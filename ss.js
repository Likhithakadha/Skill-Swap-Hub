/* ==========================================================
   SkillSwap — shared logic
   Front-end only: everything is stored in this browser's localStorage.
   ========================================================== */
(function () {
  'use strict';

  /* ---- Settings you can change ---- */
  var CONFIG = {
    seedSampleProfiles: false,   // adds a few "Sample" mentors/learners so pages aren't empty
    sampleAutoReply: true       // sample profiles accept requests and reply automatically
  };

  var K = {
    teachers: 'ssh_teachers',
    learners: 'ssh_learners',
    requests: 'ssh_requests',
    conns: 'ssh_connections',
    msgs: 'ssh_messages',
    session: 'ssh_session',
    seeded: 'ssh_seeded_v2'
  };

  /* ---------- storage helpers ---------- */
  function rd(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function wr(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function uid(prefix) { return prefix + '_' + Date.now() + Math.random().toString(36).slice(2, 6); }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- skills ---------- */
  var SKILLS = [
    { name: 'Web Development', emoji: '🌐', blurb: 'HTML, CSS and JavaScript for building real websites.',
      icon: '<polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/><line x1="14" y1="4" x2="10" y2="20"/>' },
    { name: 'Photography', emoji: '📷', blurb: 'Camera skills, framing, light and editing.',
      icon: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>' },
    { name: 'Dance', emoji: '💃', blurb: 'Explore different dance styles and build confidence.',
      icon: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v5.5l-3.5 7"/><path d="M12 13l3.5 7"/><path d="M5.5 10.5l6.5-1.5 6.5-3"/>' },
    { name: 'Graphic Design', emoji: '🎨', blurb: 'Posters, logos and layouts in Photoshop and similar tools.',
      icon: '<path d="M12 3a9 9 0 100 18c1.6 0 2.1-1 1.6-2.1-.5-1.1.1-2.4 1.5-2.4H18a3 3 0 003-3c0-5.6-4-10.5-9-10.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15.5" cy="7.5" r="1"/>' },
    { name: 'Public Speaking', emoji: '🎤', blurb: 'Speak with confidence, on stage or in a small room.',
      icon: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0"/><line x1="12" y1="18" x2="12" y2="21"/>' },
    { name: 'Programming', emoji: '💻', blurb: 'Python, Java and problem solving from the basics.',
      icon: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><polyline points="7 10 10 13 7 16"/><line x1="12" y1="16" x2="17" y2="16"/>' },
    { name: 'Musical Skills', emoji: '🎵', blurb: 'Singing, rhythm and music basics.',
      icon: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>' },
    { name: 'Spoken English', emoji: '🗣️', blurb: 'Vocabulary, fluency and speaking without hesitation.',
      icon: '<path d="M4 5h16v11H10l-4 4v-4H4z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="12" x2="13" y2="12"/>' },
    { name: 'Instrument Learning', emoji: '🎸', blurb: 'Guitar, keyboard, piano or drums with a patient mentor.',
      icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><line x1="8" y1="5" x2="8" y2="19"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="16" y1="5" x2="16" y2="19"/><rect x="6.5" y="5" width="3" height="8" fill="currentColor"/><rect x="10.5" y="5" width="3" height="8" fill="currentColor"/><rect x="14.5" y="5" width="3" height="8" fill="currentColor"/>' },
    { name: 'Student Support', emoji: '🎓', blurb: 'Guidance on study plans, exams, stress and careers.',
      icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.8"/><line x1="5.6" y1="5.6" x2="9.3" y2="9.3"/><line x1="18.4" y1="5.6" x2="14.7" y2="9.3"/><line x1="5.6" y1="18.4" x2="9.3" y2="14.7"/><line x1="18.4" y1="18.4" x2="14.7" y2="14.7"/>' },
    { name: 'Drawing', emoji: '✏️', blurb: 'Pencil sketching, shading and character drawing from scratch.',
      icon: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>' },
    { name: 'Painting', emoji: '🖼️', blurb: 'Watercolour, acrylic and colour mixing basics.',
      icon: '<path d="M14 4l6 6-8 8H6v-6z"/><path d="M4 21c2 0 3-1 3-3"/>' },
    { name: 'Video Editing', emoji: '🎬', blurb: 'Cut, colour and export videos for reels and projects.',
      icon: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 10l4-2v8l-4-2"/>' },
    { name: 'UI/UX Design', emoji: '📱', blurb: 'Design app screens in Figma and think like a user.',
      icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M9 9v12"/>' },
    { name: 'Mobile App Development', emoji: '📲', blurb: 'Build Android and cross-platform apps.',
      icon: '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>' },
    { name: 'Data Science', emoji: '📊', blurb: 'Python, statistics and machine learning basics.',
      icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
    { name: 'Digital Marketing', emoji: '📈', blurb: 'Social media, SEO and running your first campaign.',
      icon: '<path d="M3 11v3l4 1 9 5V6L7 11z"/><path d="M19 9a4 4 0 010 6"/>' },
    { name: 'Content Writing', emoji: '✍️', blurb: 'Blogs, captions and clear writing that people finish.',
      icon: '<path d="M5 3h10l4 4v14H5z"/><path d="M8 12h8M8 16h8"/>' },
    { name: 'Yoga & Fitness', emoji: '🧘', blurb: 'Beginner yoga, stretching and simple home workouts.',
      icon: '<circle cx="12" cy="5" r="2"/><path d="M5 20l7-8 7 8M12 12V8M6 10h12"/>' },
    { name: 'Cooking', emoji: '🍳', blurb: 'Easy recipes, basic techniques and hostel-friendly meals.',
      icon: '<path d="M5 11h14v3a5 5 0 01-5 5h-4a5 5 0 01-5-5z"/><path d="M8 4v4M12 3v5M16 4v4"/>' },
    { name: 'Chess', emoji: '♟️', blurb: 'Openings, tactics and how to think a few moves ahead.',
      icon: '<circle cx="12" cy="5" r="2"/><path d="M9 21h6M8 18h8l-1-6a4 4 0 10-6 0z"/>' },
    { name: 'Mathematics', emoji: '➗', blurb: 'Aptitude, algebra and exam-style problem solving.',
      icon: '<path d="M12 4v8M8 8h8M6 17h12M6 20h12"/>' },
    { name: 'Interview Preparation', emoji: '💼', blurb: 'Resume tips, HR questions and mock interviews.',
      icon: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>' },
    { name: 'Foreign Languages', emoji: '🌍', blurb: 'Hindi, Telugu, German, French and more for beginners.',
      icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>' }
  ];

  function svg(inner, cls) {
    return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  function skillIcon(name) {
    var s = SKILLS.filter(function (x) { return x.name === name; })[0];
    return '<span class="skill-emoji" aria-hidden="true">' + (s ? s.emoji : '⭐') + '</span>';
  }
  var ICON = {
    check: '<polyline points="4 12.5 9.5 18 20 6.5"/>',
    learner: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    mentor: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
  };

  /* ---------- logo ---------- */
  function logoMark() {
    return '<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#6D4AFF"/>' +
      '<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M8 12.5h17M21 8.5l4 4-4 4"/><path d="M26 21.5H9M13 17.5l-4 4 4 4"/></g></svg>';
  }

  /* ---------- users & session ---------- */
  function teachers() { return rd(K.teachers, []); }
  function learners() { return rd(K.learners, []); }
  function saveTeachers(l) { wr(K.teachers, l); }
  function saveLearners(l) { wr(K.learners, l); }

  function keyOf(role, email) { return role + ':' + email; }
  function splitKey(k) { var i = k.indexOf(':'); return { role: k.slice(0, i), email: k.slice(i + 1) }; }

  function findUser(role, email) {
    var list = role === 'mentor' ? teachers() : learners();
    var u = list.filter(function (x) { return x.email === email; })[0];
    if (!u) return null;
    var copy = {}; for (var p in u) copy[p] = u[p];
    copy.role = role; copy.key = keyOf(role, email);
    return copy;
  }
  function userByKey(k) { var s = splitKey(k); return findUser(s.role, s.email); }

  function updateUser(role, email, fn) {
    var list = role === 'mentor' ? teachers() : learners();
    var i = list.findIndex(function (x) { return x.email === email; });
    if (i < 0) return null;
    fn(list[i]);
    (role === 'mentor' ? saveTeachers : saveLearners)(list);
    return list[i];
  }

  function getSession() { return rd(K.session, null); }
  function setSession(role, email) { wr(K.session, { role: role, email: email }); }
  function me() { var s = getSession(); return s ? findUser(s.role, s.email) : null; }
  function homeFor(role) { return role === 'mentor' ? 'mentor-home.html' : 'learner-home.html'; }

  // Old versions kept the mentor login under another key — carry it over.
  (function migrateLegacy() {
    var legacy = localStorage.getItem('ssh_currentTeacher');
    if (legacy && !getSession()) setSession('mentor', legacy);
    if (legacy) localStorage.removeItem('ssh_currentTeacher');
  })();

  function logout() { localStorage.removeItem(K.session); location.href = 'index.html'; }

  // Redirects away if the visitor isn't signed in as `role` (pass null for "any signed-in user").
  function guard(role) {
    var u = me();
    if (!u) { location.replace('auth.html?mode=login' + (role ? '&role=' + role : '')); return null; }
    if (role && u.role !== role) { location.replace(homeFor(u.role)); return null; }
    return u;
  }

  /* ---------- avatars, badges ---------- */
  var COLORS = ['#E5484D', '#5B7CFA', '#8E44AD', '#12A150', '#E8890C', '#D6409F', '#0E9FBC', '#7B5E3B'];
  function colorFor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return COLORS[Math.abs(h) % COLORS.length];
  }
  function avatar(u, size) {
    var cls = 'avatar av-' + (size || 'md');
    if (u.avatarType === 'photo' && u.avatarValue) return '<span class="' + cls + '"><img src="' + esc(u.avatarValue) + '" alt=""></span>';
    if (u.avatarType === 'preset' && u.avatarValue) return '<span class="' + cls + '" style="background:#3B3378">' + u.avatarValue + '</span>';
    var n = (u.name || '?').trim();
    return '<span class="' + cls + '" style="background:' + colorFor(n) + '">' + esc(n.charAt(0).toUpperCase()) + '</span>';
  }
  function computeBadge(n) {
    if (n >= 15) return '🏆 Top Mentor';
    if (n >= 5) return '🌟 Rising Mentor';
    return null;
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(text) {
    var t = document.getElementById('ssToast');
    if (!t) { t = document.createElement('p'); t.id = 'ssToast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4200);
  }

  /* ---------- requests (learner -> mentor) ---------- */
  function requests() { return rd(K.requests, []); }
  function saveRequests(l) { wr(K.requests, l); }

  function meetLink() { return 'https://zoom.us/j/' + (Math.floor(Math.random() * 9e9) + 1e9); }  // demo link, used only by Sample mentors

  function createRequest(o) {
    var list = requests();
    var r = {
      id: uid('req'), skill: o.skill, learnerName: o.learner.name, learnerEmail: o.learner.email,
      mentorEmail: o.mentorEmail || null, mentorName: o.mentorName || null,
      message: o.message || '', status: 'pending', date: new Date().toISOString(), declinedBy: []
    };
    list.push(r); saveRequests(list); return r;
  }

  function pendingForMentor(m) {
    return requests().filter(function (r) {
      return r.status === 'pending' &&
        (r.declinedBy || []).indexOf(m.email) === -1 &&
        (r.mentorEmail === m.email || (!r.mentorEmail && r.skill === m.skill));
    });
  }
  function acceptedForMentor(m) {
    return requests().filter(function (r) { return r.status === 'accepted' && r.teacherEmail === m.email; });
  }
  function requestsOfLearner(email) {
    return requests().filter(function (r) { return r.learnerEmail === email; })
      .sort(function (a, b) { return Date.parse(b.date) - Date.parse(a.date); });
  }

  function respondRequest(id, mentor, decision) {
    var list = requests();
    var r = list.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    if (decision === 'accepted') {
      r.status = 'accepted'; r.teacherEmail = mentor.email; r.mentorName = mentor.name;
      r.meetLink = meetLink(); r.respondedAt = new Date().toISOString();
      updateUser('mentor', mentor.email, function (t) {
        t.points = (t.points || 0) + 10;
        t.sessionsAccepted = (t.sessionsAccepted || 0) + 1;
        t.badge = computeBadge(t.sessionsAccepted);
      });
    } else if (r.mentorEmail) {
      r.status = 'declined'; r.respondedAt = new Date().toISOString();   // asked this mentor directly
    } else {
      r.declinedBy = (r.declinedBy || []).concat(mentor.email);           // open request: other mentors can still take it
    }
    saveRequests(list);
  }

  function cancelRequest(id) {
    var list = requests();
    var r = list.filter(function (x) { return x.id === id; })[0];
    if (r && r.status === 'pending') { r.status = 'cancelled'; saveRequests(list); }
  }

  /* ---------- connections & messages ---------- */
  function conns() { return rd(K.conns, []); }
  function msgs() { return rd(K.msgs, []); }

  function connBetween(k1, k2) {
    return conns().filter(function (c) { return (c.a === k1 && c.b === k2) || (c.a === k2 && c.b === k1); })[0] || null;
  }
  // learner -> mentor or learner; mentor -> mentor
  function canConnect(fromRole, toRole) { return fromRole === 'learner' || toRole === 'mentor'; }

  function connState(myKey, otherKey) {
    var c = connBetween(myKey, otherKey);
    if (!c) return { state: 'none' };
    if (c.status === 'accepted') return { state: 'connected', conn: c };
    return { state: c.a === myKey ? 'sent' : 'incoming', conn: c };
  }
  function sendConnect(fromKey, toKey) {
    if (fromKey === toKey || connBetween(fromKey, toKey)) return null;
    var list = conns();
    var c = { id: uid('conn'), a: fromKey, b: toKey, status: 'pending', date: new Date().toISOString() };
    list.push(c); wr(K.conns, list); return c;
  }
  function respondConn(id, accept) {
    var list = conns();
    var i = list.findIndex(function (c) { return c.id === id; });
    if (i < 0) return;
    if (accept) list[i].status = 'accepted'; else list.splice(i, 1);
    wr(K.conns, list);
  }
  function removeConn(id) {
    wr(K.conns, conns().filter(function (c) { return c.id !== id; }));
  }
  function incomingConns(myKey) { return conns().filter(function (c) { return c.b === myKey && c.status === 'pending'; }); }
  function outgoingConns(myKey) { return conns().filter(function (c) { return c.a === myKey && c.status === 'pending'; }); }
  function myConns(myKey) { return conns().filter(function (c) { return c.status === 'accepted' && (c.a === myKey || c.b === myKey); }); }
  function otherKey(c, myKey) { return c.a === myKey ? c.b : c.a; }

  function thread(connId) {
    return msgs().filter(function (m) { return m.connId === connId; })
      .sort(function (a, b) { return Date.parse(a.date) - Date.parse(b.date); });
  }
  function sendMsg(connId, senderKey, text) {
    var list = msgs();
    list.push({ id: uid('msg'), connId: connId, sender: senderKey, text: text, date: new Date().toISOString() });
    wr(K.msgs, list);
  }

  /* ---------- delete account (learner or mentor) ---------- */
  function deleteAccount(role, email) {
    var key = keyOf(role, email);
    var allConns = conns();
    var removedIds = allConns.filter(function (c) { return c.a === key || c.b === key; }).map(function (c) { return c.id; });
    wr(K.conns, allConns.filter(function (c) { return c.a !== key && c.b !== key; }));
    wr(K.msgs, msgs().filter(function (m) { return removedIds.indexOf(m.connId) === -1; }));
    saveRequests(requests().filter(function (r) {
      return role === 'learner' ? r.learnerEmail !== email : (r.mentorEmail !== email && r.teacherEmail !== email);
    }));
    if (role === 'mentor') saveTeachers(teachers().filter(function (u) { return u.email !== email; }));
    else saveLearners(learners().filter(function (u) { return u.email !== email; }));
    try {
      var fb = JSON.parse(localStorage.getItem('ssh_feedback')) || [];
      localStorage.setItem('ssh_feedback', JSON.stringify(fb.filter(function (f) { return f.from !== email && f.mentor !== email; })));
    } catch (e) {}
    try {
      var nt = JSON.parse(localStorage.getItem('ssh_notes')) || [];
      localStorage.setItem('ssh_notes', JSON.stringify(nt.filter(function (n) { return n.owner !== key; })));
    } catch (e) {}
    try { localStorage.removeItem('ssh_seen_' + key); } catch (e) {}
    var s = getSession();
    if (s && s.role === role && s.email === email) localStorage.removeItem(K.session);
    try { if (localStorage.getItem('ssh_remember') === email) localStorage.removeItem('ssh_remember'); } catch (e) {}
  }

  /* ---------- sample profiles (clearly labelled "Sample") ---------- */
  var SAMPLE_MENTORS = [
    { name: 'Sneha Varma', skill: 'Web Development', sessions: 18, av: '👩‍💻', bio: 'Final-year CSE. I help beginners publish their first portfolio site with HTML, CSS and JavaScript.' },
    { name: 'Kiran Kumar', skill: 'Photography', sessions: 7, av: '', bio: 'Street and portrait shooter. I teach light, framing and quick mobile editing.' },
    { name: 'Divya Sree', skill: 'Dance', sessions: 3, av: '', bio: 'Classical and semi-classical. Beginner friendly, no experience needed.' },
    { name: 'Rahul Teja', skill: 'Programming', sessions: 12, av: '', bio: 'Python and Java for placements, with daily problem-solving practice.' },
    { name: 'Harika Devi', skill: 'Spoken English', sessions: 9, av: '👩‍🏫', bio: 'I help shy speakers get fluent through short daily conversation practice.' },
    { name: 'Naveen Chowdary', skill: 'Musical Skills', sessions: 2, av: '👩‍🎤', bio: 'Singing and keyboard basics. I can help you pick and learn your first song.' },
    { name: 'Lavanya Rao', skill: 'Public Speaking', sessions: 5, av: '', bio: 'Debate club captain. Stage fright, structure and delivery.' },
    { name: 'Sai Manoj', skill: 'Graphic Design', sessions: 4, av: '👨‍🎨', bio: 'Posters, logos and Photoshop shortcuts that save hours.' },
    { name: 'Pranav Nair', skill: 'Instrument Learning', sessions: 6, av: '', bio: 'Guitar from zero to your first three songs.' },
    { name: 'Meghana Iyer', skill: 'Student Support', sessions: 11, av: '🧑‍🎓', bio: 'Peer counsellor. Study plans, exam stress and career questions.' }
  ];
  var SAMPLE_LEARNERS = [
    { name: 'Anitha Kumari', interests: ['Web Development', 'Spoken English'], goal: 'Want to build a portfolio and speak more confidently in interviews.' },
    { name: 'Tarun Sai', interests: ['Photography', 'Graphic Design'], goal: 'Learning to shoot and edit posters for our college fest.' },
    { name: 'Bhavana R', interests: ['Dance', 'Public Speaking'], goal: 'Preparing for the annual day performance and a short speech.' },
    { name: 'Yashwanth M', interests: ['Programming', 'Instrument Learning'], goal: 'Placement prep in Java, and guitar as a hobby.' }
  ];

  function sampleEmail(name) { return name.toLowerCase().replace(/[^a-z]+/g, '.') + '@sample.skillswap'; }

  function seedSamples() {
    if (!CONFIG.seedSampleProfiles || localStorage.getItem(K.seeded)) return;
    var t = teachers(), l = learners();
    SAMPLE_MENTORS.forEach(function (m) {
      var email = sampleEmail(m.name);
      if (t.some(function (x) { return x.email === email; })) return;
      t.push({ id: 'sample_' + email, name: m.name, email: email, password: null, skill: m.skill, bio: m.bio,
        avatarType: m.av ? 'preset' : 'initial', avatarValue: m.av || null,
        points: m.sessions * 10, sessionsAccepted: m.sessions, badge: computeBadge(m.sessions),
        joined: new Date().toISOString(), sample: true });
    });
    SAMPLE_LEARNERS.forEach(function (p) {
      var email = sampleEmail(p.name);
      if (l.some(function (x) { return x.email === email; })) return;
      l.push({ id: 'sample_' + email, name: p.name, email: email, password: null, interests: p.interests, goal: p.goal,
        avatarType: 'initial', avatarValue: null, joined: new Date().toISOString(), sample: true });
    });
    saveTeachers(t); saveLearners(l);
    localStorage.setItem(K.seeded, '1');
  }

  // After sign-up, a sample profile sends the new user a connection request so the Network page has something to show.
  function seedWelcomeRequest(user) {
    if (!CONFIG.seedSampleProfiles) return;
    var from = null;
    if (user.role === 'mentor') {
      from = teachers().filter(function (x) { return x.sample && x.skill !== user.skill; })[0];
    } else {
      var mine = user.interests || [];
      var pool = learners().filter(function (x) { return x.sample; });
      from = pool.filter(function (x) { return (x.interests || []).some(function (i) { return mine.indexOf(i) > -1; }); })[0] || pool[0];
    }
    if (!from) return;
    var fromKey = keyOf(user.role, from.email);
    if (!connBetween(fromKey, user.key)) {
      var list = conns();
      list.push({ id: uid('conn'), a: fromKey, b: user.key, status: 'pending', date: new Date().toISOString() });
      wr(K.conns, list);
    }
  }

  function isSampleKey(k) { var u = userByKey(k); return !!(u && u.sample); }
  function isSampleMentorEmail(email) {
    var u = findUser('mentor', email); return !!(u && u.sample);
  }

  // Sample profiles answer after a short delay. Returns true if anything changed.
  function processSamples() {
    if (!CONFIG.sampleAutoReply) return false;
    var now = Date.now(), changed = false;

    var cl = conns(), fresh = [];
    cl.forEach(function (c) {
      if (c.status === 'pending' && isSampleKey(c.b) && now - Date.parse(c.date) > 2500) {
        c.status = 'accepted'; changed = true;
        var a = userByKey(c.a);
        var first = ((a && a.name) || 'there').split(' ')[0];
        fresh.push({ id: uid('msg'), connId: c.id, sender: c.b, text: 'Hi ' + first + '! Good to connect. Ask me anything.', date: new Date().toISOString() });
      }
    });
    if (changed) { wr(K.conns, cl); if (fresh.length) wr(K.msgs, msgs().concat(fresh)); }

    var rl = requests(), rch = false;
    rl.forEach(function (r) {
      if (r.status === 'pending' && r.mentorEmail && isSampleMentorEmail(r.mentorEmail) && now - Date.parse(r.date) > 5000) {
        r.status = 'accepted'; r.teacherEmail = r.mentorEmail; r.meetLink = meetLink(); r.respondedAt = new Date().toISOString(); rch = true;
      }
    });
    if (rch) { saveRequests(rl); changed = true; }
    return changed;
  }

  var CANNED_MENTOR = ['Sounds good! Let\'s find a time this week.', 'Happy to help. What are you working towards right now?', 'Nice. Send a session request and I\'ll confirm a slot.', 'Thanks for reaching out!'];
  var CANNED_LEARNER = ['Same here! Want to practise together?', 'That would be great. What time works for you?', 'I\'m still figuring it out too. Let\'s share notes.', 'Thanks for connecting!'];

  function scheduleSampleReply(connId, otherK, done) {
    if (!CONFIG.sampleAutoReply || !isSampleKey(otherK)) return;
    var pool = splitKey(otherK).role === 'mentor' ? CANNED_MENTOR : CANNED_LEARNER;
    setTimeout(function () {
      if (!conns().some(function (c) { return c.id === connId; })) return;
      sendMsg(connId, otherK, pool[Math.floor(Math.random() * pool.length)]);
      if (done) done();
    }, 1400);
  }

  function startTick(cb) {
    function run() { if (processSamples() && cb) cb(); refreshNavBadge(); }
    processSamples();
    setInterval(run, 1500);
  }

  /* ---------- shared UI: person card & request modal ---------- */
  function personCard(u, actionsHtml) {
    var isM = u.role === 'mentor';
    var badge = isM ? computeBadge(u.sessionsAccepted || 0) : null;
    var line = isM
      ? '<div class="person-skill">' + skillIcon(u.skill) + '<span>' + esc(u.skill) + '</span></div>'
      : '<div class="chips-row">' + (u.interests || []).slice(0, 3).map(function (s) { return '<span class="mini-chip">' + esc(s) + '</span>'; }).join('') + '</div>';
    var text = isM ? (u.bio || 'This mentor hasn\'t added a bio yet.') : (u.goal || 'Hasn\'t shared a learning goal yet.');
    return '<article class="person">' +
      '<div class="person-top">' + avatar(u, 'lg') +
      '<div><h3>' + esc(u.name) + (u.sample ? '<span class="tag-sample" title="A demo profile that replies automatically">Sample</span>' : '') + '</h3>' +
      '<span class="role-pill role-' + u.role + '">' + (isM ? 'Mentor' : 'Learner') + '</span></div></div>' +
      line +
      (badge ? '<div><span class="badge-pill">' + badge + '</span></div>' : '') +
      '<p class="bio">' + esc(text) + '</p>' +
      (actionsHtml ? '<div class="person-actions">' + actionsHtml + '</div>' : '') +
      '</article>';
  }

  function openRequestModal(o) {
    var u = me();
    if (!u || u.role !== 'learner') { location.href = 'auth.html?mode=login&role=learner'; return; }
    var old = document.getElementById('ssModal'); if (old) old.remove();

    var ov = document.createElement('div');
    ov.id = 'ssModal'; ov.className = 'modal-overlay';
    ov.innerHTML =
      '<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="ssModalTitle">' +
      '<h3 id="ssModalTitle">' + (o.mentor ? 'Request a session' : 'Post a learning request') + '</h3>' +
      '<p class="modal-sub">' + skillIcon(o.skill) + '<span>' + esc(o.skill) + (o.mentor ? ' with ' + esc(o.mentor.name) : '') + '</span></p>' +
      (o.mentor ? '' : '<p style="color:var(--muted);font-size:14px">Every mentor teaching this skill will see your request. The first to accept gets the session.</p>') +
      '<label for="ssReqMsg">Message (optional)</label>' +
      '<textarea class="input" id="ssReqMsg" rows="3" placeholder="What do you want to learn? Any preferred timing?"></textarea>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button>' +
      '<button type="button" class="btn btn-learner" data-send>Send request</button></div></div>';
    document.body.appendChild(ov);

    function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('[data-close]').onclick = close;
    ov.querySelector('[data-send]').onclick = function () {
      createRequest({
        skill: o.skill, learner: u, message: document.getElementById('ssReqMsg').value.trim(),
        mentorEmail: o.mentor ? o.mentor.email : null, mentorName: o.mentor ? o.mentor.name : null
      });
      close();
      toast('Request sent. Follow it under My requests.');
      if (o.onDone) o.onDone();
    };
    document.getElementById('ssReqMsg').focus();
  }

  /* ---------- navigation bar ---------- */
  function refreshNavBadge() {
    var dot = document.querySelector('.nav-dot[data-net]');
    var u = me();
    if (!dot || !u) return;
    var n = incomingConns(u.key).length;
    dot.textContent = n; dot.hidden = n === 0;
  }

  function renderNav(opts) {
    opts = opts || {};
    var host = document.getElementById('nav');
    if (!host) return;
    var u = me();
    var dark = opts.theme === 'dark';
    var links = [];

    if (u && !opts.public && u.role === 'learner') {
      links = [['learner-home.html', 'Dashboard', 'home'], ['skills.html', 'Skills', 'skills'], ['mentor.html', 'Mentors', 'mentors'],
               ['track.html', 'My requests', 'requests'], ['network.html', 'Network', 'network']];
    } else if (u && !opts.public && u.role === 'mentor') {
      links = [['mentor-home.html', 'Dashboard', 'home'], ['network.html', 'Network', 'network']];
    } else {
      links = [['index.html#skills', 'Skills', 'skills'], ['index.html#how', 'How it works', 'how'], ['about.html', 'About', 'about']];
    }

    var linkHtml = links.map(function (l) {
      var extra = l[2] === 'network' ? '<span class="nav-dot" data-net hidden></span>' : '';
      return '<a href="' + l[0] + '"' + (opts.active === l[2] ? ' class="active" aria-current="page"' : '') + '>' + l[1] + extra + '</a>';
    }).join('');

    var right;
    if (u) {
      var goHome = opts.public ? '<a class="btn btn-primary btn-sm" href="' + homeFor(u.role) + '">Dashboard</a>' : '';
      right = goHome +
        '<div class="nav-user">' + avatar(u, 'sm') +
        '<div class="who">' + esc(u.name.split(' ')[0]) + '<small class="r-' + u.role + '">' + (u.role === 'mentor' ? 'Mentor' : 'Learner') + '</small></div></div>' +
        '<button type="button" class="btn ' + (dark ? 'btn-ghost-dark' : 'btn-ghost') + ' btn-sm" data-logout>Log out</button>';
    } else {
      right = '<a class="btn ' + (dark ? 'btn-ghost-dark' : 'btn-ghost') + ' btn-sm" href="auth.html?mode=login">Log in</a>' +
              '<a class="btn btn-primary btn-sm" href="auth.html?mode=signup">Sign up</a>';
    }

    host.innerHTML =
      '<header class="topbar' + (dark ? ' dark' : '') + '"><div class="wrap topbar-in">' +
      '<a class="logo" href="' + (u && !opts.public ? homeFor(u.role) : 'index.html') + '">' + logoMark() + '<span>SkillSwap</span></a>' +
      '<nav class="nav-links" aria-label="Main">' + linkHtml + '</nav>' +
      '<div class="nav-right">' + right + '</div></div></header>';

    var lo = host.querySelector('[data-logout]');
    if (lo) lo.onclick = logout;
    refreshNavBadge();
  }

  seedSamples();

  window.SS = {
    CONFIG: CONFIG, SKILLS: SKILLS, ICON: ICON,
    esc: esc, svg: svg, skillIcon: skillIcon, logoMark: logoMark, avatar: avatar, colorFor: colorFor, computeBadge: computeBadge, toast: toast,
    teachers: teachers, learners: learners, saveTeachers: saveTeachers, saveLearners: saveLearners,
    keyOf: keyOf, splitKey: splitKey, findUser: findUser, userByKey: userByKey, updateUser: updateUser,
    getSession: getSession, setSession: setSession, me: me, homeFor: homeFor, logout: logout, guard: guard,
    requests: requests, createRequest: createRequest, pendingForMentor: pendingForMentor, acceptedForMentor: acceptedForMentor,
    requestsOfLearner: requestsOfLearner, respondRequest: respondRequest, cancelRequest: cancelRequest,
    conns: conns, msgs: msgs, connState: connState, canConnect: canConnect, sendConnect: sendConnect, respondConn: respondConn, removeConn: removeConn,
    incomingConns: incomingConns, outgoingConns: outgoingConns, myConns: myConns, otherKey: otherKey,
    thread: thread, sendMsg: sendMsg, scheduleSampleReply: scheduleSampleReply, deleteAccount: deleteAccount,
    seedWelcomeRequest: seedWelcomeRequest, startTick: startTick, processSamples: processSamples,
    personCard: personCard, openRequestModal: openRequestModal, renderNav: renderNav, refreshNavBadge: refreshNavBadge
  };
})();
