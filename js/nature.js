'use strict';
/* ============================================================
   FIGHTER CRAFT - the world beyond the city blocks:
     - Market Street shops and the hero's house (outsides)
     - the beach, the sea (swim, fish, dolphins) and a pier
     - the jungle with a river, a temple and animals
     - the ruined, burning border where the map ends
     - traffic: citizens driving, and parked cars anyone can drive
   Extends the World class.
   ============================================================ */
const SHOPS = [
  { id: 'food', i: 16, j: 10, dx: -1, name: 'YUM YUM FOOD', icon: '🍔', col: '#ff6b8a', body: '#fff1e0' },
  { id: 'guns', i: 16, j: 11, dx: -1, name: 'HERO GEAR', icon: '⚔️', col: '#39d0ff', body: '#dfe6f0' },
  { id: 'pets', i: 16, j: 13, dx: -1, name: 'PET SHOP', icon: '🐶', col: '#ffb347', body: '#fff6c9' },
  { id: 'house', i: 8, j: 13, dx: 1, name: 'MY HOUSE', icon: '🏠', col: '#5fd68a', body: '#fbf7ea' }
];
const RIVER_Z = -40, BRIDGE_X = -300, PIER_X = -60, PIER_Z1 = SHORE + 46;
const ANIMAL_NAMES = { elephant: 'Elephant', tiger: 'Tiger', deer: 'Deer', monkey: 'Monkey', croc: 'Crocodile', parrot: 'Parrot' };

Object.assign(World.prototype, {
  inWater(x, z) {
    if (z > SHORE) return !(Math.abs(x - PIER_X) < 2.2 && z < PIER_Z1);
    return x < -WORLD_R - 3 && Math.abs(z - RIVER_Z) < 6.5 && Math.abs(x - BRIDGE_X) > 3.3;
  },
  shopPad(s) { const x = cellX(s.i), z = cellX(s.j), w = s.id === 'house' ? 3.6 + Math.max(1, S.house) * 0.8 : 6; return { id: s.id, x: x + s.dx * (w + 2.1), z: s.id === 'house' ? z : z - 2.4, r: 1.7, col: s.col, label: s.icon + ' ' + (s.id === 'house' && !S.house ? 'HOUSE FOR SALE' : s.name), lx: x, lz: z, ly: 11 }; },
  buildShop(s) {
    const x = cellX(s.i), z = cellX(s.j), dx = s.dx, col = C3(s.col), fx = x + dx * 6;
    G3.abox(x, 0.1, z, CS / 2 - 0.25, 0.1, CS / 2 - 0.25, C3('#b4bccb'), 10);
    if (s.id === 'house') {
      const lv = S.house, w = 3.6 + Math.max(1, lv) * 0.8, hh = 2.8 + (lv > 1 ? 2.4 : 0);
      G3.abox(x, 0.22, z, 6.6, 0.03, 6.6, C3('#4fbf6b'), 11);
      if (!lv) { G3.amesh(x + dx * 3, 1.2, z, CYX, 0.08, 1.2, 0.08, C3('#6b4a2b')); G3.abox(x + dx * 3.1, 2.3, z, 0.06, 0.6, 1.3, C3('#fff6c9'), 0.6); G3.abox(x + dx * 3.17, 2.3, z, 0.02, 0.25, 1.0, C3('#e5383b'), 0.9); return; }
      G3.abox(x, hh / 2 + 0.2, z, w, hh / 2, w * 0.9, C3(lv >= 3 ? '#fff6e0' : '#fbf7ea'), -0.1);
      for (const sd of [-1, 1]) G3.box(M4.rz(M4.t(ID4, x + sd * w * 0.52, hh + 0.2 + w * 0.36, z), -sd * 0.62), w * 0.66, 0.14, w * 0.98, C3(lv >= 3 ? '#3a78d8' : '#c8402f'), -0.3);
      G3.abox(x, hh + 0.2 + w * 0.34, z, 0.14, w * 0.36, w * 0.9, C3('#fbf7ea')); G3.abox(x - w * 0.5, hh + 1.6, z - w * 0.4, 0.35, 0.9, 0.35, C3('#a8503a'));
      G3.abox(x + dx * (w + 0.03), 1.25, z, 0.05, 1.05, 0.6, C3('#7a4a2a')); for (const q of [-1, 1]) G3.abox(x + dx * (w + 0.03), 1.8, z + q * w * 0.55, 0.05, 0.55, 0.6, C3('#bfe9ff'), 0.6);
      if (lv > 1) for (const q of [-1, 0, 1]) G3.abox(x + dx * (w + 0.03), 4.2, z + q * w * 0.55, 0.05, 0.55, 0.55, C3('#bfe9ff'), 0.6);
      if (lv >= 3) { G3.amesh(x - dx * 1, 0.27, z + 5.2, CYL, 2.2, 0.03, 1.1, C3('#39a0ff'), 12); tree3(x - dx * 4.5, z - 5.4, 0.8, false); }
      G3.amesh(x + dx * (w + 1.2), 0.8, z + 2.2, CYX, 0.05, 0.8, 0.05, C3('#555a66')); G3.abox(x + dx * (w + 1.2), 1.5, z + 2.2, 0.3, 0.2, 0.2, col, 0.5);
      this.solid(x - w, x + w, z - w * 0.9, z + w * 0.9, hh + 2.5); return;
    }
    const hh = 7; G3.abox(x, hh / 2, z, 6, hh / 2, 6, C3(s.body), -0.1); G3.abox(x, hh + 0.2, z, 6.25, 0.2, 6.25, mulC(col, 0.8));
    G3.abox(fx + dx * 0.1, 5.4, z, 0.1, 0.9, 4.6, col, 1); G3.abox(fx + dx * 0.06, 2, z + 2.2, 0.06, 1.4, 2.2, C3('#bfe9ff'), 0.7); G3.abox(fx + dx * 0.06, 1.4, z - 2.4, 0.06, 1.4, 1.0, C3('#3a2a1c'));
    for (let k = -3; k <= 3; k++) G3.abox(fx + dx * 0.95, 3.7, z + k * 1.6, 0.9, 0.07, 0.8, k % 2 ? WHITE : col, -0.2);
    const top = M4.t(ID4, x, hh + 0.4, z);
    if (s.id === 'food') food3('burger', top, 4.2, 0);
    else if (s.id === 'guns') { G3.box(M4.rz(top, 0.5), 0.22, 3.6, 0.07, C3('#e6fbff'), 0.5); G3.box(M4.rz(top, -0.5), 0.22, 3.6, 0.07, C3('#e6fbff'), 0.5); G3.mesh(M4.rx(M4.t(top, 0, 1.4, 0), HPI), CYL, 1.3, 0.12, 1.3, col, -0.8); }
    else { G3.amesh(x, hh + 1.7, z, SPL, 1.3, 1.3, 1.1, C3('#c98f4e'), 0); for (const q of [-1, 1]) { G3.amesh(x, hh + 2.7, z + q * 0.95, SPX, 0.5, 0.7, 0.3, C3('#8a5a2c'), 0); G3.amesh(x + dx * 1.05, hh + 1.95, z + q * 0.45, SPT, 0.13, 0.13, 0.13, C3('#15161a'), 0); } G3.amesh(x + dx * 1.25, hh + 1.5, z, SPX, 0.3, 0.25, 0.3, C3('#15161a'), 0); }
    this.solid(x - 6, x + 6, z - 6, z + 6, hh);
  },
  buildNature(L, A) {
    this.fires = []; this.zones = [{ x: -WORLD_R - 6, z: 0, label: '🌴 JUNGLE', col: '#5fd68a' }, { x: PIER_X, z: SHORE - 6, label: '🏖️ BEACH', col: '#ffe14d' }];
    for (const s of SHOPS) this.pads.push(this.shopPad(s));
    const r = rng(77), sand = C3('#ecd9a0'), wood = C3('#8a6a4a');
    // ---- beach, sea and pier ----
    G3.abox(-127, 0.03, WORLD_R + 12, 320, 0.04, 12, sand, 11);
    G3.abox(-127, -0.3, SHORE + 350, 700, 0.335, 350, C3(L >= 1 ? '#2f86d6' : '#2c5a80'), 12);
    for (let z = SHORE - 4; z < PIER_Z1; z += 3) { G3.abox(PIER_X, 0.17, z + 1.4, 2, 0.08, 1.4, wood, 0); if (Math.round(z) % 9 === 0) for (const sx of [-1, 1]) G3.amesh(PIER_X + sx * 2, 0.2, z, CYX, 0.14, 1.1, 0.14, C3('#6b4a2b')); }
    this.solid(PIER_X - 2, PIER_X + 2, SHORE - 4, PIER_Z1, 0.25);
    for (let k = 0; k < 16; k++) { const x = -400 + r() * 560, z = WORLD_R + 4 + r() * 12; if (Math.abs(x - PIER_X) < 6) continue; this.palm(x, z, r); if (k % 3 === 0) { G3.amesh(x + 5, 1.2, z + 3, CYX, 0.05, 1.2, 0.05, WHITE); G3.amesh(x + 5, 2.5, z + 3, CONE, 1.7, 0.45, 1.7, C3(['#ff6b6b', '#39d0ff', '#ffd23f'][k % 9 / 3 | 0]), -0.2); G3.abox(x + 5.6, 0.1, z + 4.2, 0.5, 0.03, 1, C3('#f4f8ff')); } }
    // ---- jungle ----
    G3.abox(-312, 0.03, 0, 137, 0.035, WORLD_R, C3('#3f8a4a'), 11);
    G3.abox(-312, 0.06, RIVER_Z, 137, 0.035, 6.5, C3('#3a8ad0'), 12);
    for (let k = -1; k <= 1; k++) G3.abox(BRIDGE_X + k * 2.2, 0.17, RIVER_Z, 1.05, 0.08, 8.5, wood, 0); for (const sx of [-1, 1]) { G3.abox(BRIDGE_X + sx * 3.2, 0.9, RIVER_Z, 0.08, 0.08, 8.5, wood); for (let q = -2; q <= 2; q++) G3.amesh(BRIDGE_X + sx * 3.2, 0.5, RIVER_Z + q * 4, CYX, 0.09, 0.5, 0.09, wood); }
    this.solid(BRIDGE_X - 3.3, BRIDGE_X + 3.3, RIVER_Z - 8.5, RIVER_Z + 8.5, 0.25);
    const tx = -350, tz = 70; // temple
    for (let k = 0; k < 4; k++) { const hw = 13 - k * 3; G3.abox(tx, 1.2 + k * 2.4, tz, hw, 1.2, hw, C3(k % 2 ? '#8a8f7a' : '#9aa08a'), 2 + 3); this.solid(tx - hw, tx + hw, tz - hw, tz + hw, 2.4 + k * 2.4); }
    G3.amesh(tx, 11.4, tz, SPL, 1.4, 1.8, 1.4, C3('#ffd86b'), -0.95); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { G3.amesh(tx + sx * 15, 3, tz + sz * 15, CYL, 0.8, 3, 0.8, C3('#9aa08a')); G3.amesh(tx + sx * 15, 6.5, tz + sz * 15, SPX, 0.6, 0.6, 0.6, C3('#ff8c1a'), 1); this.solid(tx + sx * 15 - 0.8, tx + sx * 15 + 0.8, tz + sz * 15 - 0.8, tz + sz * 15 + 0.8, 6); }
    if (!this.natureMade) { this.natureMade = true; for (const sx of [-1, 1]) this.crates.push({ x: tx + sx * 2.2, y: 9.6, z: tz, gold: true, hitT: 0, dead: false, resp: 0, rot: sx, roof: true }); }
    for (let k = 0; k < 170; k++) {
      const x = -WORLD_R - 8 - r() * 240, z = -WORLD_R + 6 + r() * (WORLD_R * 2 - 12), q = r();
      if (Math.abs(z - RIVER_Z) < 11 || (Math.abs(x - tx) < 22 && Math.abs(z - tz) < 22) || (Math.abs(z) < 5 && x > -260) || Math.abs(x - BRIDGE_X) < 5) continue;
      if (q < 0.4) this.palm(x, z, r);
      else if (q < 0.8) { const s = 1.2 + r() * 1.2; G3.amesh(x, 2.2 * s, z, CYX, 0.3 * s, 2.2 * s, 0.3 * s, C3('#5a4030'), 0); for (let c = 0; c < 3; c++) G3.amesh(x + (r() - 0.5) * 2.5 * s, (4.2 + r() * 1.6) * s, z + (r() - 0.5) * 2.5 * s, SPX, (1.5 + r()) * s, (1.1 + r() * 0.5) * s, (1.5 + r()) * s, C3(['#2f7a3e', '#3a8a48', '#266a34'][c]), 0); this.solid(x - 0.35 * s, x + 0.35 * s, z - 0.35 * s, z + 0.35 * s, 9); }
      else { const s = 0.5 + r() * 0.7; G3.amesh(x, 0.5 * s, z, SPX, 1.1 * s, 0.7 * s, 1.1 * s, C3('#3fa85a'), 0); if (r() < 0.5) G3.amesh(x + 0.4 * s, 0.9 * s, z, SPT, 0.14, 0.14, 0.14, C3(['#ff6b9d', '#ffd23f', '#ff8c1a'][k % 3]), 0.5); }
    }
    for (let k = 0; k < 9; k++) { G3.amesh(-446 - r() * 14, 12 + r() * 12, -WORLD_R + k * 42, TAPER, 20, 16 + r() * 14, 24, C3('#6a7466'), 0); G3.amesh(-WORLD_R - 20 - k * 30, 10 + r() * 10, -WORLD_R - 14 - r() * 10, TAPER, 20, 14 + r() * 12, 14, C3('#6a7466'), 0); }
    // ---- the ruined, burning border (north and east): the end of the map ----
    const burnt = ['#2a2628', '#3a3436', '#221f22', '#4a3f3c'];
    const ruin = (x, z) => {
      const q = r();
      if (q < 0.45) { const w = 4 + r() * 5, hh = 5 + r() * 14; G3.box(M4.rz(M4.rx(M4.ry(M4.t(ID4, x, hh * 0.4, z), r() * 3), (r() - 0.5) * 0.7), (r() - 0.5) * 0.7), w, hh / 2, w * (0.6 + r() * 0.5), C3(burnt[k4 = Math.floor(r() * 4)]), 2 + 5); for (let c = 0; c < 4; c++) G3.box(M4.ry(M4.rx(M4.t(ID4, x + (r() - 0.5) * 14, 0.5 + r(), z + (r() - 0.5) * 14), r()), r() * 3), 1 + r() * 2, 0.4 + r() * 0.8, 0.8 + r() * 1.6, C3(burnt[c]), 0); }
      else if (q < 0.65) { G3.amesh(x, 0.06, z, CYL, 5 + r() * 4, 0.04, 5 + r() * 4, C3('#121012'), 0); G3.amesh(x, 0.09, z, CYL, 2 + r() * 2, 0.04, 2 + r() * 2, C3('#ff5a1a'), 0.55); this.fires.push([x, 0.6, z, 1.4]); }
      else if (q < 0.82) { car3(M4.rz(M4.ry(M4.t(ID4, x, 0.5 + r() * 0.6, z), r() * 6), r() < 0.5 ? 2.6 : 0.4), C3('#2c2628'), 0, false, true, ['sedan', 'van', 'pickup'][Math.floor(r() * 3)]); this.fires.push([x, 1.4, z, 0.9]); }
      else { G3.amesh(x, 2.5, z, CYX, 0.25, 2.5 + r() * 3, 0.25, C3('#2a2628'), 0); G3.box(M4.rz(M4.t(ID4, x, 4.5, z), 0.9), 2.5, 0.12, 0.12, C3('#2a2628')); this.fires.push([x, 5, z, 0.7]); }
    };
    let k4 = 0;
    G3.abox(0, 0.03, -WORLD_R - 62, WORLD_R + 130, 0.035, 60, C3('#2a2628'), 9); G3.abox(WORLD_R + 62, 0.03, 85, 60, 0.035, 330, C3('#2a2628'), 9);
    for (let x = -WORLD_R + 8; x < WORLD_R + 110; x += 13) for (let row = 0; row < 4; row++) ruin(x + (r() - 0.5) * 8, -WORLD_R - 12 - row * 22 - r() * 10);
    for (let z = -WORLD_R; z < 330; z += 13) for (let row = 0; row < 4; row++) ruin(WORLD_R + 12 + row * 22 + r() * 10, z + (r() - 0.5) * 8);
    for (let x = -WORLD_R; x <= WORLD_R; x += 7) { G3.abox(x, 0.6, -WORLD_R - 2.2, 2.6, 0.45, 0.35, C3(Math.round(x / 7) % 2 ? '#ffd23f' : '#23262e')); }
    for (let z = -WORLD_R; z <= SHORE; z += 7) { G3.abox(WORLD_R + 2.2, 0.6, z, 0.35, 0.45, 2.6, C3(Math.round(z / 7) % 2 ? '#ffd23f' : '#23262e')); }
    this.spawnTraffic();
  },
  palm(x, z, r) {
    const hh = 5 + r() * 3, lean = (r() - 0.5) * 0.3, m = M4.rz(M4.t(ID4, x, 0, z), lean); G3.mesh(M4.t(m, 0, hh / 2, 0), CYX, 0.16, hh / 2, 0.16, C3('#8a6a4a'), 0);
    for (let i = 0; i < 6; i++) G3.mesh(M4.rx(M4.ry(M4.t(m, 0, hh, 0), i * 1.047 + r()), 1.15), SPT, 0.35, 0.12, 1.9, C3(i % 2 ? '#3fa85a' : '#2f8a4a'), 0);
    for (let i = 0; i < 3; i++) G3.mesh(M4.t(m, Math.cos(i * 2.1) * 0.22, hh - 0.25, Math.sin(i * 2.1) * 0.22), SPT, 0.16, 0.16, 0.16, C3('#6b4a2b'), 0);
    this.solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3, hh);
  },

  /* ---------------- living things ---------------- */
  initLife() {
    const r = rng(321), h = this.h; this.animals = []; this.fish = [];
    const J = (kind, n, o) => { for (let k = 0; k < n; k++) { const x = -205 - r() * 205, z = -150 + r() * 300; if (Math.abs(z - RIVER_Z) < 14) { continue; } this.animals.push(Object.assign({ kind, x, z, y: 0, hx: x, hz: z, rad: 44, tx: x, tz: z, yaw: r() * TAU, wait: r() * 4, moving: false, ph: r() * 9, sp: 1.6, r: 1 }, o)); } };
    J('elephant', 4, { sp: 1.3, r: 2.4 }); J('tiger', 4, { sp: 2.4, r: 1.3 }); J('deer', 6, { sp: 3, r: 1, fast: 1 }); J('monkey', 6, { sp: 2.2, r: 0.7 });
    for (let k = 0; k < 3; k++) { const x = -220 - k * 75; this.animals.push({ kind: 'croc', x, z: RIVER_Z + 9, y: 0, hx: x, hz: RIVER_Z + 10, rad: 9, tx: x, tz: RIVER_Z + 9, yaw: 1.6, wait: 2, moving: false, ph: k, sp: 0.8, r: 1.6 }); }
    for (let k = 0; k < 5; k++) this.animals.push({ kind: 'parrot', fly: true, cx: -230 - r() * 170, cz: -120 + r() * 240, a: r() * TAU, rr: 8 + r() * 10, x: 0, z: 0, y: 8 + r() * 5, yaw: 0, moving: true, ph: r() * 9, r: 1, col: ['#e5383b', '#2f7df6', '#2fbf71', '#ffd23f', '#ff8c1a'][k] });
    const cols = ['#ff8c1a', '#ffd23f', '#39d0ff', '#ff6b9d', '#b388ff', '#5fd68a'];
    for (let k = 0; k < 18; k++) this.fish.push({ cx: -400 + r() * 560, cz: SHORE + 10 + r() * 110, rr: 3 + r() * 6, a: r() * TAU, sp: 0.6 + r(), col: cols[k % 6], s: 1 + r() * 0.8, ph: r() * 9, jump: 0, x: 0, y: -0.05, z: 0, yaw: 0, pitch: 0 });
    for (let k = 0; k < 3; k++) this.fish.push({ big: true, cx: -200 + k * 130, cz: SHORE + 60 + r() * 60, rr: 16 + r() * 8, a: r() * TAU, sp: 0.5, col: '#7a8aa0', ph: r() * 9, jump: 0, x: 0, y: -0.2, z: 0, yaw: 0, pitch: 0 });
    this.pet3 = { x: h.x + 1, z: h.z, y: 0, yaw: 0, moving: false, ph: 0, kind: S.pet };
  },
  okNode(i, j) {
    if (i < 0 || j < 0 || i > 24 || j > 24 || i % 3 || j % 3 || (i === 12 && j === 12) || (i >= 17 && j >= 17)) return false;
    for (const a of ARENAS.concat([RUMBLE_AT])) if (Math.abs(i - a.i) <= 2 && Math.abs(j - a.j) <= 2) return false;
    const d = this.districtOf(i, j); return d === 5 || S.armor[d];
  },
  nextNode(c) {
    const o = []; for (const [di, dj] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { const ni = c.ni + di, nj = c.nj + dj; if (this.okNode(ni, nj) && !(ni === c.pi && nj === c.pj)) o.push([ni, nj]); }
    const n = o.length ? pick(o) : [c.pi, c.pj]; c.pi = c.ni; c.pj = c.nj; c.ni = n[0]; c.nj = n[1];
  },
  spawnTraffic() {
    const nodes = []; for (let j = 0; j <= 24; j += 3) for (let i = 0; i <= 24; i += 3) if (this.okNode(i, j) && [[3, 0], [-3, 0], [0, 3], [0, -3]].some(([a, b]) => this.okNode(i + a, j + b))) nodes.push([i, j]);
    this.traffic = []; if (!nodes.length) return; const cols = ['#e5383b', '#2f7df6', '#ffd23f', '#f4f8ff', '#2fbf71', '#9b5de5', '#ff8c1a'];
    for (let k = 0; k < 5 + this.L * 2; k++) { const n = pick(nodes), c = { ai: true, type: 'car', kind: pick(['sedan', 'sedan', 'taxi', 'van', 'pickup', 'sports']), col: C3(pick(cols)), pi: n[0], pj: n[1], ni: n[0], nj: n[1], x: cellX(n[0]), y: 0, z: cellX(n[1]), yaw: 0, speed: 0, spin: 0, honk: 0 }; this.nextNode(c); const dx = c.ni - c.pi, dz = c.nj - c.pj, l = Math.hypot(dx, dz) || 1; c.x += -dz / l * 3 + dx / l * rand(4, 30); c.z += dx / l * 3 + dz / l * rand(4, 30); c.yaw = Math.atan2(dx, dz); if (k % 2 === 0) c.kind = c.kind === 'sports' ? 'sedan' : c.kind; this.traffic.push(c); }
  },
  carBump(o, r, skip) { // push o away from cars; returns true when something was hit
    let hit = false; for (const list of [this.traffic, this.cars, this.vehs]) for (const c of list) { if (c === skip || c.type !== 'car' || c.away > 0) continue; const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), min = r + 1.5; if (d < min && d > 0.01 && (o.y || 0) < 1.6) { o.x = c.x + dx / d * min; o.z = c.z + dz / d * min; hit = true; } } return hit;
  },
  petAnimal(a) {
    const h = this.h, n = ANIMAL_NAMES[a.kind]; a.wait = 3; a.moving = false; a.yaw = Math.atan2(h.x - a.x, h.z - a.z); Snd.play('heart'); this.text(a.x, (a.kind === 'elephant' ? 4.2 : 2.2), a.z, '❤', '#ff6b8a', 40);
    if (!S.friends[a.kind]) { S.friends[a.kind] = 1; UI.toast(`🐾 New animal friend: the ${n}!`); say(`You made friends with the ${n}!`); this.gainXp(30); UI.badgeToasts(checkBadges()); Save.save(); }
  },
  upLife(dt) {
    const h = this.h, t = this.t, foot = !h.veh && !this.mis; this.nearAnimal = null; let bd = 99;
    for (const a of this.animals) {
      if (Math.abs(a.x - h.x) > 170 && !a.fly) continue;
      if (a.fly) { a.a += dt * 0.5; a.x = a.cx + Math.cos(a.a) * a.rr; a.z = a.cz + Math.sin(a.a) * a.rr; a.yaw = Math.atan2(-Math.sin(a.a), Math.cos(a.a)); continue; }
      const dh = Math.hypot(a.x - h.x, a.z - h.z); if (foot && dh < a.r + 3.6 && dh < bd) { bd = dh; this.nearAnimal = a; }
      a.moving = false;
      if (a.wait > 0) { a.wait -= dt; if (a.wait <= 0) { a.tx = a.hx + rand(-a.rad, a.rad); a.tz = a.hz + rand(-a.rad, a.rad); a.walk = rand(4, 10); } continue; }
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz); a.walk -= dt;
      if (d < 0.8 || a.walk <= 0 || this.inWater(a.x + dx / d * 2, a.z + dz / d * 2)) { a.wait = rand(1.5, 5); continue; }
      a.yaw = lerpA(a.yaw, Math.atan2(dx, dz), Math.min(1, dt * 4)); a.x += Math.sin(a.yaw) * a.sp * dt; a.z += Math.cos(a.yaw) * a.sp * dt; a.moving = true; this.collide(a, a.r * 0.6);
      a.x = clamp(a.x, BND.x0 + 4, -WORLD_R - 4);
    }
    for (const f of this.fish) {
      if (Math.abs(f.cx - h.x) > 190 || h.z < 60) continue;
      f.a += dt * f.sp * (f.big ? 4 : 2.2) / f.rr; f.x = f.cx + Math.cos(f.a) * f.rr; f.z = Math.max(SHORE + 2, f.cz + Math.sin(f.a) * f.rr); f.yaw = Math.atan2(-Math.sin(f.a), Math.cos(f.a));
      if (f.jump > 0) { f.jump -= dt / (f.big ? 1.3 : 0.8); const p = 1 - Math.max(0, f.jump); f.y = Math.sin(p * Math.PI) * (f.big ? 2.6 : 1.1) - 0.1; f.pitch = -Math.cos(p * Math.PI) * 0.9; if (f.jump <= 0 && Math.hypot(f.x - h.x, f.z - h.z) < 60) this.fx.spark(f.x, 0.2, f.z, 6, '#dff4ff', 4); }
      else { f.y = f.big ? -0.22 : -0.04; f.pitch = 0; if (Math.random() < dt * (f.big ? 0.22 : 0.07)) f.jump = 1; }
      if (!f.big && h.swim && Math.hypot(f.x - h.x, f.z - h.z) < 1.5) { S.fish++; Snd.play('coin'); this.text(h.x, 1.6, h.z, '+1 🐟  (' + S.fish + ')', '#7df9ff', 26); f.cx = h.x + rand(-60, 60); f.cz = SHORE + 14 + rand(0, 100); f.a = rand(TAU); UI.badgeToasts(checkBadges()); }
    }
    for (const c of this.traffic) { // citizens driving around
      if (Math.abs(c.x - h.x) > 190 || Math.abs(c.z - h.z) > 190) { continue; }
      const dx = c.ni - c.pi, dz = c.nj - c.pj, l = Math.hypot(dx, dz) || 1, tx = cellX(c.ni) - dz / l * 3, tz = cellX(c.nj) + dx / l * 3, gx = tx - c.x, gz = tz - c.z, gd = Math.hypot(gx, gz);
      if (gd < 4.5) { this.nextNode(c); continue; }
      c.yaw = lerpA(c.yaw, Math.atan2(gx, gz), Math.min(1, dt * 3.2)); const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
      let stop = false; const ahead = (x, z, y) => { const ax = x - c.x, az = z - c.z, al = ax * fx + az * fz; return al > 0 && al < 9 && Math.abs(ax * fz - az * fx) < 2.4 && (y || 0) < 3; };
      if (ahead(h.x, h.z, h.y)) { stop = true; c.honk -= dt; if (c.honk <= 0) { c.honk = 2.5; Snd.play('warn'); } }
      for (const o of this.traffic) if (o !== c && ahead(o.x, o.z, 0)) stop = true; for (const e of this.en) if (ahead(e.x, e.z, e.y)) stop = true;
      c.speed = lerp(c.speed, stop ? 0 : 9.5, Math.min(1, dt * (stop ? 6 : 1.5))); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt; c.spin += c.speed * dt * 2.8;
    }
    for (const f of this.fires) if (Math.abs(f[0] - h.x) < 90 && Math.abs(f[2] - h.z) < 90 && Math.random() < dt * 5) this.fx.smoke(f[0] + rand(-0.6, 0.6), f[1] + 1.4, f[2] + rand(-0.6, 0.6), 1, '#2a2628');
    // the pet walks with the hero
    const p = this.pet3; p.kind = S.pet;
    if (S.pet && !h.veh) { const gx = h.x - Math.cos(h.yaw) * 1.3 - Math.sin(h.yaw) * 0.8, gz = h.z + Math.sin(h.yaw) * 1.3 - Math.cos(h.yaw) * 0.8, dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz); p.moving = d > 0.5; if (d > 26) { p.x = gx; p.z = gz; } else if (p.moving) { p.yaw = lerpA(p.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10)); const v = Math.min(12, d * 3 + 1); p.x += Math.sin(p.yaw) * v * dt; p.z += Math.cos(p.yaw) * v * dt; } p.y = S.pet === 'parrot' ? h.y + 1.9 + Math.sin(t * 3) * 0.15 : Math.max(this.floorAt(p.x, p.z, h.y + 0.5), h.swim ? -0.42 : 0); p.fast = 1; }
  },
  drawLife(t) {
    const h = this.h, near = (x, z, r) => Math.abs(x - h.x) < r && Math.abs(z - h.z) < r;
    for (const a of this.animals) if (near(a.x, a.z, 130)) { G3.shadow(a.x, 0.07, a.z, a.r * (a.fly ? 0.5 : 1.3), a.fly ? 0.2 : 0.4); animal3(a, t); }
    if (h.z > 40) for (const f of this.fish) if (near(f.x, f.z, 150)) fish3(f, t);
    const car = (c, mine) => { const x = mine ? h.x : c.x, z = mine ? h.z : c.z; if (!near(x, z, 150)) return; G3.shadow(x, 0.05, z, 2.6, 0.5); car3(M4.ry(M4.t(ID4, x, 0, z), mine ? h.yaw : c.yaw), c.col, c.spin, mine || c.ai, !mine && !near(x, z, 45), c.kind); };
    for (const c of this.traffic) car(c, false); for (const c of this.cars) car(c, h.veh === c);
    for (const f of this.fires) if (near(f[0], f[2], 170)) { const s = f[3], fl = 1 + Math.sin(t * 13 + f[0]) * 0.25; G3.agmesh(f[0], f[1] + s * fl, f[2], CONE, s * 0.7, s * 1.3 * fl, s * 0.7, C3('#ff7b1a'), 1.1); G3.agmesh(f[0], f[1] + s * 0.6, f[2], CONE, s * 0.4, s * 0.8 * fl, s * 0.4, C3('#ffe14d'), 1.2); G3.agmesh(f[0], f[1] + 0.3, f[2], SPT, s * 2.2, s * 1.2, s * 2.2, C3('#ff5a1a'), 0.22); }
    if (S.pet && !h.veh) { G3.shadow(this.pet3.x, Math.max(0.05, this.pet3.y + 0.05), this.pet3.z, 0.4, 0.35); animal3(this.pet3, t); }
    if (h.climb && h.rope && !h.veh) { const R = h.rope, len = Math.max(0.2, R.top - h.y - 1.2); G3.amesh(R.x, h.y + 1.2 + len / 2, R.z, CYX, 0.025, len / 2, 0.025, C3('#d9c08a'), 0); G3.amesh(R.x, R.top + 0.1, R.z, SPT, 0.2, 0.12, 0.2, C3('#9aa4b8'), -0.8); G3.amesh(R.x, h.y + 1.15, R.z, SPT, 0.07, 0.07, 0.07, C3('#ff8c1a'), -0.6); }
    if (h.swim && !h.veh && Math.random() < 0.25) this.fx.add({ k: 0, x: h.x + rand(-0.5, 0.5), y: 0.1, z: h.z + rand(-0.5, 0.5), vx: rand(-1, 1), vy: rand(1, 3), vz: rand(-1, 1), life: 0.3, max: 0.3, c: C3('#dff4ff'), s: 0.05, g: 9 });
  },
  hudLife(g) {
    const h = this.h, a = this.nearAnimal;
    for (const z of this.zones) { const d = Math.hypot(z.x - h.x, z.z - h.z); if (d > 420 || d < 30) continue; const s = this.toScreen(z.x, 14, z.z); if (s) this.pill(g, s[0], s[1], z.label + ' • ' + Math.round(d) + ' m', z.col, clamp(60 / s[2], 0.6, 1)); }
    if (a) { const s = this.toScreen(a.x, a.kind === 'elephant' ? 4.6 : 2.4, a.z); if (s) this.pill(g, s[0], s[1], `${UI.isTouch ? 'Tap F' : 'Press F'} to pet the ${ANIMAL_NAMES[a.kind].toLowerCase()}${S.friends[a.kind] ? ' ❤' : ''}`, '#ffe14d', 1); }
    const v = this.nearVeh; if (v && !h.veh && this.cars.includes(v)) { const s = this.toScreen(v.x, 2.6, v.z); if (s) this.pill(g, s[0], s[1], `🚗 ${UI.isTouch ? 'Tap F' : 'Press F'} to drive the ${CAR_KINDS[v.kind].name.toLowerCase()}`, '#ffe14d', 1.05); }
    if (S.fish > 0) { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W - 320, 18, 96, 38, 19); g.fill(); g.fillStyle = '#7df9ff'; g.font = `bold 20px ${FONT}`; g.textAlign = 'center'; g.fillText('🐟 ' + S.fish, W - 272, 38); }
    if (h.swim) { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W / 2 - 170, 622, 340, 38, 14); g.fill(); g.fillStyle = '#7df9ff'; g.font = `bold 18px ${FONT}`; g.textAlign = 'center'; g.fillText('🏊 Swimming - bump into fish to catch them', W / 2, 642); }
  }
});
