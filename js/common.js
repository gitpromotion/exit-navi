// 공통 데이터 도우미 (find.html, operator.html)
var D = window.KSPO2, Z = D.zones, DOORS = D.doors, CAP = D.cap_per_min;
var GATE = { '2-1문': '#6250d6', '2-2문': '#2a78d6', '2-3문': '#d55181' };
var doorIdx = {}; DOORS.forEach(function (d, i) { doorIdx[d.id] = i; });
var RING = [{ r0: 25, r1: 42 }, { r0: 45, r1: 60 }];
var R_CONC = 64, R_DOOR = 69.5;

function sc(k) { return D.scen[k]; }
function keyOf(method, floor) { return method + '_' + floor + '_100'; }
function qAt(k, di, t) {
  var q = sc(k).q; t = Math.max(0, Math.min(t, q.length - 1));
  var i = Math.floor(t), j = Math.min(i + 1, q.length - 1), f = t - i;
  return q[i][di] + (q[j][di] - q[i][di]) * f;
}
function doorName(id) { return '#' + id.replace('방풍실#', ''); }
function fmt(n) { return Math.round(n).toLocaleString(); }
function losColor(q) { return q <= 142 ? '#1baf7a' : q <= 333 ? '#eda100' : q <= 500 ? '#eb6834' : '#e34948'; }
function losName(q) { return q <= 142 ? '여유' : q <= 333 ? '혼잡' : q <= 500 ? '매우 혼잡' : '위험'; }
function mix(h, k) { // 흰색과 섞기
  h = h.replace('#', ''); var c = [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); });
  return 'rgb(' + c.map(function (v) { return Math.round(v + (255 - v) * k); }).join(',') + ')';
}
function ranges(arr) {
  arr = arr.slice().sort(function (a, b) { return a - b; }); var out = [], s = arr[0], p = arr[0];
  for (var i = 1; i <= arr.length; i++) { var v = arr[i]; if (v === p + 1) { p = v; continue; } out.push(s === p ? '' + s : s + '~' + p); s = p = v; }
  return out.join('·');
}
// 한 구역 관객(가운데 사람 기준)의 예상 퇴장 과정
function estimate(k, zid) {
  var S = sc(k), door = S.assign[zid], di = doorIdx[door], dl = S.delay[zid] || 0, walk = S.walk[zid];
  var t = 4 + dl + walk, wait = qAt(k, di, Math.min(t, D.tmax)) / CAP;
  return { door: door, di: di, gate: DOORS[di].gate, delay: dl, walk: walk, wait: wait, total: dl + walk + wait, queue: qAt(k, di, Math.min(t, D.tmax)) };
}
function announcements(k) {
  var S = sc(k), groups = {};
  Z.forEach(function (z) {
    var dl = S.delay[z.id] || 0, g = DOORS[doorIdx[S.assign[z.id]]].gate;
    groups[dl] = groups[dl] || {}; (groups[dl][g] = groups[dl][g] || []).push(z.id);
  });
  return Object.keys(groups).map(Number).sort(function (a, b) { return a - b; }).map(function (dl) {
    var parts = Object.keys(groups[dl]).sort().map(function (g) { return { gate: g, zones: groups[dl][g] }; });
    return { t: dl, parts: parts };
  });
}

// ---------- 평면 지도 (SVG) ----------
var rad = function (a) { return a * Math.PI / 180; };
function pt(r, a) { return [r * Math.cos(rad(a)), -r * Math.sin(rad(a))]; }
function sector(r0, r1, a0, a1) {
  var p1 = pt(r1, a0), p2 = pt(r1, a1), p3 = pt(r0, a1), p4 = pt(r0, a0), L = (a1 - a0) > 180 ? 1 : 0;
  return 'M' + p1 + 'A' + r1 + ',' + r1 + ' 0 ' + L + ' 0 ' + p2 + 'L' + p3 + 'A' + r0 + ',' + r0 + ' 0 ' + L + ' 1 ' + p4 + 'Z';
}
function zoneCenter(z) { var R = RING[z.ring]; return pt((R.r0 + R.r1) / 2, z.ang); }
function routePath(z, door) {
  var R = RING[z.ring], a0 = z.ang, a1 = DOORS[doorIdx[door]].ang;
  var d = ((a1 - a0 + 540) % 360) - 180, s = pt((R.r0 + R.r1) / 2, a0), m = pt(R_CONC, a0), e = pt(R_CONC, a0 + d), f = pt(R_DOOR, a1);
  return 'M' + s + 'L' + m + 'A' + R_CONC + ',' + R_CONC + ' 0 0 ' + (d > 0 ? 0 : 1) + ' ' + e + 'L' + f;
}
function drawMap(svg, opt) {
  // opt: {key, selected, onPick, showDelay}
  var S = sc(opt.key), h = '';
  h += '<circle r="74" fill="#f3f2ee"/>';
  h += '<circle r="' + R_CONC + '" fill="none" stroke="#dcdbd5" stroke-width="2.4"/>';
  h += '<circle r="22" fill="#ebeae5"/>';
  var st = pt(17, 270); h += '<rect x="-14" y="' + (st[1] - 4) + '" width="28" height="9" rx="1.5" fill="#0b0b0b"/><text x="0" y="' + (st[1] + 1.6) + '" class="lb w" style="font-size:3.4px;font-weight:700">무대</text>';
  h += '<text x="0" y="-3" class="lb s">플로어</text>';
  Z.forEach(function (z) {
    var R = RING[z.ring], g = DOORS[doorIdx[S.assign[z.id]]].gate, sel = opt.selected === z.id;
    var fill = sel ? GATE[g] : mix(GATE[g], (S.delay[z.id] || 0) > 0 ? 0.72 : 0.45);
    h += '<path class="z" data-z="' + z.id + '" d="' + sector(R.r0, R.r1, z.a0 + 0.35, z.a1 - 0.35) + '" fill="' + fill + '" stroke="' + (sel ? '#0b0b0b' : '#fff') + '" stroke-width="' + (sel ? 0.9 : 0.5) + '"/>';
    var c = zoneCenter(z), dl = S.delay[z.id] || 0;
    h += '<text x="' + c[0] + '" y="' + (c[1] + (opt.showDelay && dl ? -0.6 : 1.2)) + '" class="lb zn' + (sel ? ' w' : '') + '">' + z.id + '</text>';
    if (opt.showDelay && dl) h += '<text x="' + c[0] + '" y="' + (c[1] + 3.2) + '" class="lb dl' + (sel ? ' w' : '') + '">' + dl + '분 뒤</text>';
  });
  if (opt.selected) {
    var zz = Z.filter(function (z) { return z.id === opt.selected; })[0];
    h += '<path d="' + routePath(zz, S.assign[zz.id]) + '" fill="none" stroke="#0b0b0b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 2.6"/>';
  }
  var gates = {};
  DOORS.forEach(function (d, i) {
    var p = pt(R_DOOR, d.ang), on = opt.selected && S.assign[opt.selected] === d.id;
    h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (on ? 3.1 : 2.2) + '" fill="' + GATE[d.gate] + '" stroke="#fff" stroke-width="0.8"/>';
    var q = pt(R_DOOR + 5.2, d.ang); h += '<text x="' + q[0] + '" y="' + (q[1] + 1.2) + '" class="lb dn">' + doorName(d.id) + '</text>';
    (gates[d.gate] = gates[d.gate] || []).push(d.ang);
  });
  Object.keys(gates).forEach(function (g) {
    var a = gates[g].reduce(function (s, v) { return s + v; }, 0) / gates[g].length, p = pt(R_DOOR + 11.5, a);
    h += '<text x="' + p[0] + '" y="' + (p[1] + 1.4) + '" class="lb gt" fill="' + GATE[g] + '">' + g + '</text>';
  });
  svg.innerHTML = h;
  if (opt.onPick) svg.querySelectorAll('.z').forEach(function (el) {
    el.addEventListener('click', function () { opt.onPick(+el.getAttribute('data-z')); });
  });
}
