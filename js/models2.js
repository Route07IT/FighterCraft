'use strict';
/* ============================================================
   FIGHTER CRAFT - more models: car types, rockets, jungle animals,
   pets, sea life, food and shop furniture.
   ============================================================ */

/* ---------------- cars: several shapes ---------------- */
const CAR_KINDS = {
  sports: { name: 'Sports Car', max: 31, acc: 24, turn: 2.2 }, sedan: { name: 'Sedan', max: 24, acc: 18, turn: 2.0 }, taxi: { name: 'Taxi', max: 25, acc: 19, turn: 2.0 },
  van: { name: 'Van', max: 19, acc: 13, turn: 1.7 }, pickup: { name: 'Pickup Truck', max: 22, acc: 16, turn: 1.9 }
};
function car3(m, col, spin, lights, lo, kind) {
  const M = lo ? SPX : SPL, B = lo ? SPL : SPH, glass = C3('#16202e'), tire = C3('#16181d'), k = kind || 'sports', big = k === 'van';
  if (k === 'van') { G3.mesh(M4.t(m, 0, 1.08, 0), B, 1.02, 0.84, 2.3, col, -0.8); G3.mesh(M4.t(m, 0, 1.38, 1.25), M, 0.88, 0.42, 0.9, glass, -0.95); G3.box(M4.t(m, 0, 1.15, -0.5), 1.04, 0.18, 1.0, mulC(col, 0.8), -0.5); }
  else if (k === 'pickup') { G3.mesh(M4.t(m, 0, 0.7, 0), B, 1.0, 0.42, 2.35, col, -0.85); G3.mesh(M4.t(m, 0, 1.18, 0.6), M, 0.86, 0.5, 0.95, glass, -0.95); G3.box(M4.t(m, 0, 0.98, -1.3), 0.92, 0.2, 0.9, mulC(col, 0.72), -0.4); }
  else if (k === 'sedan' || k === 'taxi') { G3.mesh(M4.t(m, 0, 0.62, 0), B, 0.96, 0.42, 2.2, col, -0.85); G3.mesh(M4.t(m, 0, 1.08, -0.05), M, 0.8, 0.42, 1.25, glass, -0.95); if (k === 'taxi') G3.box(M4.t(m, 0, 1.56, -0.05), 0.3, 0.09, 0.12, C3('#fff6c9'), 1); }
  else { G3.mesh(M4.t(m, 0, 0.56, 0), B, 0.98, 0.37, 2.2, col, -0.85); G3.mesh(M4.t(m, 0, 0.98, -0.2), M, 0.78, 0.36, 1.05, glass, -0.95); if (!lo) { G3.box(M4.t(m, 0, 1.02, -2.0), 0.82, 0.025, 0.15, mulC(col, 0.7), -0.6); for (const sx of [-1, 1]) G3.box(M4.t(m, sx * 0.6, 0.9, -2.0), 0.03, 0.12, 0.05, mulC(col, 0.7), 0); } }
  const wr = big ? 0.42 : 0.36, wy = wr, hy = k === 'sports' ? 0.62 : big ? 0.85 : 0.7;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = M4.rx(M4.rz(M4.t(m, sx * 0.9, wy, sz * 1.35), HPI), spin || 0); G3.mesh(w, lo ? CYX : CYL, wr, 0.13, wr, tire, 0); if (!lo) G3.mesh(w, CYX, wr * 0.5, 0.145, wr * 0.5, C3('#c9ced6'), -0.8); }
  for (const sx of [-1, 1]) { ell(m, sx * 0.56, hy, 2.1, 0.17, 0.09, 0.08, C3('#fff6c9'), lights ? 1 : 0.25, SPX); ell(m, sx * 0.6, hy + 0.02, -2.12, 0.16, 0.07, 0.06, C3('#ff3b2f'), lights ? 0.9 : 0.2, SPX); }
}
/* a rocket with nose, fins and a flame */
function rocket3(s, t) {
  const k = s.air ? 1.5 : 1, m = M4.rx(M4.ry(M4.t(ID4, s.x, s.y, s.z), Math.atan2(s.vx, s.vz)), HPI - Math.atan2(s.vy, Math.hypot(s.vx, s.vz)));
  G3.mesh(m, CYX, 0.07 * k, 0.34 * k, 0.07 * k, C3('#eef1f6'), -0.8); G3.mesh(M4.t(m, 0, 0.46 * k, 0), CONE, 0.07 * k, 0.13 * k, 0.07 * k, C3('#e5383b'), -0.6); G3.mesh(M4.t(m, 0, 0.1 * k, 0), CYX, 0.073 * k, 0.03 * k, 0.073 * k, C3('#e5383b'), -0.4);
  for (let i = 0; i < 4; i++) G3.box(M4.t(M4.ry(m, i * HPI), 0.1 * k, -0.28 * k, 0), 0.06 * k, 0.09 * k, 0.008, C3('#3a3f4d'), -0.5);
  const fl = (0.22 + Math.sin(t * 70) * 0.06) * k; G3.gmesh(M4.rx(M4.t(m, 0, -0.36 * k - fl, 0), Math.PI), CONE, 0.06 * k, fl, 0.06 * k, C3('#ffb347'), 1.5); G3.gmesh(M4.t(m, 0, -0.4 * k, 0), SPT, 0.17 * k, 0.17 * k, 0.17 * k, C3('#ff7b3d'), 0.8);
}

/* ---------------- animals and pets ---------------- */
function legs4(m, bw, bl, hy, len, lr, col, w) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const j = jnt(m, sx * bw, hy, sz * bl, sx * sz * w * 0.6, 0); G3.mesh(M4.t(j, 0, -len / 2, 0), CYX, lr, len / 2 + 0.03, lr, col, 0); } }
function eyes2(m, x, y, z, r) { for (const s of [-1, 1]) ell(m, s * x, y, z, r, r, r * 0.6, C3('#15161a'), 0, SPT); }
function animal3(a, t) {
  const w = a.moving ? Math.sin(t * (a.fast ? 13 : 8) + a.ph) : 0, hop = a.kind === 'bunny' && a.moving ? Math.abs(Math.sin(t * 9 + a.ph)) * 0.25 : 0, m = M4.ry(M4.t(ID4, a.x, (a.y || 0) + hop, a.z), a.yaw), wag = Math.sin(t * 9 + a.ph) * 0.5;
  switch (a.kind) {
    case 'elephant': { const c = C3('#8d939e'), d = C3('#737986'); G3.mesh(M4.t(m, 0, 2.15, 0), SPH, 1.15, 1.1, 1.8, c, 0); legs4(m, 0.7, 1.1, 1.5, 1.5, 0.34, d, w); G3.mesh(M4.t(m, 0, 2.6, 1.9), SPL, 0.8, 0.85, 0.8, c, 0);
      for (const s of [-1, 1]) { G3.mesh(M4.ry(M4.t(m, s * 0.95, 2.7, 1.6), s * 0.5 + Math.sin(t * 2 + a.ph) * 0.15), SPL, 0.75, 0.85, 0.12, d, 0); G3.mesh(M4.rx(M4.t(m, s * 0.4, 2.0, 2.6), HPI * 0.8), CONE, 0.09, 0.5, 0.09, C3('#f3ead6'), -0.4); }
      const tr = Math.sin(t * 1.5 + a.ph) * 0.3; for (let i = 0; i < 5; i++) G3.mesh(M4.t(m, 0, 2.3 - i * 0.38, 2.6 + Math.sin(i * 0.5 + tr) * 0.25), SPX, 0.26 - i * 0.03, 0.26, 0.26 - i * 0.03, c, 0);
      G3.mesh(M4.rx(M4.t(m, 0, 2.2, -1.85), 0.3), CYX, 0.05, 0.5, 0.05, d, 0); eyes2(m, 0.5, 2.85, 2.5, 0.08); break; }
    case 'tiger': { const c = C3('#f08a24'), d = C3('#2a1c14'); G3.mesh(M4.t(m, 0, 1.0, 0), SPL, 0.42, 0.42, 1.05, c, 0); for (let i = -1; i <= 1; i++) G3.mesh(M4.rx(M4.t(m, 0, 1.03, i * 0.45), HPI), CYX, 0.435, 0.05, 0.435, d, 0);
      legs4(m, 0.26, 0.7, 0.75, 0.75, 0.1, c, w); G3.mesh(M4.t(m, 0, 1.3, 1.15), SPL, 0.34, 0.32, 0.36, c, 0); ell(m, 0, 1.2, 1.45, 0.17, 0.13, 0.12, C3('#fff4e0'), 0, SPX);
      for (const s of [-1, 1]) ell(m, s * 0.24, 1.6, 1.05, 0.09, 0.1, 0.05, d, 0, SPT); eyes2(m, 0.14, 1.38, 1.44, 0.04); G3.mesh(M4.rx(M4.t(m, 0, 1.1, -1.35), -1.1 + wag * 0.3), CYX, 0.05, 0.45, 0.05, c, 0); break; }
    case 'deer': { const c = C3('#b07a4a'), d = C3('#7a5230'); G3.mesh(M4.t(m, 0, 1.25, 0), SPL, 0.34, 0.38, 0.85, c, 0); legs4(m, 0.2, 0.55, 0.95, 0.95, 0.06, d, w); G3.mesh(M4.rx(M4.t(m, 0, 1.75, 0.8), 0.5), CYX, 0.12, 0.42, 0.12, c, 0); G3.mesh(M4.t(m, 0, 2.15, 1.05), SPX, 0.17, 0.17, 0.26, c, 0);
      for (const s of [-1, 1]) { G3.mesh(M4.rz(M4.t(m, s * 0.12, 2.5, 0.95), -s * 0.4), CONE, 0.03, 0.28, 0.03, C3('#e8dcc0'), 0); ell(m, s * 0.17, 2.25, 0.9, 0.05, 0.1, 0.03, d, 0, SPT); } eyes2(m, 0.12, 2.2, 1.2, 0.03); ell(m, 0, 1.4, -0.85, 0.1, 0.12, 0.08, C3('#fff4e0'), 0, SPT); break; }
    case 'croc': { const c = C3('#4a7a3a'), d = C3('#35592a'); G3.mesh(M4.t(m, 0, 0.32, 0), SPL, 0.45, 0.24, 1.3, c, 0); legs4(m, 0.5, 0.75, 0.3, 0.3, 0.09, d, w); G3.mesh(M4.t(m, 0, 0.34, 1.6), SPX, 0.26, 0.14, 0.75, c, 0); G3.mesh(M4.rx(M4.t(m, 0, 0.3, -2.0), -HPI), CONE, 0.26, 0.95, 0.2, d, 0);
      for (let i = 0; i < 5; i++) ell(m, 0, 0.56, -0.9 + i * 0.4, 0.08, 0.07, 0.1, d, 0, SPT); eyes2(m, 0.16, 0.5, 1.2, 0.05); break; }
    case 'monkey': { const c = C3('#7a5230'), f = C3('#e8c9a0'); G3.mesh(M4.t(m, 0, 0.55, 0), SPL, 0.3, 0.38, 0.26, c, 0); G3.mesh(M4.t(m, 0, 1.1, 0.05), SPL, 0.25, 0.24, 0.24, c, 0); ell(m, 0, 1.07, 0.2, 0.17, 0.15, 0.1, f, 0, SPX); eyes2(m, 0.07, 1.12, 0.29, 0.03);
      for (const s of [-1, 1]) { ell(m, s * 0.26, 1.12, 0.02, 0.07, 0.09, 0.04, f, 0, SPT); const j = jnt(m, s * 0.3, 0.8, 0, a.moving ? s * w : 2.6 + wag * 0.4, s * 0.3); G3.mesh(M4.t(j, 0, -0.3, 0), CYX, 0.06, 0.32, 0.06, c, 0); const l = jnt(m, s * 0.16, 0.3, 0.05, -s * w * 0.7 + 0.5, 0); G3.mesh(M4.t(l, 0, -0.18, 0), CYX, 0.07, 0.2, 0.07, c, 0); }
      for (let i = 0; i < 5; i++) ell(m, 0, 0.3 + Math.sin(i * 0.7) * 0.35, -0.3 - i * 0.14, 0.05, 0.05, 0.09, c, 0, SPT); break; }
    case 'parrot': { const c = C3(a.col || '#e5383b'), fl = Math.sin(t * 16 + a.ph) * (a.moving ? 1 : 0.1); G3.mesh(M4.rx(M4.t(m, 0, 0.3, 0), 0.5), SPX, 0.13, 0.2, 0.13, c, -0.2); G3.mesh(M4.t(m, 0, 0.52, 0.1), SPX, 0.11, 0.11, 0.11, c, -0.2); G3.mesh(M4.rx(M4.t(m, 0, 0.5, 0.22), HPI + 0.5), CONE, 0.05, 0.08, 0.04, C3('#ffd23f'), 0); eyes2(m, 0.07, 0.56, 0.17, 0.02);
      for (const s of [-1, 1]) G3.mesh(M4.rz(M4.t(m, s * 0.2, 0.36, -0.02), s * (0.3 + fl)), SPX, 0.22, 0.03, 0.12, C3('#2f7df6'), -0.2); G3.mesh(M4.rx(M4.t(m, 0, 0.2, -0.24), -1.1), SPX, 0.05, 0.2, 0.03, C3('#ffd23f'), 0); break; }
    case 'dog': { const c = C3('#c98f4e'), d = C3('#8a5a2c'); G3.mesh(M4.t(m, 0, 0.5, 0), SPX, 0.2, 0.2, 0.42, c, 0); legs4(m, 0.13, 0.28, 0.36, 0.36, 0.05, c, w); G3.mesh(M4.t(m, 0, 0.75, 0.45), SPX, 0.17, 0.16, 0.18, c, 0); ell(m, 0, 0.7, 0.62, 0.09, 0.08, 0.1, d, 0, SPT); ell(m, 0, 0.74, 0.72, 0.03, 0.03, 0.03, C3('#15161a'), 0, SPT);
      for (const s of [-1, 1]) ell(m, s * 0.15, 0.8, 0.4, 0.04, 0.11, 0.07, d, 0, SPT); eyes2(m, 0.07, 0.8, 0.6, 0.025); G3.mesh(M4.rz(M4.rx(M4.t(m, 0, 0.62, -0.42), -0.9), wag), CYX, 0.03, 0.18, 0.03, d, 0); break; }
    case 'cat': { const c = C3('#8a8f9c'); G3.mesh(M4.t(m, 0, 0.36, 0), SPX, 0.15, 0.15, 0.33, c, 0); legs4(m, 0.09, 0.22, 0.26, 0.26, 0.035, c, w); G3.mesh(M4.t(m, 0, 0.56, 0.34), SPX, 0.14, 0.13, 0.13, c, 0);
      for (const s of [-1, 1]) G3.mesh(M4.t(m, s * 0.08, 0.72, 0.32), CONE, 0.045, 0.07, 0.03, c, 0); eyes2(m, 0.055, 0.58, 0.45, 0.025); ell(m, 0, 0.53, 0.47, 0.02, 0.015, 0.015, C3('#ff8fa3'), 0, SPT); G3.mesh(M4.rx(M4.t(m, 0, 0.5, -0.36), 0.5 + wag * 0.3), CYX, 0.025, 0.24, 0.025, c, 0); break; }
    case 'bunny': { const c = C3('#f4f4f6'); G3.mesh(M4.t(m, 0, 0.26, 0), SPX, 0.16, 0.17, 0.22, c, 0); G3.mesh(M4.t(m, 0, 0.46, 0.2), SPX, 0.12, 0.12, 0.12, c, 0);
      for (const s of [-1, 1]) { G3.mesh(M4.rz(M4.t(m, s * 0.05, 0.7, 0.16), -s * 0.15), SPT, 0.035, 0.16, 0.025, c, 0); ell(m, s * 0.1, 0.09, 0.06, 0.05, 0.05, 0.12, c, 0, SPT); } eyes2(m, 0.06, 0.5, 0.3, 0.02); ell(m, 0, 0.45, 0.32, 0.018, 0.014, 0.014, C3('#ff8fa3'), 0, SPT); ell(m, 0, 0.26, -0.22, 0.06, 0.06, 0.06, c, 0, SPT); break; }
  }
}
function fish3(f, t) {
  const big = f.big, s = big ? 1 : f.s, m = M4.rx(M4.ry(M4.t(ID4, f.x, f.y, f.z), f.yaw + Math.sin(t * 8 + f.ph) * 0.15), f.pitch || 0), c = C3(f.col);
  if (big) { G3.mesh(m, SPL, 0.4, 0.42, 1.3, c, -0.6); ell(m, 0, -0.14, 0.3, 0.3, 0.26, 0.9, C3('#dfe6f0'), -0.4, SPX); G3.mesh(M4.rx(M4.t(m, 0, 0.5, -0.1), -0.5), CONE, 0.1, 0.3, 0.2, c, -0.5); G3.box(M4.t(m, 0, 0, -1.4), 0.55, 0.03, 0.2, c, -0.5); G3.mesh(M4.rx(M4.t(m, 0, 0.05, 1.45), HPI), CONE, 0.14, 0.25, 0.14, c, -0.5); }
  else { G3.mesh(m, SPX, 0.09 * s, 0.14 * s, 0.26 * s, c, -0.7); G3.mesh(M4.rx(M4.t(m, 0, 0, -0.34 * s), HPI), CONE, 0.03 * s, 0.13 * s, 0.14 * s, c, -0.5); ell(m, 0, 0.14 * s, 0, 0.02 * s, 0.06 * s, 0.1 * s, C3('#fff6c9'), 0, SPT); eyes2(m, 0.07 * s, 0.03 * s, 0.17 * s, 0.022 * s); }
}

/* ---------------- food (s = size) ---------------- */
const FOODS = [
  { id: 'apple', name: 'Apple', icon: '🍎', cost: 5, fx: 'Heals 30%. Healthy and cheap!', heal: 0.3 },
  { id: 'salad', name: 'Veggie Bowl', icon: '🥗', cost: 12, fx: 'Heals 50% and more XP for 3 minutes', heal: 0.5, xp: 180 },
  { id: 'juice', name: 'Fruit Juice', icon: '🧃', cost: 8, fx: 'Fills your energy, and it refills 2x faster for 1 minute', en: 1, regen: 60 },
  { id: 'sushi', name: 'Sushi', icon: '🍣', cost: 16, fx: 'Heals 60% and fills your super bar', heal: 0.6, sup: 1 },
  { id: 'burger', name: 'Hero Burger', icon: '🍔', cost: 15, fx: 'Heals 70%', heal: 0.7 },
  { id: 'pizza', name: 'Pizza', icon: '🍕', cost: 20, fx: 'Heals 100%', heal: 1 },
  { id: 'icecream', name: 'Ice Cream', icon: '🍦', cost: 10, fx: 'Run 20% faster for 2 minutes', spd: 120 },
  { id: 'cake', name: 'Party Cake', icon: '🎂', cost: 40, fx: 'Heals 100%, fills energy and super - a real treat', heal: 1, en: 1, sup: 1 }
];
function food3(id, m, s, t) {
  const E = (x, y, z, sx, sy, sz, c, e, M) => ell(m, x * s, y * s, z * s, sx * s, sy * s, sz * s, C3(c), e || 0, M), Cy = (y, r, hh, c, e) => G3.mesh(M4.t(m, 0, y * s, 0), CYL, r * s, hh * s, r * s, C3(c), e || 0);
  switch (id) {
    case 'apple': E(0, 0.3, 0, 0.3, 0.28, 0.3, '#e5383b', -0.8, SPH); G3.mesh(M4.t(m, 0, 0.62 * s, 0), CYX, 0.02 * s, 0.07 * s, 0.02 * s, C3('#6b4a2b'), 0); G3.mesh(M4.rz(M4.t(m, 0.09 * s, 0.66 * s, 0), 0.8), SPT, 0.1 * s, 0.03 * s, 0.05 * s, C3('#3fa85a'), 0); break;
    case 'salad': G3.mesh(M4.rx(M4.t(m, 0, 0.26 * s, 0), Math.PI), TAPER, 0.4 * s, 0.2 * s, 0.4 * s, C3('#f4f8ff'), -0.7); for (let i = 0; i < 9; i++) { const a = i * 0.7; E(Math.cos(a) * 0.2, 0.42 + (i % 3) * 0.03, Math.sin(a) * 0.2, 0.13, 0.07, 0.13, i % 3 ? '#58c773' : '#3fa85a', 0, SPT); } for (let i = 0; i < 4; i++) E(Math.cos(i * 1.6 + 0.5) * 0.16, 0.52, Math.sin(i * 1.6 + 0.5) * 0.16, 0.06, 0.06, 0.06, i % 2 ? '#e5383b' : '#ffb347', -0.5, SPT); break;
    case 'juice': Cy(0.36, 0.2, 0.36, '#ff8c1a', -0.5); Cy(0.74, 0.215, 0.03, '#f4f8ff'); G3.mesh(M4.rz(M4.t(m, 0.06 * s, 0.9 * s, 0), -0.2), CYX, 0.02 * s, 0.24 * s, 0.02 * s, C3('#e5383b'), 0); E(-0.12, 0.8, 0.1, 0.09, 0.09, 0.03, '#ffd23f', -0.3, SPT); break;
    case 'sushi': for (let i = -1; i <= 1; i++) { G3.mesh(M4.t(m, i * 0.34 * s, 0.14 * s, 0), CYL, 0.14 * s, 0.11 * s, 0.14 * s, C3('#fbf7ea'), 0); G3.mesh(M4.t(m, i * 0.34 * s, 0.14 * s, 0), CYL, 0.146 * s, 0.07 * s, 0.146 * s, C3('#1c2a22'), 0); E(i * 0.34, 0.27, 0, 0.1, 0.035, 0.1, i ? '#ff8f6b' : '#5fd68a', -0.5, SPT); } G3.box(M4.t(m, 0, 0.015 * s, 0), 0.6 * s, 0.015 * s, 0.26 * s, C3('#3a2a1c'), -0.4); break;
    case 'burger': E(0, 0.1, 0, 0.4, 0.13, 0.4, '#d9963f', -0.3, SPH); Cy(0.24, 0.41, 0.06, '#5a3220'); G3.box(M4.ry(M4.t(m, 0, 0.32 * s, 0), 0.5), 0.4 * s, 0.015 * s, 0.4 * s, C3('#ffd23f'), -0.4); for (let i = 0; i < 7; i++) E(Math.cos(i * 0.9) * 0.34, 0.37, Math.sin(i * 0.9) * 0.34, 0.14, 0.035, 0.14, '#58c773', 0, SPT); Cy(0.42, 0.37, 0.03, '#e5383b'); E(0, 0.5, 0, 0.42, 0.24, 0.42, '#e8a84e', -0.4, SPH); for (let i = 0; i < 9; i++) E(Math.cos(i * 2.4) * 0.2, 0.71 - (i % 3) * 0.02, Math.sin(i * 2.4) * 0.2, 0.025, 0.012, 0.04, '#fff6c9', 0, SPT); break;
    case 'pizza': Cy(0.04, 0.55, 0.04, '#e8a84e'); Cy(0.07, 0.48, 0.02, '#ffd86b', -0.4); for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3, r = i % 2 ? 0.3 : 0.16; E(Math.cos(a) * r, 0.1, Math.sin(a) * r, 0.07, 0.02, 0.07, '#c81e1e', -0.3, SPT); } for (let i = 0; i < 5; i++) E(Math.cos(i * 1.3) * 0.36, 0.1, Math.sin(i * 1.3) * 0.36, 0.04, 0.02, 0.06, '#3fa85a', 0, SPT); break;
    case 'icecream': G3.mesh(M4.rx(M4.t(m, 0, 0.3 * s, 0), Math.PI), CONE, 0.2 * s, 0.3 * s, 0.2 * s, C3('#d9963f'), 0); E(0, 0.66, 0, 0.23, 0.2, 0.23, '#ff9ec2', -0.5, SPH); E(0, 0.92, 0, 0.19, 0.17, 0.19, '#fff6c9', -0.5, SPH); E(0, 1.1, 0, 0.06, 0.06, 0.06, '#e5383b', -0.8, SPT); break;
    case 'cake': Cy(0.16, 0.48, 0.16, '#ff9ec2', -0.3); Cy(0.33, 0.49, 0.025, '#fff6f9'); Cy(0.48, 0.32, 0.13, '#fff6c9', -0.3); Cy(0.62, 0.33, 0.02, '#ff6b8a'); for (let i = 0; i < 5; i++) { const a = i * 1.257, x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2; G3.mesh(M4.t(m, x * s, 0.74 * s, z * s), CYX, 0.018 * s, 0.1 * s, 0.018 * s, C3(['#39d0ff', '#ffd23f', '#5fd68a', '#b388ff', '#ff8c1a'][i]), 0); G3.gmesh(M4.t(m, x * s, (0.9 + Math.sin(t * 9 + i) * 0.01) * s, z * s), SPT, 0.035 * s, 0.06 * s, 0.035 * s, C3('#ffb347'), 1.4); } for (let i = 0; i < 8; i++) E(Math.cos(i * 0.785) * 0.47, 0.36, Math.sin(i * 0.785) * 0.47, 0.05, 0.05, 0.05, '#e5383b', -0.6, SPT); break;
  }
}

/* ---------------- furniture for the walk-in rooms ---------------- */
function pedestal3(x, z, h, col, top) { G3.amesh(x, h / 2, z, CYL, 0.55, h / 2, 0.55, C3(col || '#f4f8ff'), -0.4); G3.amesh(x, h + 0.03, z, CYL, 0.62, 0.03, 0.62, C3(top || '#ffd23f'), -0.8); }
function keeper3(x, z, t, shirt, hat) { const c = { x, z, y: 0, yaw: 0, moving: false, cheer: false, ph: 0, s: 1, c1: C3(shirt), c2: C3('#2a2e39'), skin: C3('#f2b98a'), hair: C3('#3b2a20') }; citizen3(c, t); if (hat) { G3.amesh(x, 1.82, z, CYX, 0.14, 0.1, 0.14, WHITE, 0); G3.amesh(x, 1.95, z, SPX, 0.19, 0.11, 0.19, WHITE, 0); } }
function table3(x, z) { G3.amesh(x, 0.75, z, CYL, 0.6, 0.04, 0.6, C3('#fbf7ea'), -0.3); G3.amesh(x, 0.37, z, CYX, 0.06, 0.37, 0.06, C3('#8a93a6'), -0.6); for (const s of [-1, 1]) { G3.amesh(x + s * 0.95, 0.42, z, CYL, 0.25, 0.03, 0.25, C3('#ff6b8a'), -0.2); G3.amesh(x + s * 0.95, 0.2, z, CYX, 0.04, 0.2, 0.04, C3('#8a93a6'), -0.6); } }
function plant3(x, z) { G3.amesh(x, 0.25, z, TAPER, 0.25, 0.25, 0.25, C3('#b85c44'), 0); for (let i = 0; i < 5; i++) G3.mesh(M4.rz(M4.ry(M4.t(ID4, x, 0.8, z), i * 1.26), 0.6), SPT, 0.08, 0.5, 0.16, C3(i % 2 ? '#3fa85a' : '#58c773'), 0); }
