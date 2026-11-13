'use strict';
/* ============================================================
   FIGHTER CRAFT - the city blocks and streets.
   Buildings come in four looks (apartments, glass towers, brick,
   offices) with shop fronts, doors, awnings, balconies, ledges,
   roof rims, stair huts, air units, tanks, masts and billboards.
   Streets get sidewalks, crosswalks, traffic lights, benches,
   bus stops, hydrants and planters.
   Extends the World class.
   ============================================================ */
const STYLE_OF = [[2, 2, 0, 3], [1, 3, 3, 0], [1, 1, 3, 1], [2, 0, 2, 3], [3, 1, 3, 0], [0, 3, 1, 0]]; // the facade looks each district likes
const lightPhase = (i, j, t) => Math.floor((t + i * 2.3 + j * 3.7) / 8) % 2; // 0 = east-west traffic may go, 1 = north-south

Object.assign(World.prototype, {
  buildBlocks(L, A, gold, pave) {
    const E = CS / 2, steel = C3('#8a93a6'), dark = C3('#23262e'), glass = C3('#16202e'), roofC = C3(L >= 3 ? '#5a5f6a' : '#3c3f48');
    const accents = ['#ff6b6b', '#ffd23f', '#5fd68a', '#4da6ff', '#ff8c1a', '#b388ff'];
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
      if (this.isOpen(i, j)) continue;
      const shop = SHOPS.find(q => q.i === i && q.j === j); if (shop) { this.buildShop(shop); continue; }
      const d = this.districtOf(i, j), ruin = d === 5 ? L === 0 : !A[d], r = rng(i * 131 + j * 977 + 5), pal = DPAL[d], hr = DH[d];
      let h = hr[0] + r() * (hr[1] - hr[0]); const low = r() < 0.2; if (low) h = 5 + r() * 4;
      let col = C3(pal[Math.floor(r() * 4)]), st = low ? (r() < 0.5 ? 2 : 0) : STYLE_OF[d][Math.floor(r() * 4)]; if (h > 36 && st === 2) st = 3;
      if (ruin) { col = mulC(mixC(col, [0.38, 0.36, 0.4], 0.6), 0.85); h *= 0.55 + r() * 0.3; st = st === 1 ? 3 : st; }
      else { h = Math.max(2, Math.round(h / 3.2)) * 3.2 + 0.45; if (gold && d === 5) col = mixC(col, C3('#e8d59a'), 0.35); if (st === 1) col = mixC(col, C3('#6f8fb0'), 0.5); else if (st === 2) col = mixC(col, C3('#a8593c'), 0.4); else if (st === 3) col = mixC(col, C3('#d4d9e2'), 0.3); }
      const half = E - 1 - r() * 0.8, x = cellX(i), z = cellX(j), oW = this.isOpen(i - 1, j), oE = this.isOpen(i + 1, j), oN = this.isOpen(i, j - 1), oS = this.isOpen(i, j + 1);
      const x0 = x - (oW ? half : E), x1 = x + (oE ? half : E), z0 = z - (oN ? half : E), z1 = z + (oS ? half : E), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2, mat = 2 + d + 0.1 * st, trim = mulC(col, 0.72), ac = C3(accents[Math.floor(r() * 6)]);
      G3.abox(x, 0.1, z, E - 0.25, 0.1, E - 0.25, pave, 10);
      G3.abox(mx, h / 2, mz, hx, h / 2, hz, col, mat);
      this.solids.push({ x0, x1, z0, z1, top: h }); this.cellSolid[i + j * GN] = this.solids.length; let top = h;
      const sides = [[oW, -1, 0], [oE, 1, 0], [oN, 0, -1], [oS, 0, 1]].filter(s => s[0]);
      // a face-relative box: u runs along the wall, o sticks out of it
      const face = (s, u, y, o, hu, hy, ho, c, e) => s[1] ? G3.abox(mx + s[1] * (hx + o), y, mz + u, ho, hy, hu, c, e || 0) : G3.abox(mx + u, y, mz + s[2] * (hz + o), hu, hy, ho, c, e || 0);
      if (ruin) { // a broken shell: jagged walls on top, rubble at the foot (all of it is solid, also for aircraft)
        const n = 2 + Math.floor(r() * 3);
        for (let q = 0; q < n; q++) { const bh = 1.5 + r() * 6, bs = half * (0.22 + r() * 0.3), cx = mx + (r() - 0.5) * hx * 1.3, cz = mz + (r() - 0.5) * hz * 1.3; G3.box(M4.ry(M4.t(ID4, cx, h + bh / 2, cz), (r() - 0.5) * 0.5), bs, bh / 2, bs * 0.7, col, mat); this.solid(cx - bs, cx + bs, cz - bs * 0.7, cz + bs * 0.7, h + bh); top = Math.max(top, h + bh); }
        for (const s of sides) for (let q = 0; q < 2; q++) { const u = (r() - 0.5) * (s[1] ? hz : hx) * 1.5; G3.box(M4.rx(M4.ry(M4.t(ID4, s[1] ? mx + s[1] * (hx + 0.7) : mx + u, 0.5, s[1] ? mz + u : mz + s[2] * (hz + 0.7)), r() * 3), r() * 0.6), 0.5 + r() * 0.8, 0.25 + r() * 0.4, 0.4 + r() * 0.6, mulC(col, 0.8), 0); }
        this.roofs.push([mx, mz, h, hx, hz]);
        if (d === 1 && r() < 0.7) G3.abox(x + (r() < 0.5 ? 1 : -1) * (half + 0.16), 6 + r() * 6, z + (r() - 0.5) * 5, 0.12, 1.2 + r() * 2, 2.2, C3(r() < 0.5 ? '#ff3df2' : '#3df2ff'), 0.12);
        continue;
      }
      // ---- street level: base course, shop band, doors, awnings, signs ----
      G3.abox(mx, 0.3, mz, hx + 0.09, 0.3, hz + 0.09, mulC(col, 0.5));
      G3.abox(mx, 3.82, mz, hx + 0.16, 0.14, hz + 0.16, trim);
      sides.forEach((s, k) => {
        const len = s[1] ? hz : hx, u = (r() - 0.5) * len * 0.9;
        if (k === 0 || r() < 0.5) { face(s, u, 1.3, 0.05, 0.95, 1.3, 0.06, glass, -0.95); face(s, u, 2.72, 0.09, 1.15, 0.12, 0.1, trim); for (const q of [-1, 1]) face(s, u + q * 1.05, 1.36, 0.09, 0.1, 1.36, 0.1, trim); face(s, u, 0.08, 0.5, 1.2, 0.08, 0.45, C3('#8c93a2')); }
        if (st !== 1 && r() < 0.6) face(s, u, 3.35, 0.75, Math.min(len * 0.8, 1.6 + r() * 2.5), 0.06, 0.75, ac, -0.2);
        if (r() < 0.45) face(s, (r() - 0.5) * len, 4.55, 0.1, 1.3 + r(), 0.36, 0.07, ac, 0.75);
      });
      // ---- the walls: corner piers, floor ledges, balconies ----
      if (st !== 1) for (const cx of [-1, 1]) for (const cz of [-1, 1]) if ((cx < 0 ? oW : oE) || (cz < 0 ? oN : oS)) G3.abox(mx + cx * hx, h / 2, mz + cz * hz, 0.3, h / 2, 0.3, mulC(col, 0.84));
      if (st === 0 || st === 2) for (let y = 3.2 * 4 + 0.1; y < h - 3; y += 3.2 * 3) G3.abox(mx, y, mz, hx + 0.1, 0.08, hz + 0.1, trim);
      if (st === 1 && h > 24) G3.abox(mx, Math.round(h * 0.55 / 3.2) * 3.2 + 0.1, mz, hx + 0.07, 0.5, hz + 0.07, glass, -0.9);
      if (st === 0 && sides.length && !low) { const s = sides[Math.floor(r() * sides.length)], len = s[1] ? hz : hx, n = Math.min(8, Math.floor((h - 4) / 3.2)); for (const q of [-1, 1]) for (let f = 1; f <= n; f++) face(s, q * len * 0.42, 0.75 + f * 3.2, 0.42, 1.0, 0.5, 0.42, mulC(col, 0.9)); }
      if (d === 1 && r() < 0.7) G3.abox(x + (r() < 0.5 ? 1 : -1) * (half + 0.16), 6 + r() * 6, z + (r() - 0.5) * 5, 0.12, 1.2 + r() * 2, 2.2, C3(r() < 0.5 ? '#ff3df2' : '#3df2ff'), 1);
      // ---- the roof: rim, deck, then things that stand on it ----
      G3.abox(mx, h - 0.16, mz, hx + 0.24, 0.16, hz + 0.24, trim); G3.abox(mx, h + 0.03, mz, hx - 0.25, 0.03, hz - 0.25, roofC, 9);
      G3.abox(mx, h + 0.26, z0 + 0.1, hx + 0.1, 0.26, 0.1, trim); G3.abox(mx, h + 0.26, z1 - 0.1, hx + 0.1, 0.26, 0.1, trim); G3.abox(x0 + 0.1, h + 0.26, mz, 0.1, 0.26, hz, trim); G3.abox(x1 - 0.1, h + 0.26, mz, 0.1, 0.26, hz, trim);
      if (!low && r() < 0.42) { // a set-back upper part, and sometimes a crown
        const th = Math.max(2, Math.round((4 + r() * h * 0.3) / 3.2)) * 3.2, ts = 0.55 + r() * 0.2, tx = hx * ts, tz = hz * ts;
        G3.abox(mx, h + th / 2, mz, tx, th / 2, tz, mixC(col, WHITE, 0.08), mat); this.solid(mx - tx, mx + tx, mz - tz, mz + tz, h + th); G3.abox(mx, h + th - 0.14, mz, tx + 0.18, 0.14, tz + 0.18, trim); top = h + th;
        if (st === 1 || gold) { if (r() < 0.6) { G3.amesh(mx, top + 0.6, mz, TAPER, tx * 0.5, 0.6, tz * 0.5, steel, -0.7); G3.amesh(mx, top + 4.2, mz, CYX, 0.12, 3, 0.12, steel, -0.7); G3.amesh(mx, top + 7.3, mz, SPT, 0.2, 0.2, 0.2, C3('#ff4433'), 1); } if (gold && r() < 0.6) G3.amesh(mx + tx * 0.5, top + 2.5, mz - tz * 0.5, CONE, 0.9, 2.5, 0.9, C3('#ffd86b'), -0.9); }
        else if (r() < 0.5) G3.abox(mx, top + 0.6, mz, 1.2, 0.6, 1.0, C3('#9aa0ac'), -0.4);
      } else {
        const px = () => mx + (r() - 0.5) * hx * 1.2, pz = () => mz + (r() - 0.5) * hz * 1.2;
        { const bx = mx - hx * 0.45, bz = mz - hz * 0.45; G3.abox(bx, h + 1.15, bz, 1.2, 1.15, 1.0, mulC(col, 0.9)); G3.abox(bx, h + 1.0, bz + 1.02, 0.45, 0.95, 0.03, dark); G3.abox(bx, h + 2.36, bz, 1.32, 0.07, 1.12, trim); } // stair hut
        if (r() < 0.6) { const ax = px(), az = pz(); G3.abox(ax, h + 0.5, az, 0.9, 0.45, 0.7, C3('#aab0bc'), -0.4); G3.amesh(ax, h + 0.97, az, CYX, 0.45, 0.03, 0.45, dark, -0.5); if (r() < 0.5) { G3.abox(ax + 2.1, h + 0.5, az, 0.9, 0.45, 0.7, C3('#aab0bc'), -0.4); G3.amesh(ax + 2.1, h + 0.97, az, CYX, 0.45, 0.03, 0.45, dark, -0.5); } }
        if ((st === 2 || low) && r() < 0.6) { const tx = px(), tz = pz(); for (const a of [-1, 1]) for (const b of [-1, 1]) G3.abox(tx + a * 0.65, h + 0.7, tz + b * 0.65, 0.06, 0.7, 0.06, dark); G3.amesh(tx, h + 2.5, tz, CYX, 1.0, 1.1, 1.0, C3('#8a6a4a'), 0); G3.amesh(tx, h + 3.9, tz, CONE, 1.1, 0.35, 1.1, C3('#5a4030'), 0); }
        if (r() < 0.3) { const ax = mx + hx * 0.5, az = mz - hz * 0.5; G3.amesh(ax, h + 3.2, az, CYX, 0.07, 3, 0.07, C3('#555a66'), 0); G3.amesh(ax, h + 6.3, az, SPX, 0.16, 0.16, 0.16, C3('#ff4433'), 1); G3.box(M4.rx(M4.t(ID4, ax - 1.2, h + 1.1, az), 0.7), 0.6, 0.06, 0.6, C3('#dfe6f0'), -0.5); }
        if (L >= 4 && r() < 0.5) { if (r() < 0.5) { G3.abox(mx + hx * 0.2, h + 0.4, mz + hz * 0.3, hx * 0.5, 0.06, hz * 0.4, C3('#4fbf6b'), 11); G3.amesh(mx + hx * 0.2, h + 1.3, mz + hz * 0.3, SPX, 0.9, 0.9, 0.9, C3('#3fa85a'), 0); } else for (let q = 0; q < 3; q++) G3.box(M4.rx(M4.t(ID4, mx + hx * 0.25, h + 0.55, mz + (q - 1) * 1.5 + hz * 0.2), 0.5), hx * 0.4, 0.04, 0.55, C3('#1c3a6a'), -0.95); }
        if (h > 40 && r() < 0.5) { G3.amesh(mx + hx * 0.15, h + 0.09, mz + hz * 0.15, CYL, 2.6, 0.03, 2.6, C3('#ffd23f')); G3.amesh(mx + hx * 0.15, h + 0.12, mz + hz * 0.15, CYL, 2.3, 0.02, 2.3, roofC, 9); }
        if (low && r() < 0.6) { G3.amesh(mx, h + 2.2, mz, CYX, 0.1, 1.8, 0.1, C3('#555a66'), 0); G3.abox(mx, h + 4.4, mz, 2.6, 1.1, 0.12, ac, 0.75); }
        else if ((d === 1 || d === 5) && sides.length && r() < 0.25) { const s = sides[0]; face(s, 0, h + 2.3, -0.5, 2.8, 1.3, 0.1, ac, 0.8); face(s, -2, h + 0.55, -0.5, 0.08, 0.55, 0.08, dark); face(s, 2, h + 0.55, -0.5, 0.08, 0.55, 0.08, dark); }
      }
      this.roofs.push([mx, mz, top, hx, hz]);
    }
  },

  buildStreets(L, A) {
    const day = L >= 3, white = C3(day ? '#eef1f6' : '#b9b6a4'), pave = C3(day ? '#b4bccb' : '#666a78'), dark = C3('#3a3d48'), E = CS / 2; this.tlights = []; this.tlSet = new Set();
    // sidewalks along every road, with street furniture
    for (let k = 0; k < GN; k += 3) for (let q = 0; q < GN; q++) {
      if (q % 3 === 0 || !this.isBlockRoad(k, q)) continue;
      for (const vert of [true, false]) {
        const cx = vert ? cellX(k) : cellX(q), cz = vert ? cellX(q) : cellX(k), d = this.districtOf(vert ? k : q, vert ? q : k), ok = d === 5 ? L >= 1 : A[d], r = rng(k * 53 + q * 811 + (vert ? 7 : 0));
        if (this.inAirport(cx, cz)) continue;
        for (const sd of [-1, 1]) {
          const ox = vert ? sd * (E - 0.7) : 0, oz = vert ? 0 : sd * (E - 0.7); G3.abox(cx + ox, 0.1, cz + oz, vert ? 0.7 : E, 0.1, vert ? E : 0.7, pave, 10);
          const u = (r() - 0.5) * 9, px = cx + ox + (vert ? 0 : u), pz = cz + oz + (vert ? u : 0), q2 = r(), fr = (a, y, b, ha, hy, hb, c, e) => G3.abox(px + (vert ? b : a), y, pz + (vert ? a : b), vert ? hb : ha, hy, vert ? ha : hb, c, e || 0); // a = along the road, b = across it
          if (!ok) { if (q2 < 0.25) G3.box(M4.ry(M4.rx(M4.t(ID4, px, 0.45, pz), r()), r() * 3), 0.6, 0.25, 0.4, C3('#3a3d47'), 0); continue; }
          if (q2 < 0.22) { fr(0, 0.62, 0, 0.9, 0.05, 0.24, C3('#8a6a4a')); fr(0, 0.95, sd * 0.22, 0.9, 0.2, 0.04, C3('#8a6a4a')); fr(-0.75, 0.4, 0, 0.05, 0.22, 0.22, dark); fr(0.75, 0.4, 0, 0.05, 0.22, 0.22, dark); } // bench
          else if (q2 < 0.34) { G3.amesh(px, 0.5, pz, CYX, 0.13, 0.32, 0.13, C3('#d9382e'), -0.3); G3.amesh(px, 0.86, pz, SPT, 0.14, 0.12, 0.14, C3('#d9382e'), -0.3); fr(0, 0.6, 0, 0.2, 0.05, 0.05, C3('#c9d2e0'), -0.6); } // hydrant
          else if (q2 < 0.46) { G3.amesh(px, 0.62, pz, TAPER, 0.24, 0.42, 0.24, C3('#2f6a4a'), -0.2); G3.amesh(px, 1.06, pz, CYX, 0.27, 0.03, 0.27, dark); } // bin
          else if (q2 < 0.56 && L >= 2) { fr(0, 1.25, sd * 0.4, 1.6, 1.05, 0.04, C3('#9fd4f0'), -0.9); fr(0, 2.38, 0, 1.75, 0.06, 0.6, C3('#3a78d8'), -0.4); fr(-1.6, 1.25, 0, 0.05, 1.1, 0.05, dark); fr(1.6, 1.25, 0, 0.05, 1.1, 0.05, dark); fr(0, 0.6, sd * 0.2, 1.1, 0.04, 0.18, C3('#8a6a4a')); fr(1.3, 1.9, sd * 0.36, 0.25, 0.25, 0.03, C3('#ffd23f'), 0.6); } // bus stop
          else if (q2 < 0.7 && L >= 3) { fr(0, 0.4, 0, 0.8, 0.2, 0.35, C3('#8c93a2')); for (let f = -1; f <= 1; f++) G3.amesh(px + (vert ? 0 : f * 0.5), 0.78, pz + (vert ? f * 0.5 : 0), SPT, 0.3, 0.24, 0.3, C3(f ? '#3fa85a' : ['#ff6b9d', '#ffd23f', '#ff8c1a'][k % 3]), 0); } // planter
          else if (q2 < 0.78) { fr(0, 0.75, 0, 0.26, 0.55, 0.22, C3('#2f5fd0'), -0.3); fr(0, 1.34, 0, 0.26, 0.06, 0.22, C3('#274fae')); } // mailbox
          else if (q2 < 0.88 && L >= 3) tree3(px, pz, 0.6 + r() * 0.2, d === 3);
        }
      }
    }
    // crossings: zebra stripes, traffic lights, lamps, trees and parked cars
    for (let j = 0; j < GN; j += 3) for (let i = 0; i < GN; i += 3) {
      if ((Math.abs(i - GC) <= 2 && Math.abs(j - GC) <= 2) || (i >= 17 && j >= 17)) continue;
      const d = this.districtOf(i, j), ok = d === 5 ? L >= 1 : A[d], cx = cellX(i), cz = cellX(j), x = cx + E - 0.9, z = cz + E - 0.9, r = rng(i * 17 + j * 71);
      G3.amesh(x, 3, z, CYX, 0.09, 3, 0.09, dark, -0.4); G3.box(M4.t(ID4, x - 0.45, 6, z), 0.55, 0.05, 0.06, dark); G3.amesh(x - 0.95, 5.88, z, SPX, 0.3, 0.14, 0.2, C3(DCOL[d]), ok ? 1 : 0.08); if (ok) this.lamps.push([x - 0.95, z, C3(DCOL[d])]);
      if (ok && L >= 3 && r() < 0.8) tree3(cx - E + 0.9, cz - E + 0.9, 0.9 + r() * 0.3, d === 3);
      if (r() < 0.45) { const px = cx + (r() < 0.5 ? -1 : 1) * (E - 2.6), pz = cz + (r() - 0.5) * 4 + (r() < 0.5 ? 16 : -16), cc = ok ? C3(['#e5383b', '#2f7df6', '#ffd23f', '#f4f8ff', '#2fbf71'][Math.floor(r() * 5)]) : C3('#34343c'); if (!this.inArena(px, pz, 38) && Math.hypot(px, pz) > 48 && !this.inAirport(px, pz) && !this.nearBase(px, pz, 18) && Math.abs(px) < WORLD_R - 4 && Math.abs(pz) < WORLD_R - 4) { if (!this.carsMade) this.cars.push({ type: 'car', kind: ['sedan', 'van', 'pickup', 'taxi', 'sports', 'sedan'][Math.floor(r() * 6)], col: C3(['#e5383b', '#2f7df6', '#ffd23f', '#f4f8ff', '#2fbf71', '#9b5de5'][Math.floor(r() * 6)]), x: px, y: 0, z: pz, yaw: 0, speed: 0, spin: 0, away: 0 }); } } // parked cars: anyone can drive them
      if (j > 0 && this.isBlockRoad(i, j - 1)) for (let s = -2; s <= 2; s++) G3.abox(cx + s * 2.1, 0.03, cz - E - 1.5, 0.6, 0.02, 1.2, white);
      if (i < GN - 1 && this.isBlockRoad(j, i + 1)) for (let s = -2; s <= 2; s++) G3.abox(cx + E + 1.5, 0.03, cz + s * 2.1, 1.2, 0.02, 0.6, white);
      const tx = cx + E - 0.9, tz = cz - E + 0.9; // a traffic light on an arm over the crossing
      if (ok) { G3.amesh(tx, 3.1, tz, CYX, 0.1, 3.1, 0.1, dark, -0.4); G3.abox(tx - 2.6, 6.1, tz, 2.6, 0.06, 0.06, dark); G3.abox(tx - 5, 5.6, tz, 0.2, 0.55, 0.2, C3('#1c1e24'), -0.3); this.tlights.push([tx - 5, tz, i, j]); this.tlSet.add(i + ',' + j); }
      else G3.box(M4.rz(M4.t(ID4, tx, 2.4, tz), 0.5), 0.1, 2.6, 0.1, dark, -0.4);
    }
  },
  drawLights(t, h) { // the lamps of nearby traffic lights (they change every 8 seconds; traffic obeys them)
    const red = C3('#ff3b2f'), grn = C3('#3dff7a');
    for (const l of this.tlights) {
      if (Math.abs(l[0] - h.x) > 80 || Math.abs(l[1] - h.z) > 80) continue; const p = lightPhase(l[2], l[3], t);
      for (const s of [-1, 1]) { G3.aglow(l[0] + s * 0.23, p ? 5.95 : 5.25, l[1], 0.04, 0.13, 0.13, p ? red : grn, 1.6); G3.aglow(l[0], p ? 5.25 : 5.95, l[1] + s * 0.23, 0.13, 0.13, 0.04, p ? grn : red, 1.6); }
    }
  }
});
