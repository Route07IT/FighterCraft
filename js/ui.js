'use strict';
/* ============================================================
   FIGHTER CRAFT - screens shared by everything: title, story,
   results, quiz, touch controls and the main game loop
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
    if (!on) ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyJ', 'KeyK', 'KeyL', 'KeyF', 'ShiftLeft'].forEach(k => { Input.down[k] = false; });
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
    const up = o.ups > 0 ? `<div class="up">⬆ LEVEL UP!  Level ${o.lvBefore} → ${S.level}   •   ⚡ Power ${o.pBefore} → ${Calc.power()}</div>` : '';
    const badges = o.badges.length ? `<div class="gotbadge">${o.badges.map(b => `${b.icon} New badge: <b>${b.name}</b>`).join(' &nbsp; ')}</div>` : '';
    let body, btns;
    if (o.win) {
      const final = o.stage === 14 && o.armor;
      body = `<div class="bigstars">${[0, 1, 2].map(i => `<span class="${i < o.stars ? '' : 'off'}">★</span>`).join('')}</div>
        <div class="rows"><div>🤖 Robots defeated <b>${o.robots}</b></div><div>🔥 Best combo <b>${o.combo}</b></div>
        <div><span><i class="coin"></i> Coins collected</span> <b>+${o.coins}</b></div><div>⭐ Experience <b>+${o.xp} XP</b></div>
        ${o.interest ? `<div style="grid-column:1/3">🏦 Bank interest - you saved ${o.saved} coins! <b>+${o.interest}</b></div>` : ''}</div>${up}
        ${o.armor ? `<div class="newarmor">${o.armor.icon} NEW ARMOR: ${o.armor.name.toUpperCase()} - FREE!<small>${o.armor.power}  The city is getting an upgrade too!</small></div>` : ''}${badges}`;
      btns = o.armor || !o.canNext ? `<button class="btn gold" data-act="go" data-key="enter">${final ? '👑 SEE YOUR CITY' : 'CONTINUE ➜'}</button>`
        : `<button class="btn gold" data-act="next" data-key="enter">NEXT MISSION ➜</button><button class="btn" data-act="go">🏙️ EXPLORE</button>`;
      say('Mission complete! ' + (o.armor ? `You earned the ${o.armor.name}!` : o.ups > 0 ? 'Level up!' : o.stars === 3 ? 'Three stars. Amazing!' : 'Great job!'));
    } else {
      body = `<div class="tipbox"><b>BOLT:</b> ${o.tip}</div>
        <div class="rows"><div>🤖 Robots defeated <b>${o.robots}</b></div><div>🔥 Best combo <b>${o.combo}</b></div>
        <div><span><i class="coin"></i> Coins kept</span> <b>+${o.coins}</b></div><div>⭐ Experience kept <b>+${o.xp} XP</b></div></div>${up}${badges}
        <div class="sub">Heroes never give up. Every try makes you stronger!</div>`;
      btns = `<button class="btn gold" data-act="retry" data-key="enter">↻ TRY AGAIN</button><button class="btn green" data-act="dojo">🥋 TRAIN AT DOJO</button><button class="btn gray" data-act="city">🏙️ PLAZA</button>`;
      say(o.tip);
    }
    this.set(`<div class="dim"><div class="panel center res"><h2>${o.title}</h2>${body}<div class="brow">${btns}</div></div></div>`, a => WORLD.onResult(a, o));
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
      a => { if (a === 'again') Game.go(new Dojo(k)); else goWorld(); });
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
touchEl.innerHTML = `<div class="stick"><i></i></div>
  <button class="tb" style="left:984px;top:592px" data-k="Space">⬆</button>
  <button class="tb" style="left:1140px;top:570px" data-k="KeyJ">👊</button>
  <button class="tb sm" style="left:1166px;top:452px" data-k="KeyK">💥</button>
  <button class="tb sm" style="left:1040px;top:478px" data-k="KeyL">⭐</button>
  <button class="tb sm" style="left:920px;top:486px" data-k="KeyF">🚗</button>
  <button class="tb xs" style="left:1196px;top:376px" data-k="ShiftLeft">⬇</button>
  <button class="tb xs" style="left:24px;top:170px" data-k="KeyQ">⚔️</button>
  <button class="tb xs" style="left:92px;top:170px" data-k="KeyE">🔫</button>
  <button class="tb pause" style="left:430px;top:16px" data-k="Escape">⏸</button>`;
touchEl.querySelectorAll('.tb').forEach(b => {
  const k = b.dataset.k, off = () => { Input.down[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); Snd.init(); Input.down[k] = true; Input.pressed[k] = true; b.classList.add('on'); });
  b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
{ // a thumb-stick: push up to run, sideways to turn, down to back up
  const pad = touchEl.querySelector('.stick'), knob = pad.querySelector('i');
  const set = e => { const r = pad.getBoundingClientRect(); let x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } Input.down.ArrowLeft = x < -0.35; Input.down.ArrowRight = x > 0.35; Input.down.ArrowUp = y < -0.3; Input.down.ArrowDown = y > 0.5; knob.style.transform = `translate(${x * 60}px,${y * 60}px)`; };
  const off = () => { Input.down.ArrowLeft = Input.down.ArrowRight = Input.down.ArrowUp = Input.down.ArrowDown = false; knob.style.transform = ''; };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); Snd.init(); try { pad.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } set(e); });
  pad.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') set(e); });
  pad.addEventListener('pointerup', off); pad.addEventListener('pointercancel', off);
}
addEventListener('touchstart', () => { if (!UI.isTouch) { UI.isTouch = true; if (Game.scene === WORLD && WORLD && !WORLD.panel && !WORLD.cut) UI.touch(true); } }, { passive: true });

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
      a => { if (a === 'full') toggleFull(); else if (S.started) goWorld(); else this.setup(); });
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
    if (i >= STORY.length) { S.started = true; Save.save(); goWorld(); return; }
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

/* ---------- boot + main loop ---------- */
{ const r = document.createElement('div'); r.id = 'rotate'; r.innerHTML = '<div>📱↻<br><br>Turn your device sideways to play <b>Fighter Craft</b></div>'; document.body.appendChild(r); }
Save.load();
G3.init(document.getElementById('gl'));
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
