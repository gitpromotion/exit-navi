// EXIT NAVI PWA: 모바일 OS별 설치 안내 및 설치 프롬프트
(function () {
  'use strict';
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (err) { console.warn('Service worker registration failed:', err); });
    });
  }
  var deferredPrompt = null;
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  var inApp = /KAKAOTALK|NAVER\(|Instagram|FBAN|FBAV|Line\//i.test(ua);
  function installed() { return !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone); }
  function hideInstallButtons() { document.querySelectorAll('[data-install]').forEach(function (el) { el.style.display = 'none'; }); }
  window.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferredPrompt = event; });
  window.addEventListener('appinstalled', function () { deferredPrompt = null; hideInstallButtons(); closeGuide(); });

  var style = document.createElement('style');
  style.textContent = '.exit-install-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}' +
    '.exit-install-dialog{box-sizing:border-box;width:min(100%,460px);max-height:min(90vh,720px);overflow-y:auto;background:#fff;color:#111;border-radius:20px;padding:24px;font:14px/1.7 "Noto Sans KR",system-ui,sans-serif;box-shadow:0 24px 70px #0005}' +
    '.exit-install-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}.exit-install-head img{width:44px;height:44px;border-radius:11px}.exit-install-head strong{font-size:19px}.exit-install-head p{margin:0;color:#666;font-size:12px}' +
    '.exit-install-close{margin-left:auto;border:0;background:#f3f3f3;border-radius:50%;width:34px;height:34px;font-size:21px;cursor:pointer;color:#333}' +
    '.exit-install-tabs{display:flex;gap:6px;background:#f3f3f3;border-radius:12px;padding:5px;margin:16px 0}.exit-install-tab{flex:1;border:0;border-radius:9px;background:transparent;padding:10px 6px;font:inherit;font-weight:700;cursor:pointer;color:#555}.exit-install-tab[aria-selected=true]{background:#111;color:white}' +
    '.exit-install-steps{margin:12px 0;padding-left:24px}.exit-install-steps li{padding:5px 0}.exit-install-tip{background:#f5f5f5;border-radius:12px;padding:12px 14px;font-size:12px;color:#444;margin-top:12px}' +
    '.exit-install-action{width:100%;border:0;border-radius:12px;background:#111;color:white;font:inherit;font-weight:700;padding:12px;margin-top:16px;cursor:pointer}.exit-install-action:focus-visible,.exit-install-tab:focus-visible,.exit-install-close:focus-visible{outline:3px solid #f47668;outline-offset:2px}' +
    '@media(max-width:480px){.exit-install-overlay{align-items:flex-end;padding:0}.exit-install-dialog{width:100%;border-radius:20px 20px 0 0;max-height:90dvh;padding:20px}}';
  document.head.appendChild(style);
  var overlay = null, previousFocus = null;
  function closeGuide() {
    if (!overlay) return;
    overlay.remove(); overlay = null;
    document.removeEventListener('keydown', keyHandler);
    document.body.style.overflow = '';
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }
  function keyHandler(e) {
    if (e.key === 'Escape') closeGuide();
    if (e.key === 'Tab' && overlay) {
      var focusables = Array.from(overlay.querySelectorAll('button:not([disabled])'));
      if (!focusables.length) return;
      if (e.shiftKey && document.activeElement === focusables[0]) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === focusables[focusables.length - 1]) { e.preventDefault(); focusables[0].focus(); }
    }
  }
  function guide(initialTab) {
    if (overlay) closeGuide();
    previousFocus = document.activeElement;
    overlay = document.createElement('div');
    overlay.className = 'exit-install-overlay';
    overlay.innerHTML = '<section class="exit-install-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-install-title">' +
      '<div class="exit-install-head"><img src="icons/icon-192.png" alt="EXIT NAVI 아이콘"><div><strong id="exit-install-title">앱 설치 안내</strong><p>EXIT NAVI를 홈 화면에서 빠르게 실행하세요.</p></div><button type="button" class="exit-install-close" aria-label="닫기">×</button></div>' +
      '<div class="exit-install-tabs" role="tablist" aria-label="스마트폰 종류"><button type="button" class="exit-install-tab" data-os="android" role="tab" aria-controls="exit-install-panel">안드로이드</button><button type="button" class="exit-install-tab" data-os="ios" role="tab" aria-controls="exit-install-panel">아이폰</button></div>' +
      '<div id="exit-install-panel" role="tabpanel" aria-live="polite"></div>' +
      '<div class="exit-install-tip">💡 카카오톡 등 앱 내부 브라우저에서는 설치 메뉴가 보이지 않을 수 있습니다. Chrome 또는 Safari에서 주소를 직접 열어주세요. 기기·브라우저 버전에 따라 메뉴 이름이 다를 수 있습니다.</div>' +
      '<button type="button" class="exit-install-action">확인</button></section>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('.exit-install-close') || e.target.closest('.exit-install-action')) closeGuide(); });
    overlay.querySelectorAll('[data-os]').forEach(function (button) {
      button.addEventListener('click', function () { setTab(button.dataset.os); });
    });
    setTab(initialTab || (ios ? 'ios' : 'android'));
    document.addEventListener('keydown', keyHandler);
    overlay.querySelector('.exit-install-close').focus();
  }
  function setTab(os) {
    if (!overlay) return;
    overlay.querySelectorAll('[data-os]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.os === os)); b.tabIndex = b.dataset.os === os ? 0 : -1; });
    var panel = overlay.querySelector('#exit-install-panel');
    panel.innerHTML = os === 'ios'
      ? '<b>Safari 브라우저에서 설치</b><ol class="exit-install-steps"><li>Safari에서 EXIT NAVI 웹사이트를 엽니다.</li><li>공유 버튼(□↑)을 누릅니다. 버전에 따라 메뉴 위치가 다릅니다.</li><li><b>홈 화면에 추가</b>를 선택합니다.</li><li>표시되는 경우 <b>웹 앱으로 열기</b>를 활성화하고 <b>추가</b>를 누릅니다.</li><li>홈 화면의 EXIT NAVI 아이콘을 실행합니다.</li></ol>'
      : '<b>Chrome 브라우저에서 설치</b><ol class="exit-install-steps"><li>Chrome에서 EXIT NAVI 웹사이트를 엽니다.</li><li>오른쪽 위 <b>⋮ 메뉴</b>를 누릅니다.</li><li><b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 선택합니다.</li><li>안내에 따라 설치한 후 홈 화면의 EXIT NAVI 아이콘을 실행합니다.</li></ol>';
  }
  function install() {
    if (installed()) { guide(ios ? 'ios' : 'android'); return; }
    if (deferredPrompt && !inApp) {
      var promptEvent = deferredPrompt;
      deferredPrompt = null;
      promptEvent.prompt();
      Promise.resolve(promptEvent.userChoice).catch(function () {});
      return;
    }
    guide(ios ? 'ios' : 'android');
  }
  window.EXIT_INSTALL = install;
  window.EXIT_INSTALL_GUIDE = guide;
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-install]');
    if (button) { event.preventDefault(); install(); }
  });
  if (installed()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideInstallButtons);
    else hideInstallButtons();
  }
})();
