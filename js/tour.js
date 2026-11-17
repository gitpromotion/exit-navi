// 3분 둘러보기: 주소에 ?tour=번호 가 있으면 화면 아래에 안내 막대를 띄웁니다.
(function () {
  var STEPS = [
    { url: 'sim.html', title: '문제와 효과를 한눈에', time: '40초',
      text: '왼쪽은 <b>지금처럼</b>, 오른쪽은 <b>EXIT NAVI</b>예요. 아래 <b>▶ 재생</b>을 누르면 왼쪽 출구 앞 줄은 2,000명 넘게 쌓이고, 오른쪽은 211명 이하로 유지돼요.' },
    { url: 'find.html', hash: '#z=16', title: '관객 화면 · 기다림 보상', time: '50초',
      text: '16구역을 골라 두었어요. 출구와 출발 시각, <b>🔊 듣기</b>를 확인한 뒤 아래 <b>🎁 기다림 보상</b>에서 <b>10배속 → ▶ 시연</b>을 눌러 보세요. 시간이 되면 쿠폰이 열려요.' },
    { url: 'operator.html', title: '운영자 화면 · 전광판 · 비상 모드', time: '50초',
      text: '<b>📺 전광판 모드 → 10배속 → ▶ 시작</b>을 누르면 구역 신호등이 차례로 초록이 돼요. ✕로 닫은 뒤 <b>🚨 비상 모드</b>에서 출구 하나를 폐쇄하면 남은 출구로 바로 다시 배정돼요.' },
    { url: 'forecast.html', title: '다가오는 공연 혼잡 예보', time: '20초',
      text: '2026년 11월~2027년 2월 KSPO DOME 공연 25회의 혼잡 등급이에요. 카드를 누르면 지금처럼과 EXIT NAVI의 최대 줄을 비교해 볼 수 있어요.' },
    { url: 'about.html', title: '데이터와 계산 방법', time: '20초',
      text: '사용한 공공데이터와 계산 과정(STEP 1~12)이에요. 둘러보기는 여기까지예요. 감사합니다!' }
  ];
  function link(i) { var s = STEPS[i]; return s.url + '?tour=' + (i + 1) + (s.hash || ''); }
  window.EXIT_TOUR = { steps: STEPS, link: link };

  var m = location.search.match(/[?&]tour=(\d+)/);
  if (!m) return;
  var i = +m[1] - 1; if (i < 0 || i >= STEPS.length) return;
  var s = STEPS[i];

  var css = document.createElement('style');
  css.textContent =
    '#tourbar{position:fixed;right:16px;bottom:16px;z-index:900;width:min(440px,calc(100% - 24px));background:#0b0b0b;color:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:14px 16px 12px;font-family:"Noto Sans KR",system-ui,sans-serif}' +
    '#tourbar .tb-h{display:flex;align-items:center;gap:6px 10px;flex-wrap:wrap;font-size:12px;color:#a9a8a2}' +
    '#tourbar .tb-h b{color:#fff;font-size:15px}' +
    '#tourbar .tb-dots{display:flex;gap:4px;margin-left:auto}' +
    '#tourbar .tb-dots i{width:22px;height:4px;border-radius:2px;background:#3a3a37}' +
    '#tourbar .tb-dots i.on{background:#fff}' +
    '#tourbar .tb-x{background:none;border:0;color:#a9a8a2;font-size:18px;cursor:pointer;padding:0 0 0 6px;line-height:1}' +
    '#tourbar .tb-t{font-size:14px;line-height:1.65;margin:8px 0 10px;color:#e8e7e2}' +
    '#tourbar .tb-t b{color:#fff}' +
    '#tourbar .tb-b{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}' +
    '#tourbar .tb-b a{font-size:13px;font-weight:700;text-decoration:none;border-radius:9px;padding:7px 14px;border:1px solid #3a3a37;color:#fff}' +
    '#tourbar .tb-b a.nx{background:#fff;color:#0b0b0b;border-color:#fff}' +
    '#tourbar.min .tb-t,#tourbar.min .tb-b{display:none}' +
    '@media(max-width:600px){#tourbar{right:8px;left:8px;bottom:8px;width:auto;padding:10px 12px;border-radius:14px}#tourbar .tb-t{font-size:12.5px;margin:6px 0 8px}#tourbar .tb-h b{font-size:13.5px}#tourbar .tb-dots{display:none}#tourbar .tb-b a{padding:6px 10px;font-size:12px}body{padding-bottom:190px}}' +
    '@media print{#tourbar{display:none}}';
  if (/sim\.html$/.test(location.pathname)) css.textContent += '@media(min-width:601px){#tourbar{right:auto;left:16px;bottom:178px}}';
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.id = 'tourbar';
  bar.innerHTML =
    '<div class="tb-h"><span>3분 둘러보기 ' + (i + 1) + '/' + STEPS.length + ' · 약 ' + s.time + '</span><b>' + s.title + '</b>' +
    '<span class="tb-dots">' + STEPS.map(function (_, k) { return '<i' + (k <= i ? ' class="on"' : '') + '></i>'; }).join('') + '</span>' +
    '<button class="tb-x" id="tbMin" title="접기">–</button><button class="tb-x" id="tbX" title="둘러보기 끝내기">✕</button></div>' +
    '<div class="tb-t">' + s.text + '</div>' +
    '<div class="tb-b">' + (i > 0 ? '<a href="' + link(i - 1) + '">← 이전</a>' : '<a href="index.html">처음으로</a>') +
    (i < STEPS.length - 1 ? '<a class="nx" href="' + link(i + 1) + '">다음: ' + STEPS[i + 1].title + ' →</a>' : '<a class="nx" href="index.html">홈으로 ✓</a>') + '</div>';
  function mount() {
    document.body.appendChild(bar);
    document.getElementById('tbX').onclick = function () { bar.remove(); history.replaceState(null, '', location.pathname + location.hash); };
    document.getElementById('tbMin').onclick = function () { bar.classList.toggle('min'); this.textContent = bar.classList.contains('min') ? '+' : '–'; };
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
