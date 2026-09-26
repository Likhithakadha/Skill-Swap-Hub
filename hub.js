/* Skill Swap Hub — extras loaded after ss.js: settings, languages, sidebar, email + Zoom flow */
(function () {
  'use strict';
  var S = window.SS;

  /* To email mentors automatically (no mail app opening), create a free EmailJS account and fill these 3 values. */
  S.CONFIG.emailjs = { serviceId: '', templateId: '', publicKey: '' };

  /* ---------- remove the old fake "Sample" profiles and anything tied to them ---------- */
  (function purgeSamples() {
    var isS = function (e) { return /@sample\.skillswap$/.test(e || ''); };
    function rd(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
    var t = rd('ssh_teachers'), l = rd('ssh_learners');
    var bad = function (u) { return u.sample || isS(u.email); };
    if (!t.some(bad) && !l.some(bad)) return;
    var keyBad = function (k) { return isS(String(k).split(':').slice(1).join(':')); };
    var conns = rd('ssh_connections'), dead = {};
    var keep = conns.filter(function (c) { var b = keyBad(c.a) || keyBad(c.b); if (b) dead[c.id] = 1; return !b; });
    localStorage.setItem('ssh_teachers', JSON.stringify(t.filter(function (u) { return !bad(u); })));
    localStorage.setItem('ssh_learners', JSON.stringify(l.filter(function (u) { return !bad(u); })));
    localStorage.setItem('ssh_connections', JSON.stringify(keep));
    localStorage.setItem('ssh_messages', JSON.stringify(rd('ssh_messages').filter(function (m) { return !dead[m.connId]; })));
    localStorage.setItem('ssh_requests', JSON.stringify(rd('ssh_requests').filter(function (r) { return !isS(r.mentorEmail) && !isS(r.learnerEmail) && !isS(r.teacherEmail); })));
  })();

  /* ---------- login check (server verifies the password when the server is running) ---------- */
  S.checkLogin = function (role, email, pw) {
    if (window.SS_SERVER) {
      try {
        var x = new XMLHttpRequest(); x.open('POST', '/api/login', false); x.setRequestHeader('Content-Type', 'application/json');
        x.send(JSON.stringify({ role: role, email: email, password: pw }));
        var r = JSON.parse(x.responseText); S._locked = !!r.locked; return x.status === 200 && r.ok === true;
      } catch (e) { return false; }
    }
    var u = S.findUser(role, email); return !!(u && u.password && u.password === pw);
  };

  /* ---------- settings ---------- */
  var DEF = { lang: 'en', theme: 'light', font: 'm', bg: 'default', connect: 'everyone', emailNotify: true, desktopNotify: false };
  var AURORA = 'radial-gradient(900px 520px at 100% -10%, #E2D9FF 0%, transparent 62%), radial-gradient(760px 520px at -10% 35%, #D2F4EC 0%, transparent 60%), radial-gradient(700px 460px at 95% 105%, #FFE6BE 0%, transparent 60%), #F6F4FF';
  var BGS = { default: '', lavender: 'linear-gradient(135deg,#EFE9FF,#D9CFFF)', mint: 'linear-gradient(135deg,#E6F7F1,#C6EEE2)', sand: 'linear-gradient(135deg,#FFF6E6,#FFE0B3)', ocean: 'linear-gradient(135deg,#E3F1FF,#BCDDFF)', sunset: 'linear-gradient(135deg,#FFE8F0,#FFD8B5)', slate: '#E8EDF3' };
  function prefs() {
    var u = S.me(), saved = null;
    try { saved = JSON.parse(localStorage.getItem('ssh_prefs')); } catch (e) {}
    var pr = Object.assign({}, DEF, saved || {}, (u && u.prefs) || {});
    if (u && u.role === 'learner' && !((saved && saved.connect) || (u.prefs && u.prefs.connect))) pr.connect = 'requested';
    return pr;
  }
  function apply() {
    var p = prefs(), d = document.documentElement;
    var dark = p.theme === 'dark' || (p.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    d.dataset.theme = dark ? 'dark' : 'light';
    if (BGS[p.bg]) d.style.setProperty('--user-bg', BGS[p.bg]); else d.style.removeProperty('--user-bg');
    d.lang = p.lang;
    translateSite(p.lang);
    if (document.body) document.body.style.zoom = { s: 0.92, m: 1, l: 1.12 }[p.font] || 1;
  }
  function savePrefs(p) {
    localStorage.setItem('ssh_prefs', JSON.stringify(p));
    var u = S.me();
    if (u) S.updateUser(u.role, u.email, function (x) { x.prefs = p; });
    apply();
  }

  /* ---------- languages (menus and welcome page) ---------- */
  var TX = {
    en: { home: 'Home', profile: 'Profile', skills: 'Explore Skills', signIn: 'Sign in', logIn: 'Log in', signUp: 'Sign up', haveAcc: 'Already a member?', mentors: 'Find Mentor', feedback: 'Feedback', notes: 'Notes', help: 'Help', settings: 'Settings', logout: 'Log out',
      wTitle: 'Welcome to Skill Swap Hub', tTitle: 'Teach what you want', tBtn: 'I want to teach', lTitle: 'Learn what you want', lBtn: 'I want to learn' },
    te: { home: 'హోమ్', profile: 'ప్రొఫైల్', skills: 'నైపుణ్యాలు చూడండి', signIn: 'సైన్ ఇన్', logIn: 'లాగిన్', signUp: 'సైన్ అప్', haveAcc: 'ఇప్పటికే సభ్యులా?', mentors: 'మెంటార్‌ను వెతకండి', feedback: 'ఫీడ్‌బ్యాక్', notes: 'నోట్స్', help: 'సహాయం', settings: 'సెట్టింగ్స్', logout: 'లాగ్ అవుట్',
      wTitle: 'స్కిల్ స్వాప్ హబ్‌కు స్వాగతం', tTitle: 'మీకు నచ్చినది నేర్పండి', tBtn: 'నేను నేర్పాలనుకుంటున్నాను', lTitle: 'మీకు నచ్చినది నేర్చుకోండి', lBtn: 'నేను నేర్చుకోవాలనుకుంటున్నాను' },
    hi: { home: 'होम', profile: 'प्रोफ़ाइल', skills: 'स्किल्स देखें', signIn: 'साइन इन', logIn: 'लॉग इन', signUp: 'साइन अप', haveAcc: 'पहले से सदस्य हैं?', mentors: 'मेंटर खोजें', feedback: 'फ़ीडबैक', notes: 'नोट्स', help: 'सहायता', settings: 'सेटिंग्स', logout: 'लॉग आउट',
      wTitle: 'स्किल स्वैप हब में आपका स्वागत है', tTitle: 'जो चाहें सिखाएँ', tBtn: 'मैं सिखाना चाहता हूँ', lTitle: 'जो चाहें सीखें', lBtn: 'मैं सीखना चाहता हूँ' }
  };
  function t(k) { var l = prefs().lang; return (TX[l] && TX[l][k]) || TX.en[k] || k; }

  /* ---------- sidebar (replaces the top bar for signed-in users) ---------- */
  var baseNav = S.renderNav;
  S.renderNav = function (o) {
    o = o || {};
    var u = S.me();
    if (!u || o.public) { baseNav(o); apply(); return; }
    var host = document.getElementById('nav'); if (!host) return;
    var L = [['home', S.homeFor(u.role)], ['profile', 'hub.html#profile'], ['skills', 'skills.html'], ['mentors', 'mentor.html'],
             ['feedback', 'hub.html#feedback'], ['notes', 'hub.html#notes'], ['help', 'hub.html#help'], ['settings', 'hub.html#settings']];
    host.innerHTML = '<aside class="side"><a class="logo" href="' + S.homeFor(u.role) + '">' + S.logoMark() + '<span>Skill Swap Hub</span></a><nav aria-label="Main">' +
      L.map(function (l) {
        return '<a href="' + l[1] + '"' + (o.active === l[0] ? ' class="active" aria-current="page"' : '') + '>' + t(l[0]) +
          (l[0] === 'home' ? '<span class="nav-dot" data-net hidden></span>' : '') + '</a>';
      }).join('') + '</nav><div class="side-user">' + S.avatar(u, 'sm') +
      '<div class="who">' + S.esc(u.name.split(' ')[0]) + '<small>' + (u.role === 'mentor' ? 'Teacher' : 'Learner') + '</small></div>' +
      '<button type="button" class="btn btn-ghost-dark btn-sm" data-logout>' + t('logout') + '</button></div></aside>';
    document.body.classList.add('has-side');
    var ph = document.querySelector('main .page-head');
    if (ph && /(learner|mentor)-home\.html$/.test(location.pathname) && !document.getElementById('exploreBox')) {
      ph.insertAdjacentHTML('afterend', '<div id="exploreBox"><div class="section-head"><h2>Explore Skills</h2><a href="skills.html">See all ' + S.SKILLS.length + '</a></div><div class="skill-strip">' +
        S.SKILLS.map(function (k) { return '<a class="skill-chip" href="mentor.html?skill=' + encodeURIComponent(k.name) + '">' + S.svg(k.icon) + '<span>' + S.esc(k.name) + '</span></a>'; }).join('') + '</div></div>');
    }
    host.querySelector('[data-logout]').onclick = S.logout;
    S.refreshNavBadge();
    apply();
  };

  /* ---------- email to the teacher ---------- */
  function notifyEmail(to, subject, body, autoOnly) {
    if (/@sample\.skillswap$/.test(to)) return false;
    if (window.SS_SERVER) return true;   // the server sends the real email (see server.js)
    var c = S.CONFIG.emailjs;
    if (c && c.publicKey) {
      fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: c.serviceId, template_id: c.templateId, user_id: c.publicKey, template_params: { to_email: to, subject: subject, message: body } }) }).catch(function () {});
      return true;
    }
    if (autoOnly) return false;
    window.open('mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body), '_self');
    return true;
  }

  /* ---------- request modal: in-site request + email to the teacher ---------- */
  S.openRequestModal = function (o) {
    var u = S.me();
    if (!u) { location.href = 'auth.html?mode=login&role=learner'; return; }
    if (u.role !== 'learner') { S.toast('Log in with a learner account to request a session.'); return; }
    var old = document.getElementById('ssModal'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'ssModal'; ov.className = 'modal-overlay';
    ov.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true"><h3>' + (o.mentor ? 'Request a session' : 'Post a learning request') + '</h3>' +
      '<p class="modal-sub">' + S.skillIcon(o.skill) + '<span>' + S.esc(o.skill) + (o.mentor ? ' with ' + S.esc(o.mentor.name) : '') + '</span></p>' +
      (o.mentor ? '<p class="hint">The teacher sees this in the website and also gets it by email.</p>' : '<p class="hint">Every teacher of this skill sees your request in the website. The first to accept gets the session.</p>') +
      '<label for="ssReqMsg">Message (optional)</label><textarea class="input" id="ssReqMsg" rows="3" placeholder="What do you want to learn? Preferred timing?"></textarea>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-learner" data-send>Send request</button></div></div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); }
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('[data-close]').onclick = close;
    ov.querySelector('[data-send]').onclick = function () {
      var msg = document.getElementById('ssReqMsg').value.trim();
      S.createRequest({ skill: o.skill, learner: u, message: msg, mentorEmail: o.mentor ? o.mentor.email : null, mentorName: o.mentor ? o.mentor.name : null });
      close();
      if (o.mentor) {
        S.sendConnect(u.key, o.mentor.key || S.keyOf('mentor', o.mentor.email));
        var mp = (S.findUser('mentor', o.mentor.email) || {}).prefs || {};
        if (mp.emailNotify !== false)
          notifyEmail(o.mentor.email, 'Skill Swap Hub: ' + u.name + ' wants to learn ' + o.skill,
            'Hi ' + o.mentor.name + ',\n\n' + u.name + ' (' + u.email + ') sent you a session request for ' + o.skill + '.\n' + (msg ? 'Message: ' + msg + '\n' : '') +
            '\nLog in to Skill Swap Hub to accept it.');
      }
      S.toast('Request sent. Follow it under Home.');
      if (o.onDone) o.onDone();
    };
    document.getElementById('ssReqMsg').focus();
  };

  /* ---------- accept: a meeting room is created at once and both sides get the link; chat opens ---------- */
  function newRoom() { return 'https://meet.jit.si/SkillSwapHub-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36); }
  var baseRespond = S.respondRequest;
  S.respondRequest = function (id, mentor, decision) {
    baseRespond(id, mentor, decision);
    if (decision !== 'accepted') return;
    var list = S.requests(), r = list.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    r.meetLink = /^https?:\/\//i.test(mentor.zoom || '') ? mentor.zoom : newRoom();   // teacher's own Zoom link (Profile) wins
    localStorage.setItem('ssh_requests', JSON.stringify(list));
    var lk = S.keyOf('learner', r.learnerEmail), mk = S.keyOf('mentor', mentor.email), cs = S.conns();
    var c = cs.filter(function (x) { return (x.a === lk && x.b === mk) || (x.a === mk && x.b === lk); })[0];
    if (c) c.status = 'accepted'; else cs.push({ id: 'conn_' + Date.now(), a: lk, b: mk, status: 'accepted', date: new Date().toISOString() });
    localStorage.setItem('ssh_connections', JSON.stringify(cs));
    notifyEmail(r.learnerEmail, 'Skill Swap Hub: ' + mentor.name + ' accepted your ' + r.skill + ' request',
      'Hi ' + r.learnerName + ',\n\n' + mentor.name + ' accepted your request. Join the meeting: ' + r.meetLink, true);
    S.toast('Accepted. The meeting link is ready for both of you.');
  };

  /* ---------- live refresh when other people change data ---------- */
  var baseTick = S.startTick;
  S.startTick = function (cb) {
    baseTick(cb);
    window.addEventListener('ssh-sync', function () {
      var a = document.activeElement, id = a && a.id, v = a && a.value;
      if (cb) cb();
      if (id) { var n = document.getElementById(id); if (n && v != null) { n.value = v; n.focus(); } }
    });
  };
  setInterval(function () {
    var u = S.me(), dot = document.querySelector('.nav-dot[data-net]'); if (!u || !dot) return;
    var n = S.incomingConns(u.key).length + (u.role === 'mentor' ? S.pendingForMentor(u).length : 0);
    dot.textContent = n; dot.hidden = n === 0;
  }, 1500);

  /* ---------- desktop (browser) notifications: mentor gets one for each new request, learner for each acceptance ---------- */
  function fireDesktopNotify(title, body, goTo) {
    try {
      var n = new Notification(title, { body: body, tag: title + body });
      n.onclick = function () { try { window.focus(); } catch (e) {} location.href = goTo; };
    } catch (e) {}
  }
  function checkDesktopNotify() {
    var u = S.me(); if (!u) return;
    var p = prefs(); if (!p.desktopNotify) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    var storeKey = 'ssh_seen_' + u.key, seen = null;
    try { seen = JSON.parse(localStorage.getItem(storeKey)); } catch (e) {}
    if (u.role === 'mentor') {
      var pend = S.pendingForMentor(u), ids = pend.map(function (r) { return r.id; });
      if (seen) pend.filter(function (r) { return seen.indexOf(r.id) < 0; }).forEach(function (r) {
        fireDesktopNotify('New session request', r.learnerName + ' wants to learn ' + r.skill + '.', S.homeFor('mentor'));
      });
      localStorage.setItem(storeKey, JSON.stringify(ids));
    } else {
      var mine = S.requestsOfLearner(u.email), acc = mine.filter(function (r) { return r.status === 'accepted'; }), ids2 = acc.map(function (r) { return r.id; });
      if (seen) acc.filter(function (r) { return seen.indexOf(r.id) < 0; }).forEach(function (r) {
        fireDesktopNotify('Request accepted', (r.mentorName || 'The teacher') + ' accepted your ' + r.skill + ' request.', 'track.html');
      });
      localStorage.setItem(storeKey, JSON.stringify(ids2));
    }
  }
  setInterval(checkDesktopNotify, 3000);
  window.addEventListener('ssh-sync', checkDesktopNotify);

  /* ---------- teachers can switch off connection requests ---------- */
  var baseSend = S.sendConnect;
  S.sendConnect = function (from, to) {
    var target = S.userByKey(to);
    var sender = S.userByKey(from);
    if (target && target.role === 'learner') {          // learners are protected: only teachers they sent a request to can connect
      var tc = (target.prefs && target.prefs.connect) || 'requested';
      var asked = sender && sender.role === 'mentor' && S.requests().some(function (r) { return r.learnerEmail === target.email && (r.mentorEmail === sender.email || r.teacherEmail === sender.email); });
      if (tc === 'nobody' || (tc === 'requested' && !asked)) { S.toast(target.name + ' only connects with teachers they have sent a request to.'); return null; }
    } else if (target && target.prefs && target.prefs.connect === 'nobody') { S.toast(target.name + ' is not accepting connection requests.'); return null; }
    return baseSend(from, to);
  };

  /* ---------- whole-site language: Google Translate, remembered on every page ---------- */
  var LANGS = [['en', 'English'], ['te', 'తెలుగు (Telugu)'], ['hi', 'हिन्दी (Hindi)'], ['ta', 'தமிழ் (Tamil)'], ['kn', 'ಕನ್ನಡ (Kannada)'], ['ml', 'മലയാളം (Malayalam)'], ['bn', 'বাংলা (Bengali)'], ['mr', 'मराठी (Marathi)'], ['ur', 'اردو (Urdu)']];
  function translateSite(lang) {
    if (location.protocol === 'file:') return;
    var m = document.cookie.match(/(?:^|; )googtrans=([^;]*)/), cur = m ? decodeURIComponent(m[1]) : '';
    var want = lang && lang !== 'en' ? '/en/' + lang : '';
    if (cur !== want) {
      var exp = want ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'googtrans=' + want + '; path=/' + exp;
      if (location.hostname.indexOf('.') > 0) document.cookie = 'googtrans=' + want + '; path=/; domain=' + location.hostname + exp;
      if (sessionStorage.getItem('ssh_gt') !== (lang || 'en')) { sessionStorage.setItem('ssh_gt', lang || 'en'); location.reload(); return; }
    }
    if (want && !window.ssGT) {
      window.ssGT = function () { new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'gtEl'); };
      var go = function () {
        var d = document.createElement('div'); d.id = 'gtEl'; document.body.appendChild(d);
        var sc = document.createElement('script'); sc.src = 'https://translate.google.com/translate_a/element.js?cb=ssGT'; document.body.appendChild(sc);
      };
      if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
    }
  }

  /* ---------- validation helpers, college list, qualifications, mobile lookup ---------- */
  var TYPOS = ['gmial.com', 'gmai.com', 'gamil.com', 'gmail.con', 'gmail.co', 'gmaill.com', 'gnail.com', 'gmail.comm', 'hotmial.com', 'yahho.com'];
  S.validEmail = function (e) { e = String(e || '').trim().toLowerCase(); return /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e) && e.length < 120 && TYPOS.indexOf(e.split('@')[1]) < 0; };
  S.validPhone = function (p) { return /^(\+?91[\s-]?)?[6-9]\d{9}$/.test(String(p || '').replace(/[\s-]/g, '').replace(/^0/, '')); };
  S.findByPhone = function (role, phone) {
    var d = String(phone || '').replace(/\D/g, '').slice(-10); if (d.length < 10) return null;
    var list = role === 'mentor' ? S.teachers() : S.learners();
    var u = list.filter(function (x) { return String(x.phone || '').replace(/\D/g, '').slice(-10) === d; })[0];
    return u ? S.findUser(role, u.email) : null;
  };
  var COLLEGES = ['Indian Institute of Technology Madras', 'Indian Institute of Technology Hyderabad', 'Indian Institute of Technology Tirupati', 'Indian Institute of Technology Bombay', 'Indian Institute of Technology Delhi', 'Indian Institute of Technology Kharagpur', 'Indian Institute of Technology Kanpur',
    'National Institute of Technology Andhra Pradesh', 'National Institute of Technology Warangal', 'National Institute of Technology Tiruchirappalli', 'International Institute of Information Technology Hyderabad', 'IIIT Sri City',
    'RGUKT Nuzvid', 'RGUKT RK Valley', 'RGUKT Srikakulam', 'RGUKT Ongole', 'Andhra University', 'Acharya Nagarjuna University', 'Sri Venkateswara University', 'Osmania University', 'Jawaharlal Nehru Technological University Hyderabad', 'JNTU Kakinada', 'JNTU Anantapur',
    'Krishna University', 'Adikavi Nannaya University', 'Yogi Vemana University', 'Sri Padmavati Mahila Visvavidyalayam', 'University of Hyderabad', 'VIT-AP University', 'SRM University-AP', 'KL University (KLEF)', 'Amrita Vishwa Vidyapeetham', 'GITAM University', 'Anurag University', 'BITS Pilani',
    "Vignan's Foundation for Science, Technology and Research", 'Vasireddy Venkatadri Institute of Technology', 'RVR & JC College of Engineering', 'Bapatla Engineering College', 'Gudlavalleru Engineering College', 'Velagapudi Ramakrishna Siddhartha Engineering College', 'Prasad V. Potluri Siddhartha Institute of Technology',
    'Chaitanya Bharathi Institute of Technology', 'Vasavi College of Engineering', 'Andhra Loyola College', 'Hindu College Guntur', 'University of Delhi', 'Anna University', 'University of Madras', 'Jawaharlal Nehru University', 'Bangalore University', 'University of Mumbai', 'Savitribai Phule Pune University'];
  var QUALS = ['10th / SSC', 'Intermediate / 12th', 'Diploma', 'B.Tech / B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA', 'B.Pharm', 'MBBS', 'M.Tech / M.E.', 'M.Sc', 'M.Com', 'M.A.', 'MBA', 'MCA', 'Ph.D.', 'Working professional', 'Other'];

  S.t = t;
  S.hub = { LANGS: LANGS, COLLEGES: COLLEGES, QUALS: QUALS, AURORA: AURORA, prefs: prefs, savePrefs: savePrefs, apply: apply, BGS: BGS, notifyEmail: notifyEmail };
  apply();
})();
