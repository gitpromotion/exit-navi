// 앱으로 설치(PWA): 서비스 워커 등록 + "📱 앱으로 설치" 버튼
(function () {
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', function () { deferred = null; document.querySelectorAll('[data-install]').forEach(function (b) { b.style.display = 'none'; }); });
  function guide(html) {
    var m = document.createElement('div');
    m.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;padding:12px';
    m.innerHTML = '<div style="background:#fff;color:#0b0b0b;border-radius:18px;max-width:420px;width:100%;padding:18px 18px 14px;font:14px/1.7 \'Noto Sans KR\',system-ui,sans-serif">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><img src="icons/icon-192.png" alt="" style="width:40px;height:40px;border-radius:10px"><b style="font-size:16px">EXIT NAVI 앱으로 설치</b></div>' + html +
      '<div style="text-align:right;margin-top:10px"><button style="font:inherit;font-weight:700;border:0;background:#0b0b0b;color:#fff;border-radius:10px;padding:8px 16px;cursor:pointer">확인</button></div></div>';
    m.onclick = function (e) { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); };
    document.body.appendChild(m);
  }
  function install() {
    if (standalone) { guide('이미 앱으로 실행 중이에요.'); return; }
    if (deferred) { deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; }); return; }
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    guide(ios
      ? '<ol style="margin:0;padding-left:20px"><li>Safari 아래쪽의 <b>공유 버튼(□↑)</b>을 눌러요.</li><li><b>홈 화면에 추가</b>를 눌러요.</li><li>홈 화면의 <b>EXIT NAVI</b> 아이콘으로 열면 앱처럼 전체 화면으로 열려요.</li></ol>'
      : '<ol style="margin:0;padding-left:20px"><li>크롬·엣지 오른쪽 위 <b>⋮ 메뉴</b>를 눌러요.</li><li><b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 눌러요.</li><li>설치한 아이콘으로 열면 주소창 없이 앱처럼 열려요.</li></ol>');
  }
  window.EXIT_INSTALL = install;
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-install]'); if (b) { e.preventDefault(); install(); } });
  if (standalone) document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('[data-install]').forEach(function (b) { b.style.display = 'none'; }); });
})();
