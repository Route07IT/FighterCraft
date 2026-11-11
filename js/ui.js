'use strict';
/* ============================================================
   FIGHTER CRAFT - screens: title, story, city hub, menus,
   results, touch controls and the main game loop
   ============================================================ */
const stageEl = document.getElementById('stage'), cv = document.getElementById('game'), ctx = cv.getContext('2d'), uiEl = document.getElementById('ui');
const touchEl = document.createElement('div'); touchEl.id = 'touch'; stageEl.appendChild(touchEl);
const view = { s: 1, ox: 0, oy: 0 };
function fit() { // scale the 1280x720 stage to fill any window or screen
  const s = Math.min(innerWidth / W, innerHeight / H); view.s = s; view.ox = (innerWidth - W * s) / 2; view.oy = (innerHeight - H * s) / 2;
  stageEl.style.transform = `translate(${view.ox}px,${view.oy}px) scale(${s})`;
}
addEventListener('resize', fit); fit();
cv.addEventListener('pointerdown', e => { Snd.init(); Input.mouse.x = (e.clientX - view.ox) / view.s; Input.mouse.y = (e.clientY - view.oy) / view.s; Input.mouse.clicked = true; });
addEventListener('contextmenu', e => e.preventDefault());
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function toggleFull() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* not allowed */ } }

const Game = {
  scene: null,
  go(s) { if (this.scene && this.scene.exit) this.scene.exit(); UI.clear(); this.scene = s; if (s.enter) s.enter(); }
};

const UI = {
  isTouch: !!(window.matchMedia && matchMedia('(pointer: coarse)').matches), handler: null,
  set(html, handler) { uiEl.innerHTML = html; this.handler = handler || null; },
  clear() { uiEl.innerHTML = ''; this.handler = null; },
  toast(html) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html; stageEl.appendChild(d); setTimeout(() => d.remove(), 3200); },
  badgeToasts(list) { list.forEach((b, i) => setTimeout(() => { UI.toast(`${b.icon} New badge: ${b.name}!`); Snd.play('levelup'); }, 400 + i * 900)); },
  touch(on) {
    touchEl.style.display = on && this.isTouch ? 'block' : 'none';
    if (!on) ['ArrowLeft', 'ArrowRight', 'Space', 'KeyJ', 'KeyK', 'KeyL'].forEach(k => { Input.down[k] = false; });
  },
  pause(b) {
    this.touch(false);
    this.set(`<div class="dim"><div class="panel center"><h2>⏸ PAUSED</h2>
      <button class="btn gold" data-act="resume" data-key="esc">▶ RESUME</button>
      <button class="btn" data-act="retry">↻ RESTART MISSION</button>
      <button class="btn gray" data-act="quit">🏙️ BACK TO CITY</button></div></div>`,
      a => { if (a === 'resume') { b.paused = false; Input.pressed = {}; UI.clear(); UI.touch(true); } else if (a === 'retry') Game.go(new Battle(b.stage, b.rumble)); else Game.go(new Hub()); });
  },
  quiz(q, cb) {
    say(q.speak); let done = false;
    this.set(`<div class="dim"><div class="panel quiz"><div class="quiz-head">💎 BRAIN BOOST!</div><div class="q-text">${q.text}</div>
      <div class="answers">${q.answers.map((a, i) => `<button class="btn gold ans" data-act="ans" data-arg="${i}" data-key="${i + 1}">${a}</button>`).join('')}</div>
      <div class="quiz-note">Answer right for a POWER SURGE!</div></div></div>`,
      (a, arg, btn) => {
        if (done || a !== 'ans') return; done = true; const ok = +arg === q.correct;
        uiEl.querySelectorAll('.ans')[q.correct].classList.add('right');
        if (ok) { Snd.play('correct'); say('Correct! Power surge!'); }
        else { btn.classList.add('wrong'); Snd.play('wrong'); uiEl.querySelector('.quiz-note').textContent = `The answer is ${q.answerText}. You will get it next time!`; say('The answer is ' + q.answerText); }
        setTimeout(() => { UI.clear(); cb(ok); }, ok ? 900 : 2300);
      });
  },
  results(o) {
    Music.play('hub');
    const up = o.ups ? `<div class="up">⬆ LEVEL UP!  Level ${o.lvBefore} → ${S.level}   •   ⚡ Power ${o.pBefore} → ${Calc.power()}</div>` : '';
    const badges = o.badges.length ? `<div class="gotbadge">${o.badges.map(b => `${b.icon} New badge: <b>${b.name}</b>`).join(' &nbsp; ')}</div>` : '';
    let body, btns;
    if (o.win) {
      const final = o.stage === 14 && o.armor;
      body = `<div class="bigstars">${[0, 1, 2].map(i => `<span class="${i < o.stars ? '' : 'off'}">★</span>`).join('')}</div>
        <div class="rows"><div>🤖 Robots defeated <b>${o.robots}</b></div><div>🔥 Best combo <b>${o.combo}</b></div>
        <div><span><i class="coin"></i> Coins collected</span> <b>+${o.coins}</b></div><div>⭐ Experience <b>+${o.xp} XP</b></div>
        ${o.interest ? `<div style="grid-column:1/3">🏦 Bank interest - you saved ${o.saved} coins! <b>+${o.interest}</b></div>` : ''}</div>${up}
        ${o.armor ? `<div class="newarmor">${o.armor.icon} NEW ARMOR: ${o.armor.name.toUpperCase()} - FREE!<small>${o.armor.power}  The city is getting an upgrade too!</small></div>` : ''}${badges}`;
      btns = o.armor || o.stage >= 14 ? `<button class="btn gold" data-act="hub" data-key="enter">${final ? '👑 SEE YOUR CITY' : 'CONTINUE ➜'}</button>`
        : `<button class="btn gold" data-act="next" data-key="enter">NEXT MISSION ➜</button><button class="btn" data-act="hub">🏙️ CITY</button>`;
      say('Mission complete! ' + (o.armor ? `You earned the ${o.armor.name}!` : o.ups ? 'Level up!' : o.stars === 3 ? 'Three stars. Amazing!' : 'Great job!'));
    } else {
      body = `<div class="tipbox"><b>BOLT:</b> ${o.tip}</div>
        <div class="rows"><div>🤖 Robots defeated <b>${o.robots}</b></div><div>🔥 Best combo <b>${o.combo}</b></div>
        <div><span><i class="coin"></i> Coins kept</span> <b>+${o.coins}</b></div><div>⭐ Experience kept <b>+${o.xp} XP</b></div></div>${up}${badges}
        <div class="sub">Heroes never give up. Every try makes you stronger!</div>`;
      btns = `<button class="btn gold" data-act="retry" data-key="enter">↻ TRY AGAIN</button><button class="btn green" data-act="dojo">🥋 TRAIN AT DOJO</button><button class="btn gray" data-act="hub">🏙️ CITY</button>`;
      say(o.tip);
    }
    this.set(`<div class="dim"><div class="panel center res"><h2>${o.title}</h2>${body}<div class="brow">${btns}</div></div></div>`,
      a => { if (a === 'next') Game.go(new Battle(o.stage + 1)); else if (a === 'retry') Game.go(new Battle(o.stage, o.rumble)); else if (a === 'dojo') Game.go(new Hub('dojo')); else Game.go(new Hub()); });
  },
  dojoResult(o) {
    const k = o.kind, need = Calc.statNeed(S[k]), have = S[k + 'Xp'];
    const up = o.ups ? `<div class="up">⬆ ${o.info.stat.toUpperCase()} ${o.before} → ${S[k]}!  ${o.info.gives}   •   ⚡ Power ${o.pBefore} → ${Calc.power()}</div>` : '';
    const motto = pick(['Practice makes you powerful!', 'Every training makes you a little stronger.', 'Mistakes help your brain grow!', 'Champions train every day.']);
    this.set(`<div class="dim"><div class="panel center res"><h2>${o.info.icon} TRAINING COMPLETE!</h2>
      <div class="rows"><div>${o.info.stat} training <b>+${o.gained} XP</b></div><div><span><i class="coin"></i> Coins</span> <b>+${o.gained}</b></div></div>
      <div style="width:100%"><small>${o.info.stat} level ${S[k]} - next level: ${have} / ${need}</small><div class="sbar"><i style="width:${have / need * 100}%"></i></div></div>
      ${up}${o.tierMsg ? `<div class="sub">${o.tierMsg}</div>` : ''}${o.badges.length ? `<div class="gotbadge">${o.badges.map(b => `${b.icon} New badge: <b>${b.name}</b>`).join(' &nbsp; ')}</div>` : ''}
      <div class="sub">${motto}</div>
      <div class="brow"><button class="btn gold" data-act="again" data-key="enter">↻ TRAIN AGAIN</button><button class="btn" data-act="hub">🏙️ BACK TO CITY</button></div></div></div>`,
      a => { if (a === 'again') Game.go(new Dojo(k)); else Game.go(new Hub()); });
    Snd.play(o.ups ? 'levelup' : 'correct'); say(o.ups ? `${o.info.stat} level up! ${o.info.gives}!` : motto);
  }
};
uiEl.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  Snd.init(); Snd.play('click'); if (UI.handler) UI.handler(b.dataset.act, b.dataset.arg, b);
});
addEventListener('keydown', e => { // number keys pick answers, Enter = main button, Esc = close
  if (e.target && e.target.tagName === 'INPUT') { if (e.code !== 'Enter') return; }
  let k = null;
  if (/^(Digit|Numpad)[1-9]$/.test(e.code)) k = e.code.slice(-1); else if (e.code === 'Enter' || e.code === 'NumpadEnter') k = 'enter'; else if (e.code === 'Escape') k = 'esc';
  if (k) { const b = uiEl.querySelector(`[data-key="${k}"]`); if (b && !b.disabled) { b.click(); e.preventDefault(); } }
});

/* ---------- touch controls (tablets / phones) ---------- */
touchEl.innerHTML = `<div class="dpad"><span>◀</span><span>▶</span></div>
  <button class="tb" style="left:984px;top:592px" data-k="Space">⬆</button>
  <button class="tb" style="left:1140px;top:570px" data-k="KeyJ">👊</button>
  <button class="tb sm" style="left:1166px;top:452px" data-k="KeyK">💥</button>
  <button class="tb sm" style="left:1040px;top:478px" data-k="KeyL">⭐</button>
  <button class="tb pause" style="left:430px;top:16px" data-k="Escape">⏸</button>`;
touchEl.querySelectorAll('.tb').forEach(b => {
  const k = b.dataset.k, off = () => { Input.down[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); Snd.init(); Input.down[k] = true; Input.pressed[k] = true; b.classList.add('on'); });
  b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
{
  const pad = touchEl.querySelector('.dpad'), sp = pad.querySelectorAll('span');
  const set = e => { const r = pad.getBoundingClientRect(), left = (e.clientX - r.left) / r.width < 0.5; Input.down.ArrowLeft = left; Input.down.ArrowRight = !left; sp[0].classList.toggle('on', left); sp[1].classList.toggle('on', !left); };
  const off = () => { Input.down.ArrowLeft = Input.down.ArrowRight = false; sp[0].classList.remove('on'); sp[1].classList.remove('on'); };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); Snd.init(); try { pad.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } set(e); });
  pad.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') set(e); });
  pad.addEventListener('pointerup', off); pad.addEventListener('pointercancel', off);
}
addEventListener('touchstart', () => { if (!UI.isTouch) { UI.isTouch = true; if (Game.scene instanceof Battle && !Game.scene.paused) UI.touch(true); } }, { passive: true });

/* ---------- title + story ---------- */
const STORY = [
  { L: 5, text: 'Nova City was the richest, brightest city in the world. It was full of gold, lights and happy people.' },
  { L: 0, text: 'Then the robot boss CORE-X stole the city\'s power. The lights went out, and robots took over the streets.' },
  { L: 0, hero: true, text: 'You are the last fighter! Five robot bosses guard five pieces of legendary armor. Every piece you win back lights up the city again.' },
  { L: 0, hero: true, text: 'Remember: real power comes from practice. Train your body and your brain, fight smart, save your coins, and rebuild the city. I am BOLT, and I will help you!' }
];
const FULL_BUILD = { workshop: 3, bank: 3, hospital: 3, plant: 3, park: 3 };
class Title {
  constructor() { this.t = 0; this.hero = false; }
  enter() { Music.play('hub'); this.L = S.started ? Calc.cityLevel() : 0; this.city = renderCity(this.L, S.build); this.hero = false; this.menu(); }
  exit() { hush(); }
  menu() {
    UI.set(`<div class="title"><div class="logo"><span>FIGHTER</span><span class="craft">CRAFT</span></div>
      <div class="tag2">Save Nova City. Earn the armor. Become a legend.</div>
      <button class="btn gold huge" data-act="play" data-key="enter">▶ ${S.started ? 'CONTINUE' : 'PLAY'}</button>
      ${S.started ? `<div class="tag3">${esc(S.name)}  •  Level ${S.level}  •  ⚡ Power ${Calc.power()}</div>` : ''}
      <button class="mini fs" data-act="full">⛶ Full screen</button></div>`,
      a => { if (a === 'full') toggleFull(); else if (S.started) Game.go(new Hub()); else this.setup(); });
  }
  setup() {
    this.hero = true;
    UI.set(`<div class="panel center" style="position:absolute;left:60px;top:150px"><h2>CREATE YOUR HERO</h2>
      <label>What is your hero's name?</label><input id="nm" maxlength="12" placeholder="Type a name" autocomplete="off">
      <label>Pick your suit color</label><div class="suits">${SUITS.map((s, i) => `<button class="suit ${i === S.suit ? 'on' : ''}" style="background:${s[0]}" data-act="suit" data-arg="${i}"></button>`).join('')}</div>
      <button class="btn gold" data-act="go" data-key="enter">START ADVENTURE ➜</button></div>`,
      (a, arg) => {
        if (a === 'suit') { S.suit = +arg; uiEl.querySelectorAll('.suit').forEach((b, i) => b.classList.toggle('on', i === S.suit)); }
        else if (a === 'go') { S.name = (uiEl.querySelector('#nm').value.trim() || 'Hero').slice(0, 12); this.story(0); }
      });
  }
  story(i) {
    if (i >= STORY.length) { S.started = true; Save.save(); Game.go(new Hub()); return; }
    const s = STORY[i]; this.L = s.L; this.hero = !!s.hero; this.city = renderCity(s.L, s.L === 5 ? FULL_BUILD : S.build); say(s.text);
    UI.set(`<div class="story"><div class="sbox"><b>BOLT</b><p>${s.text}</p>
      <button class="btn gold" data-act="next" data-key="enter">${i < STORY.length - 1 ? 'NEXT ➜' : "LET'S GO! ➜"}</button><button class="mini" data-act="skip">Skip</button></div></div>`,
      a => this.story(a === 'skip' ? 99 : i + 1));
  }
  update(dt) { this.t += dt; }
  draw(g) {
    g.drawImage(this.city, 0, 0); drawCityLive(g, this.t, this.L);
    if (this.hero) { drawHero(g, { x: 760, y: 606, face: 1, t: this.t, pose: 'idle', armor: [], suit: S.suit, scale: 1.8 }); drawBolt(g, 930, 400, this.t); }
  }
}

/* ---------- the city hub ---------- */
class Hub {
  constructor(open) { this.t = 0; this.open = open || 'main'; this.view = 'main'; this.preview = -1; this.fx = new FX(); this.cut = null; }
  enter() {
    Music.play('hub'); this.L = Calc.cityLevel(); this.city = renderCity(this.L, S.build);
    if (S.pendingCity > 0) {
      const L = S.pendingCity; this.cut = { t: 0, from: renderCity(L - 1, S.build), L, armor: ARMOR[L - 1], step: 0 };
      S.pendingCity = -1; Save.save(); Snd.play('fanfare'); say(`You earned the ${this.cut.armor.name}! ${this.cut.armor.power}`);
    } else this.show(this.open);
  }
  exit() { hush(); }
  canBuild(b) { const lv = S.build[b.id]; if (lv >= 3) return 'max'; const cap = clamp(this.L - b.city + 1, 0, 3); return cap <= 0 ? 'city' : lv >= cap ? 'cap' : true; }
  makeTip() {
    const p = Calc.power(), rec = Calc.recPower(Math.min(S.stage, 14));
    if (S.stage > 14) return 'You saved Nova City! Try Robot Rumble and collect every badge.';
    if (p < rec) return `The next mission needs Power ${rec}. You have ${p}. Train in the Dojo to grow stronger!`;
    const b = BUILDINGS.find(x => this.canBuild(x) === true && S.coins >= x.cost[S.build[x.id]]);
    if (b) return `You have enough coins to build the ${b.name}! ${b.tip}`;
    if (!S.stats.trainings) return 'Visit the Dojo! Training your body and brain makes your hero stronger.';
    if (!S.stats.wins) return 'Robots are in Rusty Harbor! Press MISSIONS to start your first fight.';
    return pick(TIPS);
  }
  show(v) {
    this.view = v; this.preview = -1; const X = '<button class="x" data-act="close" data-key="esc">✕</button>'; let html = '';
    if (v === 'main') {
      const need = Calc.xpNeed(); this.tip = this.makeTip();
      html = `<div class="topbar">
        <div class="chip who"><span class="lv">LV ${S.level}</span><div class="whoinfo">${esc(S.name)}<div class="xp"><i style="width:${S.xp / need * 100}%"></i></div><small>XP ${S.xp} / ${need}</small></div></div>
        <button class="chip power" data-act="power">⚡ POWER ${Calc.power()}<small>tap to see where it comes from</small></button>
        <div class="chip">🏙️ City Level ${this.L}<small>${CITY_NAMES[this.L]}</small></div>
        <div class="chip coins"><i class="coin"></i>${S.coins}</div>
        <button class="chip gear" data-act="settings">⚙️</button></div>
        <button class="bolt-tip" data-act="tip"><b>BOLT:</b> ${this.tip} 🔊</button>
        <div class="menu"><button class="big go" data-act="missions">⚔️<span>MISSIONS</span></button><button class="big" data-act="dojo">🥋<span>DOJO</span></button>
        <button class="big" data-act="armor">🛡️<span>ARMOR</span></button><button class="big" data-act="build">🏗️<span>BUILD CITY</span></button><button class="big" data-act="badges">🏅<span>BADGES</span></button></div>`;
    } else if (v === 'missions') {
      const p = Calc.power(); let rows = '';
      DISTRICTS.forEach((D, d) => {
        rows += `<div class="drow"><div class="dname">${D.icon} ${D.name}</div>`;
        for (let s = 0; s < 3; s++) {
          const i = d * 3 + s, rec = Calc.recPower(i), st = S.stars[i] || 0, cls = p >= rec ? 'ok' : p >= rec * 0.8 ? 'mid' : 'hard';
          rows += i > S.stage ? '<button class="stage lock" data-act="locked">🔒</button>'
            : `<button class="stage ${s === 2 ? 'boss' : ''}" data-act="stage" data-arg="${i}"><b>${s === 2 ? '☠ BOSS ' + ARMOR[d].icon + (S.armor[d] ? '✅' : '🎁') : (d + 1) + '-' + (s + 1) + ' ' + STAGE_NAMES[s]}</b><span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><span class="rec ${cls}">⚡ ${rec}</span></button>`;
        }
        rows += '</div>';
      });
      html = `<div class="dim"><div class="panel wide">${X}<h2>⚔️ MISSIONS</h2>${rows}
        <div class="legend"><div class="sub">⚡ = the Power you should have. Your Power is <b style="color:#ffe14d">${p}</b>. &nbsp; <span class="rec ok" style="padding:2px 8px">green = ready</span> <span class="rec hard" style="padding:2px 8px">red = train first!</span></div>
        ${S.stage >= 3 ? `<button class="btn red" data-act="rumble">🏟️ ROBOT RUMBLE${S.stats.rumble ? ' (best: wave ' + S.stats.rumble + ')' : ''}</button>` : '<div class="sub">🏟️ Robot Rumble unlocks after the first boss</div>'}</div></div></div>`;
    } else if (v === 'dojo') {
      html = `<div class="dim"><div class="panel wide">${X}<h2>🥋 TRAINING DOJO</h2><p class="sub">Nobody is born strong. Heroes get their power by practicing! Pick a training:</p><div class="cards">
        ${['str', 'spd', 'foc'].map(k => { const I = DOJO_INFO[k], need = Calc.statNeed(S[k]); return `<div class="card"><div class="cicon">${I.icon}</div><b>${I.name}</b><small>${k === 'str' ? 'Solve number puzzles and punch the right bag' : k === 'spd' ? 'Hit the robot targets with the arrow keys - fast!' : 'Remember the crystal pattern'}</small>
          <div>${I.stat} level <b style="color:#ffe14d">${S[k]}</b></div><div class="sbar"><i style="width:${S[k + 'Xp'] / need * 100}%"></i></div><small style="min-height:0">→ ${I.gives}</small><button class="btn green" data-act="train" data-arg="${k}">TRAIN!</button></div>`; }).join('')}</div></div></div>`;
    } else if (v === 'armor') {
      html = `<div class="panel side">${X}<h2>🛡️ LEGENDARY ARMOR</h2><p class="sub">Armor is never bought. You EARN it by beating a boss - and every piece upgrades the whole city!</p>
        ${ARMOR.map((a, i) => `<button class="arow ${S.armor[i] ? 'got' : ''}" data-act="try" data-arg="${i}"><span class="aicon" style="background:${a.color}">${a.icon}</span><span class="ainfo"><b>${a.name}</b><small>${a.power}</small><em>${S.armor[i] ? '✅ EARNED' : `🔒 Beat ${a.from} in ${DISTRICTS[i].name} - FREE reward`}</em></span></button>`).join('')}
        <p class="sub">👆 Tap a piece to try it on!</p></div>`;
    } else if (v === 'build') {
      html = `<div class="dim"><div class="panel wide">${X}<h2>🏗️ BUILD THE CITY</h2><div class="coinsline"><i class="coin"></i> ${S.coins} coins &nbsp;•&nbsp; City Level ${this.L}: ${CITY_NAMES[this.L]}</div><div class="cards">
        ${BUILDINGS.map(b => { const lv = S.build[b.id], can = this.canBuild(b), cost = b.cost[lv]; const btn = can === 'max' ? '<div class="tag gold">★ MAX LEVEL</div>' : can === 'city' ? `<div class="tag lock">🔒 Needs City Level ${b.city}<small>Earn more armor!</small></div>` : can === 'cap' ? '<div class="tag lock">🔒 Earn the next armor<small>to upgrade more</small></div>' : `<button class="btn ${S.coins >= cost ? 'gold' : 'gray'}" data-act="buy" data-arg="${b.id}"><i class="coin"></i> ${cost} ${lv ? 'UPGRADE' : 'BUILD'}</button>`; return `<div class="card"><div class="cicon">${b.icon}</div><b>${b.name}</b><div class="pips">${[0, 1, 2].map(i => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div><small>${b.fx}</small>${btn}</div>`; }).join('')}</div>
        <p class="sub">💡 The city grows when you earn armor. A bigger city lets you build bigger buildings - and they make you stronger too.</p></div></div>`;
    } else if (v === 'badges') {
      const n = BADGES.filter(b => S.badges[b.id]).length;
      html = `<div class="dim"><div class="panel wide">${X}<h2>🏅 BADGES  ${n} / ${BADGES.length}</h2><div class="grid">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? 'on' : ''}"><div class="bi">${b.icon}</div>${b.name}<small>${b.desc}</small></div>`).join('')}</div></div></div>`;
    } else if (v === 'power') {
      const parts = Calc.powerParts(), mx = Math.max(...parts.map(p => p.v), 1), nx = Math.min(S.stage, 14);
      html = `<div class="dim"><div class="panel wide">${X}<h2>⚡ WHERE DOES MY POWER COME FROM?</h2>
        ${parts.map(p => `<div class="prow"><span class="pi">${p.icon}</span><span>${p.name}</span><div class="pbar"><i style="width:${p.v / mx * 100}%"></i></div><span class="pv">${p.v}</span><small>${p.how}</small></div>`).join('')}
        <div class="ptotal">TOTAL POWER: ⚡ ${Calc.power()} ${S.stage <= 14 ? `<small style="display:inline;font-size:19px;color:#fff"> &nbsp; Next mission needs ⚡ ${Calc.recPower(nx)}</small>` : ''}</div>
        <p class="sub">Power is not luck. Every bar grows when YOU work on it: fight, train, earn armor and build.</p></div></div>`;
    } else if (v === 'settings') {
      const t = k => `<button class="btn ${S.opts[k] ? 'green' : 'gray'}" data-act="opt" data-arg="${k}">${{ sound: '🔊 Sound', music: '🎵 Music', voice: '🗣️ BOLT voice' }[k]}: ${S.opts[k] ? 'ON' : 'OFF'}</button>`;
      html = `<div class="dim"><div class="panel center">${X}<h2>⚙️ SETTINGS</h2><div class="opts">${t('sound')}${t('music')}${t('voice')}</div>
        <label>Hero name</label><input id="nm" maxlength="12" value="${esc(S.name)}" autocomplete="off">
        <div class="suits">${SUITS.map((s, i) => `<button class="suit ${i === S.suit ? 'on' : ''}" style="background:${s[0]}" data-act="suit" data-arg="${i}"></button>`).join('')}</div>
        <div class="brow"><button class="btn" data-act="full">⛶ Full screen</button><button class="btn red" data-act="reset">🗑️ Start over</button></div>
        <div class="sub">Controls: ← → move • SPACE jump • J punch • K blast • L super • ESC pause<br>A game controller works too.</div></div></div>`;
    }
    UI.set(html, (a, arg, btn) => this.act(a, arg, btn));
    const nm = uiEl.querySelector('#nm'); if (nm) nm.addEventListener('input', () => { S.name = (nm.value.trim() || 'Hero').slice(0, 12); Save.save(); });
    if (v === 'main') say(this.tip);
  }
  act(a, arg, btn) {
    switch (a) {
      case 'close': this.show('main'); break;
      case 'missions': case 'dojo': case 'armor': case 'build': case 'badges': case 'power': case 'settings': this.show(a); break;
      case 'stage': Game.go(new Battle(+arg)); break;
      case 'locked': UI.toast('🔒 Beat the mission before this one first!'); break;
      case 'rumble': Game.go(new Battle(0, true)); break;
      case 'train': Game.go(new Dojo(arg)); break;
      case 'try': this.preview = +arg; Snd.play('crystal'); say(ARMOR[+arg].name + '. ' + ARMOR[+arg].power); break;
      case 'tip': say(this.tip); break;
      case 'opt': S.opts[arg] = !S.opts[arg]; if (!S.opts.voice) hush(); Save.save(); this.show('settings'); break;
      case 'suit': S.suit = +arg; Save.save(); this.show('settings'); break;
      case 'full': toggleFull(); break;
      case 'reset': if (btn.dataset.sure) { Save.reset(); Game.go(new Title()); } else { btn.dataset.sure = '1'; btn.textContent = '⚠ Press again to erase everything'; } break;
      case 'buy': {
        const b = BUILDINGS.find(x => x.id === arg), cost = b.cost[S.build[arg]];
        if (this.canBuild(b) !== true) break;
        if (S.coins < cost) { Snd.play('wrong'); UI.toast(`You need ${cost - S.coins} more coins. Beat robots and smash crates!`); say('You need more coins. Beat robots and smash crates!'); break; }
        S.coins -= cost; S.build[arg]++; S.stats.built++; Snd.play('build'); this.city = renderCity(this.L, S.build);
        const got = checkBadges(); Save.save(); this.show('main'); hush(); say(`${b.name} level ${S.build[arg]}! ${b.tip}`);
        UI.toast(`${b.icon} ${b.name} is now level ${S.build[arg]}!`); UI.badgeToasts(got);
        for (let i = 0; i < 4; i++) setTimeout(() => { this.fx.spark(LAND_X[arg] + rand(-60, 60), 480 + rand(-60, 40), 16, '#ffd23f', 380); }, i * 160);
        break;
      }
    }
  }
  update(dt) {
    this.t += dt; this.fx.update(dt);
    const c = this.cut;
    if (c) {
      c.t += dt;
      if (c.step === 0 && c.t > 3.2) { c.step = 1; Snd.play('levelup'); say(`City level up! Nova City is now level ${c.L}. ${CITY_NAMES[c.L]}`); }
      if (c.step === 1 && Math.random() < dt * 9) this.fx.spark(rand(100, 1180), rand(120, 420), 18, pick(['#ffd23f', '#7df9ff', '#ff6b9d', '#5fd68a']), 300);
      if (c.t > 8.5 || (c.t > 4.2 && (Input.hit('ok') || Input.hit('jump') || Input.mouse.clicked))) { this.cut = null; this.show('main'); if (c.L === 5) UI.toast('👑 You saved Nova City! You are a LEGEND!'); }
    }
  }
  draw(g) {
    const c = this.cut, t = this.t;
    if (c && c.t < 4.2) { g.drawImage(c.from, 0, 0); if (c.t > 3.2) { g.globalAlpha = c.t - 3.2; g.drawImage(this.city, 0, 0); g.globalAlpha = 1; } drawCityLive(g, t, c.t > 3.7 ? this.L : c.L - 1); }
    else { g.drawImage(this.city, 0, 0); drawCityLive(g, t, this.L); }
    const side = this.view === 'armor', hx = side ? 300 : 640, sc = side ? 2.3 : 1.7;
    const arm = S.armor.slice(); if (this.preview >= 0) arm[this.preview] = true;
    if (c && c.t < 3.2) glow(g, hx, 480, 260 + Math.sin(t * 6) * 20, c.armor.color, 0.5);
    if (!this.cut && this.view !== 'main' && !side) { /* hero hidden behind panels */ }
    drawHero(g, { x: hx, y: side ? 640 : 606, face: 1, t, pose: c ? 'win' : 'idle', armor: arm, suit: S.suit, scale: sc });
    if (!side) drawBolt(g, 800, 420, t);
    this.fx.draw(g);
    if (c) {
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const first = c.t < 3.2, a = clamp(first ? c.t * 3 : (c.t - 3.2) * 3, 0, 1);
      g.globalAlpha = a; g.fillStyle = 'rgba(8,10,20,0.78)'; g.fillRect(0, 70, W, 150); g.fillStyle = first ? c.armor.color : '#ffe14d'; g.fillRect(0, 70, W, 5); g.fillRect(0, 215, W, 5);
      g.font = `bold 62px ${FONT}`; g.fillText(first ? `NEW ARMOR: ${c.armor.name.toUpperCase()}!` : `🏙️ CITY LEVEL ${c.L}: ${CITY_NAMES[c.L].toUpperCase()}`, W / 2, 122);
      g.fillStyle = '#fff'; g.font = `26px ${FONT}`; g.fillText(first ? c.armor.power : 'Your new armor brought power back to Nova City!', W / 2, 182);
      g.globalAlpha = 1;
      if (c.t > 4.6) { g.fillStyle = '#fff'; g.font = `22px ${FONT}`; g.globalAlpha = 0.6 + Math.sin(t * 5) * 0.4; g.fillText(UI.isTouch ? 'Tap to continue' : 'Press ENTER or click to continue', W / 2, 690); g.globalAlpha = 1; }
    }
  }
}

/* ---------- boot + main loop ---------- */
{ const r = document.createElement('div'); r.id = 'rotate'; r.innerHTML = '<div>📱↻<br><br>Turn your device sideways to play <b>Fighter Craft</b></div>'; document.body.appendChild(r); }
Save.load();
Game.go(new Title());
let _last = performance.now();
function frame(now) {
  const dt = Math.min(0.034, Math.max(0.001, (now - _last) / 1000)); _last = now;
  Input.poll();
  try { if (Game.scene) { Game.scene.update(dt); Game.scene.draw(ctx); } }
  catch (e) { console.error(e); }
  Input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
