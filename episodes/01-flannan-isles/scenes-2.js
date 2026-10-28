// Episode 01 scenes, part 2: inside, clues, coats, landing, myth, theory, ending, outro.
(function () {
'use strict';
const SCENES = window.SCENES;
const EP = window.EP;
const { C, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, easeOutBack } = HD;
const CHALK = EP.chalk;

// panel helper: border draws itself on, content is clipped inside
function panel(L, x, y, w, h, p, id, drawInside) {
  if (p <= 0) return;
  const box = HD.rect(x, y, w, h);
  for (const c of [L.col, L.ink, L.glow]) { c.save(); HD.trace(c, box, true); c.clip(); }
  L.col.globalAlpha = 1;
  HD.washRect(L.col, 'pn' + id, x - 10, y - 10, w + 20, h + 20, '#efe6d2', 0.6 * smooth(p));
  drawInside(smooth(p));
  for (const c of [L.col, L.ink, L.glow]) c.restore();
  HD.ink(L.ink, HD.partial(HD.closed(box), easeOut(p)), id, 5, 1.2);
}

// =====================================================================
// 8. INSIDE — a graphic-novel page: steps, gate, door, fire, beds, clock.
// =====================================================================
SCENES.inside = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const P = [[60, 60, 1100, 470], [1190, 60, 330, 470], [1550, 60, 310, 470], [60, 560, 560, 460], [650, 560, 560, 460], [1240, 560, 620, 460]];
    const appear = [k.at('in1') - 0.6, k.at('in2') - 0.2, k.at('in2') + 1.2, k.at('in3') - 0.1, k.at('in3') + 1.8, k.at('in4') - 0.2];
    const focus = i => ({ s: Math.min(1920 / (P[i][2] + 160), 1080 / (P[i][3] + 120), 1.9), x: P[i][0] + P[i][2] / 2, y: P[i][1] + P[i][3] / 2 });
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 960, y: 540 },
      { t: appear[0] + 0.4, ...focus(0) },
      { t: appear[1] + 0.2, ...focus(0) },
      { t: appear[1] + 0.8, s: 1.6, x: 1530, y: 300 },
      { t: appear[3], s: 1.6, x: 1530, y: 300 },
      { t: appear[3] + 0.7, s: 1.55, x: 640, y: 790 },
      { t: appear[5], s: 1.55, x: 640, y: 790 },
      { t: appear[5] + 0.8, ...focus(5) },
      { t: k.at('in4') + 2.0, ...focus(5) },
      { t: k.at('in4') + 3.2, s: 2.3, x: 1550, y: 720 },
    ], t);
    HD.cam(L, cam);
    HD.washRect(L.col, 'in-page', -300, -300, 2600, 1700, '#2a2f48', 0.55);
    const ps = appear.map(a => prog(t, a, 0.6));
    // P1: Moore climbs the steps alone
    panel(L, ...P[0], ps[0], 1500, () => {
      HD.washRect(L.col, 'in-p1sky', 60, 60, 1100, 470, '#a3abbd', 0.45);
      const slope = [[60, 530], [60, 470], [400, 420], [760, 300], [1040, 170], [1160, 150], [1160, 530]];
      EP.rock(L, 'in-p1rock', slope, { color: '#5b5a63', alpha: 0.8, id: 1510, strata: 5 });
      HD.lighthouse(L, 1070, 165, 0.42, { id: 1520 });
      const u = easeInOut(prog(t, k.at('in1') - 0.3, k.endOf('in1') - k.at('in1') + 1.5));
      const fx = lerp(220, 860, u), fy = lerp(450, 260, u);
      for (let i = 0; i < 16; i++) HD.ink(L.ink, [[lerp(160, 960, i / 16), lerp(472, 222, i / 16)], [lerp(160, 960, i / 16) + 30, lerp(472, 222, i / 16)]], 1530 + i, 1.4, 0.4, 0.6);
      HD.figure(L, fx, fy, 1.0, { pose: 'climb', phase: t * 5, id: 1550 });
    });
    // P2: gate shut
    panel(L, ...P[1], ps[1], 1600, () => {
      for (const px of [1210, 1470]) { HD.crayon(L.col, HD.rect(px, 150, 40, 380), '#8a8778', 1610 + px, { spacing: 4 }); HD.inkShape(L.ink, HD.rect(px, 150, 40, 380), 1612 + px, 2.2, 0.8); }
      for (let i = 0; i < 9; i++) {
        const bx = 1268 + i * 22;
        HD.ink(L.ink, [[bx, 200], [bx, 520]], 1620 + i, 3, 0.5);
        HD.ink(L.ink, [[bx - 6, 206], [bx, 186], [bx + 6, 206]], 1630 + i, 2, 0.4);
      }
      HD.ink(L.ink, [[1250, 260], [1470, 260]], 1640, 3, 0.6);
      HD.ink(L.ink, [[1250, 460], [1470, 460]], 1641, 3, 0.6);
    });
    // P3: door shut
    panel(L, ...P[2], ps[2], 1700, () => {
      HD.washRect(L.col, 'in-p3w', 1550, 60, 310, 470, '#d8d2c4', 0.5);
      const door = HD.rect(1610, 150, 190, 380);
      HD.crayon(L.col, door, '#7a5230', 1710, { spacing: 4, dark: '#55361d' });
      HD.inkShape(L.ink, door, 1711, 3, 1);
      for (let i = 1; i < 4; i++) HD.ink(L.ink, [[1610 + i * 47, 150], [1610 + i * 47, 530]], 1712 + i, 1.4, 0.8, 0.6);
      for (const hy of [210, 450]) HD.ink(L.ink, [[1615, hy], [1700, hy]], 1720 + hy, 5, 0.4, 1, '#25222a');
      HD.dot(L.ink, 1775, 345, 8, '#25222a');
    });
    // P4: cold fireplace
    panel(L, ...P[3], ps[3], 1800, () => {
      HD.washRect(L.col, 'in-p4w', 60, 560, 560, 460, '#b9b1a3', 0.5);
      const hearth = [[140, 1020], [140, 690], [540, 690], [540, 1020], [470, 1020], [470, 770], [210, 770], [210, 1020]];
      HD.crayon(L.col, hearth, '#8a8778', 1810, { spacing: 5 });
      HD.inkShape(L.ink, hearth, 1811, 3, 1);
      HD.crayon(L.col, HD.rect(210, 770, 260, 250), '#1d1c22', 1812, { spacing: 3 });
      HD.crayon(L.col, HD.ellipse(340, 985, 100, 22, 16), '#9a9aa2', 1813, { spacing: 3 });
      for (let i = 0; i < 5; i++) HD.ink(L.ink, [[270 + i * 30, 990], [300 + i * 26, 960]], 1814 + i, 3, 0.6, 0.8, '#3a332d');
      HD.ink(L.ink, [[340, 770], [340, 850]], 1820, 2, 0.4);
      HD.crayon(L.col, HD.ellipse(340, 880, 40, 30, 16), '#2b2b33', 1821, { spacing: 3 });
      HD.inkShape(L.ink, HD.ellipse(340, 880, 40, 30, 16), 1822, 2, 0.5);
    });
    // P5: empty beds
    panel(L, ...P[4], ps[4], 1900, () => {
      HD.washRect(L.col, 'in-p5w', 650, 560, 560, 460, '#c9c2b2', 0.5);
      for (const [by, id] of [[700, 0], [880, 1]]) {
        const frame = HD.rect(700, by, 460, 90);
        HD.crayon(L.col, frame, '#7a5230', 1910 + id * 10, { spacing: 4 });
        HD.crayon(L.col, HD.spline([[720, by + 6], [860, by - 18], [980, by + 2], [1140, by - 10], [1140, by + 30], [720, by + 30]]), '#8c96b0', 1911 + id * 10, { spacing: 4 });
        HD.inkShape(L.ink, frame, 1912 + id * 10, 2.4, 0.8);
        HD.ink(L.ink, HD.spline([[720, by + 6], [860, by - 18], [980, by + 2], [1140, by - 10]], false), 1913 + id * 10, 2, 1);
        HD.crayon(L.col, HD.ellipse(760, by - 4, 40, 18, 14), '#efe9dc', 1914 + id * 10, { hatch: 0.1 });
        HD.inkShape(L.ink, HD.ellipse(760, by - 4, 40, 18, 14), 1915 + id * 10, 1.8, 0.6);
      }
      HD.ink(L.ink, [[700, 600], [700, 1020]], 1930, 4, 0.6);
      HD.ink(L.ink, [[1160, 600], [1160, 1020]], 1931, 4, 0.6);
    });
    // P6: the clock stops
    const stopT = k.at('in4') + 1.6;
    panel(L, ...P[5], ps[5], 2000, () => {
      HD.washRect(L.col, 'in-p6w', 1240, 560, 620, 460, '#d3cab6', 0.5);
      const cx = 1550, cy = 700;
      const caseP = [[1488, 770], [1612, 770], [1636, 1010], [1464, 1010]];
      HD.crayon(L.col, caseP, '#6b4428', 2010, { spacing: 4 });
      HD.inkShape(L.ink, caseP, 2011, 3, 1);
      HD.crayon(L.col, HD.ellipse(cx, cy, 92, 92, 36), '#f4eedf', 2012, { hatch: 0.08 });
      HD.inkShape(L.ink, HD.ellipse(cx, cy, 92, 92, 36), 2013, 3.5, 0.8);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; HD.ink(L.ink, [[cx + Math.cos(a) * 74, cy + Math.sin(a) * 74], [cx + Math.cos(a) * 84, cy + Math.sin(a) * 84]], 2014 + i, i % 3 ? 1.6 : 3.5, 0.3); }
      const run = clamp((stopT - t) / 3);
      const hand = (ang, len, w, id) => HD.ink(L.ink, [[cx, cy], [cx + Math.cos(ang) * len, cy + Math.sin(ang) * len]], id, w, 0.4);
      hand(-Math.PI / 2 + 1.1, 46, 6, 2030);
      hand(-Math.PI / 2 - 0.55 + Math.min(t, stopT) * 0.01, 70, 3.5, 2031);
      HD.dot(L.ink, cx, cy, 7, HD.INK);
      const amp = 0.32 * Math.pow(run, 0.6), sw = Math.sin((Math.min(t, stopT)) * Math.PI) * amp;
      const bob = [cx + Math.sin(sw) * 210, 800 + Math.cos(sw) * 160];
      HD.ink(L.ink, [[cx, 800], bob], 2040, 2.4, 0.3);
      HD.crayon(L.col, HD.ellipse(bob[0], bob[1], 26, 26, 16), '#c9a24a', 2041, { spacing: 3 });
      HD.inkShape(L.ink, HD.ellipse(bob[0], bob[1], 26, 26, 16), 2042, 2.2, 0.4);
    });
    const stopped = prog(t, stopT + 0.3, 0.8);
    HD.darkness(L, 0.25 + stopped * 0.25, [{ x: 1550, y: 760, r: 700, a: stopped }], '#06081a', cam);
    const c = EP.top(L);
    const labels = [['alone.', 1000, 500, 0, 2.2], ['shut.', 1355, 505, 1, 0.5], ['shut.', 1705, 505, 2, 0.4], ['cold.', 340, 1000, 3, 1.0], ['empty.', 930, 1000, 4, 0.8], ['stopped.', 1760, 990, 5, 2.2]];
    for (const [txt, x, y, i, off] of labels) HD.text(c, txt, x, y, { size: 58, color: C.orange, p: prog(t, appear[i] + off, 0.6), align: 'center', id: 2100 + i, weight: 700 });
  },
};

// =====================================================================
// 9. CLUES — an evidence board: lamp ready, kitchen clean, slate ends 15 Dec.
// =====================================================================
function card(L, x, y, w, h, rot, id, p) {
  const T = pts => HD.xform(pts, x, y, rot * (1 - 0.3 * p), easeOutBack(p));
  const box = HD.rect(-w / 2, -h / 2, w, h);
  HD.crayon(L.col, T(HD.rect(-w / 2 + 8, -h / 2 + 10, w, h)), '#3b2a1c', id, { alpha: 0.35, hatch: 0 });
  HD.crayon(L.col, T(box), '#f6efdf', id + 1, { hatch: 0.06 });
  HD.inkShape(L.ink, T(box), id + 2, 2, 0.8);
  const pin = T([[0, -h / 2 + 14]])[0];
  HD.dot(L.ink, pin[0], pin[1], 10, C.rust);
  HD.dot(L.ink, pin[0] - 3, pin[1] - 3, 3, '#ffd0c0');
  return T;
}
SCENES.clues = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const A = [430, 380], B = [980, 600], Cc = [1500, 380], Q = [900, 900];
    HD.cam(L, EP.camAt([
      { t: k.start, s: 1.0, x: 960, y: 540 },
      { t: k.at('clue1') + 0.3, s: 1.6, x: A[0] + 60, y: A[1] + 30 },
      { t: k.at('clue2'), s: 1.6, x: A[0] + 60, y: A[1] + 30 },
      { t: k.at('clue2') + 1.0, s: 1.4, x: 940, y: 720 },
      { t: k.at('clue3'), s: 1.4, x: 940, y: 720 },
      { t: k.at('clue3') + 1.0, s: 1.55, x: Cc[0], y: Cc[1] + 20 },
      { t: k.at('clue3') + 4.2, s: 1.55, x: Cc[0], y: Cc[1] + 20 },
      { t: k.at('clue3') + 6.0, s: 1.0, x: 960, y: 560 },
    ], t));
    HD.washRect(L.col, 'cl-cork', -300, -300, 2600, 1700, '#b98a55', 0.45);
    for (let i = 0; i < 260; i++) HD.dot(L.col, HD.h2(i, 1) * 2000 - 40, HD.h2(i, 2) * 1160 - 40, 2 + HD.h2(i, 3) * 3, '#7a5530', 0.35);
    HD.inkShape(L.ink, HD.rect(20, 20, 1880, 1040), 2200, 8, 1, 1, '#4a3018');
    const pA = prog(t, k.at('clue1') - 0.4, 0.7), pB = prog(t, k.at('clue2') - 0.2, 0.7), pC = prog(t, k.at('clue3') - 0.2, 0.7), pQ = prog(t, k.at('clue2') + 2.6, 0.7);
    // A: the lamp, ready for night
    if (pA > 0) {
      const T = card(L, A[0], A[1], 420, 470, -0.05, 2210, pA);
      const glass = HD.spline([[-40, -150], [40, -150], [55, -60], [70, 10], [40, 60], [-40, 60], [-70, 10], [-55, -60]]);
      HD.crayon(L.col, T(glass), '#ffe2a0', 2215, { alpha: 0.6 });
      HD.inkShape(L.ink, T(glass), 2216, 2.2, 0.8);
      const base = [[-90, 60], [90, 60], [70, 140], [-70, 140]];
      HD.crayon(L.col, T(base), '#b58a3a', 2217, { spacing: 4 });
      HD.inkShape(L.ink, T(base), 2218, 2.2, 0.8);
      HD.crayon(L.col, T(HD.spline([[0, -60], [14, -20], [0, 10], [-14, -20]])), '#f4a43a', 2219, { alpha: 0.8 });
      const f = T([[0, -20]])[0];
      HD.glow(L.glow, f[0], f[1], 160, C.lamp, 0.6 * pA);
      HD.text(L.ink, 'cleaned ✓', ...T([[-150, 190]])[0], { size: 40, p: prog(t, k.at('clue1') + 2.6, 0.7), id: 2220, color: C.rust, weight: 700 });
      HD.text(L.ink, 'refilled ✓', ...T([[20, 190]])[0], { size: 40, p: prog(t, k.at('clue1') + 3.4, 0.7), id: 2221, color: C.rust, weight: 700 });
    }
    // B: kitchen things, all clean
    if (pB > 0) {
      const T = card(L, B[0], B[1], 460, 330, 0.04, 2230, pB);
      for (const [px, py, r] of [[-120, -10, 70], [10, 10, 60]]) {
        HD.crayon(L.col, T(HD.ellipse(px, py, r, r * 0.45, 20)), '#e8eef2', 2231 + px, { hatch: 0.1 });
        HD.inkShape(L.ink, T(HD.ellipse(px, py, r, r * 0.45, 20)), 2232 + px, 2, 0.6);
        HD.inkShape(L.ink, T(HD.ellipse(px, py, r * 0.6, r * 0.27, 16)), 2233 + px, 1.4, 0.4, 0.6);
      }
      const cup = [[100, -40], [170, -40], [160, 40], [110, 40]];
      HD.crayon(L.col, T(cup), '#dfe6ec', 2240, { hatch: 0.1 });
      HD.inkShape(L.ink, T(cup), 2241, 2, 0.6);
      HD.ink(L.ink, T(HD.ellipse(176, 0, 18, 22, 10, 0, -1.4, 1.4)), 2242, 2, 0.4);
      for (const sx of [-150, 0, 140]) HD.ink(L.ink, T([[sx - 10, -90], [sx, -110], [sx + 10, -90]]), 2243 + sx, 2, 0.4, 0.7, C.rust);
      HD.text(L.ink, 'all clean', ...T([[0, 130]])[0], { size: 46, p: prog(t, k.at('clue2') + 1.2, 0.7), id: 2250, color: C.rust, weight: 700, align: 'center' });
    }
    // Q: Moore's words, typed on a strip
    if (pQ > 0) {
      const T = card(L, Q[0], Q[1], 1000, 120, -0.015, 2260, pQ);
      HD.text(L.ink, '"...it must be after dinner some time they left."', ...T([[0, 6]])[0], { size: 40, font: 'serif', italic: true, weight: 400, p: prog(t, k.at('clue2') + 2.8, 1.8), id: 2261, align: 'center', rot: -0.015 });
      HD.text(L.ink, '— Joseph Moore, relief keeper', ...T([[300, 44]])[0], { size: 28, p: prog(t, k.at('clue2') + 4.4, 0.8), id: 2262, align: 'center' });
    }
    // C: the log slate
    if (pC > 0) {
      const T = card(L, Cc[0], Cc[1], 440, 380, 0.03, 2270, pC);
      const slate = HD.rect(-180, -140, 360, 260);
      HD.crayon(L.col, T(slate), '#2d3138', 2271, { spacing: 3 });
      HD.inkShape(L.ink, T(slate), 2272, 6, 0.8, 1, '#6b4428');
      HD.text(L.ink, 'Dec. 15', ...T([[-150, -80]])[0], { size: 46, p: prog(t, k.at('clue3') + 0.6, 0.8), id: 2273, color: '#e9e6dc', rot: 0.03 });
      for (let i = 0; i < 4; i++) {
        const pts = [];
        for (let x = -150; x < 120 - i * 30; x += 8) pts.push([x, -20 + i * 36 + Math.sin(x * 0.2 + i * 3) * 4]);
        HD.ink(L.ink, HD.partial(T(pts), prog(t, k.at('clue3') + 1.2 + i * 0.3, 0.4)), 2274 + i, 2, 0.6, 0.85, '#e9e6dc');
      }
      HD.text(L.ink, 'last entry', ...T([[0, 165]])[0], { size: 44, p: prog(t, k.at('clue3') + 2.4, 0.7), id: 2280, color: C.rust, weight: 700, align: 'center' });
    }
    // red string tying it together
    const sp = prog(t, k.at('clue3') + 4.4, 1.4);
    const H15 = [960, 150];
    for (const [i, pt] of [[0, A], [1, B], [2, Cc]]) {
      const dy = i === 1 ? -150 : -220;
      HD.ink(L.ink, HD.partial(HD.quadPts([pt[0], pt[1] + dy], [(pt[0] + H15[0]) / 2, (pt[1] + H15[1]) / 2 + 60], H15, 16), sp), 2290 + i, 2.6, 0.6, 1, '#c0392b');
    }
    if (sp > 0.6) {
      const T = card(L, H15[0], H15[1], 420, 110, 0.02, 2300, prog(t, k.at('clue3') + 5.2, 0.6));
      HD.text(L.ink, '15 Dec — that day.', ...T([[0, 18]])[0], { size: 54, id: 2301, align: 'center', weight: 700, p: prog(t, k.at('clue3') + 5.4, 0.8) });
    }
    HD.darkness(L, 0.28, [{ x: 960, y: 540, r: 1100, core: 0.3 }], '#0b0812');
  },
};

// =====================================================================
// 10. COATS — callback to the hook wall, now lit: whose coats are missing.
// =====================================================================
SCENES.coats = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 900, y: 520 },
      { t: k.at('coat2') + 0.5, s: 1.25, x: 640, y: 520 },
      { t: k.at('coat3'), s: 1.25, x: 650, y: 520 },
      { t: k.at('coat3') + 1.2, s: 1.45, x: 1060, y: 580 },
      { t: k.at('coat4'), s: 1.4, x: 1000, y: 560 },
      { t: k.at('coat4') + 1.8, s: 1.1, x: 700, y: 540 },
    ], t);
    HD.cam(L, cam);
    const doorOpen = easeOut(prog(t, k.at('coat4') + 2.0, 0.8));
    const gust = doorOpen * (1 - prog(t, k.at('coat4') + 4.5, 2));
    HD.washRect(L.col, 'hk-wall', -300, -300, 2600, 1400, '#9a97a3', 0.55);
    HD.washRect(L.col, 'hk-wains', -300, 650, 2600, 300, '#6d5a4a', 0.6);
    HD.washRect(L.col, 'hk-floor', -300, 900, 2600, 400, '#45362c', 0.75);
    for (let x = -260; x < 2200; x += 90) HD.ink(L.ink, [[x, 655], [x + 3, 898]], 300 + x, 1.5, 1, 0.45);
    HD.ink(L.ink, [[-300, 650], [2200, 654]], 298, 3, 1);
    HD.ink(L.ink, [[-300, 900], [2200, 896]], 297, 3, 1);
    const rail = HD.rect(300, 318, 960, 30);
    HD.crayon(L.col, rail, C.wood, 310, { spacing: 4 });
    HD.inkShape(L.ink, rail, 311, 2.4, 0.8);
    const pegs = [460, 760, 1060];
    pegs.forEach((px, i) => EP.peg(L, px, 348, 320 + i * 4));
    EP.coat(L, 1060, 362, 1, Math.sin(t * 0.8) * 0.015 + gust * (0.12 + 0.05 * Math.sin(t * 9)), 400);
    // ghosts of the two missing oilskins drift away toward the door
    for (const [i, px] of [[0, 460], [1, 760]]) {
      const gp = prog(t, k.at('coat2') + 0.6 + i * 0.6, 0.6), leave = easeIn(prog(t, k.at('coat2') + 2.8 + i * 0.4, 2.2));
      const a = gp * (1 - leave);
      if (a <= 0) continue;
      const gx = lerp(px, 160, leave), gy = 362 + leave * 60;
      const ghost = HD.xform(HD.spline([[-34, 18], [0, 24], [34, 18], [104, 66], [118, 250], [124, 466], [62, 490], [0, 482], [-62, 490], [-124, 466], [-118, 250], [-104, 66]]), gx, gy, -leave * 0.3, 1 - leave * 0.3);
      const dashed = HD.resample(HD.closed(ghost), 14);
      for (let j = 0; j < dashed.length - 1; j += 2) HD.ink(L.ink, [dashed[j], dashed[j + 1]], 2400 + i * 200 + j, 2.4, 0.6, a * 0.85, '#3d4a7a');
    }
    // door (left)
    const door = [[40, 120], [250, 120], [250, 900], [40, 900]];
    HD.crayon(L.col, door, '#3d5487', 2450, { alpha: doorOpen * 0.95, spacing: 4, dark: '#1d2a4a' });
    if (doorOpen > 0) {
      const sea = [];
      for (let x = 40; x <= 250; x += 10) sea.push([x, 640 + Math.sin(x * 0.05 + t * 3) * 10]);
      HD.ink(L.ink, sea, 2449, 2, 0.6, doorOpen, '#9fb2d8');
    }
    const swingX = lerp(250, 110, doorOpen);
    const leaf = [[40, 120], [swingX, 120 - 40 * doorOpen], [swingX, 900 + 40 * doorOpen], [40, 900]];
    HD.crayon(L.col, leaf, '#7a5230', 2451, { spacing: 4, dark: '#55361d' });
    HD.inkShape(L.ink, leaf, 2452, 3, 1);
    HD.inkShape(L.ink, door, 2453, 3, 1);
    if (doorOpen > 0) {
      HD.rain(L, t, { density: Math.floor(160 * gust), alpha: 0.4 * doorOpen, angle: -0.9, len: 60 });
      EP.bolt(L, 160, 160, 700, 2460, EP.flashAt(t, [k.at('coat4') + 2.3]));
      const runU = prog(t, k.at('coat4') + 2.2, 1.6);
      if (runU > 0 && runU < 1) HD.figure(L, lerp(330, 120, runU), 880, 2.2, { pose: 'run', phase: t * 14, coat: false, facing: -1, id: 2470, alpha: 1 - prog(runU, 0.75, 0.25) });
    }
    HD.darkness(L, 0.35, [{ x: 145, y: 500, r: 500, a: doorOpen * 0.8 }], '#070a1a', cam);
    L.flash = EP.flashAt(t, [k.at('coat4') + 2.3]) * 0.3;
    const c = EP.top(L);
    const names = ['Ducat', 'Marshall', 'McArthur'];
    pegs.forEach((px, i) => HD.text(c, names[i], px, 290, { size: 58, color: CHALK, p: prog(t, k.at('coat1') + 0.3 + i * 0.4, 0.7), align: 'center', id: 2480 + i, weight: 700 }));
    for (const [i, px] of [[0, 460], [1, 760]]) HD.text(c, 'gone', px, 560, { size: 52, color: C.orange, p: prog(t, k.at('coat2') + 1.4 + i * 0.5, 0.6), align: 'center', id: 2490 + i, weight: 700 });
    HD.underline(c, 960, 1160, 305, prog(t, k.at('coat3') + 1.1, 0.6), 2495, 5);
    HD.text(c, 'still here.', 1060, 1000, { size: 64, color: C.orange, p: prog(t, k.at('coat3') + 1.6, 0.7), align: 'center', id: 2496, weight: 700 });
  },
};

// =====================================================================
// 11. LANDING — Muirhead's survey as an annotated cliff section.
// =====================================================================
const MPX = 11;                       // pixels per metre on the height scale
const yAt = m => 900 - m * MPX;
const CLIFF_W = [[640, 1100], [640, 905], [700, 880], [760, yAt(8)], [820, yAt(20)], [860, yAt(33)], [930, yAt(45)], [1000, yAt(55)], [1080, yAt(62)], [1300, yAt(66)], [2100, yAt(68)], [2100, 1100]];
SCENES.landing = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    HD.cam(L, EP.camAt([
      { t: k.start, s: 0.98, x: 960, y: 520 },
      { t: k.at('land2'), s: 1.0, x: 960, y: 540 },
      { t: k.at('land2') + 0.6, s: 1.5, x: 860, y: 700 },
      { t: k.at('land3') + 0.4, s: 1.6, x: 900, y: 560 },
      { t: k.at('land4') + 0.4, s: 1.5, x: 1100, y: 330 },
      { t: k.at('land5'), s: 1.0, x: 960, y: 520 },
    ], t));
    HD.washRect(L.col, 'ld-paper', -400, -300, 2800, 1700, '#e2d7bd', 0.3);
    for (let y = -200; y < 1300; y += 40) HD.ink(L.ink, [[-300, y], [2300, y]], 2500 + y, 0.8, 0.5, 0.12, '#4f6f9a');
    for (let x = -300; x < 2300; x += 40) HD.ink(L.ink, [[x, -200], [x, 1300]], 2600 + x, 0.8, 0.5, 0.12, '#4f6f9a');
    HD.sea(L, { horizon: 905, bottom: 1150, t, storm: 0.6, color: '#3c5a86', alpha: 0.6, id: 2700, rows: 6 });
    EP.rock(L, 'ld-cliff', CLIFF_W, { color: '#a19da3', alpha: 0.55, id: 2710, strata: 12 });
    HD.washPoly(L.col, 'ld-turf', [[1080, yAt(62)], [1300, yAt(66)], [2100, yAt(68)], [2100, yAt(65)], [1300, yAt(63)], [1100, yAt(59)]], C.grass, 0.4);
    // height scale
    HD.ink(L.ink, [[220, yAt(0)], [220, yAt(70)]], 2720, 3, 0.4);
    for (let m = 0; m <= 70; m += 10) {
      HD.ink(L.ink, [[205, yAt(m)], [235, yAt(m)]], 2721 + m, 2.4, 0.3);
      HD.text(L.ink, `${m} m`, 190, yAt(m) + 10, { size: 30, align: 'right', id: 2730 + m });
    }
    HD.text(L.ink, 'West Landing, Eilean Mòr', 300, 110, { size: 64, font: 'serif', weight: 400, p: prog(t, k.at('land1') + 0.2, 1.4), id: 2740 });
    HD.text(L.ink, "surveyed by Superintendent Robert Muirhead · Dec 1900", 305, 160, { size: 36, p: prog(t, k.at('land1') + 1.8, 1.6), id: 2741 });
    // landing + stairs with railings that bend
    HD.crayon(L.col, HD.rect(640, 870, 120, 20), '#8a8778', 2750, { spacing: 3 });
    const bend = easeOut(prog(t, k.at('land2') + 0.2, 1.2));
    for (let i = 0; i < 7; i++) {
      const u = i / 6, px = lerp(700, 860, u), py = lerp(870, yAt(33) - 6, u);
      const kink = bend * (i % 2 ? 1 : -0.6) * (1 - u * 0.5);
      HD.ink(L.ink, [[px, py], [px + 10 * kink, py - 26], [px + 30 * kink, py - 50 + 10 * Math.abs(kink)]], 2760 + i, 2.6, 0.4, 0.9, '#2a2a33');
    }
    const railTop = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; railTop.push([lerp(700, 860, u) + Math.sin(u * 9) * 26 * bend, lerp(820, yAt(33) - 56, u) + Math.cos(u * 7) * 18 * bend]); }
    HD.ink(L.ink, railTop, 2770, 2.6, 0.6, 0.9, '#2a2a33');
    // the rock that moved
    const rp = easeInOut(prog(t, k.at('land2') + 2.6, 1.6));
    const r0 = [960, yAt(47)], r1 = [1010, yAt(53)];
    const rock = HD.ellipse(lerp(r0[0], r1[0], rp), lerp(r0[1], r1[1], rp), 46, 32, 16);
    if (rp > 0) for (let i = 0; i < 16; i += 2) { const pts = HD.ellipse(r0[0], r0[1], 46, 32, 16); HD.ink(L.ink, [pts[i], pts[i + 1]], 2780 + i, 1.6, 0.4, 0.6); }
    HD.crayon(L.col, rock, '#4b4a52', 2790, { spacing: 4 });
    HD.inkShape(L.ink, rock, 2791, 2.6, 0.8);
    // the box in its crevice, smashed, ropes strewn
    const cx = 868, cy = yAt(33);
    HD.crayon(L.col, [[cx - 30, cy - 50], [cx + 50, cy - 60], [cx + 60, cy + 10], [cx - 20, cy + 14]], '#2a2a33', 2800, { spacing: 3 });
    const smash = easeOut(prog(t, k.at('land3') + 1.2, 0.8));
    const planks = [[-30, -30, 0], [10, -32, 0.4], [-20, -8, -0.3], [16, -6, 0.8]];
    planks.forEach(([px, py, rot], i) => {
      const pk = HD.xform(HD.rect(-22, -6, 44, 12), cx + px + smash * (i - 1.5) * 30, cy + py + smash * (20 + i * 12), rot * smash * 2, 1);
      HD.crayon(L.col, pk, '#9a6a3f', 2810 + i, { spacing: 3 });
      HD.inkShape(L.ink, pk, 2815 + i, 1.8, 0.4);
    });
    if (smash > 0) for (let i = 0; i < 4; i++) {
      const pts = [];
      for (let a = 0; a < 12; a += 0.35) pts.push([cx - 60 + i * 50 + Math.cos(a) * (10 + a), cy + 70 + i * 20 + Math.sin(a) * (6 + a * 0.6)]);
      HD.ink(L.ink, HD.partial(pts, smash), 2820 + i, 2, 0.5, 0.9, '#7a5a2a');
    }
    // turf torn away at 60 m
    const tp = easeOut(prog(t, k.at('land4') + 0.6, 1.2));
    if (tp > 0) {
      HD.crayon(L.col, [[1120, yAt(62.5)], [1240, yAt(65)], [1230, yAt(61)], [1130, yAt(59)]], '#6b4428', 2830, { alpha: tp, spacing: 3 });
      HD.crayon(L.col, HD.xform([[-50, -10], [50, -14], [46, 10], [-46, 12]], 1180 + tp * 260, yAt(64) - tp * 120, tp * 1.6, 1), C.grass, 2831, { alpha: 1 - prog(t, k.at('land4') + 3, 1), spacing: 3 });
    }
    // ghost of the wave that did it
    const wp = HD.window(t, k.at('land5') - 0.2, k.end + 1, 1.6, 0.5);
    if (wp > 0) {
      const wave = HD.spline([[300, 905], [420, 700], [560, 420], [720, yAt(60)], [900, yAt(64)], [1000, yAt(58)], [930, yAt(52)], [800, 700], [700, 905]]);
      HD.washPoly(L.col, 'ld-ghostwave', wave, '#4f79a8', 0.3 * wp);
      const d = HD.resample(HD.closed(wave), 16);
      for (let j = 0; j < d.length - 1; j += 2) HD.ink(L.ink, [d[j], d[j + 1]], 2840 + j, 2.6, 0.5, wp, '#2d4a7a');
    }
    const c = L.ink;
    const note = (txt, x, y, p, id, align = 'left', size = 44) => HD.text(c, txt, x, y, { size, color: C.rust, p, id, align, weight: 700 });
    note('railings bent & twisted', 470, yAt(18), prog(t, k.at('land2') + 0.8, 1), 2850, 'right');
    HD.arrow(c, [[480, yAt(19)], [600, yAt(21)], [700, yAt(16)]], prog(t, k.at('land2') + 1.2, 0.6), 2851);
    note('rock of over 1 ton, moved', 1080, yAt(50), prog(t, k.at('land2') + 3.0, 1), 2852);
    note('box of ropes, 33 m up', 470, yAt(36), prog(t, k.at('land3') + 1.0, 1), 2853, 'right');
    HD.ink(c, [[220, yAt(33)], [860, yAt(33)]], 2854, 2, 0.4, 0.5 * prog(t, k.at('land3') + 0.6, 0.6), C.rust);
    note('smashed. ropes scattered.', 900, yAt(22), prog(t, k.at('land3') + 3.4, 1), 2855);
    HD.ink(c, [[220, yAt(60)], [1240, yAt(60)]], 2856, 2, 0.4, 0.5 * prog(t, k.at('land4') + 0.2, 0.6), C.rust);
    note('turf torn away, over 60 m up', 1300, yAt(55), prog(t, k.at('land4') + 1.4, 1.1), 2857);
    HD.text(c, '"difficult to believe unless actually seen."', 1020, 1010, { size: 46, font: 'serif', italic: true, weight: 400, p: prog(t, k.at('land5') + 0.3, 2.4), align: 'center', id: 2858 });
    HD.text(c, '— Robert Muirhead', 1460, 1055, { size: 32, p: prog(t, k.at('land5') + 2.6, 0.8), id: 2859 });
  },
};

// =====================================================================
// 12. MYTH — the invented logbook and the poem's meal and chair, struck out.
// =====================================================================
SCENES.myth = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 960, y: 560 },
      { t: k.at('myth2') + 0.4, s: 1.35, x: 520, y: 560 },
      { t: k.at('myth2') + 4.2, s: 1.35, x: 520, y: 560 },
      { t: k.at('myth2') + 5.4, s: 1.3, x: 1220, y: 560 },
      { t: k.at('myth3') + 0.2, s: 1.0, x: 960, y: 560 },
      { t: k.at('myth4'), s: 1.0, x: 960, y: 560 },
      { t: k.at('myth4') + 3, s: 1.15, x: 960, y: 520 },
    ], t);
    HD.cam(L, cam);
    HD.washRect(L.col, 'my-desk', -300, -300, 2600, 1700, '#5a3d27', 0.6);
    // the poem book (left)
    const book = HD.xform(HD.rect(-300, -340, 600, 680), 520, 560, -0.06, 1);
    HD.crayon(L.col, book, '#efe3c6', 2900, { hatch: 0.06 });
    HD.inkShape(L.ink, book, 2901, 2.4, 1);
    HD.text(L.ink, 'Flannan Isle', 520, 300, { size: 64, font: 'serif', weight: 400, align: 'center', id: 2902, rot: -0.06, p: prog(t, k.at('myth2') - 0.2, 1) });
    HD.text(L.ink, 'a poem · W. W. Gibson, 1912', 525, 350, { size: 34, align: 'center', id: 2903, rot: -0.06, p: prog(t, k.at('myth2') + 0.6, 1) });
    // overturned chair + uneaten meal sketch
    const sk = prog(t, k.at('myth2') + 0.8, 1.6);
    const chair = HD.xform([[-60, 0], [60, 0], [60, -18], [-60, -18]], 450, 640, 1.3, 1);
    HD.ink(L.ink, HD.partial(HD.closed(chair), sk), 2904, 2.4, 0.8);
    HD.ink(L.ink, HD.partial([[400, 600], [330, 700]], sk), 2905, 2.4, 0.6);
    HD.ink(L.ink, HD.partial([[470, 690], [400, 750]], sk), 2906, 2.4, 0.6);
    HD.ink(L.ink, HD.partial(HD.closed(HD.ellipse(620, 560, 70, 26, 18)), sk), 2907, 2.2, 0.6);
    HD.crayon(L.col, HD.ellipse(620, 552, 38, 12, 12), '#a8623a', 2908, { alpha: sk });
    HD.text(L.ink, 'an uneaten meal, an overturned chair', 520, 800, { size: 34, align: 'center', id: 2909, rot: -0.06, p: prog(t, k.at('myth2') + 1.6, 1.4) });
    // the "logbook" (right)
    const log = HD.xform(HD.rect(-330, -360, 660, 720), 1260, 560, 0.04, 1);
    HD.crayon(L.col, log, '#e9dcc0', 2910, { hatch: 0.06 });
    HD.inkShape(L.ink, log, 2911, 2.4, 1);
    for (let i = 0; i < 12; i++) HD.ink(L.ink, HD.xform([[-300, -250 + i * 52], [300, -250 + i * 52]], 1260, 560, 0.04, 1), 2912 + i, 1, 0.4, 0.25, '#4f6f9a');
    const entries = [
      ['Dec 12. Gale. Never seen such a storm.', 'Ducat irritable.'],
      ['Dec 13. Storm continued.', 'Ducat quiet. McArthur praying.'],
      ['Dec 15. Storm ended, sea calm.', 'God is over all.'],
    ];
    entries.forEach(([a, b], i) => {
      const s0 = k.at('myth2') + 4.4 + i * 1.9;
      const pos = (dx, dy) => HD.xform([[dx, dy]], 1260, 560, 0.04, 1)[0];
      HD.text(L.ink, a, ...pos(-290, -230 + i * 156), { size: 40, p: prog(t, s0, 1.0), id: 2930 + i, rot: 0.04 + HD.h2(i, 4) * 0.02, color: '#3a2a6a' });
      HD.text(L.ink, b, ...pos(-260, -180 + i * 156), { size: 40, p: prog(t, s0 + 0.8, 0.8), id: 2935 + i, rot: 0.04, color: '#3a2a6a' });
    });
    // candle
    const fl = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.7);
    HD.crayon(L.col, HD.rect(900, 860, 40, 120), '#efe6cf', 2950, { hatch: 0.1 });
    HD.inkShape(L.ink, HD.rect(900, 860, 40, 120), 2951, 2, 0.4);
    HD.crayon(L.ink, HD.spline([[920, 820], [930, 845], [920, 860], [910, 845]]), '#ffd27a', 2952, { hatch: 0, amp: 0.3 });
    HD.glow(L.glow, 920, 840, 300 * fl, C.lamp, 0.55);
    // strike-outs and stamps
    const s1 = prog(t, k.at('myth3') + 0.3, 0.7), s2 = prog(t, k.at('myth3') + 2.6, 0.9);
    HD.ink(L.ink, HD.partial([[300, 520], [740, 760], [760, 740], [290, 560], [320, 600], [720, 780]], s1), 2960, 6, 2, 0.85, C.rust);
    for (let i = 0; i < 3; i++) HD.ink(L.ink, HD.partial(HD.xform([[-300, -240 + i * 156], [320, -190 + i * 156], [-280, -170 + i * 156], [300, -150 + i * 156]], 1260, 560, 0.04, 1), clamp(s2 * 3 - i)), 2961 + i, 5, 2, 0.85, C.rust);
    const stamp = (txt, x, y, rot, p, id) => {
      if (p <= 0) return;
      const sc = lerp(1.8, 1, easeOut(p)), a = clamp(p * 2);
      const c = L.ink;
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
      c.globalAlpha = 0.85 * a;
      c.strokeStyle = C.rust; c.lineWidth = 7; c.strokeRect(-210, -62, 420, 112);
      c.restore();
      HD.text(c, txt, x, y + 26 * sc, { size: 92 * sc, font: 'brand', weight: 700, color: C.rust, align: 'center', rot, alpha: 0.85 * a, id, shadow: false });
    };
    stamp('A POEM', 520, 470, -0.18, prog(t, k.at('myth3') + 1.6, 0.35), 2970);
    stamp('INVENTED', 1260, 470, 0.14, prog(t, k.at('myth3') + 3.8, 0.35), 2971);
    // the truth is quieter: everything dims except the candle
    const quiet = prog(t, k.at('myth4') + 0.2, 1.8);
    HD.darkness(L, 0.35 + 0.5 * quiet, [{ x: 920, y: 840, r: 520 + 200 * (1 - quiet), core: 0.25 }], '#06070f', cam);
    const c = EP.top(L);
    HD.text(c, 'the true record is quieter.', 960, 200, { size: 72, color: CHALK, p: prog(t, k.at('myth4') + 0.4, 1.4), align: 'center', id: 2980, weight: 700 });
  },
};

// =====================================================================
// 13. THEORY — two men at the landing, one at the window, one enormous wave.
// =====================================================================
const ISLAND_T = [[380, 1200], [430, 880], [520, 850], [600, 760], [700, 640], [820, 520], [940, 450], [1100, 420], [1500, 400], [2200, 390], [2200, 1200]];
const PATH_T = [[1330, 410], [1180, 430], [1000, 470], [880, 560], [760, 660], [640, 780], [560, 850]];
const along = (pts, u) => { const p = HD.partial(HD.resample(pts, 6), clamp(u)); return p[p.length - 1]; };
SCENES.theory = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const crash = k.at('th5') + 1.6;
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 960, y: 540 },
      { t: k.at('th2') + 1, s: 1.15, x: 800, y: 620 },
      { t: k.at('th3'), s: 1.4, x: 1300, y: 380 },
      { t: k.at('th3') + 3.2, s: 1.4, x: 1300, y: 380 },
      { t: k.at('th3') + 4.6, s: 0.95, x: 860, y: 520 },
      { t: k.at('th4') + 2.5, s: 1.05, x: 800, y: 560 },
      { t: crash, s: 1.12, x: 700, y: 600, r: 0 },
      { t: crash + 0.4, s: 1.0, x: 700, y: 560, r: -0.02 },
      { t: crash + 2, s: 1.0, x: 820, y: 560, r: 0 },
    ], t);
    const shake = Math.exp(-Math.max(0, t - crash) * 2) * (t > crash ? 1 : 0);
    cam.x += Math.sin(t * 60) * 14 * shake; cam.y += Math.cos(t * 53) * 10 * shake;
    HD.cam(L, cam);
    const flash = EP.flashAt(t, [k.at('th1') + 0.3, k.at('th3') + 4.0, crash]);
    HD.washRect(L.col, 'th-sky', -500, -400, 3000, 1800, '#34416b', 0.7);
    for (let i = 0; i < 6; i++) HD.drawWash(L.col, HD.makeWash(720 + i), -200 + i * 420 - t * 12, 80 + HD.h2(i, 5) * 160, 260, i, '#121730', 0.28);
    HD.sea(L, { horizon: 600, t: t * 1.2, storm: 1, color: '#22365f', alpha: 0.85, id: 3000, inkColor: '#9db2da', inkAlpha: 0.65, x0: -500, x1: 1100 });
    EP.rock(L, 'th-isl', ISLAND_T, { color: '#1c1f2e', alpha: 0.9, id: 3010, strata: 10 });
    HD.ink(L.ink, PATH_T, 3020, 2.2, 1, 0.7, '#9aa0b8');
    const winLit = 1;
    HD.lighthouse(L, 1360, 410, 0.95, { lit: 0.85, id: 3030, windows: winLit, beamAng: Math.PI * 0.95 + Math.sin(t * 0.3) * 0.2, beamAlpha: 0.3 });
    const gone = t > crash + 0.3;
    // Ducat & Marshall walk down to the landing
    if (!gone) {
      for (const i of [0, 1]) {
        const u = easeInOut(prog(t, k.at('th2') + 0.3 + i * 0.5, 5.5));
        const p = along(PATH_T, u);
        const walking = u > 0 && u < 1;
        HD.figure(L, p[0] + (u >= 1 ? i * 34 : 0), p[1], 0.9, { pose: walking ? 'walk' : 'stand', phase: t * 7 + i, id: 3040 + i * 10, facing: -1 });
      }
      // McArthur at the window, then running
      const runU = easeIn(prog(t, k.at('th4') + 0.2, 4.4));
      if (runU <= 0) {
        HD.figure(L, 1230, 404, 0.55, { id: 3060, alpha: prog(t, k.at('th3') + 0.5, 0.6) });
      } else {
        const p = along(PATH_T, runU * 0.95);
        HD.figure(L, p[0], p[1], 0.9, { pose: 'run', phase: t * 13, coat: false, id: 3060, facing: -1 });
      }
    }
    // the wave: a curling breaker that rises out of the Atlantic and lands on the west landing
    const rise0 = k.at('th3') + 2.6;
    const g = easeIn(prog(t, rise0, crash - rise0));
    if (g > 0 && t < crash + 0.7) {
      const fall = clamp((t - crash) / 0.7);
      const base = 880, ht = lerp(50, 600, Math.pow(g, 0.85)) * (1 - fall * 0.7);
      const cx = lerp(-260, 430, g) + fall * 120, cy = base - ht, lp = lerp(30, 250, g);
      const wave = HD.spline([
        [-900, base + 40], [cx - 760, base - 10], [cx - 430, base - ht * 0.42], [cx - 190, cy + ht * 0.1], [cx - 30, cy],
        [cx + lp * 0.55, cy - 6], [cx + lp, cy + lp * 0.42], [cx + lp * 0.8, cy + lp * 0.78], [cx + lp * 0.45, cy + lp * 0.6],
        [cx + lp * 0.3, cy + lp * 0.95], [cx + lp * 0.62, base - ht * 0.22], [cx + lp + 150, base + 30], [cx + lp + 320, base + 300], [-900, base + 300],
      ]);
      HD.occlude(L.ink, wave);
      HD.crayon(L.col, wave, '#2f5f98', 3100, { spacing: 6, dark: '#1b3e6c' });
      const face = HD.spline([[cx - 30, cy + 12], [cx + lp * 0.5, cy + 8], [cx + lp * 0.85, cy + lp * 0.45], [cx + lp * 0.4, cy + lp * 0.6], [cx + lp * 0.3, cy + lp * 0.95], [cx + lp * 0.62, base - ht * 0.22], [cx + lp + 120, base + 20], [cx - 60, base - ht * 0.3]]);
      HD.crayon(L.col, face, '#86b1da', 3101, { alpha: 0.7, spacing: 5 });
      HD.inkShape(L.ink, wave, 3102, 3.6, 2);
      for (let i = 1; i <= 6; i++) {
        const f = i / 7;
        const flow = HD.spline([[cx - 760 + i * 70, base - 6], [cx - 430 + i * 50, base - ht * (0.42 - f * 0.3)], [cx - 190 + i * 32, cy + ht * (0.1 + f * 0.35)], [cx - 30 + i * 22, cy + ht * f * 0.45]], false);
        HD.ink(L.ink, flow, 3110 + i, 1.8, 1.4, 0.75, '#b8d0f0');
      }
      for (let j = 0; j < 12; j++) {          // foam claws along the crest and lip
        const u = j / 11, px = lerp(cx - 150, cx + lp * 0.95, u), py = j < 6 ? lerp(cy + 30, cy - 4, u * 2) : cy + (u - 0.5) * lp * 0.9;
        HD.ink(L.ink, HD.quadPts([px, py], [px + 14, py - 12], [px + 24, py + 4], 5), 3130 + j, 3, 0.6, 1, C.foam);
      }
      HD.spatter(L.ink, cx + lp * 0.3, cy - 20, 60 + g * 80, 26, C.foam, 3145 + Math.floor(t * 8) % 4, 0.9);
    }
    // crash: white water explodes over the landing, then settles
    const cr = t - crash;
    if (cr > 0) {
      const a = clamp(1 - cr / 5);
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI * (0.1 + HD.h2(i, 2) * 0.8), d = easeOut(clamp(cr / 1.0)) * (160 + HD.h2(i, 3) * 300);
        HD.drawWash(L.ink, HD.makeWash(760 + i), 600 + Math.cos(ang) * d, 820 + Math.sin(ang) * d * 0.9, 50 + easeOut(clamp(cr / 1.5)) * 60, i, '#f3f0e8', 0.2 * a);
      }
      HD.spatter(L.ink, 600, 700, 220 + cr * 160, 140, C.foam, 3150 + Math.floor(cr * 8), 0.9 * a);
      HD.glow(L.glow, 600, 780, 500, '#cfe0ff', 0.4 * a);
    }
    HD.rain(L, t, { density: 220, alpha: 0.28, angle: 0.35 });
    if (flash > 0.3) EP.bolt(L, 300, -200, 450, 3160 + Math.floor(t), flash);
    HD.darkness(L, 0.3 - flash * 0.2, [{ x: 1360, y: 180, r: 500, a: 0.7 }, { x: 1230, y: 360, r: 260, a: 0.6 }], '#03050f', cam);
    L.flash = flash * 0.35 + clamp(1 - cr / 0.5) * (cr > 0 ? 0.6 : 0);
    const c = EP.top(L);
    HD.text(c, 'So what happened?', 960, 160, { size: 80, color: CHALK, p: prog(t, k.at('th1'), 1.0), align: 'center', id: 3170, weight: 700, alpha: 1 - prog(t, k.at('th2') + 1.5, 0.6) });
    HD.text(c, 'Ducat & Marshall', 560, 960, { size: 50, color: CHALK, p: prog(t, k.at('th2') + 4.6, 0.8), align: 'center', id: 3171, weight: 700, alpha: 1 - prog(t, k.at('th3') + 2, 0.6) });
    HD.text(c, 'McArthur?', 1180, 300, { size: 46, color: C.orange, p: prog(t, k.at('th3') + 0.6, 0.6), align: 'center', id: 3172, weight: 700, alpha: 1 - prog(t, k.at('th3') + 3.6, 0.5) });
    HD.text(c, 'a theory.', 1700, 1000, { size: 40, color: '#b8b0a0', p: prog(t, k.at('th2'), 0.8), align: 'center', id: 3173 });
  },
};

// =====================================================================
// 14. ENDING — calm night, the light still turns, three birds fly away.
// =====================================================================
SCENES.ending = {
  enter: { type: 'fade', dur: 2.2 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.3, x: 980, y: 470 },
      { t: k.at('end2') + 4, s: 1.0, x: 960, y: 520 },
      { t: k.at('end3'), s: 1.0, x: 960, y: 520 },
    ], t);
    HD.cam(L, cam);
    HD.washRect(L.col, 'en-sky', -400, -300, 2700, 1700, '#1f2950', 0.8);
    HD.stars(L, 120, -300, -200, 2500, 820, t, 9, 0.9);
    HD.glow(L.glow, 1500, 170, 200, '#e8e4ff', 0.35);
    HD.crayon(L.col, HD.ellipse(1500, 170, 46, 46, 24), '#f4f0e6', 3200, { hatch: 0.05 });
    HD.inkShape(L.ink, HD.ellipse(1500, 170, 46, 46, 24), 3201, 2, 0.6, 0.6, '#cfd3ea');
    HD.sea(L, { horizon: 640, t: t * 0.6, storm: 0.15, color: '#1d2b52', alpha: 0.8, id: 3210, inkColor: '#8ea2cf', inkAlpha: 0.5, foam: false });
    EP.rock(L, 'en-isl', [[700, 660], [760, 600], [850, 560], [920, 520], [1050, 515], [1130, 545], [1220, 600], [1280, 660]], { color: '#121628', alpha: 0.9, id: 3220, strata: 4 });
    const beamAng = t * 0.55;
    const lamp = HD.lighthouse(L, 980, 522, 0.55, { lit: 1, beamAng, beamAlpha: 0.45, id: 3230 });
    for (let i = 0; i < 6; i++) HD.glow(L.glow, 980 + Math.sin(t * 0.7 + i) * 20, 680 + i * 50, 60 - i * 6, C.lamp, 0.12 * (0.5 + 0.5 * Math.sin(beamAng * 2)));
    // three seabirds lift off and fly into the dark
    for (let i = 0; i < 3; i++) {
      const u = easeIn(prog(t, k.at('end1') + 0.4 + i * 0.35, 6));
      if (u <= 0 || u >= 1) continue;
      const bx = 1000 + i * 30 - u * (700 + i * 120), by = 500 - u * (380 + i * 60) + Math.sin(u * 12 + i) * 12;
      const f = Math.sin(t * 8 + i * 2), s = 16 * (1 - u * 0.4);
      HD.ink(L.ink, [...HD.quadPts([bx - s, by - s * 0.35 * f], [bx - s * 0.45, by - s * 0.55 * f - s * 0.1], [bx, by], 5), ...HD.quadPts([bx, by], [bx + s * 0.45, by - s * 0.55 * f - s * 0.1], [bx + s, by - s * 0.35 * f], 5).slice(1)], 3240 + i, 2.6, 0.5, 1 - u, '#d8d6e8');
    }
    HD.darkness(L, 0.35, [{ x: lamp[0], y: lamp[1], r: 400 }], '#03050f', cam);
    const c = EP.top(L);
    HD.text(c, 'automated · 1971', 980, 760, { size: 44, color: '#d8cfb8', p: prog(t, k.at('end2') + 3.4, 1.2), align: 'center', id: 3250, alpha: 1 - prog(t, k.at('end3') - 0.4, 0.6) });
    HD.text(c, 'It keeps its watch alone.', 980, 830, { size: 50, color: CHALK, p: prog(t, k.at('end2') + 6.0, 1.4), align: 'center', id: 3251, weight: 700, alpha: 1 - prog(t, k.at('end3') - 0.4, 0.6) });
    HD.text(c, 'What do you think happened?', 960, 830, { size: 84, color: CHALK, p: prog(t, k.at('end3') + 0.2, 1.4), align: 'center', id: 3252, weight: 700 });
    HD.text(c, 'tell us in the comments ↓', 960, 905, { size: 52, color: C.orange, p: prog(t, k.at('end3') + 2.2, 1.0), align: 'center', id: 3253, weight: 700 });
  },
};

// =====================================================================
// THUMBNAIL (not in the timeline; rendered with `npm run render -- <ep> --thumb`)
// =====================================================================
SCENES.thumbnail = {
  draw(L, k) {
    const t = 3.0;
    HD.cam(L, { s: 1.0, x: 900, y: 520 });
    HD.washRect(L.col, 'hk-wall', -300, -300, 2600, 1400, '#9a97a3', 0.55);
    HD.washRect(L.col, 'hk-wains', -300, 650, 2600, 300, '#6d5a4a', 0.6);
    HD.washRect(L.col, 'hk-floor', -300, 900, 2600, 400, '#45362c', 0.75);
    for (let x = -260; x < 2200; x += 90) HD.ink(L.ink, [[x, 655], [x + 3, 898]], 300 + x, 1.5, 1, 0.45);
    const rail = HD.rect(300, 318, 960, 30);
    HD.crayon(L.col, rail, C.wood, 310, { spacing: 4 });
    HD.inkShape(L.ink, rail, 311, 2.4, 0.8);
    [460, 760, 1060].forEach((px, i) => EP.peg(L, px, 348, 320 + i * 4));
    EP.coat(L, 1060, 362, 1, 0.02, 400);
    HD.lantern(L, 1330, 120, 1.3, { lit: 1, id: 340, t, swing: 0.1 });
    HD.owl(L, 1700, 880, 0.5, { brow: 1, look: [-1, -0.2], lantern: 0, id: 5000, t });
    HD.darkness(L, 0.9, [{ x: 1150, y: 520, r: 760, core: 0.35 }, { x: 610, y: 430, r: 420, a: 0.75 }, { x: 1600, y: 760, r: 300, a: 0.8 }], '#070a1a', { s: 1, x: 900, y: 520 });
    const c = EP.top(L);
    c.setTransform(1, 0, 0, 1, 0, 0);
    HD.circleMark(c, 520, 430, 75, 100, 1, 370, 7);
    HD.circleMark(c, 820, 430, 75, 100, 1, 371, 7);
    HD.text(c, 'WHY ONE', 70, 830, { size: 170, font: 'brand', weight: 700, color: '#fff3e3', id: 380, rot: -0.04 });
    HD.text(c, 'COAT?', 80, 1020, { size: 210, font: 'brand', weight: 700, color: C.orange, id: 382, rot: -0.04 });
    HD.text(c, 'Flannan Isles · 1900', 70, 100, { size: 64, color: CHALK, id: 383, weight: 700 });
  },
};

// =====================================================================
// 15. OUTRO — the owl, the lantern, and the eyes of the Owl Society.
// =====================================================================
const SOCIETY = Array.from({ length: 26 }, (_, i) => ({ x: 80 + HD.h2(i, 31) * 1760, y: 90 + HD.h2(i, 32) * 560, s: 0.6 + HD.h2(i, 33) * 0.7, at: HD.h2(i, 34) }))
  .filter(e => Math.hypot(e.x - 960, (e.y - 520) * 1.3) > 430);
SCENES.outro = {
  enter: { type: 'fade', dur: 1.6 },
  draw(L, k) {
    const t = k.t, lt = k.lt;
    HD.cam(L, EP.camAt([
      { t: k.start, s: 1.25, x: 960, y: 560 },
      { t: k.at('out2') + 2, s: 1.0, x: 960, y: 540 },
      { t: k.at('out3') + 1.5, s: 1.0, x: 960, y: 540 },
      { t: k.end, s: 1.05, x: 960, y: 520 },
    ], t));
    HD.washRect(L.col, 'ou-bg', -300, -300, 2600, 1700, '#1a2144', 0.8);
    for (let i = 0; i < 9; i++) {
      const x = -100 + i * 260, h = 380 + HD.h2(i, 6) * 300;
      HD.washPoly(L.col, 'ou-tree' + i, [[x - 90, 1200], [x - 30, 1080 - h], [x + 40, 1060 - h * 1.05], [x + 110, 1200]], '#0a0d20', 0.35);
    }
    HD.stars(L, 80, -200, -200, 2300, 600, t, 21, 0.5);
    HD.ink(L.ink, [[300, 862], [700, 848], [1100, 858], [1600, 846]], 3300, 30, 2, 1, '#22170f');
    HD.ink(L.ink, [[1100, 858], [1250, 800], [1320, 770]], 3301, 10, 1.5, 1, '#22170f');
    const s = 1.2, oy = 848 - 232 * s;
    const out3 = k.at('out3');
    const wink = HD.window(t, out3 + 2.2, out3 + 2.75, 0.12, 0.15);
    const blink = (lt % 4.2 > 3.95) ? 1 : 0;
    const raise = 0.75 + 0.25 * easeInOut(prog(t, k.at('out2') + 2.2, 1.2));
    HD.owl(L, 960, oy, s, {
      blink, wink, look: [Math.sin(lt * 0.5) * 0.3, 0], brow: 0.6 + 0.4 * prog(t, out3, 0.5), wingUp: raise, lantern: 1, lit: 1,
      swing: Math.sin(lt * 1.4) * 0.1, id: 5000, t, tilt: Math.sin(lt * 0.7) * 0.03,
    });
    const lantern = [960 + 150 * s, oy - 40 - raise * 60];
    // the society's eyes open in the dark
    const open = prog(t, k.at('out2') + 2.6, 4.0);
    for (const e of SOCIETY) HD.eyePair(L, e.x, e.y, e.s, clamp((open - e.at * 0.7) * 3), 3400 + Math.floor(e.x));
    HD.darkness(L, 0.9, [{ x: lantern[0], y: lantern[1], r: 760 + 120 * prog(t, k.at('out2') + 2.2, 1.2), core: 0.3 }], '#04051a', { s: 1, x: 960, y: 540 });
    const c = EP.top(L);
    HD.text(c, 'Some stories should never be forgotten.', 960, 150, { size: 64, color: CHALK, p: prog(t, k.at('out1') + 0.2, 2.2), align: 'center', id: 3310, weight: 700, alpha: 1 - prog(t, k.at('out2') + 0.6, 0.6) });
    HD.text(c, 'Keep watching.', 300, 300, { size: 64, color: CHALK, p: prog(t, k.at('out2') + 0.1, 0.9), align: 'center', id: 3311, weight: 700, rot: -0.05 });
    HD.text(c, 'Keep learning.', 1620, 300, { size: 64, color: CHALK, p: prog(t, k.at('out2') + 1.1, 0.9), align: 'center', id: 3312, weight: 700, rot: 0.05 });
    const em = prog(t, out3 - 0.2, 1.4);
    if (em > 0) {
      c.save(); c.globalAlpha = 1;
      HD.owlEmblem({ ink: c, glow: L.glow, t }, 960, 170, 0.62, em, 3320);
      c.restore();
      HD.text(c, 'THE OWL SOCIETY', 960, 975, { size: 70, font: 'brand', weight: 700, color: C.orange, p: prog(t, out3 + 0.2, 1.0), align: 'center', id: 3330, shadow: false });
      HD.text(c, '@HouseOfOwls.archives', 960, 1030, { size: 38, color: CHALK, p: prog(t, out3 + 1.4, 1.0), align: 'center', id: 3331 });
    }
    L.fade = prog(t, k.end - 0.8, 0.8);
  },
};
})();
