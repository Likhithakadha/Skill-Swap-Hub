/* Shares data between everyone using the site (needs server.js). Without the server it keeps working per browser. */
(function () {
  'use strict';
  if (location.protocol === 'file:') return;
  var KEYS = ['ssh_teachers', 'ssh_learners', 'ssh_requests', 'ssh_connections', 'ssh_messages', 'ssh_feedback', 'ssh_notes'];
  var set = Storage.prototype.setItem, timers = {}, pending = {}, toPush = [];
  var st;
  try {
    var x = new XMLHttpRequest(); x.open('GET', '/api/state', false); x.send();
    if (x.status !== 200) return;
    st = JSON.parse(x.responseText);
  } catch (e) { return; }
  window.SS_SERVER = true;

  function push(k) {
    pending[k] = 1; clearTimeout(timers[k]);
    timers[k] = setTimeout(function () {
      var v; try { v = JSON.parse(localStorage.getItem(k)); } catch (e) { delete pending[k]; return; }
      fetch('/api/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k, value: v }) })
        .then(function () { delete pending[k]; }, function () { delete pending[k]; });
    }, 100);
  }
  KEYS.forEach(function (k) {
    if (st[k]) set.call(localStorage, k, JSON.stringify(st[k]));
    else if (localStorage.getItem(k)) toPush.push(k);   // first run: upload what this browser already has
  });
  Storage.prototype.setItem = function (k, v) { set.call(this, k, v); if (this === localStorage && KEYS.indexOf(k) > -1) push(k); };
  toPush.forEach(push);

  setInterval(function () {
    fetch('/api/state', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (s) {
      var changed = false;
      KEYS.forEach(function (k) {
        if (pending[k] || s[k] === undefined) return;
        var str = JSON.stringify(s[k]);
        if (str !== localStorage.getItem(k)) { set.call(localStorage, k, str); changed = true; }
      });
      if (changed) window.dispatchEvent(new Event('ssh-sync'));
    }).catch(function () {});
  }, 2500);
})();
