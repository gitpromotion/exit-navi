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
  var S = typeof k === 'string' ? sc(k) : k, groups = {};
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
  // opt: {key, S, selected, onPick, showDelay, closed}
  var S = opt.S || sc(opt.key), h = '';
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
  ACCESS.segs.forEach(function (sg) {
    var on = opt.selected === sg.id;
    h += '<path class="acc" data-z="' + sg.id + '" d="' + sector(ACCESS.r - 1.1, ACCESS.r + 1.1, sg.a0 + 0.4, sg.a1 - 0.4) + '" fill="' + (on ? '#0b0b0b' : '#0f766e') + '" stroke="#fff" stroke-width="0.4"/>';
  });
  if (opt.selected && typeof opt.selected === 'string') {
    var sg = accessSeg(opt.selected), dr = (opt.S && opt.accessDoor) ? opt.accessDoor : sg.door, a1 = DOORS[doorIdx[dr]].ang, am = Math.max(sg.a0, Math.min(sg.a1, a1));
    var s0 = pt(ACCESS.r, am), m0 = pt(R_CONC, am), d0 = ((a1 - am + 540) % 360) - 180, e0 = pt(R_CONC, am + d0), f0 = pt(R_DOOR, a1);
    h += '<path d="M' + s0 + 'L' + m0 + 'A' + R_CONC + ',' + R_CONC + ' 0 0 ' + (d0 > 0 ? 0 : 1) + ' ' + e0 + 'L' + f0 + '" fill="none" stroke="#0b0b0b" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="0.1 2.6"/>';
  }
  if (opt.selected && typeof opt.selected !== 'string') {
    var zz = Z.filter(function (z) { return z.id === opt.selected; })[0];
    h += '<path d="' + routePath(zz, S.assign[zz.id]) + '" fill="none" stroke="#0b0b0b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.1 2.6"/>';
  }
  var gates = {};
  DOORS.forEach(function (d, i) {
    var p = pt(R_DOOR, d.ang), on = opt.selected && (typeof opt.selected === 'string' ? ((opt.accessDoor || accessSeg(opt.selected).door) === d.id) : S.assign[opt.selected] === d.id);
    if (opt.closed === d.id) {
      h += '<circle class="door" data-d="' + d.id + '" cx="' + p[0] + '" cy="' + p[1] + '" r="3.4" fill="#e34948" stroke="#fff" stroke-width="0.8"/>' +
        '<path d="M' + (p[0] - 1.6) + ',' + (p[1] - 1.6) + 'L' + (p[0] + 1.6) + ',' + (p[1] + 1.6) + 'M' + (p[0] + 1.6) + ',' + (p[1] - 1.6) + 'L' + (p[0] - 1.6) + ',' + (p[1] + 1.6) + '" stroke="#fff" stroke-width="0.9" stroke-linecap="round" pointer-events="none"/>';
    } else h += '<circle class="door" data-d="' + d.id + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (on ? 3.1 : 2.2) + '" fill="' + GATE[d.gate] + '" stroke="#fff" stroke-width="0.8"/>';
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
  if (opt.onPick) svg.querySelectorAll('.acc').forEach(function (el) {
    el.style.cursor = 'pointer'; el.addEventListener('click', function () { opt.onPick(el.getAttribute('data-z')); });
  });
  if (opt.onDoor) svg.querySelectorAll('.door').forEach(function (el) {
    el.style.cursor = 'pointer'; el.addEventListener('click', function () { opt.onDoor(el.getAttribute('data-d')); });
  });
}

// ---------- 지하철 (2025 승하차 데이터 분석 결과) ----------
// 공연 후 초과 승차 비중: 9호선 올림픽공원 69.7%, 5호선 올림픽공원 24.9%, 방이·몽촌토성·한성백제 합계 5.4%
var STATION = { subway: D.subway_share, olympic: 0.946, walk: D.walk_station,
  lines: [['9호선 올림픽공원역', 0.697], ['5호선 올림픽공원역', 0.249], ['방이·몽촌토성·한성백제역', 0.054]] };
// 올림픽공원역(5·9호선)에 1분마다 도착하는 관객 수 (건물 밖 유출 × 지하철 이용 47% × 올림픽공원역 94.6%, 도보 walk분 뒤)
function stationCurve(k, len) {
  len = len || 40; var o = sc(k).out, a = new Array(len).fill(0);
  for (var t = 0; t < o.length; t++) { var m = t + STATION.walk; if (m < len) a[m] += o[t].reduce(function (s, v) { return s + v; }, 0) * STATION.subway * STATION.olympic; }
  return a;
}

// ---------- 다국어 안내 ----------
var LANGS = { ko: { name: '한국어', tts: 'ko-KR' }, en: { name: 'English', tts: 'en-US' }, ja: { name: '日本語', tts: 'ja-JP' }, zh: { name: '中文', tts: 'zh-CN' } };
function rangesL(arr, lang, speech) {
  var to = speech ? { ko: '에서 ', en: ' to ', ja: 'から', zh: '至' }[lang] : (lang === 'en' ? '–' : '~');
  var sep = { ko: '·', en: ', ', ja: '・', zh: '、' }[lang]; if (speech && lang === 'ko') sep = ', ';
  return ranges(arr).split('·').map(function (r) { return r.replace('~', to); }).join(sep);
}
function gateL(g, lang) { var n = g.replace('문', ''); return { ko: g, en: 'Gate ' + n, ja: n + 'ゲート', zh: n + '号门' }[lang]; }
function zonesL(z, lang, sp) { var r = rangesL(z, lang, sp); return { ko: r + '구역', en: (z.length > 1 ? 'Sections ' : 'Section ') + r, ja: r + 'ブロック', zh: r + '区' }[lang]; }
function whenL(t, lang) {
  return t === 0 ? { ko: '[종료 직후]', en: '[Right after the show]', ja: '[終演直後]', zh: '[演出结束后]' }[lang]
    : { ko: '[' + t + '분 뒤]', en: '[In ' + t + ' minutes]', ja: '[' + t + '分後]', zh: '[' + t + '分钟后]' }[lang];
}
// parts: [{gate, zones:[...]}]
function annLine(t, parts, lang, speech) {
  var p = parts.map(function (x) { return { z: zonesL(x.zones, lang, speech), g: gateL(x.gate, lang) }; });
  var s;
  if (lang === 'ko') s = p.map(function (x) { return x.z + '은 ' + x.g; }).join(', ') + '으로 퇴장해 주세요.' + (t === 0 ? ' 나머지 구역은 잠시 자리에서 기다려 주세요.' : '');
  if (lang === 'en') s = p.map(function (x) { return x.z + ', please exit via ' + x.g; }).join('. ') + '.' + (t === 0 ? ' All other sections, please remain seated for a moment.' : '');
  if (lang === 'ja') s = p.map(function (x) { return x.z + 'は' + x.g; }).join('、') + 'からご退場ください。' + (t === 0 ? 'その他のブロックの方は、しばらくお席でお待ちください。' : '');
  if (lang === 'zh') s = p.map(function (x) { return x.z + '请从' + x.g + '退场'; }).join('，') + '。' + (t === 0 ? '其他区域的观众请在座位上稍候。' : '');
  return speech ? s : whenL(t, lang) + ' ' + s;
}
function zoneLine(z, gate, t, lang, speech) {
  var g = gateL(gate, lang), w = speech ? '' : whenL(t, lang) + ' ';
  if (lang === 'ko') return w + z + '구역 관객 여러분, ' + (t ? t + '분 뒤에 ' : '') + g + ' 방향 출구로 퇴장해 주세요.' + (t ? ' 그전까지는 자리에서 잠시 기다려 주세요.' : '');
  if (lang === 'en') return w + 'Section ' + z + ', please ' + (t ? 'wait in your seats, then in ' + t + ' minutes ' : '') + 'exit via ' + g + '.';
  if (lang === 'ja') return w + z + 'ブロックの皆さま、' + (t ? t + '分後に' : '') + g + 'からご退場ください。' + (t ? 'それまでお席でお待ちください。' : '');
  if (lang === 'zh') return w + z + '区的观众，请' + (t ? '在座位上稍候，' + t + '分钟后' : '') + '从' + g + '退场。';
}
function closedLine(doorId, lang) {
  var d = DOORS[doorIdx[doorId]], g = gateL(d.gate, lang), n = doorName(doorId);
  return { ko: '[비상 안내] ' + d.gate + ' ' + n + ' 출구가 폐쇄되었습니다. 안내에 따라 다른 출구를 이용해 주세요.',
    en: '[Emergency notice] ' + g + ' door ' + n + ' is closed. Please follow the guidance to another exit.',
    ja: '[緊急のご案内] ' + g + ' ' + n + '出口は閉鎖されています。案内に従って別の出口をご利用ください。',
    zh: '[紧急通知] ' + g + ' ' + n + '出口已关闭，请按照指引使用其他出口。' }[lang];
}

// ---------- 음성 방송 (브라우저 내장 음성 합성) ----------
var TTS = window.speechSynthesis || null;
function ttsOK() { return !!TTS; }
// 읽기용 문장 다듬기: 화면 글자는 그대로, 소리만 자연스럽게 ("2-2문" → "2 다시 2문", "#4" → "4번")
function speechText(t, lang) {
  t = String(t).replace(/[\[\]]/g, ' ');
  var dash = { ko: ' 다시 ', en: ' dash ', ja: 'の', zh: '杠' }[lang];
  t = t.replace(/(\d+)\s*-\s*(\d+)/g, '$1' + dash + '$2');
  t = t.replace(/#\s*(\d+)/g, { ko: '$1번 ', en: 'number $1 ', ja: '$1番', zh: '$1号' }[lang]);
  if (lang === 'ko') t = t.replace(/~/g, '에서 ');
  return t.replace(/\s+/g, ' ').trim();
}
// 부드러운 목소리 우선: 신경망(Natural/Online) 음성 → 이름 있는 여성 음성 → 구글 → 그 외
var SOFT_VOICES = /sunhi|yuna|injoon|nanami|kyoko|xiaoxiao|xiaoyi|tingting|jenny|aria|samantha|ava/i;
function pickVoice(lang) {
  var code = LANGS[lang].tts.slice(0, 2).toLowerCase(), best = null, bestScore = -1;
  TTS.getVoices().forEach(function (x) {
    if (!x.lang || x.lang.replace('_', '-').toLowerCase().indexOf(code) !== 0) return;
    var sc = 0;
    if (/natural|online|neural/i.test(x.name)) sc += 6;
    if (SOFT_VOICES.test(x.name)) sc += 3;
    if (/google/i.test(x.name)) sc += 2;
    if (/heami|haruka|huihui|david|zira|mark/i.test(x.name)) sc -= 1; // 오래된 기계음
    if (sc > bestScore) { bestScore = sc; best = x; }
  });
  return best;
}
<<<<<<< HEAD
function speak(texts, lang, onend) {
  if (!TTS) { alert('이 브라우저는 음성 방송을 지원하지 않아요. 크롬이나 엣지에서 열어 주세요.'); return; }
  TTS.cancel(); if (!Array.isArray(texts)) texts = [texts];
  var code = LANGS[lang].tts, pref = pickVoice(lang);
  texts.forEach(function (t, i) {
    var u = new SpeechSynthesisUtterance(speechText(t, lang)); u.lang = code; if (pref) u.voice = pref;
    u.rate = 0.92; u.pitch = 1.05; u.volume = 1;
    if (i === texts.length - 1 && onend) u.onend = onend;
=======
var SPEAK_GAP = 700;   // 문장 사이 쉬는 시간(ms): 0.7초
var speakRun = 0;      // 새로 재생하거나 멈추면 이전 재생 이어가기를 끊음
function splitSentences(t) {
  return String(t).split(/(?<=[.!?。！？])\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
}
function speak(texts, lang, onend) {
  if (!TTS) { alert('이 브라우저는 음성 방송을 지원하지 않아요. 크롬이나 엣지에서 열어 주세요.'); return; }
  TTS.cancel(); if (!Array.isArray(texts)) texts = [texts];
  var code = LANGS[lang].tts, pref = pickVoice(lang), run = ++speakRun, list = [];
  texts.forEach(function (t) { splitSentences(speechText(t, lang)).forEach(function (x) { list.push(x); }); });
  function next(i) {
    if (run !== speakRun) return;
    if (i >= list.length) { if (onend) onend(); return; }
    var u = new SpeechSynthesisUtterance(list[i]); u.lang = code; if (pref) u.voice = pref;
    u.rate = 0.9; u.pitch = 1.0; u.volume = 1;
    u.onend = function () { setTimeout(function () { next(i + 1); }, SPEAK_GAP); };
    u.onerror = u.onend;
>>>>>>> woonsik
    TTS.speak(u);
  }
  next(0);
}
<<<<<<< HEAD
function stopSpeak() { if (TTS) TTS.cancel(); }
=======
function stopSpeak() { speakRun++; if (TTS) TTS.cancel(); }
>>>>>>> woonsik
if (TTS) { TTS.getVoices(); if ('onvoiceschanged' in TTS) TTS.onvoiceschanged = function () { TTS.getVoices(); }; }

// ---------- 교통약자 우선 퇴장 (공식 좌석배치도: 2층 C블록 뒤편 장애인석, 좌석표 82석) ----------
// 장애인석과 출구(방풍실)가 같은 2층 → 계단 없이 이동. 휠체어 이동 속도 0.8m/s 가정.
var ACCESS = { seats: 82, speed: 0.8, r: 43.5,
  segs: [
    { id: 'W1', label: '장애인석 (5~7구역 뒤)', zones: [5, 6, 7], a0: 99.5, a1: 141.5, door: '방풍실#4', dist: 40, seats: 35 },
    { id: 'W2', label: '장애인석 (8구역 뒤)', zones: [8], a0: 83.8, a1: 97.2, door: '방풍실#5', dist: 26, seats: 12 },
    { id: 'W3', label: '장애인석 (9~11구역 뒤)', zones: [9, 10, 11], a0: 40.1, a1: 81.8, door: '방풍실#6', dist: 39, seats: 35 }
  ] };
function accessSeg(id) { return ACCESS.segs.filter(function (s) { return s.id === id; })[0]; }
// 비상 모드 등으로 배정 출구가 닫히면 같은 2-2문의 다른 열린 출구 → 없으면 가장 가까운 열린 출구
function accessDoor(seg, closed) {
  if (seg.door !== closed) return seg.door;
  var mid = (seg.a0 + seg.a1) / 2, best = null, bd = 1e9;
  DOORS.forEach(function (d) { if (d.id === closed) return; var dd = Math.abs(((d.ang - mid + 540) % 360) - 180) + (d.gate === '2-2문' ? 0 : 1000); if (dd < bd) { bd = dd; best = d.id; } });
  return best;
}
function accessEstimate(k, id) {
  var seg = accessSeg(id), S = sc(k), di = doorIdx[seg.door], walk = seg.dist / ACCESS.speed / 60;
  var q = qAt(k, di, walk), wait = q / CAP;
  return { seg: seg, door: seg.door, gate: DOORS[di].gate, walk: walk, queue: q, wait: wait, total: walk + wait };
}
function accessLine(gate, lang) {
  var g = gateL(gate, lang);
  return { ko: '[종료 직후 · 우선 퇴장] 장애인석 관객과 동반자분은 다른 관객보다 먼저 ' + g + '으로 퇴장해 주세요. 같은 층이라 계단 없이 바로 나가실 수 있습니다.',
    en: '[Right after the show · Priority exit] Guests in wheelchair seating and their companions, please exit first via ' + g + '. It is on the same floor, so there are no stairs.',
    ja: '[終演直後・優先退場] 車いす席のお客様と同伴の方は、先に' + g + 'からご退場ください。同じ階のため階段はありません。',
    zh: '[演出结束后·优先退场] 轮椅席观众及陪同人员请先从' + g + '退场。出口在同一层，无需走楼梯。' }[lang];
}
