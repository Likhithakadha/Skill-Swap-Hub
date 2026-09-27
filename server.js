/* Skill Swap Hub server (Node 18+, no packages).  Run: node server.js  ->  http://localhost:3000
   Optional env vars:
     GMAIL_USER, GMAIL_APP_PASSWORD  -> sends real emails (request alerts, meeting links, password reset codes)
     FAST2SMS_API_KEY                -> sends the password-reset code by SMS to the user's mobile number (India)
     TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM -> same, using Twilio instead (any country)
     GOOGLE_CLIENT_ID                -> turns on "Continue with Google"                                         */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), tls = require('tls');
const ROOT = __dirname, DB = path.join(ROOT, 'data.json'), PORT = process.env.PORT || 3000;
const MAIL = { user: process.env.GMAIL_USER, pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '') };
const GCLIENT = process.env.GOOGLE_CLIENT_ID || '';
const KEYS = ['ssh_teachers', 'ssh_learners', 'ssh_requests', 'ssh_connections', 'ssh_messages', 'ssh_feedback', 'ssh_notes'];
const HIDDEN = ['server.js', 'data.json', 'data.json.tmp', 'README.txt'];
let db = { state: {}, secrets: {} };
try { db = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (e) {}
const save = (() => {
  let chain = Promise.resolve(), dirty = false;
  return () => {
    dirty = true;
    chain = chain.then(() => new Promise(resolve => {
      if (!dirty) return resolve();
      dirty = false;
      const data = JSON.stringify(db);           // snapshot db now, so writes never interleave or overwrite each other
      fs.writeFile(DB + '.tmp', data, () => fs.rename(DB + '.tmp', DB, () => resolve()));
    }));
    return chain;
  };
})();
const hash = pw => { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(pw, s, 32).toString('hex'); };
const verify = (pw, st) => { if (!st) return false; const [s, h] = st.split(':'); return crypto.timingSafeEqual(Buffer.from(crypto.scryptSync(pw, s, 32).toString('hex')), Buffer.from(h)); };
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };

/* ---------- email (Gmail SMTP over TLS; without env vars the mail is printed in this terminal) ---------- */
const sentAt = [];
function sendMail(to, subject, text) {
  return new Promise(resolve => {
    const now = Date.now(); while (sentAt.length && now - sentAt[0] > 6e4) sentAt.shift();
    if (sentAt.length >= 40) return resolve(false);            // flood guard
    sentAt.push(now);
    if (!MAIL.user || !MAIL.pass) { console.log('\n[email not configured] To: ' + to + '\nSubject: ' + subject + '\n' + text + '\n'); return resolve(false); }
    const b64 = x => Buffer.from(x).toString('base64'), clean = x => String(x).replace(/[\r\n<>]+/g, ' ').trim();
    const msg = 'From: Skill Swap Hub <' + MAIL.user + '>\r\nTo: ' + clean(to) + '\r\nSubject: =?UTF-8?B?' + b64(subject) + '?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n' + text.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..') + '\r\n.';
    const cmds = ['EHLO skillswap', 'AUTH LOGIN', b64(MAIL.user), b64(MAIL.pass), 'MAIL FROM:<' + MAIL.user + '>', 'RCPT TO:<' + clean(to) + '>', 'DATA', msg, 'QUIT'];
    const s = tls.connect(465, 'smtp.gmail.com'); let buf = '', i = 0, done = false;
    const end = ok => { if (!done) { done = true; s.destroy(); if (!ok) console.log('[email failed] ' + to); resolve(ok); } };
    s.setTimeout(15000, () => end(false)); s.on('error', () => end(false));
    s.on('data', d => {
      buf += d; if (!/(^|\n)\d{3} [^\n]*\r?\n$/.test(buf)) return;
      const code = +buf.trimEnd().split('\n').pop().slice(0, 3); buf = '';
      if (code >= 400) return end(false);
      if (i < cmds.length) s.write(cmds[i++] + '\r\n'); else end(true);
    });
  });
}

/* ---------- SMS (password-reset code goes to the user's registered mobile number) ----------
   Fast2SMS (India, "otp" route) or Twilio. Without keys, the code is printed in this terminal instead. */
const SMSCFG = { f2s: process.env.FAST2SMS_API_KEY || '', sid: process.env.TWILIO_ACCOUNT_SID || '', tok: process.env.TWILIO_AUTH_TOKEN || '', from: process.env.TWILIO_FROM || '' };
const SMS_ON = !!(SMSCFG.f2s || (SMSCFG.sid && SMSCFG.tok && SMSCFG.from));
const ten = p => String(p || '').replace(/\D/g, '').slice(-10);           // last 10 digits of a mobile number
const smsAt = [];
async function sendSMS(phone, code) {
  const now = Date.now(); while (smsAt.length && now - smsAt[0] > 6e4) smsAt.shift();
  if (smsAt.length >= 20) return false;                                      // flood guard (protects your SMS credit)
  smsAt.push(now);
  if (!SMS_ON) { console.log('\n[SMS not configured] To: +91' + phone + '\nYour Skill Swap Hub password reset code is ' + code + '\n'); return false; }
  try {
    if (SMSCFG.f2s) {
      const r = await fetch('https://www.fast2sms.com/dev/bulkV2', { method: 'POST', headers: { authorization: SMSCFG.f2s, 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: 'otp', variables_values: code, numbers: phone, flash: 0 }) });
      const j = await r.json().catch(() => ({})); if (j.return !== true) console.log('[sms failed] ' + JSON.stringify(j).slice(0, 200));
      return j.return === true;
    }
    const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + SMSCFG.sid + '/Messages.json', { method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(SMSCFG.sid + ':' + SMSCFG.tok).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: '+91' + phone, From: SMSCFG.from, Body: 'Skill Swap Hub: your password reset code is ' + code + '. It works for 10 minutes.' }) });
    if (!r.ok) console.log('[sms failed] Twilio ' + r.status);
    return r.ok;
  } catch (e) { console.log('[sms failed] ' + e.message); return false; }
}
const T = () => db.state.ssh_teachers || [], L = () => db.state.ssh_learners || [];
function notifyRequests(prev, next) {
  const old = {}; prev.forEach(r => { old[r.id] = r; });
  next.forEach(r => {
    const o = old[r.id];
    if (!o && r.status === 'pending') {                        // new request -> the matching mentor(s)' real email
      const l = L().find(u => u.email === r.learnerEmail) || {};
      const to = r.mentorEmail ? T().filter(t => t.email === r.mentorEmail) : T().filter(t => t.skill === r.skill);
      to.filter(t => !(t.prefs && String(t.prefs.emailNotify) === 'false')).forEach(t => sendMail(t.email, 'Skill Swap Hub: you have a request for ' + r.skill,
        'Hi ' + t.name + ',\n\nYou have a new learning request for ' + r.skill + '.\n\nLearner details\n  Name: ' + (l.name || r.learnerName) + '\n  Email: ' + r.learnerEmail +
        '\n  Mobile: ' + (l.phone || '-') + '\n  Institute: ' + (l.institute || '-') + '\n  Qualification: ' + (l.qualification || '-') + '\n  Goal: ' + (l.goal || '-') +
        '\n  Message: ' + (r.message || '-') + '\n\nLog in to Skill Swap Hub and accept the request from your Home page.'));
    } else if (o && r.status === 'accepted' && o.status !== 'accepted' && r.meetLink) {   // accepted -> meeting link to BOTH emails
      [r.learnerEmail, r.teacherEmail].filter(Boolean).forEach(e => sendMail(e, 'Skill Swap Hub: your ' + r.skill + ' session is confirmed',
        'Your ' + r.skill + ' session between ' + r.learnerName + ' (learner) and ' + r.mentorName + ' (teacher) is confirmed.\n\nJoin the meeting: ' + r.meetLink + '\n\nOnly the two of you receive this link.'));
    }
  });
}

/* ---------- login lock, password reset codes ---------- */
const fails = {}, resets = {};
const isLocked = k => fails[k] && fails[k].n >= 5 && Date.now() - fails[k].t < 6e5;
const emailOk = e => typeof e === 'string' && e.length < 200 && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e);
const findAccount = (role, idf) => {                        // idf = email OR mobile number
  if (role !== 'mentor' && role !== 'learner') return null;
  idf = String(idf || '').trim().toLowerCase();
  const list = role === 'mentor' ? T() : L();
  if (idf.includes('@')) return emailOk(idf) ? list.find(u => u.email === idf) || null : null;
  const d = ten(idf); return d.length === 10 ? list.find(u => ten(u.phone) === d) || null : null;
};
const sentHour = {};                                         // max 5 reset codes per account per hour
const hourOk = k => { const n = Date.now(); sentHour[k] = (sentHour[k] || []).filter(t => n - t < 36e5); if (sentHour[k].length >= 5) return false; sentHour[k].push(n); return true; };

http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'same-origin');
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/config') return json(res, 200, { mail: !!(MAIL.user && MAIL.pass), sms: SMS_ON, google: GCLIENT });
  if (url.pathname === '/api/state' && req.method === 'GET') return json(res, 200, db.state);
  if (url.pathname.startsWith('/api/') && req.method === 'POST') {
    const o = req.headers.origin; try { if (o && new URL(o).host !== req.headers.host) return json(res, 403, { error: 'origin' }); } catch (e) { return json(res, 403, {}); }
    let body = '';
    req.on('data', c => { body += c; if (body.length > 8e6) req.destroy(); });
    req.on('end', async () => {
      let d; try { d = JSON.parse(body); } catch (e) { return json(res, 400, { error: 'bad json' }); }
      if (url.pathname === '/api/set') {
        if (!KEYS.includes(d.key) || !Array.isArray(d.value)) return json(res, 400, { error: 'bad key' });
        if (d.key === 'ssh_teachers' || d.key === 'ssh_learners') {
          const role = d.key === 'ssh_teachers' ? 'mentor' : 'learner';
          d.value.forEach(u => { if (u.password) db.secrets[role + ':' + u.email] = hash(String(u.password)); delete u.password; u.hasPw = true; });
        }
        if (d.key === 'ssh_requests') notifyRequests(db.state.ssh_requests || [], d.value);
        db.state[d.key] = d.value; save(); return json(res, 200, { ok: true });
      }
      if (url.pathname === '/api/login') {
        const k = req.socket.remoteAddress + '|' + d.role + '|' + d.email;
        if (isLocked(k)) return json(res, 200, { ok: false, locked: true });
        const ok = verify(String(d.password || ''), db.secrets[d.role + ':' + d.email]);
        if (ok) delete fails[k]; else fails[k] = { n: (fails[k] && Date.now() - fails[k].t < 6e5 ? fails[k].n : 0) + 1, t: Date.now() };
        return json(res, 200, { ok });
      }
      if (url.pathname === '/api/forgot') {                     // 6-digit code by SMS to the account's registered mobile (same reply whether or not the account exists)
        const acc = findAccount(d.role, d.id || d.email), key = acc && d.role + ':' + acc.email;
        if (acc && db.secrets[key] && !(resets[key] && Date.now() - resets[key].t < 6e4) && hourOk(key)) {
          const code = String(crypto.randomInt(100000, 1000000));
          resets[key] = { h: crypto.createHash('sha256').update(code).digest('hex'), t: Date.now(), n: 0 };
          if (ten(acc.phone).length === 10) sendSMS(ten(acc.phone), code);
          else sendMail(acc.email, 'Skill Swap Hub: password reset code', 'Your password reset code is ' + code + '. It works for 10 minutes. If you did not ask for it, ignore this email.');   // old account with no mobile saved
        }
        return json(res, 200, { ok: true, sms: SMS_ON });
      }
      if (url.pathname === '/api/reset') {
        const acc = findAccount(d.role, d.id || d.email), key = acc && d.role + ':' + acc.email, r = key && resets[key], pw = String(d.password || '');
        if (!r || Date.now() - r.t > 6e5 || r.n >= 5) return json(res, 200, { ok: false, error: 'Code expired. Ask for a new one.' });
        r.n++;
        if (crypto.createHash('sha256').update(String(d.code || '')).digest('hex') !== r.h) return json(res, 200, { ok: false, error: 'Wrong code.' });
        if (pw.length < 8) return json(res, 200, { ok: false, error: 'Use at least 8 characters.' });
        db.secrets[key] = hash(pw); delete resets[key]; save(); return json(res, 200, { ok: true });
      }
      if (url.pathname === '/api/google') {                     // verify the Google sign-in token with Google
        if (!GCLIENT) return json(res, 200, { ok: false });
        try {
          const g = await (await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(d.credential || '')))).json();
          if (g.aud !== GCLIENT || String(g.email_verified) !== 'true') return json(res, 200, { ok: false });
          return json(res, 200, { ok: true, email: g.email.toLowerCase(), name: g.name || '', picture: g.picture || '' });
        } catch (e) { return json(res, 200, { ok: false }); }
      }
      json(res, 404, {});
    });
    return;
  }
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/welcome.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT) || HIDDEN.includes(path.basename(file)) || path.basename(file).startsWith('.')) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }); res.end(data);
  });
}).listen(PORT, () => console.log('Skill Swap Hub running at http://localhost:' + PORT + (MAIL.user ? '  (email on)' : '  (email OFF: mails are printed here)') + (SMS_ON ? '  (SMS on)' : '  (SMS OFF: reset codes are printed here)')));
