'use strict';
/* ============================================================
   FIGHTER CRAFT - game data: districts, armor, city buildings,
   robots, bosses, badges and the brain-question maker
   ============================================================ */

const CITY_NAMES = ['Dark Ruins', 'Lights On!', 'Neon Nights', 'Sky City', 'Green Metropolis', 'Golden Age'];

/* 5 districts, each with 3 missions. The 3rd mission has the boss who guards an armor piece. */
const DISTRICTS = [
  {
    name: 'Rusty Harbor', icon: '⚓', boss: 'crusher', pool: ['scrapper', 'scrapper', 'roller']
  },
  {
    name: 'Neon Market', icon: '🏮', boss: 'viper', pool: ['scrapper', 'roller', 'zapper', 'zapper']
  },
  {
    name: 'Sky Bridge', icon: '🌉', boss: 'warden', pool: ['scrapper', 'zapper', 'drone', 'drone', 'roller']
  },
  {
    name: 'Furnace Works', icon: '🏭', boss: 'furnace', pool: ['scrapper', 'brute', 'zapper', 'drone', 'roller']
  },
  {
    name: 'Core Tower', icon: '🗼', boss: 'corex', pool: ['brute', 'zapper', 'drone', 'roller', 'scrapper', 'brute']
  }
];
const STAGE_NAMES = ['Patrol', 'Clean-Up', 'BOSS'];

/* Armor is never bought - it is EARNED by beating a boss. Each piece also upgrades the city. */
const ARMOR = [
  { id: 'boots', name: 'Turbo Boots', icon: '🥾', color: '#39d0ff', power: 'Run faster and DOUBLE JUMP in the air!', from: 'Crusher' },
  { id: 'gauntlets', name: 'Thunder Gauntlets', icon: '🥊', color: '#ffd23f', power: 'Much stronger punches. Your 3rd punch makes a shockwave!', from: 'Volt Viper' },
  { id: 'chest', name: 'Titan Chestplate', icon: '🛡️', color: '#c9d6e8', power: '+60 health and robots hurt you less.', from: 'Sky Warden' },
  { id: 'wings', name: 'Jet Wings', icon: '🚀', color: '#ff8c1a', power: 'Hold JUMP in the air to FLY!', from: 'Furnace' },
  { id: 'helmet', name: 'Star Helmet', icon: '⭐', color: '#b388ff', power: 'More energy and a giant STAR BEAM super!', from: 'Core-X' }
];

/* City buildings: bought with coins. "city" = city level needed before it can be built. */
const BUILDINGS = [
  { id: 'workshop', name: 'Workshop', icon: '🔧', city: 0, cost: [50, 140, 300], fx: 'Blast +4 and Punch +1 per level', tip: 'Engineers make your blaster stronger.' },
  { id: 'bank', name: 'Bank', icon: '🏦', city: 0, cost: [60, 160, 340], fx: 'Saved coins earn +5% interest per level after every mission', tip: 'Smart heroes save! Coins you keep grow by themselves.' },
  { id: 'hospital', name: 'Hospital', icon: '🏥', city: 1, cost: [80, 190, 380], fx: 'Health +25 per level, more hearts drop', tip: 'Doctors keep the hero healthy.' },
  { id: 'plant', name: 'Power Plant', icon: '🔋', city: 2, cost: [100, 230, 440], fx: 'Energy refills faster', tip: 'Clean power for your blaster.' },
  { id: 'park', name: 'Hero Park', icon: '🌳', city: 3, cost: [120, 260, 500], fx: 'XP +10% per level - happy citizens cheer for you', tip: 'A happy city makes a stronger hero.' }
];

/* Regular robots. hp/dmg get multiplied by the mission's difficulty. pw = how its Power Level compares to the mission. */
const ROBOTS = {
  scrapper: { name: 'Scrapper', hp: 30, dmg: 8, speed: 115, range: 78, wind: 0.55, w: 56, h: 104, xp: 4, coins: 3, cost: 1, pw: 0.8 },
  roller: { name: 'Roller', hp: 22, dmg: 9, speed: 0, range: 0, wind: 0.9, w: 56, h: 60, xp: 4, coins: 3, cost: 1, pw: 0.7 },
  zapper: { name: 'Zapper', hp: 26, dmg: 9, speed: 90, range: 0, wind: 0.6, w: 46, h: 120, xp: 5, coins: 4, cost: 1.5, pw: 0.9 },
  drone: { name: 'Drone', hp: 18, dmg: 10, speed: 150, range: 0, wind: 0.5, w: 70, h: 52, xp: 5, coins: 4, cost: 1.5, pw: 0.85, flying: true },
  brute: { name: 'Brute', hp: 95, dmg: 16, speed: 70, range: 112, wind: 0.95, w: 110, h: 140, xp: 12, coins: 9, cost: 3, pw: 1.4 }
};
const BOSSES = {
  crusher: { name: 'CRUSHER', hp: 320, dmg: 13, w: 150, h: 194, attacks: ['charge', 'slam'], look: 'crusher', taunt: 'I guard the Turbo Boots!' },
  viper: { name: 'VOLT VIPER', hp: 380, dmg: 13, w: 110, h: 220, attacks: ['missiles', 'charge', 'summon'], look: 'viper', taunt: 'You cannot dodge my lightning!' },
  warden: { name: 'SKY WARDEN', hp: 360, dmg: 14, w: 190, h: 110, attacks: ['missiles', 'charge'], look: 'warden', flying: true, taunt: 'The sky belongs to robots!' },
  furnace: { name: 'FURNACE', hp: 440, dmg: 15, w: 160, h: 196, attacks: ['slam', 'laser', 'summon'], look: 'furnace', taunt: 'I will melt your armor!' },
  corex: { name: 'CORE-X', hp: 560, dmg: 15, w: 150, h: 246, attacks: ['charge', 'laser', 'missiles', 'slam', 'summon'], look: 'corex', taunt: 'I took the power of this city. Come and get it!' }
};

/* Builds the list of robot waves for one mission (0-14). */
function makeWaves(stage) {
  const d = Math.floor(stage / 3), s = stage % 3, D = DISTRICTS[d], r = rng(1000 + stage * 77), waves = [];
  const n = s === 2 ? 2 : 3 + (d > 1 ? 1 : 0);
  for (let w = 0; w < n; w++) {
    let budget = 2.5 + d * 0.9 + s * 0.8 + w * 0.8; const list = [];
    while (budget > 0.4 && list.length < 9) {
      const t = D.pool[Math.floor(r() * D.pool.length)];
      if (ROBOTS[t].cost > budget + 0.6) { budget -= 0.5; continue; }
      list.push(t); budget -= ROBOTS[t].cost;
    }
    if (!list.length) list.push('scrapper');
    waves.push({ list });
  }
  if (s === 2) waves.push({ list: [], boss: D.boss });
  return waves;
}
function makeRumbleWave(n) { // endless mode: wave n (1,2,3...)
  const pool = ['scrapper', 'roller', 'zapper', 'drone', 'brute'].slice(0, Math.min(5, 2 + Math.floor(n / 2)));
  let budget = 2 + n * 0.9; const list = [];
  while (budget > 0.4 && list.length < 12) { const t = pick(pool); if (ROBOTS[t].cost > budget + 0.6) { budget -= 0.5; continue; } list.push(t); budget -= ROBOTS[t].cost; }
  const w = { list };
  if (n % 5 === 0) w.boss = ['crusher', 'viper', 'warden', 'furnace', 'corex'][(n / 5 - 1) % 5];
  return w;
}

/* Badges = long-term challenges. */
const BADGES = [
  { id: 'first', icon: '🎖️', name: 'First Victory', desc: 'Win your first mission', ok: () => S.stats.wins >= 1 },
  { id: 'bots25', icon: '🤖', name: 'Robot Wrecker', desc: 'Defeat 25 robots', ok: () => S.stats.robots >= 25 },
  { id: 'bots150', icon: '🦾', name: 'Robot Master', desc: 'Defeat 150 robots', ok: () => S.stats.robots >= 150 },
  { id: 'combo10', icon: '🔥', name: 'Combo Kid', desc: 'Make a 10-hit combo', ok: () => S.stats.bestCombo >= 10 },
  { id: 'combo25', icon: '🌋', name: 'Combo Volcano', desc: 'Make a 25-hit combo', ok: () => S.stats.bestCombo >= 25 },
  { id: 'nohit', icon: '👻', name: 'Untouchable', desc: 'Win a mission without getting hit', ok: () => S.stats.noHit >= 1 },
  { id: 'math20', icon: '🧮', name: 'Number Ninja', desc: 'Answer 20 brain questions correctly', ok: () => S.stats.math >= 20 },
  { id: 'math100', icon: '🎓', name: 'Math Master', desc: 'Answer 100 brain questions correctly', ok: () => S.stats.math >= 100 },
  { id: 'train5', icon: '🥋', name: 'Hard Worker', desc: 'Finish 5 Dojo trainings', ok: () => S.stats.trainings >= 5 },
  { id: 'train25', icon: '🏋️', name: 'Never Give Up', desc: 'Finish 25 Dojo trainings', ok: () => S.stats.trainings >= 25 },
  { id: 'save300', icon: '🐷', name: 'Super Saver', desc: 'Have 300 coins saved at once', ok: () => S.coins >= 300 },
  { id: 'build1', icon: '🏗️', name: 'City Builder', desc: 'Build your first building', ok: () => S.stats.built >= 1 },
  { id: 'mayor', icon: '🎩', name: 'Mayor', desc: 'Upgrade every building to level 3', ok: () => Calc.buildSum() >= 15 },
  { id: 'armor1', icon: '🥾', name: 'Armored Up', desc: 'Earn your first armor piece', ok: () => Calc.armorCount() >= 1 },
  { id: 'armor5', icon: '👑', name: 'Legend of the City', desc: 'Earn the full armor set', ok: () => Calc.armorCount() >= 5 },
  { id: 'lvl10', icon: '🌟', name: 'Level 10 Hero', desc: 'Reach hero level 10', ok: () => S.level >= 10 },
  { id: 'power200', icon: '⚡', name: 'Power 200', desc: 'Reach Power Level 200', ok: () => Calc.power() >= 200 },
  { id: 'base1', icon: '📡', name: 'Base Buster', desc: 'Destroy a robot base', ok: () => S.bases.some(Boolean) },
  { id: 'pal1', icon: '🤖', name: 'Robot Friend', desc: 'Build your first Robo-Pal', ok: () => Object.keys(S.palLv).length >= 1 },
  { id: 'pilot', icon: '✈️', name: 'Ace Pilot', desc: 'Buy the fighter jet', ok: () => S.veh.jet },
  { id: 'roof', icon: '🏢', name: 'Roof Runner', desc: 'Open a rooftop treasure', ok: () => (S.stats.roofs || 0) >= 1 },
  { id: 'rumble8', icon: '🏟️', name: 'Rumble Champion', desc: 'Reach wave 8 in Robot Rumble', ok: () => S.stats.rumble >= 8 }
];
function checkBadges() { // returns newly earned badges
  const got = [];
  for (const b of BADGES) if (!S.badges[b.id] && b.ok()) { S.badges[b.id] = true; got.push(b); }
  return got;
}

const TIPS = [
  'Robots flash red before they attack. Jump away when you see it!',
  'Power does not come from luck. It comes from practice!',
  'Every armor piece you earn makes the whole city better.',
  'Coins you save in the Bank grow all by themselves.',
  'Press PUNCH three times fast for a big combo finisher!',
  'A boss gets dizzy after a big attack. That is your chance!',
  'Punch the golden crates. The city is full of coins!',
  'If a mission is too hard, train in the Dojo and come back stronger.',
  'Blue power crystals ask brain questions. Smart heroes get power surges!',
  'Run into any wall and hold JUMP to climb it. There is treasure on the rooftops!',
  'Robots drop green cores. Take them to the Robo Lab to build a robot friend.',
  'Press F to call your car. You can ram robots with it!'
];

/* ---------------- Brain questions (get harder as the kid gets better) ---------------- */
function makeQuestion(tier) {
  tier = clamp(tier | 0, 1, 6);
  const kinds = [
    ['add10', 'add10', 'compare'],
    ['add10', 'add20', 'compare', 'coins'],
    ['add20', 'sub10', 'pattern', 'coins'],
    ['sub20', 'missing', 'pattern', 'double', 'add20'],
    ['missing', 'times', 'sub20', 'pattern', 'coins'],
    ['times', 'tens', 'missing', 'pattern', 'sub20']
  ][tier - 1];
  const k = pick(kinds); let text, speak, ans, opts = null, a, b;
  switch (k) {
    case 'add10': a = randi(1, 5); b = randi(1, 5); ans = a + b; text = `${a} + ${b} = ?`; speak = `What is ${a} plus ${b}?`; break;
    case 'add20': a = randi(3, 11); b = randi(2, 9); ans = a + b; text = `${a} + ${b} = ?`; speak = `What is ${a} plus ${b}?`; break;
    case 'sub10': a = randi(4, 10); b = randi(1, a - 1); ans = a - b; text = `${a} − ${b} = ?`; speak = `What is ${a} minus ${b}?`; break;
    case 'sub20': a = randi(9, 20); b = randi(2, 9); ans = a - b; text = `${a} − ${b} = ?`; speak = `What is ${a} minus ${b}?`; break;
    case 'missing': a = randi(2, 9); ans = randi(1, 9); b = a + ans; text = `${a} + ? = ${b}`; speak = `${a} plus what number makes ${b}?`; break;
    case 'double': a = randi(2, 10); ans = a * 2; text = `Double ${a} = ?`; speak = `What is double ${a}?`; break;
    case 'times': a = pick([2, 5, 10]); b = randi(1, 10); ans = a * b; text = `${b} × ${a} = ?`; speak = `What is ${b} times ${a}?`; break;
    case 'tens': a = randi(1, 5) * 10; b = randi(1, 4) * 10; ans = a + b; text = `${a} + ${b} = ?`; speak = `What is ${a} plus ${b}?`; break;
    case 'coins': a = tier < 5 ? randi(2, 3) : pick([2, 5, 10]); b = randi(2, tier < 5 ? 4 : 6); ans = a * b; text = `Each robot drops ${a} coins.\nYou beat ${b} robots. How many coins?`; speak = `Each robot drops ${a} coins. You beat ${b} robots. How many coins do you get?`; break;
    case 'pattern': { const st = pick(tier < 4 ? [1, 2] : [2, 5, 10]), s0 = randi(1, 5) * (st > 2 ? st : 1); ans = s0 + st * 3; text = `${s0}, ${s0 + st}, ${s0 + st * 2}, ?`; speak = `What number comes next? ${s0}, ${s0 + st}, ${s0 + st * 2}`; break; }
    case 'compare': { const base = randi(10, tier < 2 ? 40 : 90); const set = new Set([base]); while (set.size < 3) set.add(Math.max(1, base + randi(-9, 9))); opts = shuffle([...set]); ans = Math.max(...opts); text = 'Which robot is the STRONGEST?'; speak = 'Which power level is the biggest?'; opts = opts.map(v => ({ label: '⚡' + v, v })); break; }
  }
  if (!opts) {
    const set = new Set([ans]); let guard = 0;
    while (set.size < 3 && guard++ < 50) { const w = ans + pick([-3, -2, -1, 1, 2, 3, 10, -10]); if (w >= 0) set.add(w); }
    opts = shuffle([...set]).map(v => ({ label: String(v), v }));
  }
  return { text, speak, answers: opts.map(o => o.label), correct: opts.findIndex(o => o.v === ans), answerText: String(ans) };
}
