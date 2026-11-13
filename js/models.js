'use strict';
/* ============================================================
   FIGHTER CRAFT - 3D models, built from smooth rounded shapes
   (spheres, capsules, cylinders, cones) and animated by code.
   Facing: a character with yaw 0 looks toward +Z.
   ============================================================ */
const ID4 = M4.id(), WHITE = [1, 1, 1], HPI = Math.PI / 2;
/* rounded shape at an offset inside m */
function ell(m, x, y, z, sx, sy, sz, col, e, M) { G3.mesh(M4.t(m, x, y, z), M || SPL, sx, sy, sz, col, e || 0); }
/* a joint: +rx swings forward (toward +Z), rz swings sideways */
function jnt(m, px, py, pz, rx, rz) { let j = M4.t(m, px, py, pz); if (rz) j = M4.rz(j, rz); if (rx) j = M4.rx(j, -rx); return j; }
/* a rounded limb segment hanging down from joint j */
function seg3(j, len, r, col, e, M) { G3.mesh(M4.t(j, 0, -len / 2, 0), M || SPL, r, len / 2 + r * 0.45, r, col, e || 0); }

/* the hero, citizens and walking robots are drawn by models3.js */

/* ---------------- robots ---------------- */
const LOOK3 = {
  scrapper: { s: 0.86, bw: 0.4, bh: 0.42, leg: 0.5, hw: 0.29, arm: 1.1, aw: 0.1, c: '#93a1b8', d: '#465066', eye: '#ff8a36', ant: 1 },
  zapper: { s: 1.0, bw: 0.26, bh: 0.5, leg: 0.6, hw: 0.25, arm: 1.0, aw: 0.075, c: '#8275e0', d: '#3d357a', eye: '#7df9ff', coil: 1 },
  brute: { s: 1.35, bw: 0.62, bh: 0.5, leg: 0.42, hw: 0.3, arm: 1.3, aw: 0.2, c: '#c0623a', d: '#5e2a14', eye: '#ffcf33' },
  crusher: { s: 1.9, bw: 0.64, bh: 0.52, leg: 0.45, hw: 0.34, arm: 1.5, aw: 0.22, c: '#c8402f', d: '#641e16', eye: '#ffe14d', horn: 1, core: '#ffe14d' },
  viper: { s: 1.75, bw: 0.4, bh: 0.62, leg: 0.62, hw: 0.32, arm: 1.5, aw: 0.12, c: '#9a4fbc', d: '#4a235a', eye: '#7dffb0', coil: 1, core: '#7dffb0' },
  furnace: { s: 2.0, bw: 0.68, bh: 0.52, leg: 0.42, hw: 0.3, arm: 1.5, aw: 0.24, c: '#75828f', d: '#1c2833', eye: '#ff7b00', stack: 1, core: '#ff7b00' },
  corex: { s: 2.25, bw: 0.56, bh: 0.62, leg: 0.55, hw: 0.36, arm: 1.6, aw: 0.18, c: '#343c54', d: '#0c0e16', eye: '#ff2244', horn: 1, crown: 1, core: '#ff2244' }
};
function roller3(e) {
  const f = e.flash > 0, pal = e.pal, hot = !pal && (e.state === 'wind' || e.state === 'roll'), g1 = f ? WHITE : pal ? C3('#eef4ff') : C3('#2fa37a'), g2 = f ? WHITE : pal ? C3('#3a78d8') : C3('#14523d');
  const sh = e.state === 'wind' ? Math.sin(e.t * 60) * 0.03 : 0, m = M4.ry(M4.t(ID4, e.x + sh, e.y + 0.72, e.z), e.yaw), w = M4.rx(m, e.spin || 0), ec = C3(hot ? '#ff2a1a' : pal ? '#5dff9a' : '#ffe14d');
  G3.mesh(m, SPH, 0.7, 0.7, 0.7, g1, f ? 0 : -0.7); G3.mesh(M4.rz(m, HPI), CYL, 0.73, 0.13, 0.73, g2, f ? 0 : -0.5);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; if (e.state === 'roll') G3.mesh(M4.rx(M4.t(w, 0, Math.cos(a) * 0.74, Math.sin(a) * 0.74), a), CONE, 0.09, 0.2, 0.09, C3('#e8edf5'), -0.6); else ell(w, 0, Math.cos(a) * 0.73, Math.sin(a) * 0.73, 0.14, 0.05, 0.05, ec, 0.8, SPX); }
  for (const s of [-1, 1]) ell(m, s * 0.66, 0, 0, 0.08, 0.24, 0.24, ec, 1, SPX);
  ell(m, 0, 0.8, 0, 0.24, 0.16, 0.24, f ? WHITE : pal ? C3('#eef4ff') : C3('#9be7c4'), -0.6); ell(m, 0, 0.82, 0.18, 0.15, 0.055, 0.08, ec, 1, SPX);
  if (hot && !f) G3.gmesh(m, SPX, 1, 1, 1, C3('#ff2a1a'), 0.25);
}
function drone3(e, big) {
  const f = e.flash > 0, pal = e.pal, s = big ? 2.5 : 1, hot = !pal && (e.state === 'wind' || e.state === 'charge' || e.state === 'cast'), dz = e.state === 'dizzy';
  const c = f ? WHITE : pal ? C3('#eef4ff') : C3(big ? '#4a80c0' : '#98a2b6'), d = f ? WHITE : pal ? C3('#3a78d8') : C3('#2b3242'), MT = f ? 0 : -0.7;
  let m = M4.ry(M4.t(ID4, e.x, e.y + 0.35 * s + (dz ? 0 : Math.sin(e.t * 4) * 0.06), e.z), e.yaw);
  if (e.state === 'charge') m = M4.rx(m, 0.4); if (dz) m = M4.rz(m, Math.sin(e.t * 5) * 0.15);
  G3.mesh(m, SPL, 0.64 * s, 0.2 * s, 0.64 * s, c, MT); ell(m, 0, 0.16 * s, 0, 0.32 * s, 0.2 * s, 0.32 * s, d, MT);
  const ec = C3(hot ? '#ff2a1a' : pal ? '#5dff9a' : big ? '#ffe14d' : '#ff5a36');
  ell(m, 0, 0.03 * s, 0.56 * s, 0.2 * s, 0.07 * s, 0.1 * s, ec, 1, SPX); ell(m, 0, -0.17 * s, 0, 0.13 * s, 0.05 * s, 0.13 * s, C3(hot ? '#ff2a1a' : '#39d0ff'), 1, SPX);
  if (hot && !f) G3.gmesh(M4.t(m, 0, -0.3 * s, 0), SPX, 0.4 * s, 0.25 * s, 0.4 * s, C3('#ff2a1a'), 0.8);
  for (let i = 0; i < 4; i++) { const rx = (i & 1 ? 1 : -1) * 0.62 * s, rz = (i & 2 ? 1 : -1) * 0.62 * s; G3.mesh(M4.t(m, rx, 0.14 * s, rz), CYX, 0.04 * s, 0.1 * s, 0.04 * s, d, MT); if (!dz) G3.mesh(M4.t(m, rx, 0.26 * s, rz), CYX, 0.34 * s, 0.012, 0.34 * s, C3('#dfe6f0'), 0.25); }
  if (big) { for (const sd of [-1, 1]) G3.box(M4.rz(M4.t(m, sd * 1.0 * s, 0.05 * s, -0.1 * s), sd * 0.25), 0.5 * s, 0.04 * s, 0.3 * s, C3('#2c4f7a'), MT); G3.mesh(M4.rx(M4.t(m, 0, -0.02 * s, 0.85 * s), HPI), CONE, 0.1 * s, 0.25 * s, 0.1 * s, C3('#ffd23f'), -0.6); }
}
function enemy3(e) {
  if (e.kind === 'roller') roller3(e); else if (e.kind === 'drone') drone3(e, false); else if (e.look === 'warden') drone3(e, true); else bot3(e, LOOK3[e.look || e.kind]);
}
function crate3(p) { // a coin barrel
  const m = M4.rz(M4.ry(M4.t(ID4, p.x, (p.y || 0) + 0.62, p.z), p.rot || 0), Math.sin(p.hitT * 40) * p.hitT * 0.5), g = p.gold;
  G3.mesh(m, CYL, 0.52, 0.62, 0.52, C3(g ? '#f2c230' : '#a36f3a'), g ? 0.25 : -0.15);
  for (const y of [-0.38, 0.38]) G3.mesh(M4.t(m, 0, y, 0), CYL, 0.545, 0.05, 0.545, C3(g ? '#fff3b0' : '#5a5f6b'), g ? 0.6 : -0.6);
  ell(m, 0, 0.63, 0, 0.3, 0.03, 0.3, C3('#ffd23f'), 0.8, SPX);
  if (g) G3.gmesh(m, SPX, 0.95, 0.95, 0.95, C3('#ffd23f'), 0.22);
}
function coin3(x, y, z, t) { G3.mesh(M4.rx(M4.ry(M4.t(ID4, x, y, z), t * 6), HPI), CYX, 0.2, 0.035, 0.2, C3('#ffd23f'), 0.75); }
function heart3(x, y, z, t) { const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 5) * 0.08, z), t * 3), c = C3('#ff4d6d'); ell(m, -0.1, 0.07, 0, 0.13, 0.13, 0.08, c, 0.7, SPX); ell(m, 0.1, 0.07, 0, 0.13, 0.13, 0.08, c, 0.7, SPX); G3.mesh(M4.rx(M4.t(m, 0, -0.1, 0), Math.PI), CONE, 0.2, 0.16, 0.08, c, 0.7); }
function core3(x, y, z, t) { const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 4) * 0.08, z), t * 4); ell(m, 0, 0, 0, 0.16, 0.16, 0.16, C3('#5dff9a'), 0.9, SPX); G3.mesh(M4.rz(m, 0.5), CYX, 0.26, 0.02, 0.26, C3('#eef4ff'), 0.6); G3.gmesh(m, SPX, 0.4, 0.4, 0.4, C3('#5dff9a'), 0.5); }
function crystal3(x, y, z, t) {
  const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 3) * 0.2, z), t * 2), c = C3('#7df9ff');
  G3.mesh(M4.t(m, 0, 0.42, 0), CONE, 0.36, 0.42, 0.36, c, 0.85); G3.mesh(M4.rx(M4.t(m, 0, -0.42, 0), Math.PI), CONE, 0.36, 0.42, 0.36, c, 0.7);
  G3.gmesh(m, SPX, 0.9, 1.1, 0.9, C3('#39d0ff'), 0.45); G3.aglow(x, 6, z, 0.22, 6, 0.22, C3('#39d0ff'), 0.5);
}
/* glowing ring on the ground that marks a place you can use */
function pad3(x, z, r, col, t, active) {
  const n = 16, c = C3(col);
  for (let i = 0; i < n; i++) { const a = i * TAU / n + t * 0.8; G3.amesh(x + Math.cos(a) * r, 0.07, z + Math.sin(a) * r, SPT, 0.2, 0.05, 0.2, c, 1); }
  if (active) G3.agmesh(x, 0.3, z, CYL, r * 0.9, 0.3, r * 0.9, c, 0.2);
}
function tree3(x, z, s, pine) {
  G3.amesh(x, 1.1 * s, z, CYX, 0.17 * s, 1.1 * s, 0.17 * s, C3('#6b4a2b'), 0);
  if (pine) { G3.amesh(x, 3.0 * s, z, CONE, 1.15 * s, 1.3 * s, 1.15 * s, C3('#2f8a4a'), 0); G3.amesh(x, 4.3 * s, z, CONE, 0.8 * s, 1.0 * s, 0.8 * s, C3('#3fa85a'), 0); }
  else { G3.amesh(x, 3.0 * s, z, SPL, 1.25 * s, 1.1 * s, 1.25 * s, C3('#3fa85a'), 0); G3.amesh(x + 0.5 * s, 3.7 * s, z - 0.3 * s, SPX, 0.8 * s, 0.75 * s, 0.8 * s, C3('#58c773'), 0); G3.amesh(x - 0.55 * s, 3.5 * s, z + 0.35 * s, SPX, 0.7 * s, 0.65 * s, 0.7 * s, C3('#4bb865'), 0); }
}

/* ---------------- vehicles ---------------- */
function car3(m, col, spin, lights, lo) {
  const M = lo ? SPX : SPL, glass = C3('#16202e'), tire = C3('#16181d');
  G3.mesh(M4.t(m, 0, 0.56, 0), lo ? SPL : SPH, 0.98, 0.37, 2.2, col, -0.85); G3.mesh(M4.t(m, 0, 0.98, -0.2), M, 0.78, 0.36, 1.05, glass, -0.95);
  G3.mesh(M4.t(m, 0, 0.42, 0), CYX, 0.9, 0.06, 2.0, mulC(col, 0.5), 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = M4.rx(M4.rz(M4.t(m, sx * 0.9, 0.36, sz * 1.3), HPI), spin || 0); G3.mesh(w, lo ? CYX : CYL, 0.36, 0.13, 0.36, tire, 0); if (!lo) G3.mesh(w, CYX, 0.18, 0.145, 0.18, C3('#c9ced6'), -0.8); }
  for (const sx of [-1, 1]) { ell(m, sx * 0.56, 0.62, 2.08, 0.17, 0.09, 0.08, C3('#fff6c9'), lights ? 1 : 0.25, SPX); ell(m, sx * 0.6, 0.64, -2.1, 0.16, 0.07, 0.06, C3('#ff3b2f'), lights ? 0.9 : 0.2, SPX); }
  if (!lo) { G3.box(M4.t(m, 0, 1.02, -2.0), 0.82, 0.025, 0.15, mulC(col, 0.7), -0.6); for (const sx of [-1, 1]) G3.box(M4.t(m, sx * 0.6, 0.9, -2.0), 0.03, 0.12, 0.05, mulC(col, 0.7), 0); }
}
function heli3(m, t, on, col) {
  G3.mesh(M4.t(m, 0, 1.55, 0), SPH, 0.98, 1.0, 2.0, col, -0.85); G3.mesh(M4.t(m, 0, 1.68, 1.15), SPL, 0.82, 0.76, 1.0, C3('#16202e'), -0.95);
  G3.mesh(M4.rx(M4.t(m, 0, 1.8, -3.1), -HPI), TAPER, 0.32, 1.6, 0.32, col, -0.85);
  G3.box(M4.t(m, 0, 2.35, -4.5), 0.04, 0.55, 0.32, C3('#f4f8ff'), -0.6); G3.mesh(M4.rz(M4.t(m, 0.12, 2.2, -4.55), HPI), CYX, 0.5, 0.015, 0.5, C3('#dfe6f0'), on ? 0.3 : 0);
  G3.mesh(M4.t(m, 0, 2.75, 0), CYX, 0.09, 0.25, 0.09, C3('#3a3f4d'), -0.6);
  const r = M4.ry(M4.t(m, 0, 3.02, 0), on ? t * 30 : 0.4); G3.box(r, 3.7, 0.025, 0.16, C3('#23262e'), 0); G3.box(M4.ry(r, HPI), 3.7, 0.025, 0.16, C3('#23262e'), 0);
  if (on) G3.gmesh(M4.t(m, 0, 3.03, 0), CYL, 3.7, 0.01, 3.7, C3('#cfe4ff'), 0.07);
  for (const sx of [-1, 1]) { G3.mesh(M4.rx(M4.t(m, sx * 0.82, 0.12, 0.2), HPI), CYX, 0.06, 1.5, 0.06, C3('#3a3f4d'), -0.6); for (const sz of [-0.6, 0.9]) G3.box(M4.rz(M4.t(m, sx * 0.72, 0.42, sz), sx * 0.3), 0.03, 0.34, 0.03, C3('#3a3f4d'), 0); G3.mesh(M4.rx(M4.t(m, sx * 1.05, 1.1, 0.3), HPI), CYX, 0.11, 0.5, 0.11, C3('#5a6272'), -0.7); }
  ell(m, 0, 1.2, 2.0, 0.12, 0.1, 0.06, C3('#fff6c9'), 1, SPX);
}
function jet3(m, t, burn, gear, col) {
  const grey = C3('#aab4c4'), dark = C3('#4a5262');
  G3.mesh(m, SPH, 0.78, 0.66, 4.2, grey, -0.9); G3.mesh(M4.rx(M4.t(m, 0, -0.02, 4.7), HPI), CONE, 0.42, 1.3, 0.36, dark, -0.8);
  G3.mesh(M4.t(m, 0, 0.5, 1.4), SPL, 0.43, 0.42, 1.15, C3('#16202e'), -0.95);
  for (const s of [-1, 1]) {
    G3.box(M4.ry(M4.t(m, s * 2.25, -0.05, -0.7), -s * 0.45), 2.25, 0.06, 0.95, grey, -0.8); G3.box(M4.ry(M4.t(m, s * 4.0, -0.03, -1.65), -s * 0.45), 0.4, 0.07, 0.6, col, -0.8);
    G3.box(M4.t(m, s * 1.15, 0, -3.7), 1.1, 0.05, 0.5, grey, -0.8); G3.box(M4.rz(M4.t(m, s * 0.5, 0.85, -3.5), -s * 0.3), 0.05, 0.8, 0.6, col, -0.8);
    G3.mesh(M4.rx(M4.t(m, s * 0.36, -0.02, -3.95), HPI), CYL, 0.33, 0.5, 0.33, dark, -0.7);
    G3.mesh(M4.rx(M4.t(m, s * 2.3, -0.28, -0.4), HPI), CYX, 0.09, 0.75, 0.09, C3('#f4f8ff'), -0.7); G3.mesh(M4.rx(M4.t(m, s * 2.3, -0.28, 0.5), HPI), CONE, 0.09, 0.18, 0.09, C3('#ff3b2f'), 0.4);
    if (burn > 0) { const fl = 0.8 + burn * 2 + Math.sin(t * 60 + s) * 0.2; G3.gmesh(M4.rx(M4.t(m, s * 0.36, -0.02, -4.45 - fl), -HPI), CONE, 0.26, fl, 0.26, C3('#ffb347'), 1.3); G3.gmesh(M4.rx(M4.t(m, s * 0.36, -0.02, -4.45 - fl * 0.5), -HPI), CONE, 0.16, fl * 0.5, 0.16, C3('#bfe9ff'), 1.2); }
  }
  if (gear) for (const [x, z] of [[0, 2.6], [-1.0, -0.9], [1.0, -0.9]]) { G3.mesh(M4.t(m, x, -0.85, z), CYX, 0.04, 0.38, 0.04, dark, 0); G3.mesh(M4.rz(M4.t(m, x, -1.07, z), HPI), CYX, 0.2, 0.08, 0.2, C3('#16181d'), 0); }
}
/* a robot base: walls, signal tower, turrets and a force field */
function base3(b, t) {
  const x = b.x, z = b.z, dk = C3('#23262f'), md = C3('#3a3f4d'), red = C3('#ff2a1a'), hit = b.flash > 0;
  for (const s of [-1, 1]) { G3.abox(x + s * 12, 1.6, z, 0.6, 1.6, 12.6, dk, -0.3); G3.abox(x, 1.6, z + s * 12, 12.6, 1.6, 0.6, dk, -0.3); G3.abox(x + s * 12, 3.3, z, 0.65, 0.1, 12.65, red, 0.8); G3.abox(x, 3.3, z + s * 12, 12.65, 0.1, 0.65, red, 0.8); }
  G3.amesh(x, 8, z, TAPER, 2.6, 8, 2.6, hit ? WHITE : md, -0.6); G3.amesh(x, 16.4, z, CYL, 1.9, 0.5, 1.9, dk, -0.6);
  for (let y = 4; y < 16; y += 4) G3.amesh(x, y, z, CYL, 2.75 - y * 0.075, 0.18, 2.75 - y * 0.075, red, 1);
  G3.amesh(x, 19.5, z, CYX, 0.14, 2.7, 0.14, md, 0); G3.amesh(x, 22.4, z, SPX, 0.55, 0.55, 0.55, red, 1); G3.agmesh(x, 22.4, z, SPX, 1.6 + Math.sin(t * 5) * 0.5, 1.6, 1.6, red, 0.6);
  G3.mesh(M4.rx(M4.ry(M4.t(ID4, x, 17.6, z), t * 0.6), 0.9), SPL, 1.7, 0.35, 1.7, C3('#aab4c4'), -0.8);
  for (const u of b.turrets) { G3.amesh(u.x, 3.9, u.z, SPL, 1.1, 0.9, 1.1, md, -0.7); const m = M4.rx(M4.ry(M4.t(ID4, u.x, 4.2, u.z), u.yaw), -u.pitch); G3.mesh(M4.rx(M4.t(m, 0, 0, 1.0), HPI), CYX, 0.2, 1.0, 0.2, dk, -0.7); ell(m, 0, 0, 2.0, 0.2, 0.2, 0.1, red, 1, SPX); }
  G3.agmesh(x, 6, z, SPL, 17.5, 13, 17.5, red, 0.028 + (hit ? 0.16 : 0) + Math.sin(t * 2) * 0.008);
}
