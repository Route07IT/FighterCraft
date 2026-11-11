'use strict';
/* ============================================================
   FIGHTER CRAFT - things that make this city special:
     - vehicles: the hero car, the helicopter and the fighter jet
       (jump out in the air and you float down on a parachute)
     - robot bases: one per district, with turrets - blow them up!
     - Robo-Pals: robots you beat can be rebuilt as your teammate
   Extends the World class.
   ============================================================ */
const PALS = { scrapper: { range: 2.2, cd: 0.9, m: 0.55 }, roller: { range: 1.9, cd: 0.7, m: 0.45 }, zapper: { range: 10, cd: 1.3, m: 0.7, shot: 1 }, drone: { range: 2.6, cd: 1.2, m: 0.6 }, brute: { range: 3.1, cd: 1.9, m: 1.5, big: 1 } };
const VEH_INFO = { car: { name: 'HERO CAR', icon: '🚗' }, heli: { name: 'HELICOPTER', icon: '🚁', cost: 250 }, jet: { name: 'FIGHTER JET', icon: '✈️', cost: 600 } };
const PAL_DESC = { scrapper: 'Punches the robots next to you.', roller: 'A fast little rammer.', zapper: 'Shoots from far away.', drone: 'Flies and zaps from above.', brute: 'Slow, but its slam is HUGE.' };
const palNeed = lv => lv ? 3 + lv * 2 : 3; // cores needed to build (lv 0) or upgrade a pal

Object.assign(World.prototype, {
  /* ---------------- vehicles ---------------- */
  owns(v) { return v.type === 'car' || !!S.veh[v.type]; },
  homeVeh(v) { v.speed = 0; v.away = 0; if (v.type === 'heli') { v.x = AIR.heli[0]; v.z = AIR.heli[1]; v.y = 0; v.yaw = 0; } else if (v.type === 'jet') { v.x = AIR.jet[0]; v.z = AIR.jet[1]; v.y = 1.25; v.yaw = 0; v.air = false; v.roll = v.pitch = 0; } },
  upVehs(dt) {
    const h = this.h;
    for (const v of this.vehs) if (v.away > 0) { v.away -= dt; if (v.away <= 0) this.homeVeh(v); }
    this.nearVeh = null;
    if (this.mis || this.koT > 0) return;
    if (h.veh) { if (Input.hit('use')) this.leaveVeh(false); return; }
    let bd = 99;
    for (const v of this.vehs) { if (v.away > 0 || !this.owns(v)) continue; const d = Math.hypot(v.x - h.x, v.z - h.z), reach = v.type === 'car' ? 4.2 : 6; if (d < reach && d < bd && Math.abs(h.y - (v.type === 'jet' ? v.y - 1.25 : v.y)) < 2.5) { bd = d; this.nearVeh = v; } }
    if (Input.hit('use')) {
      if (this.nearVeh) this.enterVeh(this.nearVeh);
      else if (h.on && h.y < 0.5) { const car = this.vehs[0]; car.x = h.x; car.z = h.z; car.yaw = h.yaw; this.fx.smoke(h.x, 0.5, h.z, 8, '#dfe6f0'); this.enterVeh(car); } // BOLT brings the car
      else this.text(h.x, h.y + 2.6, h.z, 'Land first!', '#fff', 20);
    }
  },
  enterVeh(v) {
    const h = this.h; h.veh = v; h.x = v.x; h.z = v.z; h.y = v.y; h.yaw = v.yaw; this.camYaw = lerpA(this.camYaw, v.yaw, 0.5); h.vx = h.vz = h.vy = 0; h.atk = null; h.chute = false; h.climb = false; h.jet = false; v.speed = 0; v.air = false; v.cd = 0;
    if (v.type === 'car') this.collide(h, 1.35);
    Snd.play('build'); const first = !S.stats['rode_' + v.type]; S.stats['rode_' + v.type] = 1;
    if (first) this.say(v.type === 'car' ? 'Your car! Hold UP to drive and steer with LEFT and RIGHT. Hold J for turbo, and you can ram robots!' : v.type === 'heli' ? 'Hold SPACE to fly up and SHIFT to come down. K fires rockets. Press F in the air to jump out with a parachute!' : 'Hold UP to take off! In the air, UP climbs and DOWN dives. K fires missiles at robot bases. F ejects you with a parachute!', 8);
  },
  leaveVeh(silent) {
    const h = this.h, v = h.veh; if (!v) return; h.veh = null; v.x = h.x; v.z = h.z; v.y = h.y; v.yaw = h.yaw; v.speed = 0;
    const f = this.floorAt(h.x, h.z, h.y), air = h.y > f + (v.type === 'jet' ? 2 : 1.2);
    if (silent) { if (v.type !== 'car') this.homeVeh(v); return; }
    if (v.type === 'jet' && !air) h.y = f;
    if (air) { h.chute = true; h.on = false; h.vy = 4; h.vx = Math.sin(h.yaw) * 6; h.vz = Math.cos(h.yaw) * 6; v.away = 9; Snd.play('jump'); this.setBanner(v.type === 'jet' ? 'EJECT!' : 'PARACHUTE!', 'Steer with the arrows and land anywhere - even on a roof', '#7df9ff', 2); }
    else { h.x += Math.cos(h.yaw) * (v.type === 'car' ? 1.9 : 3); h.z -= Math.sin(h.yaw) * (v.type === 'car' ? 1.9 : 3); this.collide(h, 0.55); h.on = true; h.vy = 0; Snd.play('click'); }
    if (this.pal) { this.pal.x = h.x - 1; this.pal.z = h.z - 1; }
  },
  vehFire(v) {
    const h = this.h, jet = v.type === 'jet', cost = jet ? 10 : 12; if (v.cd > 0) return;
    if (h.en < cost) { Snd.play('wrong'); return; }
    let best = null, bd = jet ? 190 : 80; const pick2 = (o, r) => { const d = Math.hypot(o.x - h.x, o.z - h.z) - r; if (d < bd && Math.abs(wrapA(Math.atan2(o.x - h.x, o.z - h.z) - h.yaw)) < (jet ? 0.8 : 1.1)) { bd = d; best = o; } };
    for (const e of this.en) if (!e.dead) pick2(e, e.r); for (const b of this.bases) if (!b.dead) pick2(b, 12);
    h.en -= cost; v.cd = jet ? 0.22 : 0.4; Snd.play('blast'); const sp = jet ? v.speed + 60 : 46, side = (v.sideFlip = -(v.sideFlip || 1)) * (jet ? 2.3 : 1.05);
    this.shots.push({ k: 'rocket', f: true, air: true, x: h.x - Math.cos(h.yaw) * side, y: h.y + (jet ? -0.4 : 1.0), z: h.z + Math.sin(h.yaw) * side, vx: Math.sin(h.yaw) * sp, vy: best ? 0 : -8, vz: Math.cos(h.yaw) * sp, dmg: Calc.blast() * (jet ? 3.2 : 2.2), rad: jet ? 9 : 7, life: 3.2, tgt: best });
  },
  upVehicle(dt) {
    const h = this.h, v = h.veh, turn = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0), up = Input.held('up'), dn = Input.held('dn'), sn = () => Math.sin(h.yaw), cs = () => Math.cos(h.yaw);
    h.mv = 0; h.jet = false; h.climb = false; h.on = true; v.cd -= dt;
    if (h.hurtT > 0) h.hurtT -= dt; if (h.inv > 0) h.inv -= dt; if (h.boost > 0) h.boost -= dt;
    h.en = Math.min(h.maxEn, h.en + Calc.regen() * dt); h.calm += dt; if (h.calm > 6 && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.05 * dt);
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; } if (this.comboPop > 0) this.comboPop -= dt * 5;
    if (v.type === 'car') {
      const turbo = Input.held('punch') && up && h.en > 1; if (turbo) h.en -= 14 * dt;
      v.speed += (up ? (turbo ? 32 : 20) : dn ? (v.speed > 0 ? -34 : -14) : 0) * dt; if (!up && !dn) v.speed *= Math.pow(0.3, dt); v.speed = clamp(v.speed, -10, turbo ? 37 : 25);
      h.yaw = wrapA(h.yaw - turn * clamp(v.speed / 9, -1, 1) * 2.1 * dt);
      h.x += sn() * v.speed * dt; h.z += cs() * v.speed * dt; h.y = 0;
      if (this.collide(h, 1.35)) { if (Math.abs(v.speed) > 12) { this.shake = Math.max(this.shake, 0.25); Snd.play('hit'); this.fx.spark(h.x + sn() * 2, 0.6, h.z + cs() * 2, 6, '#ffd23f'); } v.speed *= Math.abs(v.speed) > 5 ? 0.55 : 0.92; }
      v.spin = (v.spin || 0) + v.speed * dt * 2.8;
      if (Math.abs(v.speed) > 6) for (const e of this.en) { if (e.dead || e.flying || (e.ramT || 0) > this.t || Math.hypot(e.x - h.x, e.z - h.z) > e.r + 1.6) continue; e.ramT = this.t + 0.5; this.damage(e, Math.abs(v.speed) * 1.6 + Calc.punch(), true); v.speed *= e.boss ? 0.3 : 0.8; Snd.play('bighit'); this.shake = Math.max(this.shake, 0.3); }
      for (const c of this.crates) if (!c.dead && !c.y && Math.hypot(c.x - h.x, c.z - h.z) < 1.9) this.breakCrate(c);
      if (turbo && Math.random() < 0.7) this.fx.add({ k: 0, x: h.x - sn() * 2.3, y: 0.5, z: h.z - cs() * 2.3, vx: rand(-1, 1), vy: rand(0, 2), vz: rand(-1, 1), life: 0.25, max: 0.25, c: C3('#ffb347'), s: 0.12, g: 0 });
      if (Input.hit('blast')) this.fire();
    } else if (v.type === 'heli') {
      const f = this.floorAt(h.x, h.z, h.y), asc = Input.held('jump') ? 1 : 0, desc = Input.held('desc') ? 1 : 0; let air = h.y > f + 0.12;
      h.vy = lerp(h.vy, (asc - desc) * 11, Math.min(1, dt * 3)); if (!air && !asc) h.vy = 0;
      h.y = clamp(h.y + h.vy * dt, f, 160); air = h.y > f + 0.12; v.on = air || asc > 0;
      v.speed = lerp(v.speed, air ? (up ? 18 : dn ? -8 : 0) : 0, Math.min(1, dt * 1.8)); h.yaw = wrapA(h.yaw - turn * 1.7 * dt);
      h.x += sn() * v.speed * dt; h.z += cs() * v.speed * dt; if (this.collide(h, 2.3, FLY_R)) v.speed *= 0.5;
      v.tilt = lerp(v.tilt || 0, v.speed / 18 * 0.28, Math.min(1, dt * 4)); v.bank = lerp(v.bank || 0, air ? turn * 0.25 : 0, Math.min(1, dt * 4));
      if (Input.hit('blast') || Input.hit('punch')) this.vehFire(v);
    } else { // the fighter jet
      const burn = Input.held('punch') && h.en > 1 && v.air; if (burn) h.en -= 9 * dt; v.burn = v.air ? (burn ? 1 : 0.4) : up ? 0.6 : 0;
      if (!v.air) {
        v.speed = clamp(v.speed + (up ? 24 : -16) * dt, 0, 60); h.yaw = wrapA(h.yaw - turn * 0.6 * clamp(v.speed / 10, 0, 1) * dt); h.y = 1.25; h.vy = 0; v.roll = v.pitch = 0;
        if (this.collide(h, 2.6, FLY_R)) v.speed *= 0.5;
        if (v.speed > 33) { v.air = true; h.vy = 7; Snd.play('super'); this.setBanner('TAKE OFF!', 'UP climbs, DOWN dives, K fires missiles', '#7df9ff', 2); }
      } else {
        v.speed = lerp(v.speed, burn ? 80 : 54, Math.min(1, dt * 0.9)); h.yaw = wrapA(h.yaw - turn * 0.95 * dt); v.roll = lerp(v.roll, turn * 0.8, Math.min(1, dt * 3));
        const ax = h.x + sn() * v.speed * 1.1, az = h.z + cs() * v.speed * 1.1; // look ahead: pull up before hitting a building
        const dodge = this.inSolid(ax, h.y - 1.5, az) || this.inSolid(h.x + sn() * v.speed * 0.5, h.y - 1.5, h.z + cs() * v.speed * 0.5);
        h.vy = lerp(h.vy, dodge ? 22 : ((up ? 1 : 0) - (dn ? 1 : 0)) * 17, Math.min(1, dt * (dodge ? 6 : 2.2))); v.pitch = lerp(v.pitch, -h.vy / 45, Math.min(1, dt * 3));
        h.y = clamp(h.y + h.vy * dt, 3, 175);
        if (Math.hypot(h.x, h.z) > FLY_R) h.yaw = lerpA(h.yaw, Math.atan2(-h.x, -h.z), Math.min(1, dt * 1.3));
        if (this.inSolid(h.x, h.y - 0.5, h.z)) { this.explode({ x: h.x, y: h.y, z: h.z, dmg: 0, rad: 7 }); this.leaveVeh(false); v.away = 14; h.inv = 2; this.setBanner('CRASH!', 'You ejected just in time. The jet will be repaired.', '#ff6b5a', 2.4); return; }
        if (h.y <= 3.2 && dn && this.inAirport(h.x, h.z) && Math.abs(h.x - AIR.rx) < 9) { v.air = false; h.y = 1.25; Snd.play('correct'); this.text(h.x, 4, h.z, 'Perfect landing!', '#5dff9a', 26); }
      }
      h.x += sn() * v.speed * dt; h.z += cs() * v.speed * dt;
      if (Input.hit('blast')) this.vehFire(v);
    }
  },
  drawVehs(t) {
    const h = this.h, col = C3(SUITS[S.suit][0]);
    for (const v of this.vehs) {
      const mine = h.veh === v, x = mine ? h.x : v.x, y = mine ? h.y : v.y, z = mine ? h.z : v.z, yaw = mine ? h.yaw : v.yaw;
      if (v.away > 0 || (!mine && (Math.abs(x - h.x) > 260 || Math.abs(z - h.z) > 260))) continue;
      const own = this.owns(v), c = own ? col : C3('#7a8090'), f = this.floorAt(x, z, y + 0.5);
      let m = M4.ry(M4.t(ID4, x, y, z), yaw);
      if (v.type === 'car') { G3.shadow(x, 0.05, z, 2.6, 0.5); car3(m, c, v.spin, mine, false); }
      else if (v.type === 'heli') { G3.shadow(x, f + 0.05, z, 3.2 * clamp(1 - (y - f) / 60, 0.4, 1), 0.45 * clamp(1 - (y - f) / 60, 0.3, 1)); if (mine) m = M4.rz(M4.rx(m, v.tilt || 0), v.bank || 0); heli3(m, t, mine && v.on, c); }
      else { G3.shadow(x, f + 0.05, z, 4.5 * clamp(1 - (y - f) / 90, 0.4, 1), 0.45 * clamp(1 - (y - f) / 90, 0.25, 1)); if (mine) m = M4.rz(M4.rx(m, v.pitch || 0), v.roll || 0); jet3(m, t, mine ? v.burn || 0 : 0, !mine || !v.air, c); }
    }
  },
  hudVehs(g) {
    const h = this.h;
    for (const v of this.vehs) {
      if (v.away > 0 || h.veh === v) continue; const d = Math.hypot(v.x - h.x, v.z - h.z); if (d > (this.owns(v) ? 90 : 45)) continue;
      const s = this.toScreen(v.x, v.y + (v.type === 'car' ? 2.4 : v.type === 'heli' ? 4.6 : 3.4), v.z); if (!s) continue; const I = VEH_INFO[v.type], sc = clamp(22 / s[2], 0.6, 1.1);
      if (!this.owns(v)) this.pill(g, s[0], s[1], `🔒 ${I.icon} ${I.name} - ${I.cost} coins at the airport office`, '#a9b8d8', sc);
      else if (this.nearVeh === v && !h.veh) this.pill(g, s[0], s[1], UI.isTouch ? `${I.icon} Tap F to ${v.type === 'car' ? 'drive' : 'fly'}!` : `${I.icon} Press F to ${v.type === 'car' ? 'drive' : 'fly'}!`, '#ffe14d', 1.1);
      else if (d < 60) this.pill(g, s[0], s[1], I.icon + ' ' + I.name, '#7df9ff', sc);
    }
    const v = h.veh;
    if (v && v.type !== 'car') { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W / 2 - 150, 622, 300, 38, 14); g.fill(); g.fillStyle = '#7df9ff'; g.font = `bold 18px ${FONT}`; g.textAlign = 'center'; g.fillText(`${VEH_INFO[v.type].icon}  ALTITUDE ${Math.round(h.y)} m   •   SPEED ${Math.round(Math.abs(v.speed) * 3.6)}`, W / 2, 642); }
    else if (v) { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W / 2 - 90, 622, 180, 38, 14); g.fill(); g.fillStyle = '#7df9ff'; g.font = `bold 18px ${FONT}`; g.textAlign = 'center'; g.fillText(`🚗  ${Math.round(Math.abs(v.speed) * 3.6)} km/h`, W / 2, 642); }
  },

  /* ---------------- robot bases ---------------- */
  buildBases() { // called while the static city is being built
    const old = this.bases; this.bases = [];
    BASE_AT.forEach((p, d) => {
      const x = cellX(p.i), z = cellX(p.j), dead = !!S.bases[d], prev = old && old[d], hp = 450 * (1 + d * 1.1);
      G3.abox(x, 0.05, z, 13.6, 0.05, 13.6, C3(dead ? '#6a7466' : '#2a2c34'), dead ? 11 : 9);
      if (dead) { // rubble, and a flag: this place is free now
        const r = rng(50 + d); for (let k = 0; k < 12; k++) G3.box(M4.rx(M4.ry(M4.t(ID4, x + (r() - 0.5) * 20, 0.4 + r() * 0.6, z + (r() - 0.5) * 20), r() * 3), r() * 0.6), 0.6 + r() * 1.4, 0.3 + r() * 0.5, 0.5 + r(), C3('#3a3d47'), -0.2);
        G3.amesh(x, 1.6, z, TAPER, 2.6, 1.6, 2.6, C3('#3a3f4d'), -0.3); G3.amesh(x, 6, z, CYX, 0.1, 3, 0.1, C3('#dfe6f0')); G3.abox(x + 1.1, 8, z, 1.1, 0.7, 0.03, C3(SUITS[S.suit][0]), 0.5); this.solid(x - 2.4, x + 2.4, z - 2.4, z + 2.4, 3.2);
      } else { this.solid(x - 2.4, x + 2.4, z - 2.4, z + 2.4, 17); for (const s of [-1, 1]) { this.solid(x + s * 12 - 0.6, x + s * 12 + 0.6, z - 12.6, z + 12.6, 3.3); this.solid(x - 12.6, x + 12.6, z + s * 12 - 0.6, z + s * 12 + 0.6, 3.3); } }
      this.bases.push({ d, x, z, y: 0, h: 16, r: 3, dead, hp: prev && !dead ? prev.hp : hp, maxHp: hp, flash: 0, turrets: [0, 1, 2].map(k => { const a = k * TAU / 3 + 0.5; return { x: x + Math.cos(a) * 8.5, z: z + Math.sin(a) * 8.5, yaw: 0, pitch: 0, cd: 1.5 + k * 0.7 }; }) });
    });
  },
  upBases(dt) {
    const h = this.h; if (this.mis) return;
    for (const b of this.bases) {
      if (b.dead) continue; if (b.flash > 0) b.flash -= dt;
      const d = Math.hypot(b.x - h.x, b.z - h.z); if (d > 150) continue;
      if (b.hp < b.maxHp * 0.6 && Math.random() < dt * 6) this.fx.smoke(b.x + rand(-6, 6), rand(3, 14), b.z + rand(-6, 6), 1, '#3c3c44');
      const diff = b.d * 3 + 1, dmg = 9 * (1.25 + diff * 0.22 + diff * diff * 0.022);
      for (const u of b.turrets) {
        const dx = h.x - u.x, dy = h.y + 1 - 4.2, dz = h.z - u.z, dl = Math.hypot(dx, dy, dz) || 1; u.yaw = lerpA(u.yaw, Math.atan2(dx, dz), Math.min(1, dt * 4)); u.pitch = lerp(u.pitch, Math.atan2(dy, Math.hypot(dx, dz)), Math.min(1, dt * 4));
        u.cd -= dt; if (u.cd <= 0 && dl < 62 && !(this.koT > 0)) { u.cd = rand(1.7, 2.8); const sp = 26; this.shots.push({ k: 'orb', x: u.x + dx / dl * 2, y: 4.2 + dy / dl * 2, z: u.z + dz / dl * 2, vx: dx / dl * sp, vy: dy / dl * sp, vz: dz / dl * sp, dmg, life: 3.2, home: 0.5 }); if (dl < 45) Snd.play('zap'); }
      }
    }
  },
  damageBase(b, dmg) {
    if (b.dead || dmg <= 0) return; b.hp -= dmg; b.flash = 0.12;
    this.text(b.x + rand(-2, 2), 20 + rand(-2, 2), b.z, String(Math.round(dmg)), '#ffd23f', 34); this.fx.spark(b.x + rand(-3, 3), rand(4, 15), b.z + rand(-3, 3), 10, '#ffb347', 12);
    if (b.hp <= 0) this.destroyBase(b);
  },
  destroyBase(b) {
    b.dead = true; S.bases[b.d] = true; const D = DISTRICTS[b.d], coins = 120 + b.d * 80;
    for (let k = 0; k < 7; k++) { const x = b.x + rand(-9, 9), y = rand(2, 16), z = b.z + rand(-9, 9); this.fx.spark(x, y, z, 26, pick(['#ffb347', '#ffd23f', '#ff5a36']), 16); this.fx.smoke(x, y, z, 5); this.fx.ring(x, z, '#ff7b3d', 10, y); this.fx.debris(x, y, z, 10, '#3a3f4d'); }
    Snd.play('explode'); Snd.play('fanfare'); this.shake = 1.2; this.slow = 1.2; this.flash = 0.5;
    for (const e of this.en) if (e.roam && !e.dead) { e.dead = true; this.fx.spark(e.x, e.y + 1, e.z, 12, '#5dff9a'); }
    S.coins += coins; this.coinPulse = 1; const pool = D.pool.filter(k => ROBOTS[k]); for (let k = 0; k < 2; k++) { const kind = pick(pool); S.cores[kind] = (S.cores[kind] || 0) + 1; }
    this.shots = this.shots.filter(s => s.f); this.build(); this.gainXp(Math.round(60 * (1 + b.d * 0.8)));
    this.setBanner('💥 ROBOT BASE DESTROYED!', `+${coins} coins and 2 robot cores  •  The ${D.name} boss is now 25% weaker`, '#ffe14d', 3.6); say(`Robot base destroyed! The patrol robots in ${D.name} are free.`);
    UI.badgeToasts(checkBadges()); Save.save();
  },
  drawBases(t) { const h = this.h; for (const b of this.bases) if (!b.dead && Math.abs(b.x - h.x) < 320 && Math.abs(b.z - h.z) < 320) base3(b, t); },
  hudBases(g) {
    const h = this.h;
    for (const b of this.bases) {
      if (b.dead) continue; const d = Math.hypot(b.x - h.x, b.z - h.z); if (d > 330) continue; const s = this.toScreen(b.x, 27, b.z); if (!s) continue; const sc = clamp(40 / s[2], 0.6, 1.1);
      this.pill(g, s[0], s[1], `📡 ROBOT BASE${d > 70 ? ' • ' + Math.round(d) + ' m' : ''}`, '#ff6b5a', sc);
      if (b.hp < b.maxHp) this.bar(g, s[0] - 70 * sc, s[1] + 20 * sc, 140 * sc, 9 * sc, b.hp / b.maxHp, '#b0283a', '#ff6b5a');
    }
  },

  /* ---------------- Robo-Pals ---------------- */
  initPal() {
    const k = S.pal, h = this.h; if (!k) { this.pal = null; return; } const P = E3[k];
    this.pal = { pal: true, kind: k, x: h.x - 1.6, z: h.z, y: P.fly || 0, yaw: h.yaw, r: P.r, h: P.h, flying: !!P.fly, fly: P.fly || 0, t: rand(9), state: 'walk', st: 0, cd: 1, moving: false, spin: 0, flash: 0, windT: 0.4 };
  },
  upPal(dt) {
    const p = this.pal, h = this.h; if (!p || h.veh) return;
    p.t += dt; p.moving = false; const K = PALS[p.kind], lv = S.palLv[p.kind] || 1, m = this.mis;
    if (p.state === 'swing' || p.state === 'cheer') { p.st -= dt; if (p.st <= 0) p.state = 'walk'; }
    if (m && m.state === 'win') { p.state = 'cheer'; p.st = 0.5; }
    let tgt = null, bd = 17; for (const e of this.en) { const d = Math.hypot(e.x - h.x, e.z - h.z); if (!e.dead && (e.aggro || m) && d < bd) { bd = d; tgt = e; } }
    let gx, gz, stop;
    if (tgt) { gx = tgt.x; gz = tgt.z; stop = K.range + tgt.r; } else { gx = h.x + Math.cos(h.yaw) * 1.7 - Math.sin(h.yaw) * 1.0; gz = h.z - Math.sin(h.yaw) * 1.7 - Math.cos(h.yaw) * 1.0; stop = 0.6; }
    const dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz) || 0.01;
    if (!tgt && d > 34) { p.x = gx; p.z = gz; }
    else if (d > stop && p.state === 'walk') { p.yaw = lerpA(p.yaw, Math.atan2(dx, dz), Math.min(1, dt * 9)); const v = Math.min(tgt ? 8 : 11, d * 3 + 1.5); p.x += Math.sin(p.yaw) * v * dt; p.z += Math.cos(p.yaw) * v * dt; p.moving = true; if (p.kind === 'roller') p.spin += v * dt * 1.4; }
    else if (tgt) p.yaw = lerpA(p.yaw, Math.atan2(dx, dz), Math.min(1, dt * 9));
    if (!p.flying) { p.y = 0; this.collide(p, p.r * 0.8); } else p.y = p.fly + Math.sin(p.t * 2) * 0.2;
    p.cd -= dt;
    if (tgt && d <= stop + 0.6 && p.cd <= 0) {
      p.cd = K.cd; p.state = 'swing'; p.st = 0.25; const dmg = (K.shot ? Calc.blast() : Calc.punch()) * K.m * (0.75 + lv * 0.25);
      if (K.shot) { const l = Math.hypot(dx, dz) || 1; this.shots.push({ k: 'blast', f: true, x: p.x, y: p.y + p.h * 0.8, z: p.z, vx: dx / l * 30, vy: 0, vz: dz / l * 30, dmg, life: 1.2, tgt, green: true }); Snd.play('zap'); }
      else { this.damage(tgt, dmg, !!K.big, p.x, p.z); Snd.play(K.big ? 'bighit' : 'hit'); if (K.big) this.fx.ring(p.x, p.z, '#5dff9a', 4); }
    }
  },
  drawPal(t) { const p = this.pal; if (!p || this.h.veh) return; G3.shadow(p.x, 0.05, p.z, p.r * 1.4, 0.4); enemy3(p); }
});
