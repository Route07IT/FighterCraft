'use strict';
/* ============================================================
   FIGHTER CRAFT - the world beyond the city blocks:
     - Market Street shops and the hero's house (outsides)
     - the beach and the sea: wade in, then swim; fish, dolphins,
       two piers, speedboats, a shipwreck and Treasure Island
     - the jungle: river, bridges, temple, trails, Crystal Cave
     - the savanna: waterhole, Lion Rock, a waterfall with a secret
     - the ruined, burning border where the map ends (all solid)
     - traffic that obeys the traffic lights, parked cars
     - 30 golden stars hidden all over the world
   Extends the World class.
   ============================================================ */
const SHOPS = [
  { id: 'food', i: 16, j: 10, dx: -1, name: 'YUM YUM FOOD', icon: '🍔', col: '#ff6b8a', body: '#fff1e0' },
  { id: 'guns', i: 16, j: 11, dx: -1, name: 'HERO GEAR', icon: '⚔️', col: '#39d0ff', body: '#dfe6f0' },
  { id: 'pets', i: 16, j: 13, dx: -1, name: 'PET SHOP', icon: '🐶', col: '#ffb347', body: '#fff6c9' },
  { id: 'house', i: 8, j: 13, dx: 1, name: 'MY HOUSE', icon: '🏠', col: '#5fd68a', body: '#fbf7ea' }
];
const RIVER_Z = -40, BRIDGE_X = -300, BRIDGE2_X = -520, PIER_X = -60, PIER_Z1 = SHORE + 46, JUNGLE_X = -430, SWIM_Y = -1.12;
const ISLE = { x: -190, z: 425, r: 40 }, POND = { x: -545, z: 70, r: 15 }, FALLS = { x: BND.x0 + 29, z: RIVER_Z, r: 12 }, LROCK = { x: -520, z: -124 }, LHOUSE = { x: ISLE.x + 15, z: ISLE.z + 10 };
const CAVE_AT = [{ id: 'cave1', x: -300, z: -137, dir: 1 }, { id: 'cave2', x: ISLE.x - 16, z: ISLE.z - 4, dir: -1 }, { id: 'cave3', x: BND.x0 + 12, z: RIVER_Z }];
const STAR_N = 30;
const ANIMAL_NAMES = { croc: 'Crocodile', monkey: 'Monkey', parrot: 'Parrot', flamingo: 'Flamingo' }; for (const k in ANIMALS) ANIMAL_NAMES[k] = ANIMALS[k].name;

Object.assign(World.prototype, {
  /* how deep the water is here (0 = dry land). Shallow water is waded through, deep water is swum in. */
  waterDepth(x, z) {
    if (z > SHORE) {
      if (Math.abs(x - PIER_X) < 2.2 && z < PIER_Z1) return 0;
      const di = Math.hypot(x - ISLE.x, z - ISLE.z) - ISLE.r; if (di < 0 || (Math.abs(x - ISLE.x) < 2.2 && z > ISLE.z - ISLE.r - 14 && z < ISLE.z)) return 0;
      return Math.min((z - SHORE) * 0.12, di * 0.14, 4);
    }
    if (x < -WORLD_R - 3) {
      if (x < BND.x0 + 19) return 0;
      const dz = Math.abs(z - RIVER_Z); let d = 0;
      if (dz < 6.5 && Math.abs(x - BRIDGE_X) > 3.3 && Math.abs(x - BRIDGE2_X) > 3.3) d = 1.7 * (1 - dz * dz / 42.25);
      const df = Math.hypot(x - FALLS.x, z - FALLS.z); if (df < FALLS.r) d = Math.max(d, 1.8 * (1 - df * df / (FALLS.r * FALLS.r)));
      const dp = Math.hypot(x - POND.x, z - POND.z); if (dp < POND.r) d = 0.75 * (1 - dp * dp / (POND.r * POND.r));
      return d;
    }
    return 0;
  },
  inWater(x, z) { return this.waterDepth(x, z) > 0.3; },
  shopPad(s) { const x = cellX(s.i), z = cellX(s.j), w = s.id === 'house' ? 3.6 + Math.max(1, S.house) * 0.8 : 6; return { id: s.id, x: x + s.dx * (w + 2.1), z: s.id === 'house' ? z : z - 2.4, r: 1.7, col: s.col, label: s.icon + ' ' + (s.id === 'house' && !S.house ? 'HOUSE FOR SALE' : s.name), lx: x, lz: z, ly: 11 }; },
  buildShop(s) {
    const x = cellX(s.i), z = cellX(s.j), dx = s.dx, col = C3(s.col), fx = x + dx * 6;
    G3.abox(x, 0.1, z, CS / 2 - 0.25, 0.1, CS / 2 - 0.25, C3('#b4bccb'), 10);
    if (s.id === 'house') {
      const lv = S.house, w = 3.6 + Math.max(1, lv) * 0.8, hh = 2.8 + (lv > 1 ? 2.4 : 0);
      G3.abox(x, 0.22, z, 6.6, 0.03, 6.6, C3('#4fbf6b'), 11);
      if (!lv) { G3.amesh(x + dx * 3, 1.2, z, CYX, 0.08, 1.2, 0.08, C3('#6b4a2b')); G3.abox(x + dx * 3.1, 2.3, z, 0.06, 0.6, 1.3, C3('#fff6c9'), 0.6); G3.abox(x + dx * 3.17, 2.3, z, 0.02, 0.25, 1.0, C3('#e5383b'), 0.9); return; }
      G3.abox(x, hh / 2 + 0.2, z, w, hh / 2, w * 0.9, C3(lv >= 3 ? '#fff6e0' : '#fbf7ea'), -0.1); G3.abox(x, 0.45, z, w + 0.06, 0.25, w * 0.9 + 0.06, C3('#a8a090'));
      for (const sd of [-1, 1]) G3.box(M4.rz(M4.t(ID4, x + sd * w * 0.52, hh + 0.2 + w * 0.36, z), -sd * 0.62), w * 0.66, 0.14, w * 0.98, C3(lv >= 3 ? '#3a78d8' : '#c8402f'), -0.3);
      G3.abox(x, hh + 0.2 + w * 0.34, z, 0.14, w * 0.36, w * 0.9, C3('#fbf7ea')); G3.abox(x - w * 0.5, hh + 1.6, z - w * 0.4, 0.35, 0.9, 0.35, C3('#a8503a'));
      G3.abox(x + dx * (w + 0.03), 1.25, z, 0.05, 1.05, 0.6, C3('#7a4a2a')); G3.abox(x + dx * (w + 0.5), 0.12, z, 0.5, 0.12, 0.9, C3('#a8a090'));
      for (const q of [-1, 1]) { G3.abox(x + dx * (w + 0.03), 1.8, z + q * w * 0.55, 0.05, 0.55, 0.6, C3('#bfe9ff'), -0.9); G3.abox(x + dx * (w + 0.06), 1.8, z + q * w * 0.55, 0.03, 0.62, 0.05, WHITE); G3.abox(x + dx * (w + 0.12), 1.2, z + q * w * 0.55, 0.12, 0.08, 0.7, C3('#c8402f')); }
      if (lv > 1) for (const q of [-1, 0, 1]) G3.abox(x + dx * (w + 0.03), 4.2, z + q * w * 0.55, 0.05, 0.55, 0.55, C3('#bfe9ff'), -0.9);
      if (lv >= 3) { G3.amesh(x - dx * 1, 0.27, z + 5.2, CYL, 2.2, 0.03, 1.1, C3('#39a0ff'), 12); tree3(x - dx * 4.5, z - 5.4, 0.8, false); }
      G3.amesh(x + dx * (w + 1.2), 0.8, z + 2.2, CYX, 0.05, 0.8, 0.05, C3('#555a66')); G3.abox(x + dx * (w + 1.2), 1.5, z + 2.2, 0.3, 0.2, 0.2, col, 0.5);
      for (let k = -3; k <= 3; k++) for (const q of [-1, 1]) G3.abox(x + k * 2, 0.5, z + q * 6.5, 0.06, 0.4, 0.04, WHITE); for (const q of [-1, 1]) G3.abox(x, 0.7, z + q * 6.5, 6.4, 0.04, 0.03, WHITE);
      this.solid(x - w, x + w, z - w * 0.9, z + w * 0.9, hh + 2.5); return;
    }
    const hh = 7; G3.abox(x, hh / 2, z, 6, hh / 2, 6, C3(s.body), -0.1); G3.abox(x, hh + 0.2, z, 6.25, 0.2, 6.25, mulC(col, 0.8)); G3.abox(x, 0.3, z, 6.08, 0.3, 6.08, mulC(C3(s.body), 0.6));
    G3.abox(fx + dx * 0.1, 5.4, z, 0.1, 0.9, 4.6, col, 1); G3.abox(fx + dx * 0.06, 2, z + 2.2, 0.06, 1.4, 2.2, C3('#bfe9ff'), 0.7); G3.abox(fx + dx * 0.06, 1.4, z - 2.4, 0.06, 1.4, 1.0, C3('#3a2a1c'));
    for (let k = -3; k <= 3; k++) G3.abox(fx + dx * 0.95, 3.7, z + k * 1.6, 0.9, 0.07, 0.8, k % 2 ? WHITE : col, -0.2);
    const top = M4.t(ID4, x, hh + 0.4, z);
    if (s.id === 'food') food3('burger', top, 4.2, 0);
    else if (s.id === 'guns') { G3.box(M4.rz(top, 0.5), 0.22, 3.6, 0.07, C3('#e6fbff'), 0.5); G3.box(M4.rz(top, -0.5), 0.22, 3.6, 0.07, C3('#e6fbff'), 0.5); G3.mesh(M4.rx(M4.t(top, 0, 1.4, 0), HPI), CYL, 1.3, 0.12, 1.3, col, -0.8); }
    else { G3.amesh(x, hh + 1.7, z, SPL, 1.3, 1.3, 1.1, C3('#c98f4e'), 0); for (const q of [-1, 1]) { G3.amesh(x, hh + 2.7, z + q * 0.95, SPX, 0.5, 0.7, 0.3, C3('#8a5a2c'), 0); G3.amesh(x + dx * 1.05, hh + 1.95, z + q * 0.45, SPT, 0.13, 0.13, 0.13, C3('#15161a'), 0); } G3.amesh(x + dx * 1.25, hh + 1.5, z, SPX, 0.3, 0.25, 0.3, C3('#15161a'), 0); }
    this.solid(x - 6, x + 6, z - 6, z + 6, hh);
  },

  /* ---------------- building the outer world ---------------- */
  buildNature(L, A) {
    this.fires = []; this.falls = null;
    this.zones = [{ x: -300, z: 6, label: '🌴 JUNGLE', col: '#5fd68a' }, { x: -540, z: 6, label: '🦁 SAVANNA', col: '#ffd86b' }, { x: PIER_X, z: SHORE - 6, label: '🏖️ BEACH', col: '#ffe14d' }, { x: ISLE.x, z: ISLE.z, label: '🏝️ TREASURE ISLAND', col: '#7df9ff' }];
    for (const s of SHOPS) this.pads.push(this.shopPad(s));
    const r = rng(77);
    this.buildSea(L, r); this.buildJungle(r); this.buildSavanna(r); this.buildBorder(r); this.placeStars(); this.spawnTraffic();
  },
  rock(x, z, s, c, solid) { G3.amesh(x, 0, z, SPX, s * 1.25, s, s, c, 13); G3.amesh(x + s * 0.8, 0, z + s * 0.4, SPX, s * 0.7, s * 0.6, s * 0.75, mulC(c, 0.9), 13); if (solid) this.solid(x - s * 0.8, x + s * 0.8, z - s * 0.65, z + s * 0.65, s * 0.8); },
  peak(x, z, rx, hh, rz, c) { G3.amesh(x, hh, z, TAPER, rx, hh, rz, c, 13); G3.amesh(x + rx * 0.1, hh * 2 + hh * 0.22, z, CONE, rx * 0.57, hh * 0.24, rz * 0.57, mulC(c, 1.12), 13); this.solid(x - rx * 0.6, x + rx * 0.6, z - rz * 0.6, z + rz * 0.6, hh * 1.9); },
  pier(x, z0, z1) {
    const wood = C3('#8a6a4a');
    for (let z = z0; z < z1; z += 3) { G3.abox(x, 0.17, z + 1.4, 2, 0.08, 1.4, z % 2 ? wood : mulC(wood, 0.9), 0); if (Math.round(z - z0) % 9 === 0) for (const sx of [-1, 1]) { G3.amesh(x + sx * 2, 0.2, z, CYX, 0.14, 1.1, 0.14, C3('#6b4a2b')); G3.amesh(x + sx * 2, 1.32, z, SPT, 0.17, 0.08, 0.17, C3('#dfe6f0')); } }
    for (const sx of [-1, 1]) G3.abox(x + sx * 2, 1.0, (z0 + z1) / 2, 0.04, 0.04, (z1 - z0) / 2, C3('#d9c08a'));
    this.solid(x - 2, x + 2, z0, z1, 0.25);
  },
  bridge(x) {
    const wood = C3('#8a6a4a');
    for (let k = -1; k <= 1; k++) G3.abox(x + k * 2.2, 0.17, RIVER_Z, 1.05, 0.08, 8.5, k ? wood : mulC(wood, 0.9), 0);
    for (const sx of [-1, 1]) { G3.abox(x + sx * 3.2, 0.9, RIVER_Z, 0.08, 0.08, 8.5, wood); G3.abox(x + sx * 3.2, 0.5, RIVER_Z, 0.04, 0.04, 8.5, wood); for (let q = -2; q <= 2; q++) G3.amesh(x + sx * 3.2, 0.5, RIVER_Z + q * 4, CYX, 0.09, 0.5, 0.09, wood); }
    this.solid(x - 3.3, x + 3.3, RIVER_Z - 8.5, RIVER_Z + 8.5, 0.25);
  },
  caveHill(c, name, col) { // a rocky hill with a dark way in
    const rk = C3('#7c8078'), x = c.x, z = c.z, d = c.dir;
    G3.amesh(x, 0, z, SPL, 10, 8, 7.6, rk, 13); G3.amesh(x - 6, 0, z - d * 1.5, SPX, 6, 5, 5.5, mulC(rk, 0.9), 13); G3.amesh(x + 6.5, 0, z - d, SPX, 6, 6, 5.5, mulC(rk, 1.08), 13); G3.amesh(x + 1, 6, z - d * 2, SPX, 4.5, 3.4, 4, mulC(rk, 1.05), 13);
    G3.amesh(x, 0, z + d * 6.1, SPX, 3.2, 4.1, 1.7, mulC(rk, 0.7), 13); G3.amesh(x, 0, z + d * 6.7, SPX, 2.4, 3.3, 1.5, C3('#07070a'), 0);
    for (const s of [-1, 1]) { G3.amesh(x + s * 3.1, 1.2, z + d * 7.6, CYX, 0.12, 1.2, 0.12, C3('#6b4a2b')); G3.amesh(x + s * 3.1, 2.6, z + d * 7.6, SPT, 0.22, 0.3, 0.22, C3('#ffb347'), 1); this.lamps.push([x + s * 3.1, z + d * 7.6, C3('#ffb347'), 2.7]); }
    this.solid(x - 8.5, x + 8.5, z - 6, z + 6, 7.2);
    this.pads.push({ id: c.id, x, z: z + d * 7.9, r: 1.6, col, label: name, lx: x, lz: z, ly: 10.5 });
  },
  buildSea(L, r) {
    const sand = C3('#ecd9a0'), wood = C3('#8a6a4a'), red = C3('#e5383b'), cx = (BND.x0 + WORLD_R + 20) / 2, hw = (WORLD_R + 20 - BND.x0) / 2 + 30;
    G3.abox(cx, 0.03, WORLD_R + 10, hw, 0.04, 10.6, sand, 11); G3.abox(cx, 0.045, SHORE + 0.3, hw, 0.03, 1.2, C3('#cdb884'), 11); G3.abox(cx, 0.05, SHORE + 1.9, hw, 0.012, 0.22, WHITE, 0.55);
    G3.abox(-230, -0.3, SHORE + 450, 950, 0.335, 450, C3(L >= 1 ? '#2f86d6' : '#2c5a80'), 12);
    this.pier(PIER_X, SHORE - 4, PIER_Z1); this.pier(ISLE.x, ISLE.z - ISLE.r - 14, ISLE.z - ISLE.r + 3);
    for (let k = 0; k < 24; k++) { // palms, sun umbrellas and towels
      const x = BND.x0 + 12 + r() * (WORLD_R - BND.x0 - 20), z = WORLD_R + 3 + r() * 11; if (Math.abs(x - PIER_X) < 7 || Math.abs(x + 30) < 6 || Math.abs(x + 110) < 9) continue; this.palm(x, z, r);
      if (k % 3 === 0) { G3.amesh(x + 5, 1.2, z + 3, CYX, 0.05, 1.2, 0.05, WHITE); G3.amesh(x + 5, 2.5, z + 3, CONE, 1.7, 0.45, 1.7, C3(['#ff6b6b', '#39d0ff', '#ffd23f'][k % 9 / 3 | 0]), -0.2); G3.abox(x + 5.6, 0.1, z + 4.2, 0.5, 0.03, 1, C3('#f4f8ff')); }
    }
    { const x = -30, z = WORLD_R + 9; for (const a of [-1, 1]) for (const b of [-1, 1]) G3.box(M4.rz(M4.t(ID4, x + a * 1.1, 1.5, z + b * 1.1), -a * 0.12), 0.07, 1.6, 0.07, wood); G3.abox(x, 3.2, z, 1.5, 0.08, 1.5, wood); G3.abox(x, 4.0, z - 0.5, 1.3, 0.75, 0.9, C3('#f4f8ff')); G3.abox(x, 4.95, z, 1.7, 0.08, 1.7, red, -0.2); G3.abox(x, 4.0, z + 0.42, 0.9, 0.3, 0.03, red, 0.4); this.solid(x - 1.2, x + 1.2, z - 1.2, z + 1.2, 3.3); } // lifeguard tower
    { const x = -110, z = WORLD_R + 9; for (const s of [-1, 1]) G3.amesh(x + s * 4.5, 1.25, z, CYX, 0.07, 1.25, 0.07, C3('#dfe6f0')); G3.abox(x, 2.0, z, 4.5, 0.42, 0.02, WHITE, 0.25); G3.abox(x, 2.45, z, 4.5, 0.04, 0.03, red); G3.amesh(x + 2, 0.24, z + 2.4, SPX, 0.24, 0.24, 0.24, C3('#ffd23f'), -0.2); } // volleyball
    { const x = PIER_X + 9, z = WORLD_R + 13; G3.amesh(x, 0.35, z, TAPER, 0.9, 0.35, 0.9, sand, 0); for (let k = 0; k < 4; k++) { const a = k * HPI + 0.6; G3.amesh(x + Math.cos(a) * 0.75, 0.6, z + Math.sin(a) * 0.75, CYX, 0.2, 0.6, 0.2, sand); G3.amesh(x + Math.cos(a) * 0.75, 1.35, z + Math.sin(a) * 0.75, CONE, 0.24, 0.16, 0.24, sand); } G3.amesh(x, 1.1, z, CYX, 0.03, 0.5, 0.03, wood); G3.abox(x + 0.16, 1.5, z, 0.16, 0.1, 0.01, red, 0.4); } // sandcastle
    // Treasure Island: beach ring, grass, palms, lighthouse and the Pirate Cave
    G3.amesh(ISLE.x, 0.035, ISLE.z, CYL, ISLE.r + 1.6, 0.04, ISLE.r + 1.6, sand, 11); G3.amesh(ISLE.x, 0.075, ISLE.z, CYL, ISLE.r - 11, 0.04, ISLE.r - 11, C3('#4fa85a'), 11);
    for (let k = 0; k < 10; k++) { const a = k * 0.628 + 0.2, rr = ISLE.r - 5 - (k % 3) * 3; if (k === 7 || k === 8) continue; this.palm(ISLE.x + Math.cos(a) * rr, ISLE.z + Math.sin(a) * rr, r); }
    { const x = LHOUSE.x, z = LHOUSE.z, dk = C3('#2a2e39');
      G3.amesh(x, 0.6, z, CYL, 4.2, 0.6, 4.2, C3('#8c93a2'), 13); G3.amesh(x, 10.6, z, TAPER, 3, 10, 3, C3('#f4f4f0'), -0.15); G3.amesh(x, 6, z, CYL, 2.72, 1.3, 2.72, red, -0.15); G3.amesh(x, 13.5, z, CYL, 2.2, 1.3, 2.2, red, -0.15);
      G3.amesh(x, 20.8, z, CYL, 2.8, 0.2, 2.8, dk); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; G3.amesh(x + Math.cos(a) * 2.65, 21.5, z + Math.sin(a) * 2.65, CYX, 0.04, 0.5, 0.04, dk); }
      G3.amesh(x, 22.3, z, CYL, 1.5, 1.3, 1.5, C3('#fff3b0'), 0.85); G3.amesh(x, 24.4, z, CONE, 2, 0.8, 2, red, -0.3); G3.abox(x, 1.5, z + 3.02, 0.6, 1.1, 0.06, dk); this.solid(x - 2.7, x + 2.7, z - 2.7, z + 2.7, 21); }
    this.caveHill(CAVE_AT[1], '🏴‍☠️ PIRATE CAVE', '#ffd23f');
    // out at sea: a shipwreck, rocks, marker buoys and the swimming-area line
    { const m = M4.rz(M4.rx(M4.ry(M4.t(ID4, 30, 0.5, 330), 0.7), HPI), 0.38); G3.mesh(m, HULL, 3.6, 11, 2.8, C3('#5a4030'), 0); G3.mesh(M4.rz(M4.t(ID4, 31, 4.5, 331), 0.5), CYX, 0.22, 5.5, 0.22, C3('#4a3424')); G3.box(M4.rz(M4.t(ID4, 29.6, 6.8, 331), 0.5), 2.2, 0.08, 0.08, C3('#4a3424')); this.solid(25, 35, 323, 337, 2.2); }
    for (const [x, z, s] of [[-320, 300, 3], [-420, 400, 4], [80, 420, 3.5], [-30, 470, 2.6], [-520, 260, 3], [120, 270, 2.4], [-300, 480, 3.4]]) this.rock(x, z, s, C3('#6f746c'), true);
    for (let k = 1; k <= 5; k++) { const x = lerp(PIER_X, ISLE.x, k / 6) + 6, z = lerp(PIER_Z1 + 6, ISLE.z - ISLE.r - 16, k / 6); G3.amesh(x, 0.12, z, SPT, 0.5, 0.3, 0.5, WHITE); G3.amesh(x, 0.9, z, CONE, 0.36, 0.6, 0.36, red, 0.35); }
    for (let x = BND.x0; x <= WORLD_R; x += 18) G3.amesh(x, 0.1, BND.z1 - 1, SPT, 0.55, 0.42, 0.55, C3('#ff8c1a'), 0.3);
    for (let z = SHORE + 14; z < BND.z1; z += 18) G3.amesh(BND.x0 + 1, 0.1, z, SPT, 0.55, 0.42, 0.55, C3('#ff8c1a'), 0.3);
  },
  buildJungle(r) {
    const hw = (-WORLD_R - JUNGLE_X) / 2, cx = JUNGLE_X + hw, dirt = C3('#a08a5c'), wood = C3('#8a6a4a'), rx0 = BND.x0 + 18, rcx = (rx0 - WORLD_R - 3) / 2, rhw = (-WORLD_R - 3 - rx0) / 2;
    G3.abox(cx, 0.03, 0, hw + 1, 0.035, WORLD_R, C3('#3a7a40'), 11);
    G3.abox(rcx, 0.06, RIVER_Z, rhw, 0.035, 6.5, C3('#3a8ad0'), 12); for (const s of [-1, 1]) G3.abox(rcx, 0.045, RIVER_Z + s * 7.3, rhw, 0.03, 0.9, C3('#7d7048'), 11);
    G3.abox((BND.x0 + 16 - WORLD_R) / 2, 0.07, 0, (-WORLD_R - BND.x0 - 16) / 2, 0.012, 2.2, dirt, 9); G3.abox(BRIDGE_X, 0.07, -64.5, 2.2, 0.012, 64.5, dirt, 9); G3.abox(BRIDGE2_X, 0.07, -55, 2.2, 0.012, 55, dirt, 9); G3.abox(POND.x, 0.07, 27, 2.2, 0.012, 27, dirt, 9); G3.abox(-350, 0.07, 28.5, 2.2, 0.012, 28.5, dirt, 9);
    this.bridge(BRIDGE_X); this.bridge(BRIDGE2_X);
    for (const s of [-1, 1]) { G3.amesh(-WORLD_R - 5, 2.6, s * 4, CYX, 0.3, 2.6, 0.3, wood); this.solid(-WORLD_R - 5.3, -WORLD_R - 4.7, s * 4 - 0.3, s * 4 + 0.3, 5.2); } G3.abox(-WORLD_R - 5, 5.4, 0, 0.35, 0.35, 5, wood); G3.abox(-WORLD_R - 5.4, 4.5, 0, 0.06, 0.5, 2.6, C3('#5fd68a'), 0.6); // the jungle gate
    const tx = -350, tz = 70; // temple
    for (let k = 0; k < 4; k++) { const w = 13 - k * 3; G3.abox(tx, 1.2 + k * 2.4, tz, w, 1.2, w, C3(k % 2 ? '#8a8f7a' : '#9aa08a'), 13); this.solid(tx - w, tx + w, tz - w, tz + w, 2.4 + k * 2.4); }
    for (let k = 0; k < 8; k++) G3.abox(tx, 0.3 + k * 1.2, tz - 13.6 + k * 1.25, 2, 0.3 + k * 0.01, 0.7, C3('#b0b59a'), 13); // steps up the front
    G3.amesh(tx, 11.4, tz, SPL, 1.4, 1.8, 1.4, C3('#ffd86b'), -0.95); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { G3.amesh(tx + sx * 15, 3, tz + sz * 15, CYL, 0.8, 3, 0.8, C3('#9aa08a'), 13); G3.amesh(tx + sx * 15, 6.5, tz + sz * 15, SPX, 0.6, 0.6, 0.6, C3('#ff8c1a'), 1); this.lamps.push([tx + sx * 15, tz + sz * 15, C3('#ff8c1a'), 6.4]); this.solid(tx + sx * 15 - 0.8, tx + sx * 15 + 0.8, tz + sz * 15 - 0.8, tz + sz * 15 + 0.8, 6); }
    if (!this.natureMade) { this.natureMade = true; for (const sx of [-1, 1]) this.crates.push({ x: tx + sx * 2.2, y: 9.6, z: tz, gold: true, hitT: 0, dead: false, resp: 0, rot: sx, roof: true }); }
    this.caveHill(CAVE_AT[0], '💎 CRYSTAL CAVE', '#b388ff');
    const greens = ['#2f7a3e', '#3a8a48', '#266a34'], flowers = ['#ff6b9d', '#ffd23f', '#ff8c1a', '#b388ff'];
    for (let k = 0; k < 330; k++) {
      const x = -WORLD_R - 8 - r() * (-WORLD_R - 12 - JUNGLE_X), z = -WORLD_R + 6 + r() * (WORLD_R * 2 - 12), q = r();
      if (Math.abs(z - RIVER_Z) < 11 || (Math.abs(x - tx) < 22 && Math.abs(z - tz) < 22) || Math.abs(z) < 5.5 || (Math.abs(x - BRIDGE_X) < 5.5 && z < 6) || (Math.abs(x - tx) < 5.5 && z > 0 && z < 60) || (Math.abs(x - CAVE_AT[0].x) < 13 && z < -118)) continue;
      if (q < 0.33) this.palm(x, z, r);
      else if (q < 0.72) { const s = 1.2 + r() * 1.3; G3.amesh(x, 2.2 * s, z, CYX, 0.3 * s, 2.2 * s, 0.3 * s, C3('#5a4030'), 0); G3.amesh(x, 0.3 * s, z, CONE, 0.75 * s, 0.6 * s, 0.75 * s, C3('#4a3424'), 0); for (let c = 0; c < 3; c++) G3.amesh(x + (r() - 0.5) * 2.5 * s, (4.2 + r() * 1.6) * s, z + (r() - 0.5) * 2.5 * s, c ? SPT : SPX, (1.5 + r()) * s, (1.1 + r() * 0.5) * s, (1.5 + r()) * s, C3(greens[c]), 0); this.solid(x - 0.35 * s, x + 0.35 * s, z - 0.35 * s, z + 0.35 * s, 9); }
      else if (q < 0.87) { const s = 0.5 + r() * 0.7; G3.amesh(x, 0.5 * s, z, SPX, 1.1 * s, 0.7 * s, 1.1 * s, C3('#3fa85a'), 0); if (r() < 0.6) G3.amesh(x + 0.4 * s, 0.9 * s, z, SPT, 0.14, 0.14, 0.14, C3(flowers[k % 4]), 0.5); }
      else if (q < 0.92) { for (let c = 0; c < 2; c++) { const mx = x + c * 0.5, mz = z + c * 0.3, s = 1 - c * 0.35; G3.amesh(mx, 0.2 * s, mz, CYX, 0.07 * s, 0.2 * s, 0.07 * s, C3('#f3ead6')); G3.amesh(mx, 0.42 * s, mz, SPT, 0.26 * s, 0.14 * s, 0.26 * s, C3('#e5383b'), 0); } } // mushrooms
      else if (q < 0.96) G3.mesh(M4.rz(M4.ry(M4.t(ID4, x, 0.35, z), r() * 3), HPI), CYX, 0.35, 1.6 + r(), 0.35, C3('#5a4030'), 0); // a fallen log
      else this.rock(x, z, 0.8 + r() * 1.2, C3('#7c8078'), true);
    }
    for (let k = 0; k < 12; k++) this.peak(-WORLD_R - 20 - k * 40 - r() * 10, -WORLD_R - 22 - r() * 12, 22 + r() * 6, 12 + r() * 10, 16, C3('#6a7466'));
  },
  buildSavanna(r) {
    const tan = C3('#c2ab5e'), rk = C3('#b59565'), grey = C3('#77796f'), X0 = BND.x0;
    G3.abox(JUNGLE_X - 140, 0.03, 0, 140, 0.035, WORLD_R, tan, 11);
    for (let k = 0; k < 16; k++) G3.amesh(JUNGLE_X + (r() - 0.5) * 30, 0.066, -WORLD_R + 10 + k * 21.5 + r() * 8, CYL, 6 + r() * 8, 0.012, 5 + r() * 7, r() < 0.5 ? C3('#3f8a4a') : tan, 11);
    G3.amesh(POND.x, 0.07, POND.z, CYL, POND.r + 2.6, 0.012, POND.r + 2.6, C3('#8a7a52'), 11); G3.amesh(POND.x, 0.085, POND.z, CYL, POND.r, 0.012, POND.r, C3('#4a9ad8'), 12);
    for (let k = 0; k < 14; k++) { const a = k * 0.45 + r(), rr = POND.r + 0.6 + r() * 1.4; G3.amesh(POND.x + Math.cos(a) * rr, 0.6, POND.z + Math.sin(a) * rr, CYX, 0.035, 0.6 + r() * 0.4, 0.035, C3('#5a8a3a')); }
    // the west cliffs and the waterfall (there is a secret behind the falling water)
    const fx = X0 + 18, fz = RIVER_Z;
    G3.abox(X0 - 26, 13, 0, 34, 13, WORLD_R + 20, grey, 13); this.solid(X0 - 60, X0 + 8, -WORLD_R - 20, WORLD_R + 20, 26);
    for (const s of [-1, 1]) { G3.abox(X0 + 13, 11, fz + s * 18, 5, 11, 12, mulC(grey, 1.06), 13); this.solid(X0 + 8, X0 + 18, fz + s * 18 - 12, fz + s * 18 + 12, 22); G3.amesh(X0 + 16, 0, fz + s * 31, SPX, 5, 6, 5, mulC(grey, 0.94), 13); }
    G3.abox(X0 + 13, 18, fz, 5, 4, 6, mulC(grey, 1.02), 13); G3.abox(X0 + 8.3, 7, fz, 0.3, 7, 6, C3('#15161a'), 0); // the roof and dark back of the hollow
    G3.abox(fx + 0.1, 11, fz, 0.12, 11, 5.4, C3('#9fd8ff'), 0.55); G3.abox(X0 + 12, 22.2, fz, 6.2, 0.2, 5.4, C3('#6ab8f0'), 12);
    G3.amesh(FALLS.x, 0.08, FALLS.z, CYL, FALLS.r, 0.02, FALLS.r, C3('#3a8ad0'), 12); this.falls = [fx + 0.4, fz];
    for (let k = 0; k < 9; k++) G3.amesh(X0 - 8 - r() * 30, 26 + r() * 4, -WORLD_R + k * 44, CONE, 16, 8 + r() * 12, 18, mulC(grey, 0.9 + r() * 0.2), 13);
    this.pads.push({ id: 'cave3', x: X0 + 12, z: fz, r: 1.7, col: '#ffb347', label: S.stats.in_cave3 ? '🐻 BEAR CAVE' : '❓ ???', lx: X0 + 12, lz: fz, ly: 5 });
    // Lion Rock: climb it for the view (and a star)
    { const x = LROCK.x, z = LROCK.z;
      G3.abox(x, 1.75, z, 9, 1.75, 8, rk, 13); this.solid(x - 9, x + 9, z - 8, z + 8, 3.5); for (const [a, b] of [[-9, -8], [9, -8], [-9, 8], [9, 8]]) G3.amesh(x + a, 0, z + b, SPX, 3.2, 3.6, 3.2, mulC(rk, 0.92), 13);
      G3.abox(x - 2, 5.25, z - 0.5, 5.5, 1.75, 5.5, mulC(rk, 1.06), 13); this.solid(x - 7.5, x + 3.5, z - 6, z + 5, 7);
      G3.amesh(x + 6, 4.2, z, TAPER, 5, 4.2, 3, mulC(rk, 0.95), 13); G3.box(M4.rz(M4.t(ID4, x + 6.5, 8.6, z), 0.1), 7, 0.75, 2.7, mulC(rk, 1.1), 13); this.solid(x + 0.5, x + 13, z - 2.7, z + 2.7, 9.3);
      this.zones.push({ x, z, label: '🦁 LION ROCK', col: '#ffd86b' }); }
    for (let k = 0; k < 120; k++) {
      const x = X0 + 14 + r() * (JUNGLE_X - X0 - 20), z = -WORLD_R + 6 + r() * (WORLD_R * 2 - 12), q = r();
      if (Math.abs(z - RIVER_Z) < 11 || Math.abs(z) < 5.5 || Math.hypot(x - POND.x, z - POND.z) < POND.r + 6 || (Math.abs(x - POND.x) < 5.5 && z > 0 && z < 60) || (Math.abs(x - BRIDGE2_X) < 5.5 && z < 6 && z > -112) || (Math.abs(x - LROCK.x) < 18 && Math.abs(z - LROCK.z) < 14) || Math.hypot(x - FALLS.x, z - FALLS.z) < 22) continue;
      if (q < 0.4) { const s = 0.9 + r() * 0.6, m = M4.rz(M4.t(ID4, x, 0, z), (r() - 0.5) * 0.3); G3.mesh(M4.t(m, 0, 2.3 * s, 0), CYX, 0.22 * s, 2.3 * s, 0.22 * s, C3('#6b5236'), 0); G3.mesh(M4.t(m, 0, 5.0 * s, 0), SPX, 3.6 * s, 0.75 * s, 3.4 * s, C3('#6a8a3a'), 0); G3.mesh(M4.t(m, 1.2 * s, 5.6 * s, 0.6 * s), SPT, 2.2 * s, 0.55 * s, 2.2 * s, C3('#7a9a44'), 0); this.solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 4.4 * s); } // acacia
      else if (q < 0.68) { const s = 0.5 + r() * 0.6; G3.amesh(x, 0.4 * s, z, SPT, 1.0 * s, 0.6 * s, 1.0 * s, C3(r() < 0.5 ? '#a8a04a' : '#8a9a48'), 0); }
      else if (q < 0.85) this.rock(x, z, 0.7 + r() * 1.5, rk, true);
      else { G3.amesh(x, 1.1, z, CONE, 0.9, 1.1, 0.9, C3('#a8794a'), 0); G3.amesh(x + 0.5, 0.6, z + 0.2, CONE, 0.5, 0.6, 0.5, C3('#a8794a'), 0); this.solid(x - 0.5, x + 0.5, z - 0.5, z + 0.5, 1.8); } // termite mound
    }
  },
  buildBorder(r) { // the ruined, burning wasteland north and east: the end of the map. Everything here is solid.
    const burnt = ['#2a2628', '#3a3436', '#221f22', '#4a3f3c'];
    const ruin = (x, z) => {
      const q = r();
      if (q < 0.45) { const w = 4 + r() * 5, hh = 5 + r() * 14, d = w * (0.6 + r() * 0.5); G3.box(M4.rz(M4.rx(M4.ry(M4.t(ID4, x, hh * 0.4, z), (r() - 0.5) * 0.6), (r() - 0.5) * 0.3), (r() - 0.5) * 0.3), w, hh / 2, d, C3(burnt[Math.floor(r() * 4)]), 2 + 5); this.solid(x - w, x + w, z - d, z + d, hh * 0.9); for (let c = 0; c < 4; c++) G3.box(M4.ry(M4.rx(M4.t(ID4, x + (r() - 0.5) * 14, 0.5 + r(), z + (r() - 0.5) * 14), r()), r() * 3), 1 + r() * 2, 0.4 + r() * 0.8, 0.8 + r() * 1.6, C3(burnt[c]), 0); }
      else if (q < 0.65) { G3.amesh(x, 0.06, z, CYL, 5 + r() * 4, 0.04, 5 + r() * 4, C3('#121012'), 0); G3.amesh(x, 0.09, z, CYL, 2 + r() * 2, 0.04, 2 + r() * 2, C3('#ff5a1a'), 0.55); this.fires.push([x, 0.6, z, 1.4]); }
      else if (q < 0.82) { car3(M4.rz(M4.ry(M4.t(ID4, x, 0.5 + r() * 0.6, z), r() * 6), r() < 0.5 ? 2.6 : 0.4), C3('#2c2628'), 0, false, true, ['sedan', 'van', 'pickup'][Math.floor(r() * 3)]); this.fires.push([x, 1.4, z, 0.9]); this.solid(x - 1.6, x + 1.6, z - 1.6, z + 1.6, 1.8); }
      else { const hh = 2.5 + r() * 3; G3.amesh(x, hh, z, CYX, 0.25, hh, 0.25, C3('#2a2628'), 0); G3.box(M4.rz(M4.t(ID4, x, 4.5, z), 0.9), 2.5, 0.12, 0.12, C3('#2a2628')); this.fires.push([x, 5, z, 0.7]); this.solid(x - 0.4, x + 0.4, z - 0.4, z + 0.4, hh * 2); }
    };
    const zc = (BND.z1 + 40 - WORLD_R) / 2;
    G3.abox(0, 0.03, -WORLD_R - 62, WORLD_R + 130, 0.035, 60, C3('#2a2628'), 9); G3.abox(WORLD_R + 62, 0.07, zc, 60, 0.035, zc + WORLD_R, C3('#2a2628'), 9);
    for (let x = -WORLD_R + 8; x < WORLD_R + 110; x += 13) for (let row = 0; row < 4; row++) ruin(x + (r() - 0.5) * 8, -WORLD_R - 12 - row * 22 - r() * 10);
    for (let z = -WORLD_R; z < BND.z1 + 30; z += 14) for (let row = 0; row < 4; row++) ruin(WORLD_R + 12 + row * 22 + r() * 10, z + (r() - 0.5) * 8);
    for (let x = -WORLD_R; x <= WORLD_R; x += 7) G3.abox(x, 0.6, -WORLD_R - 2.2, 2.6, 0.45, 0.35, C3(Math.round(x / 7) % 2 ? '#ffd23f' : '#23262e'));
    for (let z = -WORLD_R; z <= BND.z1; z += 7) G3.abox(WORLD_R + 2.2, 0.6, z, 0.35, 0.45, 2.6, C3(Math.round(z / 7) % 2 ? '#ffd23f' : '#23262e'));
  },
  palm(x, z, r) {
    const hh = 5 + r() * 3, lean = (r() - 0.5) * 0.3, m = M4.rz(M4.t(ID4, x, 0, z), lean); G3.mesh(M4.t(m, 0, hh / 2, 0), CYX, 0.16, hh / 2, 0.16, C3('#8a6a4a'), 0);
    for (let i = 0; i < 6; i++) G3.mesh(M4.rx(M4.ry(M4.t(m, 0, hh, 0), i * 1.047 + r()), 1.15), SPT, 0.35, 0.12, 1.9, C3(i % 2 ? '#3fa85a' : '#2f8a4a'), 0);
    G3.mesh(M4.t(m, 0.2, hh - 0.25, 0.1), SPT, 0.17, 0.17, 0.17, C3('#6b4a2b'), 0);
    this.solid(x - 0.3, x + 0.3, z - 0.3, z + 0.3, hh);
  },
  placeStars() { // 30 golden stars: easy ones, high ones, wet ones and secret ones (two more are inside caves)
    const R = this.roofs, P = [[0, 1.3, -20]], ax = cellX(ARENAS[3].i);
    for (const n of [4, 31, 58, 85, 112, 139]) { const q = R[Math.min(n, R.length - 1)]; P.push([q[0] + q[3] * 0.5, q[2] + 1.3, q[1] + q[4] * 0.5]); }
    P.push([-347.3, 10.9, 72.7], [PIER_X, 1.6, PIER_Z1 - 1.5], [ISLE.x - 24, 1.3, ISLE.z + 22], [LHOUSE.x + 2.1, 22.3, LHOUSE.z], [119.6, 23.3, 112], [cellX(ARENAS[4].i) + 45, 111.3, cellX(ARENAS[4].j) - 40], [cellX(RUMBLE_AT.i), 1.3, cellX(RUMBLE_AT.j)],
      [LROCK.x + 11.5, 10.6, LROCK.z], [FALLS.x, 1.0, FALLS.z], [POND.x, 1.2, POND.z], [90, 1.0, 480], [37, 1.0, 322], [104, 11.3, 156], [-405, 1.3, -150], [BRIDGE2_X, 1.6, RIVER_Z], [ax - 39, 34.3, cellX(ARENAS[3].j) - 24],
      [cellX(16) + 4.6, 8.3, cellX(10) + 4.6], [BND.x0 + 40, 1.3, WORLD_R + 11], [0, 70, 0], [ISLE.x, 55, ISLE.z], [BND.x0 + 30, 1.3, 150]);
    this.stars = P.map((p, id) => ({ id, x: p[0], y: p[1], z: p[2] }));
  },
  getStar(id, x, y, z) {
    if (S.stars[id]) return; S.stars[id] = 1; const n = Object.keys(S.stars).length;
    S.coins += 40; this.coinPulse = 1; Snd.play('levelup'); this.fx.spark(x, y, z, 30, '#ffd23f', 9); this.fx.ring(x, z, '#ffd23f', 3, y); this.text(x, y + 1, z, `⭐ ${n} / ${STAR_N}`, '#ffe14d', 34); this.gainXp(25);
    if (n === STAR_N) { S.coins += 1000; this.setBanner('⭐ ALL 30 GOLDEN STARS! ⭐', 'You found every single one. +1000 coins!', '#ffe14d', 4); say('Amazing! You found all thirty golden stars!'); }
    else if (n === 1) this.say('A golden star! 30 of them are hidden all over the world: on roofs, on islands, in caves and high in the sky.', 7);
    UI.badgeToasts(checkBadges()); Save.save();
  },

  /* ---------------- living things ---------------- */
  initLife() {
    const r = rng(321), h = this.h; this.animals = []; this.fish = [];
    const J = (kind, n, zn, o) => { for (let k = 0; k < n; k++) { const x = zn[0] + r() * (zn[1] - zn[0]), z = zn[2] + r() * (zn[3] - zn[2]); if (Math.abs(z - RIVER_Z) < 14 || this.blocked(x, z, 2)) continue; const Q = ANIMALS[kind]; this.animals.push(Object.assign({ kind, x, z, y: 0, hx: x, hz: z, rad: 44, tx: x, tz: z, yaw: r() * TAU, wait: r() * 4, moving: false, ph: r() * 9, sp: 1.6, r: Q ? Q.r : 1 }, o)); } };
    const JG = [JUNGLE_X + 12, -WORLD_R - 14, -150, 150], SV = [BND.x0 + 30, JUNGLE_X - 14, -150, 150];
    J('elephant', 3, JG, { sp: 1.3 }); J('tiger', 4, JG, { sp: 2.4 }); J('deer', 6, JG, { sp: 3 }); J('monkey', 6, JG, { sp: 2.2, r: 0.7 }); J('panda', 3, JG, { sp: 1.1, rad: 20 }); J('gorilla', 3, JG, { sp: 1.5, rad: 24 });
    J('lion', 4, SV, { sp: 2.2, rad: 36 }); J('zebra', 7, SV, { sp: 3 }); J('giraffe', 4, SV, { sp: 1.6 }); J('rhino', 3, SV, { sp: 1.4 }); J('elephant', 2, SV, { sp: 1.3 });
    for (let k = 0; k < 6; k++) { const a = k * 1.05, x = POND.x + Math.cos(a) * (POND.r - 2.5), z = POND.z + Math.sin(a) * (POND.r - 2.5); this.animals.push({ kind: 'flamingo', x, z, y: 0, hx: x, hz: z, rad: 2.5, tx: x, tz: z, yaw: a, wait: r() * 6, moving: false, ph: r() * 9, sp: 0.6, r: 0.6 }); }
    for (let k = 0; k < 4; k++) { const x = -220 - k * 95; this.animals.push({ kind: 'croc', x, z: RIVER_Z + 9, y: 0, hx: x, hz: RIVER_Z + 10, rad: 9, tx: x, tz: RIVER_Z + 9, yaw: 1.6, wait: 2, moving: false, ph: k, sp: 0.8, r: 1.6 }); }
    const pc = ['#e5383b', '#2f7df6', '#2fbf71', '#ffd23f', '#ff8c1a', '#b388ff'];
    for (let k = 0; k < 6; k++) this.animals.push({ kind: 'parrot', fly: true, cx: -230 - r() * 170, cz: -120 + r() * 240, a: r() * TAU, rr: 8 + r() * 10, x: 0, z: 0, y: 8 + r() * 5, yaw: 0, moving: true, ph: r() * 9, r: 1, col: pc[k] });
    for (let k = 0; k < 5; k++) this.animals.push({ kind: 'parrot', fly: true, cx: k < 3 ? PIER_X + (k - 1) * 30 : ISLE.x, cz: k < 3 ? SHORE + 20 + k * 9 : ISLE.z, a: r() * TAU, rr: 12 + r() * 14, x: 0, z: 0, y: 9 + r() * 6, yaw: 0, moving: true, ph: r() * 9, r: 1, col: '#f4f8ff', gull: 1 }); // seagulls
    const cols = ['#ff8c1a', '#ffd23f', '#39d0ff', '#ff6b9d', '#b388ff', '#5fd68a'];
    for (let k = 0; k < 28; k++) this.fish.push({ cx: BND.x0 + 30 + r() * (WORLD_R - BND.x0 - 50), cz: SHORE + 18 + r() * 250, rr: 3 + r() * 6, a: r() * TAU, sp: 0.6 + r(), col: cols[k % 6], s: 1 + r() * 0.8, ph: r() * 9, jump: 0, x: 0, y: -0.05, z: 0, yaw: 0, pitch: 0 });
    for (let k = 0; k < 4; k++) this.fish.push({ big: true, cx: -420 + k * 150, cz: SHORE + 70 + r() * 120, rr: 16 + r() * 8, a: r() * TAU, sp: 0.5, col: '#7a8aa0', ph: r() * 9, jump: 0, x: 0, y: -0.2, z: 0, yaw: 0, pitch: 0 });
    this.pet3 = { x: h.x + 1, z: h.z, y: 0, yaw: 0, moving: false, ph: 0, kind: S.pet };
    const B = (x, z, yaw) => ({ type: 'boat', x, y: 0, z, yaw, hx: x, hz: z, hyaw: yaw, speed: 0, away: 0, lean: 0 });
    this.boats = [B(PIER_X + 4.4, PIER_Z1 - 8, 0), B(ISLE.x + 4.4, ISLE.z - ISLE.r - 7, Math.PI)];
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
    for (let k = 0; k < 6 + this.L * 2; k++) { const n = pick(nodes), c = { ai: true, type: 'car', kind: pick(['sedan', 'sedan', 'taxi', 'van', 'pickup', 'sports']), col: C3(pick(cols)), pi: n[0], pj: n[1], ni: n[0], nj: n[1], x: cellX(n[0]), y: 0, z: cellX(n[1]), yaw: 0, speed: 0, spin: 0, honk: 0 }; this.nextNode(c); const dx = c.ni - c.pi, dz = c.nj - c.pj, l = Math.hypot(dx, dz) || 1; c.x += -dz / l * 2.5 + dx / l * rand(4, 30); c.z += dx / l * 2.5 + dz / l * rand(4, 30); c.yaw = Math.atan2(dx, dz); if (k % 2 === 0) c.kind = c.kind === 'sports' ? 'sedan' : c.kind; this.traffic.push(c); }
  },
  carBump(o, r, skip) { // push o away from cars; returns true when something was hit
    let hit = false; for (const list of [this.traffic, this.cars, this.vehs]) for (const c of list) { if (c === skip || c.type !== 'car' || c.away > 0) continue; const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), min = r + 1.5; if (d < min && d > 0.01 && (o.y || 0) < 1.6) { o.x = c.x + dx / d * min; o.z = c.z + dz / d * min; hit = true; } } return hit;
  },
  animalTop(a) { const Q = ANIMALS[a.kind]; return Q ? Q.top : a.kind === 'flamingo' ? 2.7 : 1.7; },
  petAnimal(a) {
    const h = this.h, n = ANIMAL_NAMES[a.kind]; a.wait = 3; a.moving = false; a.yaw = Math.atan2(h.x - a.x, h.z - a.z); Snd.play('heart'); this.text(a.x, this.animalTop(a), a.z, '❤', '#ff6b8a', 40);
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
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz) || 1; a.walk -= dt;
      if (d < 0.8 || a.walk <= 0 || this.inWater(a.x + dx / d * 2, a.z + dz / d * 2)) { a.wait = rand(1.5, 5); continue; }
      const ox = a.x, oz = a.z; a.yaw = lerpA(a.yaw, Math.atan2(dx, dz), Math.min(1, dt * 4)); a.x += Math.sin(a.yaw) * a.sp * dt; a.z += Math.cos(a.yaw) * a.sp * dt; a.moving = true; if (this.collide(a, a.r * 0.6)) { a.walk -= dt * 3; if (Math.hypot(a.x - ox, a.z - oz) < a.sp * dt * 0.3) a.wait = rand(0.5, 2); }
      a.x = clamp(a.x, BND.x0 + 22, -WORLD_R - 4);
    }
    const boat = h.veh && h.veh.type === 'boat';
    for (const f of this.fish) {
      if (Math.abs(f.cx - h.x) > 190 || h.z < 60) continue;
      f.a += dt * f.sp * (f.big ? 4 : 2.2) / f.rr; f.x = f.cx + Math.cos(f.a) * f.rr; f.z = Math.max(SHORE + 12, f.cz + Math.sin(f.a) * f.rr); f.yaw = Math.atan2(-Math.sin(f.a), Math.cos(f.a));
      if (f.jump > 0) { f.jump -= dt / (f.big ? 1.3 : 0.8); const p = 1 - Math.max(0, f.jump); f.y = Math.sin(p * Math.PI) * (f.big ? 2.6 : 1.1) - 0.1; f.pitch = -Math.cos(p * Math.PI) * 0.9; if (f.jump <= 0 && Math.hypot(f.x - h.x, f.z - h.z) < 60) this.fx.spark(f.x, 0.2, f.z, 6, '#dff4ff', 4); }
      else { f.y = f.big ? -0.22 : -0.04; f.pitch = 0; if (Math.random() < dt * (f.big ? 0.22 : 0.07)) f.jump = 1; }
      if (!f.big && (h.swim || boat) && Math.hypot(f.x - h.x, f.z - h.z) < (boat ? 2.8 : 1.5)) { S.fish++; Snd.play('coin'); this.text(h.x, 1.6, h.z, '+1 🐟  (' + S.fish + ')', '#7df9ff', 26); f.cx = clamp(h.x + rand(-60, 60), BND.x0 + 20, WORLD_R - 20); f.cz = SHORE + 20 + rand(0, 240); f.a = rand(TAU); UI.badgeToasts(checkBadges()); }
    }
    for (const c of this.traffic) { // citizens driving around; they stop at red lights
      if (Math.abs(c.x - h.x) > 190 || Math.abs(c.z - h.z) > 190) { continue; }
      const dx = c.ni - c.pi, dz = c.nj - c.pj, l = Math.hypot(dx, dz) || 1, tx = cellX(c.ni) - dz / l * 2.5, tz = cellX(c.nj) + dx / l * 2.5, gx = tx - c.x, gz = tz - c.z, gd = Math.hypot(gx, gz);
      if (gd < 4.5) { this.nextNode(c); continue; }
      c.yaw = lerpA(c.yaw, Math.atan2(gx, gz), Math.min(1, dt * 3.2)); const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
      let stop = gd > 10 && gd < 15 && this.tlSet && this.tlSet.has(c.ni + ',' + c.nj) && lightPhase(c.ni, c.nj, t) !== (dx ? 0 : 1); const ahead = (x, z, y) => { const ax = x - c.x, az = z - c.z, al = ax * fx + az * fz; return al > 0 && al < 9 && Math.abs(ax * fz - az * fx) < 2.4 && (y || 0) < 3; };
      if (ahead(h.x, h.z, h.y)) { stop = true; c.honk -= dt; if (c.honk <= 0) { c.honk = 2.5; Snd.play('warn'); } }
      for (const o of this.traffic) if (o !== c && ahead(o.x, o.z, 0)) stop = true; for (const e of this.en) if (ahead(e.x, e.z, e.y)) stop = true;
      c.speed = lerp(c.speed, stop ? 0 : 9.5, Math.min(1, dt * (stop ? 6 : 1.5))); c.x += fx * c.speed * dt; c.z += fz * c.speed * dt; c.spin += c.speed * dt * 2.8;
    }
    for (const f of this.fires) if (Math.abs(f[0] - h.x) < 90 && Math.abs(f[2] - h.z) < 90 && Math.random() < dt * 5) this.fx.smoke(f[0] + rand(-0.6, 0.6), f[1] + 1.4, f[2] + rand(-0.6, 0.6), 1, '#2a2628');
    if (this.falls && Math.abs(this.falls[0] - h.x) < 110 && Math.abs(this.falls[1] - h.z) < 110 && Math.random() < dt * 14) this.fx.add({ k: 1, x: this.falls[0] + rand(0, 3), y: 0.4, z: this.falls[1] + rand(-5, 5), vx: rand(0.5, 2.5), vy: rand(1.5, 4), vz: rand(-1, 1), life: 0.8, max: 0.8, c: C3('#e8f6ff'), s: rand(0.2, 0.4), g: 3 });
    const sr = h.veh && (h.veh.type === 'heli' || h.veh.type === 'jet') ? 9 : 2.6; for (const s of this.stars) if (!S.stars[s.id] && Math.abs(s.x - h.x) < sr && Math.abs(s.z - h.z) < sr && Math.abs(s.y - h.y - 1.1) < sr) this.getStar(s.id, s.x, s.y, s.z);
    for (const b of this.boats) if (h.veh !== b && (b.x !== b.hx || b.z !== b.hz) && Math.hypot(b.x - h.x, b.z - h.z) > 220) { b.x = b.hx; b.z = b.hz; b.yaw = b.hyaw; } // a boat left far behind drifts back to its pier
    // the pet walks with the hero
    const p = this.pet3; p.kind = S.pet;
    if (S.pet && !h.veh) { const gx = h.x - Math.cos(h.yaw) * 1.3 - Math.sin(h.yaw) * 0.8, gz = h.z + Math.sin(h.yaw) * 1.3 - Math.cos(h.yaw) * 0.8, dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz); p.moving = d > 0.5; if (d > 26) { p.x = gx; p.z = gz; } else if (p.moving) { p.yaw = lerpA(p.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10)); const v = Math.min(12, d * 3 + 1); p.x += Math.sin(p.yaw) * v * dt; p.z += Math.cos(p.yaw) * v * dt; } p.y = S.pet === 'parrot' ? Math.max(h.y, 0) + 1.9 + Math.sin(t * 3) * 0.15 : Math.max(this.floorAt(p.x, p.z, h.y + 0.5), -Math.min(0.35, this.waterDepth(p.x, p.z))); p.fast = 1; }
  },
  drawLife(t) {
    const h = this.h, near = (x, z, r) => Math.abs(x - h.x) < r && Math.abs(z - h.z) < r, night = this.night || 0;
    for (const a of this.animals) if (near(a.x, a.z, 115)) { G3.shadow(a.x, 0.09, a.z, a.r * (a.fly ? 0.5 : 1.3), a.fly ? 0.2 : 0.4); animal3(a, t); }
    if (h.z > 40) for (const f of this.fish) if (near(f.x, f.z, 150)) fish3(f, t);
    const car = (c, mine) => { const x = mine ? h.x : c.x, z = mine ? h.z : c.z; if (!near(x, z, 150)) return; G3.shadow(x, 0.05, z, 2.6, 0.5); car3(M4.ry(M4.t(ID4, x, 0, z), mine ? h.yaw : c.yaw), c.col, c.spin, mine || c.ai, !mine && !near(x, z, 45), c.kind); if (night > 0.3 && (mine || c.ai)) { const yw = mine ? h.yaw : c.yaw; G3.agmesh(x + Math.sin(yw) * 4.5, 0.5, z + Math.cos(yw) * 4.5, SPT, 2.6, 0.5, 2.6, C3('#fff3c0'), 0.16 * night); } };
    for (const c of this.traffic) car(c, false); for (const c of this.cars) car(c, h.veh === c);
    for (const f of this.fires) if (near(f[0], f[2], 170)) { const s = f[3], fl = 1 + Math.sin(t * 13 + f[0]) * 0.25; G3.agmesh(f[0], f[1] + s * fl, f[2], CONE, s * 0.7, s * 1.3 * fl, s * 0.7, C3('#ff7b1a'), 1.1); G3.agmesh(f[0], f[1] + s * 0.6, f[2], CONE, s * 0.4, s * 0.8 * fl, s * 0.4, C3('#ffe14d'), 1.2); G3.agmesh(f[0], f[1] + 0.3, f[2], SPT, s * 2.2, s * 1.2, s * 2.2, C3('#ff5a1a'), 0.22); }
    if (S.pet && !h.veh) { G3.shadow(this.pet3.x, Math.max(0.05, this.pet3.y + 0.05), this.pet3.z, 0.4, 0.35); animal3(this.pet3, t); }
    if (h.climb && h.rope && !h.veh) { const R = h.rope, len = Math.max(0.2, R.top - h.y - 1.2); G3.amesh(R.x, h.y + 1.2 + len / 2, R.z, CYX, 0.025, len / 2, 0.025, C3('#d9c08a'), 0); G3.amesh(R.x, R.top + 0.1, R.z, SPT, 0.2, 0.12, 0.2, C3('#9aa4b8'), -0.8); G3.amesh(R.x, h.y + 1.15, R.z, SPT, 0.07, 0.07, 0.07, C3('#ff8c1a'), -0.6); }
    if (!h.veh && (h.swim || (h.wade && Math.abs(h.mv) > 0.1)) && Math.random() < (h.swim ? 0.3 : 0.2)) this.fx.add({ k: 0, x: h.x + rand(-0.5, 0.5), y: 0.12, z: h.z + rand(-0.5, 0.5), vx: rand(-1, 1), vy: rand(1, 3), vz: rand(-1, 1), life: 0.3, max: 0.3, c: C3('#dff4ff'), s: 0.05, g: 9 });
    if (!h.veh && (h.swim || h.wade)) for (let k = 0; k < 16; k++) { const a = k * TAU / 16, p = t * 0.9 % 1, rr = 0.6 + p * 0.9; G3.glow(M4.ry(M4.t(ID4, h.x + Math.cos(a) * rr, 0.11, h.z + Math.sin(a) * rr), -a), 0.03, 0.008, rr * 0.2, WHITE, 0.5 * (1 - p)); } // ripples around him
    // golden stars
    const gold = C3('#ffd23f'); for (const s of this.stars) if (!S.stars[s.id] && near(s.x, s.z, 170)) { star3(s.x, s.y, s.z, t); G3.agmesh(s.x, s.y + 7, s.z, CYX, 0.14, 7, 0.14, gold, 0.16); }
    // boats
    const col = C3(SUITS[S.suit][0]);
    for (const b of this.boats) {
      const mine = h.veh === b, x = mine ? h.x : b.x, z = mine ? h.z : b.z, yaw = mine ? h.yaw : b.yaw; if (!near(x, z, 240)) continue; const sp = mine ? b.speed : 0, bob = Math.sin(t * 2 + x * 0.3) * 0.05;
      boat3(M4.rz(M4.rx(M4.ry(M4.t(ID4, x, bob + Math.abs(sp) * 0.006, z), yaw), -clamp(sp / 24, -0.3, 1) * 0.13), b.lean || 0), col, t, Math.abs(sp) > 4);
      if (mine) { hero3({ x: x + Math.sin(yaw) * 0.1, y: 0.67 + bob, z: z + Math.cos(yaw) * 0.1, yaw, t, pose: 'drive', pt: 0, armor: S.armor, suit: S.suit, melee: 'fist', ranged: S.wp.r }); if (Math.abs(sp) > 5) for (const s of [-1, 1]) this.fx.add({ k: 0, x: x - Math.sin(yaw) * 3 + Math.cos(yaw) * s * 0.9, y: 0.15, z: z - Math.cos(yaw) * 3 - Math.sin(yaw) * s * 0.9, vx: Math.cos(yaw) * s * 3 + rand(-1, 1), vy: rand(2, 4.5), vz: -Math.sin(yaw) * s * 3 + rand(-1, 1), life: 0.45, max: 0.45, c: WHITE, s: 0.09, g: 10 }); }
    }
    if (this.tlights) this.drawLights(t, h);
    if (this.falls && near(this.falls[0], this.falls[1], 200)) for (let k = 0; k < 14; k++) { const y = 22 - ((t * 9 + k * 5.3) % 22); G3.abox(this.falls[0] + 0.05, y, this.falls[1] - 5 + (k * 3.7 % 10), 0.06, 1.1, 0.16, WHITE, 0.75); } // falling water
    if (near(LHOUSE.x, LHOUSE.z, 420)) { const a = t * 0.8, bx = Math.sin(a), bz = Math.cos(a); G3.gmesh(M4.rx(M4.ry(M4.t(ID4, LHOUSE.x + bx * 16, 22.3, LHOUSE.z + bz * 16), a), HPI), CONE, 3.2, 16, 1.8, C3('#fff3b0'), 0.1 + night * 0.3); G3.agmesh(LHOUSE.x, 22.3, LHOUSE.z, SPX, 2.4, 2.4, 2.4, C3('#fff3b0'), 0.3 + night * 0.5); }
    if (night > 0.4 && h.x < -WORLD_R + 10) for (let k = 0; k < 16; k++) { const px = Math.floor(h.x / 30) * 30 + (k * 37 % 60) - 15 + Math.sin(t * 0.7 + k) * 2, pz = Math.floor(h.z / 30) * 30 + (k * 53 % 60) - 15 + Math.cos(t * 0.6 + k * 2) * 2; G3.aglow(px, 1 + (k % 4) * 0.5 + Math.sin(t * 1.3 + k) * 0.4, pz, 0.05, 0.05, 0.05, C3('#d8ff6a'), (0.6 + Math.sin(t * 3 + k * 1.7) * 0.6) * night); } // fireflies
  },
  hudLife(g) {
    const h = this.h, a = this.nearAnimal;
    for (const z of this.zones) { const d = Math.hypot(z.x - h.x, z.z - h.z); if (d > 520 || d < 34) continue; const s = this.toScreen(z.x, 14, z.z); if (s) this.pill(g, s[0], s[1], z.label + ' • ' + Math.round(d) + ' m', z.col, clamp(60 / s[2], 0.6, 1)); }
    if (a) { const s = this.toScreen(a.x, this.animalTop(a) + 0.4, a.z); if (s) this.pill(g, s[0], s[1], `${UI.isTouch ? 'Tap F' : 'Press F'} to pet the ${ANIMAL_NAMES[a.kind].toLowerCase()}${S.friends[a.kind] ? ' ❤' : ''}`, '#ffe14d', 1); }
    const v = this.nearVeh; if (v && !h.veh && this.cars.includes(v)) { const s = this.toScreen(v.x, 2.6, v.z); if (s) this.pill(g, s[0], s[1], `🚗 ${UI.isTouch ? 'Tap F' : 'Press F'} to drive the ${CAR_KINDS[v.kind].name.toLowerCase()}`, '#ffe14d', 1.05); }
    const chip = (x, w, txt, col) => { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, x, 18, w, 38, 19); g.fill(); g.fillStyle = col; g.font = `bold 20px ${FONT}`; g.textAlign = 'center'; g.fillText(txt, x + w / 2, 38); };
    const ns = Object.keys(S.stars).length; let cx = W - 222;
    if (ns > 0) { cx -= 104; chip(cx, 98, `⭐ ${ns}/${STAR_N}`, '#ffe14d'); }
    if (S.fish > 0) { cx -= 88; chip(cx, 82, '🐟 ' + S.fish, '#7df9ff'); }
    if (h.swim || (h.wade && !h.veh)) { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W / 2 - 190, 622, 380, 38, 14); g.fill(); g.fillStyle = '#7df9ff'; g.font = `bold 18px ${FONT}`; g.textAlign = 'center'; g.fillText(h.swim ? '🏊 Swimming - bump into fish to catch them' : '🌊 Wading - the water gets deeper further out', W / 2, 642); }
  }
});
