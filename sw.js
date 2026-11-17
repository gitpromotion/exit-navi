// EXIT NAVI 서비스 워커: 한 번 열면 공연장처럼 인터넷이 약한 곳에서도 화면이 열리게 저장해 둡니다.
var CACHE = 'exitnavi-v5';
var CORE = [
  './', 'index.html', 'find.html', 'operator.html', 'forecast.html', 'sim.html', 'qr.html', 'story.html', 'about.html',
  'css/site.css', 'js/common.js', 'js/data2.js', 'js/data_emg.js', 'js/data_forecast.js', 'js/data_calc.js', 'js/data_qr.js', 'js/nav.js', 'js/tour.js', 'js/pwa.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'img/pres.jpg', 'img/overlay.jpg', 'img/planmap.jpg', 'img/compare.jpg', 'img/comp.jpg', 'img/valid.jpg', 'img/ana.jpg', 'img/pred.jpg', 'img/story_hero.jpg'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));   // 하나가 없어도 나머지는 저장
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var isPage = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0;
  if (isPage) {   // 화면(HTML): 인터넷이 되면 최신본, 안 되면 저장본
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
    }));
    return;
  }
  // 나머지(스크립트·그림·글꼴): 주소가 똑같은 저장본이 있으면 먼저 보여 주고 뒤에서 새로 받아 둠.
  // 주소(?v=번호)가 바뀌면 새로 받고, 인터넷이 안 될 때만 예전 저장본으로 대신함.
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit || caches.match(req, { ignoreSearch: true }); });
    return hit || net;
  }));
});
