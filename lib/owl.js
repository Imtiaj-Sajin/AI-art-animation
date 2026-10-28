// The House of Owls mascot (round white owl, big round glasses, raised brow, orange beak,
// grey wings, lantern) plus brand pieces: glowing eye pairs and the Owl Society emblem.
// Requires lib/hand.js. Coordinates are designed at s = 1 (owl ~430px tall, origin at belly).
(function () {
'use strict';
const { ink, inkShape, crayon, xform, ellipse, quadPts, glow, dot, lerp, clamp, h2, jit } = HD;

// Catmull-Rom spline through points (closed)
HD.spline = (pts, closed = true, seg = 8) => {
  const out = [], n = pts.length;
  const P = i => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  return out;
};

const BODY = HD.spline([
  [-118, -205], [-86, -168], [-40, -182], [0, -186], [40, -182], [86, -168], [118, -205],
  [130, -145], [142, -75], [152, 10], [148, 100], [128, 170], [86, 210], [0, 224],
  [-86, 210], [-128, 170], [-148, 100], [-152, 10], [-142, -75], [-130, -145],
]);
const FACE = HD.spline([[-120, -95], [-95, -150], [0, -160], [95, -150], [120, -95], [100, -25], [0, 0], [-100, -25]]);
const WING_L = HD.spline([[-120, -45], [-158, 40], [-160, 120], [-128, 185], [-96, 196], [-104, 110], [-112, 20]]);
const SHADE = HD.spline([[60, -150], [128, -140], [146, -40], [150, 60], [140, 140], [100, 200], [70, 150], [90, 60], [100, -40]]);
const LENS_L = [-55, -76], LENS_R = [55, -76], LENS_R0 = 47;

// st: blink 0..1, look [-1..1, -1..1], tilt (rad), brow 0..1 (raise right brow), wingUp 0..1
// (raise right wing / lantern), lantern 0..1 (visible), lit 0..1, swing (rad), wink 0..1 (left eye),
// eyeGlow 0..1 (eyes shine in the dark), id
HD.owl = (L, x, y, s, st = {}) => {
  const { blink = 0, look = [0, 0], tilt = 0, brow = 0, wingUp = 0, lantern = 0, lit = 1, swing = 0, wink = 0, eyeGlow = 0, id = 5000, t = 0, alpha = 1 } = st;
  const T = pts => xform(pts, x, y, tilt, s);
  const lw = Math.max(1.4, 2.6 * s);

  // body + face + shading
  crayon(L.col, T(BODY), '#f6f4ef', id + 1, { alpha, hatch: 0.05 });
  crayon(L.col, T(SHADE), '#c9c8cf', id + 2, { alpha: 0.75 * alpha, spacing: 5, dark: '#a9a8b3' });
  crayon(L.col, T(FACE), '#fbfaf7', id + 3, { alpha, hatch: 0 });
  inkShape(L.ink, T(BODY), id + 4, lw * 1.25, 1.4 * s, alpha);
  ink(L.ink, T(FACE.slice(18, 44)), id + 5, lw * 0.6, 1, 0.35 * alpha, '#6d6f86');

  // belly chevrons
  let k = 0;
  for (const [bx, by] of [[-55, 50], [0, 45], [55, 50], [-30, 95], [30, 95], [-55, 140], [0, 140], [55, 140], [-25, 182], [25, 182]]) {
    ink(L.ink, T([[bx - 10, by - 5], [bx, by + 5], [bx + 10, by - 5]]), id + 20 + k++, lw * 0.7, 0.6 * s, 0.55 * alpha, '#8d8ea3');
  }

  // left wing (hugs body)
  crayon(L.col, T(WING_L), '#b9b9c2', id + 6, { alpha, spacing: 4, dark: '#9c9cab' });
  inkShape(L.ink, T(WING_L), id + 7, lw, 1.1 * s, alpha);
  for (let f = 0; f < 3; f++) ink(L.ink, T(quadPts([-150 + f * 14, 120 + f * 22], [-128 + f * 12, 135 + f * 22], [-118 + f * 8, 118 + f * 20], 5)), id + 8 + f, lw * 0.7, 0.5, 0.6 * alpha);

  // right wing: rotates up around the shoulder to raise the lantern
  const ang = -wingUp * 1.25;
  const shoulder = [120, -45];
  const wingR = WING_L.map(([px, py]) => {
    const mx = -px, my = py, dx = mx - shoulder[0], dy = my - shoulder[1];
    return [shoulder[0] + dx * Math.cos(ang) - dy * Math.sin(ang), shoulder[1] + dx * Math.sin(ang) + dy * Math.cos(ang)];
  });
  crayon(L.col, T(wingR), '#b9b9c2', id + 12, { alpha, spacing: 4, dark: '#9c9cab' });
  inkShape(L.ink, T(wingR), id + 13, lw, 1.1 * s, alpha);
  const tipLocal = (() => { const dx = 112 - shoulder[0], dy = 192 - shoulder[1]; return [shoulder[0] + dx * Math.cos(ang) - dy * Math.sin(ang) + 20, shoulder[1] + dx * Math.sin(ang) + dy * Math.cos(ang)]; })();

  // feet
  for (const fx of [-45, 45]) for (const tx of [-9, 0, 9]) ink(L.ink, T([[fx + tx * 0.4, 216], [fx + tx, 232]]), id + 30 + fx + tx, lw * 1.1, 0.4, alpha, '#e0782f');

  // beak
  const beak = [[-15, -42], [15, -42], [3, -12], [-3, -12]];
  crayon(L.col, T(beak), '#f08a3c', id + 40, { alpha, spacing: 3, dark: '#d0652a' });
  inkShape(L.ink, T(beak), id + 41, lw * 0.8, 0.5, alpha);

  // eyes
  const eye = (cx, cy, closedAmt, eid) => {
    const px = cx + look[0] * 11, py = cy + 4 + look[1] * 9;
    if (closedAmt > 0.55) {
      ink(L.ink, T(quadPts([cx - 20, cy + 2], [cx, cy + 14], [cx + 20, cy + 2], 6)), eid, lw * 1.2, 0.5, alpha);
    } else {
      const ry = 14 * (1 - closedAmt * 1.6);
      crayon(L.ink, T(ellipse(px, py, 13, Math.max(2, ry), 14)), '#151522', eid, { alpha, hatch: 0, amp: 0.4 });
      if (ry > 6) dot(L.ink, ...T([[px - 4, py - 5]])[0], 4.5 * s, '#ffffff', alpha);
      if (eyeGlow > 0) { const g = T([[px, py]])[0]; glow(L.glow, g[0], g[1], 60 * s, '#ffd27a', eyeGlow); }
    }
  };
  eye(LENS_L[0], LENS_L[1], Math.max(blink, wink), id + 50);
  eye(LENS_R[0], LENS_R[1], blink, id + 51);

  // glasses
  for (const [cx, cy, gid] of [[...LENS_L, 60], [...LENS_R, 61]]) {
    ink(L.ink, T(HD.closed(ellipse(cx, cy, LENS_R0, LENS_R0 - 2, 30))), id + gid, lw * 2.1, 0.8, alpha, '#141420');
    ink(L.ink, T(ellipse(cx, cy, LENS_R0 - 12, LENS_R0 - 14, 12, 0, Math.PI * 1.1, Math.PI * 1.45)), id + gid + 5, lw * 0.9, 0.3, 0.55 * alpha, '#ffffff');
  }
  ink(L.ink, T(quadPts([-9, -84], [0, -94], [9, -84], 5)), id + 70, lw * 1.6, 0.4, alpha, '#141420');
  ink(L.ink, T([[-102, -82], [-134, -96]]), id + 71, lw * 1.4, 0.4, alpha, '#141420');
  ink(L.ink, T([[102, -82], [134, -96]]), id + 72, lw * 1.4, 0.4, alpha, '#141420');

  // brows: the right one is raised (the curious/skeptical look from the channel art)
  ink(L.ink, T(quadPts([24, -134 - brow * 8], [56, -152 - brow * 14], [88, -136 - brow * 8], 6)), id + 80, lw * 1.5, 0.6, alpha, '#141420');
  ink(L.ink, T(quadPts([-86, -132], [-56, -136], [-26, -130], 6)), id + 81, lw * 1.1, 0.6, 0.7 * alpha, '#141420');

  // lantern hanging from the right wing tip
  if (lantern > 0) {
    const tip = T([tipLocal])[0];
    HD.lantern(L, tip[0], tip[1], s * 1.05, { swing, lit, id: id + 90, alpha: alpha * lantern, t });
  }
};

// Hanging lantern: (x, y) is the top of the handle.
HD.lantern = (L, x, y, s, { swing = 0, lit = 1, id = 60, alpha = 1, t = 0 } = {}) => {
  const T = pts => xform(pts, x, y, swing, s);
  ink(L.ink, T(ellipse(0, 10, 12, 12, 12, 0, Math.PI, Math.PI * 2)), id, 2.4 * s, 0.4, alpha);
  const cap = [[-16, 10], [16, 10], [24, 24], [-24, 24]];
  const glass = [[-20, 24], [20, 24], [20, 74], [-20, 74]];
  const base = [[-24, 74], [24, 74], [20, 84], [-20, 84]];
  const flick = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7.3 + 1);
  crayon(L.col, T(glass), lit > 0 ? HD.mix('#5a5040', '#ffd982', lit) : '#3a3d50', id + 1, { alpha, spacing: 3 });
  crayon(L.col, T(cap), '#2b2e40', id + 2, { alpha });
  crayon(L.col, T(base), '#2b2e40', id + 3, { alpha });
  inkShape(L.ink, T(glass), id + 4, 2 * s, 0.5, alpha);
  inkShape(L.ink, T(cap), id + 5, 2 * s, 0.5, alpha);
  inkShape(L.ink, T(base), id + 6, 2 * s, 0.5, alpha);
  ink(L.ink, T([[0, 24], [0, 74]]), id + 7, 1.2 * s, 0.3, 0.6 * alpha);
  if (lit > 0) {
    const fl = T([[0, 52]])[0];
    crayon(L.ink, T(HD.spline([[0, 36], [7, 52], [0, 64], [-7, 52]])), '#fff0b8', id + 8, { alpha: alpha * lit, hatch: 0, amp: 0.3 });
    glow(L.glow, fl[0], fl[1], 230 * s * flick, HD.C.lamp, 0.75 * lit * alpha);
    glow(L.glow, fl[0], fl[1], 40 * s, HD.C.lampHot, lit * alpha);
  }
  return T([[0, 52]])[0];
};

// A pair of glowing eyes in the dark (the Owl Society watching). open 0..1
HD.eyePair = (L, x, y, s, open, id, color = '#ffc95e') => {
  if (open <= 0.05) return;
  const blink = Math.sin(L.t * 0.9 + id) > 0.985 ? 0.1 : 1;
  const o = open * blink;
  for (const dx of [-14, 14]) {
    const ex = x + dx * s;
    HD.crayon(L.ink, ellipse(ex, y, 8 * s, 8 * s * o, 12), color, id + dx, { alpha: 0.95, hatch: 0, amp: 0.3 });
    dot(L.ink, ex, y + 1 * s, 3.2 * s * o, '#1a1206', 0.9);
    glow(L.glow, ex, y, 34 * s, color, 0.55 * o);
  }
};

// Circular "Owl Society" emblem. p 0..1 draws it on.
HD.owlEmblem = (L, x, y, s, p, id = 7700) => {
  const c = L.ink, a = clamp(p * 1.4);
  HD.ink(c, HD.partial(HD.closed(ellipse(x, y, 190 * s, 190 * s, 60, -Math.PI / 2)), p), id, 5 * s, 1, 1, HD.C.orange);
  HD.ink(c, HD.partial(HD.closed(ellipse(x, y, 172 * s, 172 * s, 60, Math.PI / 2)), p), id + 1, 2.2 * s, 1, 1, HD.C.orange);
  if (p < 0.3) return;
  const q = clamp((p - 0.3) / 0.7);
  c.save();
  c.font = `700 ${34 * s}px ${HD.FONT.brand}`; c.fillStyle = '#fff3e3'; c.globalAlpha = q; c.textAlign = 'center'; c.textBaseline = 'middle';
  const STEP = 0.15;
  const write = (str, radius, start, dir) => {
    const step = STEP;
    [...str].forEach((ch, i) => {
      const ang = start + dir * i * step;
      c.save(); c.translate(x + Math.cos(ang) * radius * s, y + Math.sin(ang) * radius * s);
      c.rotate(ang + (dir > 0 ? Math.PI / 2 : -Math.PI / 2));
      c.fillText(ch, 0, 0); c.restore();
    });
  };
  const top = 'THE OWL SOCIETY';
  write(top, 150, -Math.PI / 2 - (top.length - 1) * STEP / 2, 1);
  const bottom = 'EST. 2026';
  write(bottom, 150, Math.PI / 2 + (bottom.length - 1) * STEP / 2, -1);
  c.restore();
  // owl face in the middle: ear tufts, round glasses, beak
  const F = pts => xform(pts, x, y + 6 * s, 0, s);
  const cream = '#fff3e3';
  HD.ink(c, F(quadPts([-70, -30], [-60, -70], [-38, -54], 6)), id + 10, 3.5 * s, 0.6, q, cream);
  HD.ink(c, F(quadPts([70, -30], [60, -70], [38, -54], 6)), id + 11, 3.5 * s, 0.6, q, cream);
  for (const sx of [-1, 1]) {
    HD.ink(c, F(HD.closed(ellipse(sx * 34, -8, 28, 28, 20))), id + 12 + sx, 4.5 * s, 0.6, q, cream);
    HD.dot(c, ...F([[sx * 34 + 3, -6]])[0], 7 * s, cream, q);
  }
  HD.ink(c, F([[-6, -14], [6, -14]]), id + 15, 3 * s, 0.3, q, cream);
  HD.crayon(c, F([[-10, 22], [10, 22], [0, 42]]), HD.C.orange, id + 16, { alpha: q, hatch: 0, amp: 0.3 });
  for (const sx of [-1, 1]) {
    const sp = [x + sx * 150 * s, y];
    HD.ink(c, [[sp[0] - 10 * s, sp[1]], [sp[0] + 10 * s, sp[1]]], id + 5 + sx, 3 * s, 0.4, q, HD.C.orange);
    HD.ink(c, [[sp[0], sp[1] - 10 * s], [sp[0], sp[1] + 10 * s]], id + 7 + sx, 3 * s, 0.4, q, HD.C.orange);
  }
};
})();
