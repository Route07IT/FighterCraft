'use strict';
/* ============================================================
   FIGHTER CRAFT - walk-in places. Stepping on a door ring takes
   the hero INSIDE a room he can walk around in:
     food shop, weapon shop, pet shop, bank, Dojo and his own house.
   Also here: food effects, pets, houses, bank savings and stocks.
   Extends the World class.
   ============================================================ */
const ROOM_INFO = {
  food: { name: '🍔 YUM YUM FOOD', w: 19, d: 12, floor: '#fff1e0', wall: '#ffb8c6', trim: '#ff6b8a', hi: 'Welcome to Yum Yum! Walk up to any food and press F to eat it.' },
  guns: { name: '⚔️ HERO GEAR', w: 19, d: 12, floor: '#9aa4b8', wall: '#2b3a66', trim: '#39d0ff', hi: 'Welcome to Hero Gear! Walk up to a weapon and press F.' },
  pets: { name: '🐶 PET SHOP', w: 18, d: 12, floor: '#d8f0c8', wall: '#ffe0a8', trim: '#ffb347', hi: 'Every pet helps you in a different way. Which one will you choose?' },
  bank: { name: '🏦 NOVA BANK', w: 20, d: 13, floor: '#e9e2d0', wall: '#3a5a48', trim: '#ffd23f', hi: 'Welcome to the bank. Coins you save here grow by themselves!' },
  house: { name: '🏠 MY HOUSE', w: 17, d: 11, floor: '#c9a070', wall: '#f4e6d0', trim: '#5fd68a', hi: 'Home sweet home!' },
  cave1: { name: '💎 CRYSTAL CAVE', w: 20, d: 13, floor: '#4a4650', wall: '#3c3a44', trim: '#b388ff', cave: 1, hi: 'A crystal cave! Walk up to a crystal and press F to dig it out. They grow back after a while.' },
  cave2: { name: '🏴‍☠️ PIRATE CAVE', w: 18, d: 12, floor: '#5a5044', wall: '#40382e', trim: '#ffd23f', cave: 1, hi: 'A pirate hideout! I wonder what is inside that chest...' },
  cave3: { name: '🐻 BEAR CAVE', w: 17, d: 11, floor: '#4e4a40', wall: '#3a362e', trim: '#ffb347', cave: 1, hi: 'You found the secret cave behind the waterfall! Shh... somebody lives here.' },
  dojo: { name: '🥋 DOJO', w: 18, d: 12, floor: '#b98a4e', wall: '#5b3a55', trim: '#ff8c1a', hi: 'Pick a training station. Practice makes you powerful!' }
};
const PETS = {
  dog: { name: 'Dog', icon: '🐶', cost: 150, perk: 'Sniffs out coins from far away' }, cat: { name: 'Cat', icon: '🐱', cost: 150, perk: 'Lucky! More hearts drop from robots' },
  bunny: { name: 'Bunny', icon: '🐰', cost: 120, perk: 'Makes you 5% faster' }, parrot: { name: 'Parrot', icon: '🦜', cost: 200, perk: '+10% XP from everything' }
};
const HOUSES = [null, { name: 'Cozy House', cost: 200 }, { name: 'Big House', cost: 600 }, { name: 'Hero Villa', cost: 1500 }];
const STOCKS = [
  { id: 'yum', name: 'Yum Yum Foods', icon: '🍔', p0: 10, drift: 0.004, vol: 0.015, desc: 'Very safe. Grows very slowly.' },
  { id: 'nova', name: 'Nova Power', icon: '🔋', p0: 20, drift: 0.006, vol: 0.03, desc: 'Steady. Small ups and downs.' },
  { id: 'sky', name: 'Sky Air', icon: '✈️', p0: 30, drift: 0.008, vol: 0.06, desc: 'Bumpy, but often climbs.' },
  { id: 'robo', name: 'RoboFix', icon: '🤖', p0: 15, drift: 0.01, vol: 0.11, desc: 'Wild! Big wins and big losses.' }
];
const stockPx = id => S.bank.px[id] || STOCKS.find(s => s.id === id).p0;
function weapon3(k, m, s) {
  if (k === 'sword') { G3.box(M4.t(m, 0, 0.75 * s, 0), 0.06 * s, 0.6 * s, 0.016 * s, C3('#e6fbff'), 0.5); G3.mesh(M4.rz(M4.t(m, 0, 0.14 * s, 0), HPI), CYX, 0.03 * s, 0.17 * s, 0.03 * s, C3('#ffd23f'), -0.9); G3.mesh(M4.t(m, 0, 0.02 * s, 0), CYX, 0.03 * s, 0.1 * s, 0.03 * s, C3('#3a281d'), 0); }
  else if (k === 'hammer') { G3.mesh(M4.t(m, 0, 0.5 * s, 0), CYX, 0.035 * s, 0.5 * s, 0.035 * s, C3('#6b4a2b'), 0); G3.mesh(M4.rx(M4.t(m, 0, 1.05 * s, 0), HPI), CYL, 0.2 * s, 0.34 * s, 0.2 * s, C3('#9aa4b8'), -0.9); G3.mesh(M4.rx(M4.t(m, 0, 1.05 * s, 0), HPI), CYL, 0.215 * s, 0.07 * s, 0.215 * s, C3('#ffd23f'), 0.5); }
  else if (k === 'fist') { G3.mesh(M4.t(m, 0, 0.5 * s, 0), SPL, 0.22 * s, 0.26 * s, 0.2 * s, C3('#e5383b'), -0.6); G3.mesh(M4.t(m, 0, 0.2 * s, 0), CYX, 0.16 * s, 0.1 * s, 0.16 * s, WHITE, 0); }
  else if (k === 'rocket') { G3.mesh(M4.rz(M4.t(m, 0, 0.55 * s, 0), 1.2), CYL, 0.11 * s, 0.6 * s, 0.11 * s, C3('#3f5a3a'), -0.5); G3.mesh(M4.rz(M4.t(m, -0.62 * s, 0.78 * s, 0), 1.2), CONE, 0.09 * s, 0.14 * s, 0.09 * s, C3('#ff5a36'), 0.8); }
  else { const n = k === 'tri' ? 3 : 1; for (let i = 0; i < n; i++) G3.mesh(M4.rz(M4.t(m, 0, (0.5 + (i - (n - 1) / 2) * 0.16) * s, 0), HPI), CYX, 0.06 * s, 0.34 * s, 0.06 * s, C3('#2b3242'), -0.7); G3.mesh(M4.t(m, 0.2 * s, 0.3 * s, 0), CYX, 0.05 * s, 0.18 * s, 0.05 * s, C3('#2b3242'), -0.7); G3.mesh(M4.t(m, -0.36 * s, 0.5 * s, 0), SPT, 0.07 * s, 0.07 * s * n, 0.07 * s, C3('#7df9ff'), 1); }
}

Object.assign(World.prototype, {
  /* the clock: food effects wear off, savings grow, stock prices move */
  upClock(dt) {
    const h = this.h, B = S.bank; if (h.fSpd > 0) h.fSpd -= dt; if (h.fRegen > 0) h.fRegen -= dt; if (h.fXp > 0) h.fXp -= dt;
    B.t = (B.t || 0) + dt; if (B.t < 40) return; B.t = 0;
    if (B.sav > 0) { const g = Math.min(25, Math.max(1, Math.round(B.sav * (0.004 + 0.002 * S.build.bank)))); B.sav += g; if (!this.mis) UI.toast(`🏦 Your savings grew by ${g} coin${g === 1 ? '' : 's'}!`); }
    for (const s of STOCKS) { const p = stockPx(s.id), np = Math.max(2, Math.round(p * (1 + s.drift + (Math.random() - 0.5) * 2 * s.vol) * 10) / 10); B.px[s.id] = np; const H = B.hist[s.id] || (B.hist[s.id] = [p]); H.push(np); if (H.length > 18) H.shift(); }
    if (this.panel === 'stocks') this.openPanel('stocks');
  },
  eat(f) {
    const h = this.h; if (S.coins < f.cost) { Snd.play('wrong'); UI.toast(`You need ${f.cost - S.coins} more coins for the ${f.name}.`); return; }
    S.coins -= f.cost; S.stats.eaten = (S.stats.eaten || 0) + 1; Snd.play('heart');
    if (f.heal) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * f.heal); if (f.en) h.en = h.maxEn; if (f.sup) h.sup = 100; if (f.regen) h.fRegen = f.regen; if (f.spd) h.fSpd = f.spd; if (f.xp) h.fXp = f.xp;
    this.text(h.x, 2.6, h.z, 'Yum! ' + f.icon, '#ffe14d', 34); UI.toast(`${f.icon} ${f.name}: ${f.fx}`); Save.save();
  },
  canEnter(id) { return !!ROOM_INFO[id] && !this.room && (id !== 'house' || S.house > 0); },
  enterRoom(id) {
    const h = this.h, I = ROOM_INFO[id]; if (h.veh) this.leaveVeh(false);
    this.room = { id, I, ret: { x: h.x, z: h.z, yaw: h.yaw }, items: this.roomItems(id, I), near: null }; this.padLock = id; this.panel = null;
    h.x = 0; h.z = I.d / 2 - 1.8; h.y = 0; h.yaw = Math.PI; h.vx = h.vz = h.vy = 0; h.on = true; h.atk = null; h.chute = false; h.climb = false; h.swim = false; this.en = []; this.shots = [];
    this.pet3.x = 1.4; this.pet3.z = h.z; this.eye = [0, 4.7, I.d / 2 + 5]; this.tg = null; Snd.play('click'); Music.play('dojo'); UI.touch(true); h.wade = false;
    if (id === 'cave3') { const p = this.pads.find(q => q.id === 'cave3'); if (p) p.label = '🐻 BEAR CAVE'; }
    if (!S.stats['in_' + id]) { S.stats['in_' + id] = 1; this.say(I.hi, 5); }
  },
  exitRoom() { const h = this.h, r = this.room.ret; this.room = null; h.x = r.x; h.z = r.z; h.y = 0; h.yaw = wrapA(r.yaw + Math.PI); this.camYaw = h.yaw; this.tg = null; this.pet3.x = h.x + 1; this.pet3.z = h.z; Music.play('hub'); Snd.play('click'); Save.save(); },
  roomItems(id, I) {
    const L = [], zb = -I.d / 2, it = (x, z, o) => { const q = Object.assign({ x, z, r: 0.75, reach: 2.2 }, o); L.push(q); return q; };
    const spot = (x, z, c) => G3.agmesh(x, 1.6, z, SPT, 1.1, 1.1, 1.1, C3(c), 0.13);
    if (id === 'food') {
      FOODS.forEach((f, i) => { const x = -7.7 + i * 2.2, z = zb + 2.4; it(x, z, { label: () => `${f.icon} ${f.name}  •  ${f.cost} coins  •  ${f.fx}`, draw: (t, near) => { pedestal3(x, z, 0.9, '#fff6f9', '#ff6b8a'); food3(f.id, M4.ry(M4.t(ID4, x, 0.97 + (near ? 0.12 + Math.sin(t * 5) * 0.04 : 0), z), t * 0.9 + i), near ? 1.75 : 1.45, t); spot(x, z, near ? '#ffe14d' : '#ffb8c6'); }, use: () => this.eat(f) }); });
      it(7.4, 3, { label: () => S.fish ? `🐟 Sell your ${S.fish} fish for ${S.fish * 5} coins` : '🐟 Catch fish in the sea and sell them here', draw: () => { G3.abox(7.4, 0.4, 3, 0.8, 0.4, 0.6, C3('#7dd3ff'), -0.6); for (let k = 0; k < Math.min(6, S.fish); k++) fish3({ x: 7 + k * 0.16, y: 0.9, z: 2.8 + (k % 2) * 0.4, yaw: k, col: '#ff8c1a', s: 0.9, ph: k }, 0); }, use: () => { if (!S.fish) { UI.toast('Swim in the sea and bump into fish to catch them!'); return; } const c = S.fish * 5; S.coins += c; S.fish = 0; Snd.play('coin'); UI.toast(`🐟 Sold! +${c} coins`); Save.save(); } });
      it(0, zb + 0.9, { r: 0.5, draw: t => keeper3(0, zb + 0.9, t, '#ff6b8a', true) }); for (const sx of [-1, 1]) it(sx * 4.5, 2.6, { r: 1.25, draw: () => table3(sx * 4.5, 2.6) }); it(-8.6, 4.6, { r: 0.4, draw: () => plant3(-8.6, 4.6) });
    } else if (id === 'guns') {
      const all = [['m', 'fist'], ['m', 'sword'], ['m', 'hammer'], ['r', 'blaster'], ['r', 'tri'], ['r', 'rocket']];
      all.forEach(([slot, k], i) => { const w = (slot === 'm' ? MELEE : RANGED)[k], x = -7.5 + i * 3, z = zb + 2.6, own = () => !w.cost || S.wp.own[k];
        it(x, z, { label: () => `${w.icon} ${w.name}  •  ${own() ? (S.wp[slot] === k ? '✓ you are using this' : 'press to use it') : w.cost + ' coins'}  •  ${w.desc}`, draw: (t, near) => { pedestal3(x, z, 0.8, '#3a4a7a', '#39d0ff'); weapon3(k, M4.ry(M4.t(ID4, x, 0.95, z), t * 1.1 + i), near ? 1.5 : 1.25); spot(x, z, S.wp[slot] === k ? '#5dff9a' : near ? '#ffe14d' : '#39d0ff'); },
          use: () => { if (!own()) { if (S.coins < w.cost) { Snd.play('wrong'); UI.toast(`You need ${w.cost - S.coins} more coins for the ${w.name}. Saving up is smart!`); return; } S.coins -= w.cost; S.wp.own[k] = true; Snd.play('fanfare'); UI.toast(`${w.icon} You got the ${w.name}!`); } else Snd.play('click'); S.wp[slot] = k; Save.save(); } }); });
      it(-8.4, 3.6, { r: 0.5, draw: t => keeper3(-8.4, 3.6, t, '#39d0ff', false) }); it(8.4, 4.4, { r: 0.4, draw: () => plant3(8.4, 4.4) });
    } else if (id === 'pets') {
      Object.keys(PETS).forEach((k, i) => { const P = PETS[k], x = -6 + i * 4, z = zb + 3.2, a = { kind: k, x, z, y: 0, yaw: 0, moving: true, ph: i * 2, fast: 0 };
        it(x, z, { r: 1.5, reach: 3.1, label: () => `${P.icon} ${P.name}  •  ${S.pets[k] ? (S.pet === k ? '✓ walking with you (press to leave here)' : 'press to take with you') : P.cost + ' coins'}  •  ${P.perk}`,
          draw: (t, near) => { for (let q = 0; q < 10; q++) { const an = q * TAU / 10; G3.amesh(x + Math.cos(an) * 1.5, 0.35, z + Math.sin(an) * 1.5, CYX, 0.05, 0.35, 0.05, C3('#fbf7ea')); } G3.amesh(x, 0.03, z, CYL, 1.5, 0.03, 1.5, C3('#58c773'), 11); if (S.pet === k) return; const an = t * 0.9 + i; a.x = x + Math.cos(an) * 0.7; a.z = z + Math.sin(an) * 0.7; a.yaw = Math.atan2(-Math.sin(an), Math.cos(an)); a.y = k === 'parrot' ? 0.9 : 0; animal3(a, t); if (near) spot(x, z, '#ffe14d'); },
          use: () => { if (!S.pets[k]) { if (S.coins < P.cost) { Snd.play('wrong'); UI.toast(`You need ${P.cost - S.coins} more coins for the ${P.name.toLowerCase()}.`); return; } S.coins -= P.cost; S.pets[k] = 1; S.pet = k; Snd.play('fanfare'); UI.toast(`${P.icon} The ${P.name.toLowerCase()} is your pet now!`); say(`You have a new pet! ${P.perk}.`); UI.badgeToasts(checkBadges()); } else { S.pet = S.pet === k ? null : k; Snd.play('heart'); } this.pet3.x = this.h.x + 1; this.pet3.z = this.h.z; Save.save(); } }); });
      it(8, 3.8, { r: 0.5, draw: t => keeper3(8, 3.8, t, '#ffb347', false) }); it(-8.2, 4.4, { r: 0.4, draw: () => plant3(-8.2, 4.4) });
    } else if (id === 'bank') {
      it(-5, zb + 2.2, { r: 1.3, reach: 3, label: () => `💰 Savings desk  •  you have ${S.bank.sav} coins saved`, draw: t => { G3.abox(-5, 0.55, zb + 2.2, 2.2, 0.55, 0.6, C3('#6b4a2b'), -0.3); G3.abox(-5, 1.14, zb + 2.2, 2.3, 0.05, 0.7, C3('#ffd23f'), -0.8); keeper3(-5, zb + 1.1, t, '#3a5a48', false); }, use: () => this.openPanel('savings') });
      it(4.5, zb + 2.4, { r: 0.6, reach: 3, label: () => '📈 Stock market  •  buy little pieces of companies', draw: t => { G3.abox(4.5, 3.1, zb + 0.2, 3.2, 1.5, 0.08, C3('#0e1428')); STOCKS.forEach((s, i) => { const H = S.bank.hist[s.id] || [s.p0], up = H[H.length - 1] >= H[Math.max(0, H.length - 2)]; for (let q = 0; q < Math.min(8, H.length); q++) { const v = H[H.length - 1 - q] / (s.p0 * 2.2); G3.abox(6.9 - i * 1.6 - q * 0.16, 1.8 + v * 1.1, zb + 0.3, 0.06, v * 1.1, 0.02, C3(up ? '#5dff9a' : '#ff6b5a'), 1); } }); G3.amesh(4.5, 0.5, zb + 2.4, CYX, 0.08, 0.5, 0.08, C3('#8a93a6')); G3.abox(4.5, 1.05, zb + 2.4, 0.5, 0.04, 0.35, C3('#39d0ff'), 0.8); }, use: () => this.openPanel('stocks') });
      it(8.4, zb + 1.2, { r: 1.6, draw: t => { G3.mesh(M4.rx(M4.t(ID4, 8.4, 2, zb + 0.3), HPI), CYL, 1.9, 0.25, 1.9, C3('#9aa4b8'), -0.9); G3.mesh(M4.rz(M4.rx(M4.t(ID4, 8.4, 2, zb + 0.6), HPI), t * 0.4), CYX, 0.9, 0.06, 0.12, C3('#ffd23f'), -0.9); const n = Math.min(14, Math.floor(S.bank.sav / 50)); for (let q = 0; q < n; q++) G3.abox(6.2 + (q % 4) * 0.5, 0.12 + Math.floor(q / 4) * 0.22, zb + 2.6, 0.22, 0.1, 0.4, C3('#ffd23f'), -0.95); } });
      it(-8.6, 2, { r: 0.6, reach: 2.6, label: () => '🏗️ Make the bank bigger (savings grow faster)', draw: () => { G3.abox(-8.6, 0.5, 2, 0.5, 0.5, 0.5, C3('#6b4a2b')); G3.abox(-8.6, 1.3, 2, 0.4, 0.3, 0.05, C3('#ffe14d'), 0.8); }, use: () => this.openPanel('b_bank') });
      for (const sx of [-1, 1]) it(sx * 1.2, 3.5, { r: 0.4, draw: () => plant3(sx * 1.2 + sx * 7.5, 5) });
    } else if (id === 'house') {
      const lv = S.house;
      it(-6, zb + 2.3, { r: 1.5, reach: 3, label: () => '🛏️ Sleep  •  heals you and saves your game', draw: () => { G3.abox(-6, 0.35, zb + 2.3, 1.2, 0.35, 2, C3('#8a6a4a')); G3.abox(-6, 0.78, zb + 2.6, 1.1, 0.1, 1.6, C3(SUITS[S.suit][0]), -0.1); G3.amesh(-6, 0.9, zb + 0.9, SPX, 0.7, 0.2, 0.4, WHITE, 0); G3.abox(-6, 1.0, zb + 0.35, 1.25, 0.9, 0.1, C3('#6b4a2b')); }, use: () => { const h = this.h; h.hp = h.maxHp; h.en = h.maxEn; this.flash = 0.8; this.tod = 0.27; Snd.play('heart'); Save.save(); UI.toast('😴 Good morning! You feel great. Game saved.'); } });
      it(5.6, zb + 1, { r: 1.2, reach: 2.9, label: () => '👕 Wardrobe  •  change your suit color', draw: () => { G3.abox(5.6, 1.4, zb + 0.6, 1.2, 1.4, 0.5, C3('#8a6a4a'), -0.2); for (const s of [-1, 1]) { G3.abox(5.6 + s * 0.6, 1.4, zb + 1.12, 0.56, 1.3, 0.02, C3('#a8825c')); G3.amesh(5.6 + s * 0.12, 1.4, zb + 1.17, SPT, 0.05, 0.05, 0.05, C3('#ffd23f'), -0.8); } }, use: () => this.openPanel('wardrobe') });
      it(0, zb + 0.8, { r: 1.1, reach: 2.8, label: () => `🏅 Trophy shelf  •  ${BADGES.filter(b => S.badges[b.id]).length} badges`, draw: () => { G3.abox(0, 1.3, zb + 0.4, 1.8, 0.05, 0.35, C3('#8a6a4a')); G3.abox(0, 2.1, zb + 0.4, 1.8, 0.05, 0.35, C3('#8a6a4a')); const n = Math.min(10, BADGES.filter(b => S.badges[b.id]).length); for (let q = 0; q < n; q++) { const x = -1.5 + (q % 5) * 0.75, y = q < 5 ? 1.35 : 2.15; G3.amesh(x, y + 0.08, zb + 0.4, CYX, 0.1, 0.08, 0.1, C3('#6b4a2b')); G3.amesh(x, y + 0.32, zb + 0.4, SPT, 0.13, 0.17, 0.13, C3('#ffd23f'), -0.95); } }, use: () => this.openPanel('badges') });
      it(6.6, 3, { r: 0.7, reach: 2.6, label: () => lv >= 3 ? '🏠 Your home is a Hero Villa - the biggest there is!' : `🏠 Make the house bigger  •  ${HOUSES[lv + 1].name}: ${HOUSES[lv + 1].cost} coins`, draw: () => { G3.abox(6.6, 0.4, 3, 0.7, 0.4, 0.5, C3('#8a6a4a')); G3.abox(6.6, 0.95, 3, 0.4, 0.14, 0.3, C3('#5fd68a'), 0.6); }, use: () => this.openPanel('housebuy') });
      it(2.6, 3.4, { r: 0.1, draw: () => { G3.amesh(2.6, 0.12, 3.4, CYL, 0.6, 0.12, 0.6, C3('#e5383b'), 0); G3.amesh(2.6, 0.2, 3.4, CYL, 0.48, 0.1, 0.48, C3('#fff6c9'), 0); } });
      if (lv >= 2) { it(-6.8, 2.6, { r: 1, reach: 2.6, label: () => `🐟 Aquarium  •  ${S.fish} fish inside (catch more in the sea)`, draw: t => { G3.abox(-6.8, 0.4, 2.6, 0.9, 0.4, 0.5, C3('#3a2a1c')); G3.abox(-6.8, 1.3, 2.6, 0.9, 0.5, 0.5, C3('#39a0ff'), 0.45); for (let k = 0; k < Math.min(8, S.fish); k++) fish3({ x: -6.8 + Math.sin(t * 0.8 + k * 1.7) * 0.6, y: 1.05 + (k % 4) * 0.14, z: 3.13, yaw: Math.cos(t * 0.8 + k * 1.7) > 0 ? HPI : -HPI, col: ['#ff8c1a', '#ffd23f', '#ff6b9d', '#5fd68a'][k % 4], s: 0.7, ph: k }, t); }, use: () => UI.toast(S.fish ? `Your aquarium has ${S.fish} fish. They look happy!` : 'The aquarium is empty. Catch fish in the sea!') }); it(0, 2.2, { r: 0.1, draw: () => G3.abox(0, 0.02, 2.2, 2.4, 0.02, 1.5, C3(SUITS[S.suit][1]), 0) }); }
      if (lv >= 3) { it(-1.5, 4.2, { r: 0.9, draw: () => { G3.abox(-1.5, 0.4, 4.2, 1.6, 0.35, 0.6, C3('#3a78d8'), -0.1); G3.abox(-1.5, 0.9, 4.75, 1.6, 0.45, 0.14, C3('#3a78d8'), -0.1); } }); it(-1.5, zb + 0.5, { r: 0.1, draw: t => { G3.abox(-3.6, 2.2, zb + 0.3, 1.3, 0.75, 0.05, C3('#0e1428')); G3.abox(-3.6, 2.2, zb + 0.36, 1.2, 0.66, 0.01, C3(['#39d0ff', '#ff6b8a', '#ffd23f'][Math.floor(t) % 3]), 0.7); } }); it(8, zb + 1, { r: 0.4, draw: () => plant3(7.6, zb + 1) }); }
    } else if (I.cave) {
      const star = (x, z, sid) => it(x, z, { r: 0.1, draw: t => { if (!S.stars[sid]) star3(x, 1.3, z, t); }, touch: () => this.getStar(sid, x, 1.3, z) });
      const stone = (x, z, s) => it(x, z, { r: 0.75 * s, draw: () => { G3.amesh(x, 0, z, SPX, 0.9 * s, 0.75 * s, 0.8 * s, C3('#6a6870'), 13); G3.amesh(x + 0.3 * s, 0.6 * s, z, CONE, 0.3 * s, 0.9 * s, 0.3 * s, C3('#77757e'), 13); } });
      if (id === 'cave1') {
        const cc = ['#b388ff', '#7df9ff', '#ff6b9d', '#5dff9a', '#ffd23f', '#39d0ff'];
        [[-7.6, zb + 2.3], [-4.3, zb + 3.8], [-1, zb + 2], [2.6, zb + 3.4], [5.6, zb + 2.1], [8, zb + 4.6]].forEach(([x, z], i) => { const key = 'gem' + i, ready = () => !(S.caveT[key] > Date.now());
          it(x, z, { r: 0.7, reach: 2.4, label: () => ready() ? '⛏️ Dig out the crystal  •  coins and XP' : '🌱 This crystal is growing back...',
            draw: (t, near) => { const s = ready() ? 1 : 0.3; for (let q = 0; q < 3; q++) G3.mesh(M4.rz(M4.rx(M4.t(ID4, x + (q - 1) * 0.3, 0, z), (q - 1) * 0.25), (1 - q) * 0.3), CONE, 0.22 * s, (0.9 + (q % 2) * 0.5) * s, 0.22 * s, C3(cc[i]), 0.6); if (ready()) G3.agmesh(x, 0.7, z, SPL, 1.0, 0.9, 1.0, C3(cc[i]), near ? 0.3 : 0.14 + Math.sin(t * 2 + i) * 0.04); },
            use: () => { if (!ready()) { UI.toast('This crystal needs a few minutes to grow back.'); return; } S.caveT[key] = Date.now() + 240000; const c = 20 + Math.floor(Math.random() * 16); S.coins += c; S.stats.gems = (S.stats.gems || 0) + 1; Snd.play('coin'); this.fx.spark(x, 0.8, z, 20, cc[i], 7); this.text(x, 1.8, z, '+' + c + ' 💎', '#ffe14d', 30); this.gainXp(8); UI.badgeToasts(checkBadges()); Save.save(); } }); });
        star(-8.4, 4.2, 28); stone(4.2, 4.4, 1); stone(-2.6, 4.8, 0.7);
      } else if (id === 'cave2') {
        const full = () => !(S.chestT > Date.now());
        it(0, zb + 2.4, { r: 1.1, reach: 2.8, label: () => full() ? '💰 Open the treasure chest!' : '💰 The chest is empty. The pirates fill it again later...',
          draw: (t, near) => { const z = zb + 2.4, o = full() ? 0 : 1; G3.abox(0, 0.4, z, 0.95, 0.4, 0.6, C3('#7a4a2a'), -0.2); for (const s of [-1, 1]) G3.abox(s * 0.6, 0.4, z, 0.07, 0.42, 0.62, C3('#ffd23f'), -0.9); G3.mesh(M4.rx(M4.t(ID4, 0, 0.8, z - 0.6), -o * 1.1), CYL, 0.95, 0.001, 0.001, C3('#7a4a2a')); G3.box(M4.t(M4.rx(M4.t(ID4, 0, 0.8, z - 0.6), -o * 1.1), 0, 0.14, 0.6), 0.97, 0.14, 0.62, C3('#8a5a34'), -0.2); if (!o) { G3.abox(0, 0.62, z + 0.61, 0.12, 0.14, 0.03, C3('#ffd23f'), -0.9); G3.agmesh(0, 0.9, z, SPL, 1.4, 1.1, 1.3, C3('#ffd23f'), near ? 0.28 : 0.14 + Math.sin(t * 3) * 0.04); } },
          use: () => { if (!full()) { UI.toast('The chest is empty. Come back later!'); return; } const first = !S.stats.chest, c = first ? 400 : 90 + Math.floor(Math.random() * 60); S.stats.chest = (S.stats.chest || 0) + 1; S.chestT = Date.now() + 600000; S.coins += c; this.coinPulse = 1; Snd.play('fanfare'); this.fx.spark(0, 1, zb + 2.4, 40, '#ffd23f', 9); this.text(0, 2.2, zb + 2.4, '+' + c + ' coins!', '#ffe14d', 36); this.gainXp(first ? 60 : 15); UI.toast(first ? '🏴‍☠️ You found the pirate treasure! +' + c + ' coins' : '💰 +' + c + ' coins'); UI.badgeToasts(checkBadges()); Save.save(); } });
        for (const [x, z] of [[-6.4, zb + 2], [-5.1, zb + 2.5], [6, zb + 2.2]]) it(x, z, { r: 0.6, draw: () => { G3.amesh(x, 0.6, z, CYL, 0.5, 0.6, 0.5, C3('#7a4a2a'), -0.1); for (const y of [0.25, 0.95]) G3.amesh(x, y, z, CYL, 0.53, 0.05, 0.53, C3('#3a3d48'), -0.6); } });
        it(5.4, 3.6, { r: 0.4, draw: t => { G3.amesh(5.4, 1.1, 3.6, CYX, 0.05, 1.1, 0.05, C3('#6b4a2b')); G3.abox(5.4, 2.1, 3.6, 0.45, 0.04, 0.04, C3('#6b4a2b')); animal3({ kind: 'parrot', x: 5.4, y: 2.0, z: 3.6, yaw: -2.2 + Math.sin(t) * 0.3, moving: false, ph: 0, col: '#e5383b' }, t); } });
        it(-7.4, 4.6, { r: 0.1, draw: () => { G3.amesh(-7.4, 2.4, zb + 0.5, CYX, 0.05, 2.4, 0.05, C3('#6b4a2b')); G3.abox(-6.6, 4.1, zb + 0.5, 0.8, 0.55, 0.02, C3('#111114')); G3.amesh(-6.6, 4.2, zb + 0.54, SPT, 0.22, 0.24, 0.03, WHITE); G3.box(M4.rz(M4.t(ID4, -6.6, 3.85, zb + 0.54), 0.5), 0.3, 0.04, 0.02, WHITE); G3.box(M4.rz(M4.t(ID4, -6.6, 3.85, zb + 0.54), -0.5), 0.3, 0.04, 0.02, WHITE); } });
        stone(-2.8, 4.4, 0.8);
      } else {
        const b = { kind: 'bear', x: -3.4, y: 0, z: zb + 3, yaw: 0.9, moving: false, ph: 0, wait: 0 };
        it(-3.4, zb + 3, { r: 1.5, reach: 3.3, label: () => `🐻 Pet the sleepy bear${S.friends.bear ? ' ❤' : ''}`, draw: t => { b.y = Math.sin(t * 1.6) * 0.03; animal3(b, t); for (let k = 0; k < 3; k++) { const p = (t * 0.5 + k / 3) % 1; G3.aglow(-2.6 + p * 0.6, 2.2 + p * 1.2, zb + 3.8, 0.05 + p * 0.06, 0.05 + p * 0.06, 0.01, WHITE, 0.9 * (1 - p)); } }, use: () => this.petAnimal(b) });
        it(4, zb + 2.4, { r: 0.6, reach: 2.5, label: () => '🍯 Eat some honey  •  heals you all the way', draw: (t, near) => { G3.amesh(4, 0.45, zb + 2.4, SPX, 0.5, 0.45, 0.5, C3('#c98f3c'), -0.4); G3.amesh(4, 0.86, zb + 2.4, CYX, 0.36, 0.06, 0.36, C3('#8a5a2c')); G3.amesh(4, 0.93, zb + 2.4, CYX, 0.3, 0.02, 0.3, C3('#ffc93c'), 0.6); if (near) G3.agmesh(4, 0.9, zb + 2.4, SPT, 1, 0.9, 1, C3('#ffd23f'), 0.3); }, use: () => { const h = this.h; h.hp = h.maxHp; h.en = h.maxEn; Snd.play('heart'); this.text(4, 2, zb + 2.4, 'Yum! 🍯', '#ffe14d', 32); UI.toast('🍯 Sweet honey! You are all healed.'); } });
        it(-6.6, 4, { r: 0.1, draw: () => { G3.amesh(-4.2, 0.06, zb + 3.4, CYL, 2.6, 0.06, 2, C3('#6a7a3a'), 11); for (let k = 0; k < 3; k++) G3.amesh(6.2 + k * 0.4, 0.12, 3.6 - k * 0.3, SPT, 0.22, 0.1, 0.4, C3('#c9d2e0')); } });
        star(6.8, 1.6, 29); stone(1, 4.3, 0.8);
      }
    } else if (id === 'dojo') {
      ['str', 'spd', 'foc'].forEach((k, i) => { const D = DOJO_INFO[k], x = -5.5 + i * 5.5, z = zb + 3;
        it(x, z, { r: 0.8, reach: 2.6, label: () => `${D.icon} ${D.name}  •  trains ${D.stat} (level ${S[k]})  •  ${D.gives}`, draw: (t, near) => { if (k === 'str') { G3.amesh(x, 4.4, z, CYX, 0.04, 1.2, 0.04, C3('#2a1d14')); G3.mesh(M4.rz(M4.t(ID4, x, 2.1, z), near ? Math.sin(t * 6) * 0.15 : 0), CYL, 0.45, 1.1, 0.45, C3('#d9483b'), -0.3); } else if (k === 'spd') { for (let q = 0; q < 4; q++) { const an = q * HPI + t; G3.amesh(x + Math.cos(an) * 0.6, 0.12, z + Math.sin(an) * 0.6, CYL, 0.3, 0.1, 0.3, C3(PAD_COL[q]), 0.7); } G3.amesh(x, 1.2, z, SPX, 0.35, 0.3, 0.35, C3('#93a1b8'), -0.6); G3.amesh(x, 0.55, z, CYX, 0.06, 0.45, 0.06, C3('#465066')); } else { G3.mesh(M4.ry(M4.t(ID4, x, 1.5 + Math.sin(t * 2) * 0.1, z), t), CONE, 0.4, 0.5, 0.4, C3('#7df9ff'), 0.8); G3.mesh(M4.rx(M4.ry(M4.t(ID4, x, 0.6 + Math.sin(t * 2) * 0.1, z), t), Math.PI), CONE, 0.4, 0.4, 0.4, C3('#39d0ff'), 0.7); } spot(x, z, near ? '#ffe14d' : '#ff8c1a'); }, use: () => { Game.go(new Dojo(k)); } }); });
      it(-8, 4, { r: 0.5, draw: t => keeper3(-8, 4, t, '#f4f8ff', false) });
    }
    return L;
  },
  upRoom(dt) {
    const h = this.h, R = this.room, I = R.I; this.upClock(dt);
    const mx = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0), mz = (Input.held('dn') ? 1 : 0) - (Input.held('up') ? 1 : 0); h.mv = 0;
    if (mx || mz) { const l = Math.hypot(mx, mz); h.yaw = lerpA(h.yaw, Math.atan2(mx, mz), Math.min(1, dt * 14)); h.x += mx / l * 5.6 * dt; h.z += mz / l * 5.6 * dt; h.mv = 1; }
    h.x = clamp(h.x, -I.w / 2 + 0.6, I.w / 2 - 0.6); h.z = clamp(h.z, -I.d / 2 + 0.8, Math.abs(h.x) < 1.7 ? I.d / 2 + 0.6 : I.d / 2 - 0.7);
    let near = null, bd = 99;
    for (const q of R.items) { const dx = h.x - q.x, dz = h.z - q.z, d = Math.hypot(dx, dz); if (q.r > 0.2 && d < q.r + 0.45 && d > 0.01) { h.x = q.x + dx / d * (q.r + 0.45); h.z = q.z + dz / d * (q.r + 0.45); } if (q.use && d < q.reach && d < bd) { bd = d; near = q; } if (q.touch && d < 1.5) q.touch(); }
    R.near = near;
    if (near && (Input.hit('use') || Input.hit('punch') || Input.hit('ok') || Input.hit('jump') || Input.mouse.clicked)) { near.use(); if (!this.room) return; }
    if (h.z > I.d / 2 + 0.3) { this.exitRoom(); return; }
    h.en = Math.min(h.maxEn, h.en + Calc.regen() * dt);
    const p = this.pet3, gx = h.x + 1.1, gz = h.z + 0.5, dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz); p.kind = S.pet; p.moving = d > 0.4; if (p.moving) { p.yaw = lerpA(p.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10)); p.x += dx * Math.min(1, dt * 5); p.z += dz * Math.min(1, dt * 5); } p.y = S.pet === 'parrot' ? 1.8 : 0;
    const e = this.eye, k = Math.min(1, dt * 6), g = this.tg || (this.tg = [0, 1.1, 0]);
    e[0] = lerp(e[0], h.x * 0.8, k); e[1] = 4.7; e[2] = lerp(e[2], h.z + 6.8, k); g[0] = lerp(g[0], h.x * 0.9, k); g[1] = 1.3; g[2] = lerp(g[2], h.z - 2.4, k); this.tgt = g; // a close view from behind the hero
  },
  drawRoom(g) {
    const h = this.h, R = this.room, I = R.I, t = this.t, e = this.eye, tg = this.tgt || [0, 1.1, 0], w = I.w / 2, d = I.d / 2, wall = C3(I.wall), trim = C3(I.trim);
    this.vp = M4.mul(this.proj, M4.look(e[0], e[1], e[2], tg[0], tg[1], tg[2]));
    const env = this.roomEnv || (this.roomEnv = { top: [0.04, 0.05, 0.09], hor: [0.09, 0.1, 0.15], fog: [0.09, 0.1, 0.15], amb: [0.76, 0.74, 0.72], sunCol: [0.5, 0.48, 0.44], sun: SUN_DIR, fogD: 600, litA: [0, 0, 0], litB: [0, 0, 0], sunDisc: [0, 0, 0], sunScr: [0, 0, 0], cloud: [0, 0, 0], cloudA: 0, yaw: 0, time: 0, noStatic: true });
    const env2 = I.cave ? (this.caveEnv || (this.caveEnv = Object.assign({}, env, { amb: [0.46, 0.44, 0.56], sunCol: [0.24, 0.22, 0.28], top: [0.01, 0.01, 0.02], hor: [0.03, 0.03, 0.05], fog: [0.03, 0.03, 0.05], fogD: 70 }))) : env;
    env.time = env2.time = t; G3.begin();
    if (I.cave) this.drawCave(I, w, d, t); else {
    G3.abox(0, -0.1, 0, w, 0.1, d + 1, C3(I.floor), 10); G3.abox(0, 3.2, -d - 0.2, w + 0.4, 3.2, 0.2, wall); for (const s of [-1, 1]) { G3.abox(s * (w + 0.2), 3.2, 0, 0.2, 3.2, d, wall); G3.abox(s * (w - 0.02), 1.1, 0, 0.02, 0.09, d, trim, 0.6); }
    G3.abox(0, 1.1, -d + 0.02, w, 0.09, 0.02, trim, 0.6); G3.abox(0, 6.3, -d + 0.02, w, 0.14, 0.04, trim, 0.8); G3.abox(0, 0.02, d - 0.1, 1.7, 0.02, 0.8, C3('#5fd68a'), 0.6);
    for (const s of [-1, 1]) G3.abox(s * 1.9, 1.5, d + 0.2, 0.16, 1.5, 0.16, trim, 0.4);
    for (let k = -1; k <= 1; k++) { G3.amesh(k * w * 0.55, 6.1, -1, CYL, 0.5, 0.08, 0.5, WHITE, 1); G3.agmesh(k * w * 0.55, 5.6, -1, SPT, 1.5, 0.8, 1.5, C3('#fff6c9'), 0.25); }
    }
    for (const q of R.items) if (q.draw) q.draw(t, q === R.near);
    G3.shadow(h.x, 0.03, h.z, 0.75, 0.5); hero3({ x: h.x, y: 0, z: h.z, yaw: h.yaw, t, pose: h.mv ? 'run' : 'idle', pt: 0, armor: S.armor, suit: S.suit, melee: S.wp.m, ranged: S.wp.r });
    if (S.pet) { G3.shadow(this.pet3.x, 0.03, this.pet3.z, 0.4, 0.35); animal3(this.pet3, t); }
    this.fx.draw(); G3.render(this.vp, e, env2); g.clearRect(0, 0, W, H); this.drawRoomHud(g);
  },
  drawCave(I, w, d, t) { // rock walls, boulders, hanging stones, torches, bats and daylight at the way out
    const wall = C3(I.wall), rk = mulC(wall, 1.3);
    G3.abox(0, -0.1, 4, w + 6, 0.1, d + 8, C3(I.floor), 13); G3.abox(0, 3.6, -d - 0.6, w + 2, 3.8, 0.6, wall, 13); for (const s of [-1, 1]) G3.abox(s * (w + 0.6), 3.6, 0, 0.6, 3.8, d + 1, wall, 13);
    for (let k = 0; k < 9; k++) { const x = -w + 1 + k * (w * 2 - 2) / 8, q = (k * 37 % 10) / 10; G3.amesh(x, 0, -d + 0.2, SPX, 1.6 + q, 1.4 + q * 2.2, 1.2, rk, 13); G3.mesh(M4.rx(M4.t(ID4, x + 0.8, 6.9 - q, -d + 1.5 + q * 2.5), Math.PI), CONE, 0.3 + q * 0.2, 0.9 + q, 0.3 + q * 0.2, rk, 13); }
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const z = -d + 2 + k * (d * 2 - 7) / 3, q = ((k + (s > 0 ? 2 : 0)) * 53 % 10) / 10; G3.amesh(s * (w + 0.1), 0, z, SPX, 1.2, 1.3 + q * 2, 1.5 + q, rk, 13); }
    for (const s of [-1, 1]) { const x = s * (w - 0.5), z = -d * 0.25, fl = 1 + Math.sin(t * 14 + s) * 0.2; G3.amesh(x, 2.3, z, CYX, 0.05, 0.4, 0.05, C3('#6b4a2b')); G3.agmesh(x, 2.95, z, CONE, 0.14, 0.3 * fl, 0.14, C3('#ffb347'), 1.3); G3.agmesh(x, 2.8, z, SPL, 2.0, 1.6, 2.0, C3('#ff8c1a'), 0.1); }
    G3.abox(0, 0.02, d - 0.1, 1.7, 0.02, 0.9, C3('#dff4ff'), 0.7); G3.agmesh(0, 0.6, d - 0.4, SPL, 2.4, 1.2, 1.8, C3('#dff4ff'), 0.1); // daylight falls in at the way out
    for (let k = 0; k < 4; k++) { const a = t * (0.8 + k * 0.13) + k * 1.7; animal3({ kind: 'bat', x: Math.cos(a) * (3 + k), y: 4.4 + Math.sin(t * 2 + k) * 0.4, z: Math.sin(a) * 2.2 - 1, yaw: -a, ph: k, moving: true }, t); }
  },
  drawRoomHud(g) {
    const h = this.h, R = this.room, I = R.I, t = this.t; g.textBaseline = 'middle';
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${clamp(this.flash, 0, 1)})`; g.fillRect(0, 0, W, H); }
    this.pill(g, W / 2, 36, I.name, I.trim, 1.5);
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, 14, 12, 330, 58, 18); g.fill(); g.fillStyle = SUITS[S.suit][0]; circ(g, 44, 41, 24); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `bold 22px ${FONT}`; g.fillText(S.level, 44, 42);
    this.bar(g, 80, 26, 250, 16, h.hp / h.maxHp, '#2fbf71', '#9be36a'); this.bar(g, 80, 50, 250, 9, h.en / h.maxEn, '#1b6fd6', '#7df9ff'); g.fillStyle = '#fff'; g.font = `bold 12px ${FONT}`; g.fillText(`♥ ${Math.ceil(h.hp)} / ${h.maxHp}`, 205, 35);
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W - 214, 12, 200, 50, 25); g.fill(); drawCoin(g, W - 184, 37, 15, t); g.fillStyle = '#ffe14d'; g.font = `bold 28px ${FONT}`; g.textAlign = 'left'; g.fillText(S.coins, W - 160, 38);
    const ex = this.toScreen(0, 2.6, I.d / 2); if (ex) this.pill(g, ex[0], ex[1], '🚪 EXIT', '#5fd68a', 1);
    g.textAlign = 'center'; for (const x of this.texts) { const s = this.toScreen(x.x, x.y, x.z); if (!s) continue; g.globalAlpha = clamp(x.life * 2.5, 0, 1); g.font = `bold ${x.size}px ${FONT}`; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(x.str, s[0], s[1]); g.fillStyle = x.col; g.fillText(x.str, s[0], s[1]); } g.globalAlpha = 1;
    const n = R.near;
    if (n) { const txt = n.label(); g.font = `bold 22px ${FONT}`; const lines = wrapText(g, txt, 900), bh = 30 + lines.length * 30, bw = Math.min(980, Math.max(...lines.map(l => g.measureText(l).width)) + 150); g.fillStyle = 'rgba(10,14,26,0.86)'; rr(g, W / 2 - bw / 2, 690 - bh, bw, bh, 18); g.fill(); g.strokeStyle = '#ffe14d'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#ffe14d'; rr(g, W / 2 - bw / 2 + 14, 690 - bh / 2 - 17, 64, 34, 8); g.fill(); g.fillStyle = '#14182a'; g.textAlign = 'center'; g.fillText(UI.isTouch ? 'TAP F' : 'F', W / 2 - bw / 2 + 46, 690 - bh / 2 + 1); g.fillStyle = '#fff'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, W / 2 - bw / 2 + 96, 690 - bh + 30 + i * 30)); }
    else { g.fillStyle = 'rgba(10,14,26,0.66)'; rr(g, W / 2 - 250, 664, 500, 36, 14); g.fill(); g.fillStyle = '#fff'; g.font = `bold 17px ${FONT}`; g.textAlign = 'center'; g.fillText(UI.isTouch ? 'Use the stick to walk  •  walk up to things and tap F' : 'Arrow keys to walk  •  walk up to things and press F', W / 2, 683); }
    if (this.boltMsg) { const b = this.boltMsg, a = clamp(Math.min(b.t * 4, (b.dur - b.t) * 3), 0, 1); g.globalAlpha = a; g.font = `19px ${FONT}`; const lines = wrapText(g, b.text, 560), bh = 20 + lines.length * 24; g.fillStyle = 'rgba(255,255,255,0.95)'; rr(g, W / 2 - 300, 78, 600, bh, 16); g.fill(); g.fillStyle = '#14182a'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, W / 2 - 284, 100 + i * 24)); g.globalAlpha = 1; }
  },
  /* small panels opened from inside rooms */
  placePanel(id, X) {
    const B = S.bank;
    if (id === 'savings') {
      const rate = (0.4 + 0.2 * S.build.bank).toFixed(1), bt = (a, n) => `<button class="btn ${a === 'dep' ? 'green' : ''}" data-act="${a}" data-arg="${n}">${n === 'all' ? 'ALL' : n}</button>`;
      return `<div class="dim lite"><div class="panel" style="width:760px">${X}<h2>💰 SAVINGS</h2><p class="sub">Coins in your pocket never grow. Coins in the bank grow by <b>${rate}%</b> every little while, all by themselves. The more you save, the more you get!</p>
        <div class="rows"><div>👛 In your pocket <b>${S.coins}</b></div><div>🏦 Saved in the bank <b>${B.sav}</b></div></div>
        <h3>Put coins in the bank</h3><div class="brow">${[10, 50, 100, 'all'].map(n => bt('dep', n)).join('')}</div><h3>Take coins out</h3><div class="brow">${[10, 50, 100, 'all'].map(n => bt('wd', n)).join('')}</div></div></div>`;
    }
    if (id === 'stocks') {
      let worth = 0; const rows = STOCKS.map(s => { const p = stockPx(s.id), H = B.hist[s.id] || [s.p0, p], prev = H[Math.max(0, H.length - 2)], ch = (p - prev) / prev * 100, n = B.sh[s.id] || 0, mx = Math.max(...H), mn = Math.min(...H), pts = H.map((v, i) => `${(i / Math.max(1, H.length - 1) * 100).toFixed(0)},${(30 - (v - mn) / Math.max(0.01, mx - mn) * 26).toFixed(0)}`).join(' '); worth += n * p;
        return `<div class="wrow"><span class="aicon" style="background:#1f3a5a">${s.icon}</span><span class="ainfo"><b>${s.name}</b><small>${s.desc}</small></span><svg width="100" height="32" style="flex:none"><polyline points="${pts}" fill="none" stroke="${ch >= 0 ? '#5dff9a' : '#ff6b5a'}" stroke-width="3"/></svg><span style="width:120px;text-align:right;flex:none"><b style="font-size:22px">${p}</b><small style="color:${ch >= 0 ? '#5dff9a' : '#ff6b5a'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(1)}%</small></span><span style="width:96px;text-align:center;flex:none"><small>you own</small><b>${n}</b></span><button class="btn green" data-act="sbuy" data-arg="${s.id}:1">BUY 1</button><button class="btn green" data-act="sbuy" data-arg="${s.id}:5">BUY 5</button><button class="btn red" data-act="ssell" data-arg="${s.id}:${n}">SELL ALL</button></div>`; }).join('');
      return `<div class="dim lite"><div class="panel" style="width:1120px">${X}<h2>📈 STOCK MARKET</h2><p class="sub">A <b>share</b> is a tiny piece of a company. If the company does well, its price goes up and you can sell your shares for more than you paid. But prices can also go <b>down</b>! Prices change every little while.</p>${rows}
        <div class="coinsline"><i class="coin"></i> In your pocket: ${S.coins} &nbsp;•&nbsp; Your shares are worth: ${Math.round(worth)} coins</div><p class="sub">💡 Smart investors do not put all their coins in one place.</p></div></div>`;
    }
    if (id === 'housebuy') {
      const lv = S.house, N = HOUSES[lv + 1];
      return `<div class="dim lite"><div class="panel center" style="width:640px">${X}<h2>🏠 ${lv ? 'MY HOUSE' : 'HOUSE FOR SALE'}</h2>${lv ? `<p class="sub">You live in a <b>${HOUSES[lv].name}</b>.</p>` : '<p class="sub">Your very own home! Sleep in your bed to heal, change your suit in the wardrobe and show off your trophies.</p>'}
        ${N ? `<p class="sub">${lv ? 'Next: ' : ''}<b>${N.name}</b>${lv === 1 ? ' - bigger, with an aquarium for the fish you catch' : lv === 2 ? ' - a villa with a pool, a sofa and a TV' : ''}</p><button class="btn ${S.coins >= N.cost ? 'gold' : 'gray'} huge" data-act="hbuy" data-key="enter"><i class="coin"></i> ${N.cost} &nbsp; ${lv ? 'UPGRADE' : 'BUY IT!'}</button>` : '<div class="tag gold">★ The biggest house in Nova City!</div>'}
        <div class="coinsline"><i class="coin"></i> You have ${S.coins} coins</div></div></div>`;
    }
    if (id === 'wardrobe') return `<div class="dim lite"><div class="panel center">${X}<h2>👕 WARDROBE</h2><p class="sub">Pick your suit color. Your car, jet and flag change too!</p><div class="suits">${SUITS.map((s, i) => `<button class="suit ${i === S.suit ? 'on' : ''}" style="background:${s[0]}" data-act="suit" data-arg="${i}"></button>`).join('')}</div><button class="btn gold" data-act="close" data-key="enter">LOOKS GREAT!</button></div></div>`;
    return null;
  },
  placeAct(a, arg) {
    const B = S.bank;
    if (a === 'dep' || a === 'wd') { const have = a === 'dep' ? S.coins : B.sav, n = arg === 'all' ? have : Math.min(+arg, have); if (n <= 0) { Snd.play('wrong'); UI.toast(a === 'dep' ? 'You have no coins in your pocket.' : 'You have no coins saved yet.'); return true; } if (a === 'dep') { S.coins -= n; B.sav += n; } else { S.coins += n; B.sav -= n; } Snd.play('coin'); UI.badgeToasts(checkBadges()); Save.save(); this.openPanel('savings'); return true; }
    if (a === 'sbuy') { const [id, n] = arg.split(':'), p = stockPx(id), cost = Math.ceil(p * +n); if (S.coins < cost) { Snd.play('wrong'); UI.toast(`You need ${cost - S.coins} more coins to buy that.`); return true; } S.coins -= cost; B.sh[id] = (B.sh[id] || 0) + +n; Snd.play('coin'); UI.badgeToasts(checkBadges()); Save.save(); this.openPanel('stocks'); return true; }
    if (a === 'ssell') { const [id, n] = arg.split(':'); if (!+n) { Snd.play('wrong'); UI.toast('You do not own any of these shares.'); return true; } const got = Math.floor(stockPx(id) * +n); S.coins += got; B.sh[id] = 0; Snd.play('coin'); UI.toast(`📈 Sold for ${got} coins!`); Save.save(); this.openPanel('stocks'); return true; }
    if (a === 'hbuy') { const N = HOUSES[S.house + 1]; if (!N) return true; if (S.coins < N.cost) { Snd.play('wrong'); UI.toast(`You need ${N.cost - S.coins} more coins. Saving in the bank helps!`); return true; } S.coins -= N.cost; S.house++; Snd.play('fanfare'); this.build(); this.gainXp(40 * S.house); UI.toast(`🏠 ${N.name} - it is yours!`); say(`${N.name}! It is yours.`); UI.badgeToasts(checkBadges()); Save.save(); this.closePanel(); if (this.room) this.room.items = this.roomItems('house', this.room.I); else { this.padLock = null; this.enterRoom('house'); } return true; }
    return false;
  }
});
