// 공통 상단 메뉴 + 하단 정보
(function () {
  var pages = [
    ['index.html', '홈'],
    ['find.html', '내 출구 찾기'],
    ['operator.html', '운영자 안내'],
    ['sim.html', '3D 시뮬레이션'],
    ['story.html', '스토리'],
    ['about.html', '데이터·방법']
  ];
  var here = location.pathname.split('/').pop() || 'index.html';
  var links = pages.map(function (p) {
    return '<a href="' + p[0] + '"' + (p[0] === here ? ' class="on"' : '') + '>' + p[1] + '</a>';
  }).join('');
  var nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = '<div class="in"><a class="logo" href="index.html"><i>⇥</i>EXIT NAVI <small>퇴장 내비</small></a>' +
    '<button class="menu" aria-label="메뉴">메뉴</button><div class="links">' + links + '</div></div>';
  document.body.insertBefore(nav, document.body.firstChild);
  nav.querySelector('.menu').onclick = function () { nav.querySelector('.links').classList.toggle('open'); };

  var f = document.createElement('footer');
  f.innerHTML = '<div class="wrap row"><div><b>EXIT NAVI</b> · 실감형 콘텐츠와 공공데이터로 설계한 KSPO DOME 구역별 시차 퇴장 안내 서비스<br>' +
    '2026 한국체육산업개발(주) 공공데이터 활용 경진대회 출품작</div>' +
    '<div>데이터: 한국체육산업개발(주) · KOPIS · 서울특별시 · 기상청 · 한국천문연구원 (2025년)<br>' +
    '줄 인원·대기시간은 실제 데이터를 바탕으로 한 시뮬레이션 결과입니다.</div></div>';
  document.body.appendChild(f);
})();
