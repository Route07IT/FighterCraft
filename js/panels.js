'use strict';
/* ============================================================
   FIGHTER CRAFT - walk-in places: what opens when the hero steps
   on a glowing pad (districts, Dojo, Workshop + weapons, Bank...)
   plus the pause menu. Extends the World class.
   ============================================================ */
Object.assign(World.prototype, {
  closePanel() { this.panel = null; this.preview = -1; this.camFront = false; UI.clear(); UI.touch(true); Input.pressed = {}; Input.mouse.clicked = false; this.refresh(false); Save.save(); },
  openPanel(id) {
    this.panel = id; this.camFront = false; UI.touch(false); hush(); Input.down = {};
    const X = '<button class="x" data-act="close" data-key="esc">✕</button>', p = Calc.power(); let html = '';
    const suits = () => `<div class="suits">${SUITS.map((s, i) => `<button class="suit ${i === S.suit ? 'on' : ''}" style="background:${s[0]}" data-act="suit" data-arg="${i}"></button>`).join('')}</div>`;
    if (/^d\d$/.test(id)) {
      const d = +id[1], D = DISTRICTS[d], open = S.stage >= d * 3; let rows = '';
      for (let s = 0; s < 3; s++) {
        const i = d * 3 + s, rec = Calc.recPower(i), st = S.stars[i] || 0, cls = p >= rec ? 'ok' : p >= rec * 0.8 ? 'mid' : 'hard';
        rows += i > S.stage ? '<button class="stage lock" data-act="locked">🔒</button>'
          : `<button class="stage ${s === 2 ? 'boss' : ''}" data-act="stage" data-arg="${i}" ${i === S.stage ? 'data-key="enter"' : ''}><b>${s === 2 ? '☠ BOSS ' + ARMOR[d].icon + (S.armor[d] ? '✅' : '🎁') : (d + 1) + '-' + (s + 1) + ' ' + STAGE_NAMES[s]}</b><span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><span class="rec ${cls}">⚡ ${rec}</span></button>`;
      }
      const msg = S.armor[d] ? '✅ This district is free and the lights are back on! Replay missions for more coins and XP.' : open ? `Robots control this district. Beat the boss to win the <b>${ARMOR[d].name}</b> - it is FREE!` : `🔒 These robots are too strong for now. First beat the boss in ${DISTRICTS[d - 1].name}.`;
      html = `<div class="dim lite"><div class="panel" style="width:880px">${X}<h2>${D.icon} ${D.name.toUpperCase()}</h2><p class="sub">${msg}</p><div class="drow">${rows}</div>
        <div class="sub">⚡ = the Power you should have. Your Power is <b style="color:#ffe14d">${p}</b>. &nbsp; <span class="rec ok" style="padding:2px 8px">green = ready</span> <span class="rec hard" style="padding:2px 8px">red = train first!</span></div></div></div>`;
    } else if (id === 'dojo') {
      html = `<div class="dim lite"><div class="panel wide">${X}<h2>🥋 TRAINING DOJO</h2><p class="sub">Nobody is born strong. Heroes get their power by practicing! Pick a training:</p><div class="cards">
        ${['str', 'spd', 'foc'].map(k => { const I = DOJO_INFO[k], need = Calc.statNeed(S[k]); return `<div class="card"><div class="cicon">${I.icon}</div><b>${I.name}</b><small>${k === 'str' ? 'Solve number puzzles and punch the right bag' : k === 'spd' ? 'Hit the robot targets with the arrow keys - fast!' : 'Remember the crystal pattern'}</small>
          <div>${I.stat} level <b style="color:#ffe14d">${S[k]}</b></div><div class="sbar"><i style="width:${S[k + 'Xp'] / need * 100}%"></i></div><small style="min-height:0">→ ${I.gives}</small><button class="btn green" data-act="train" data-arg="${k}">TRAIN!</button></div>`; }).join('')}</div></div></div>`;
    } else if (id === 'armor') {
      this.camFront = true; this.h.yaw = Math.atan2(-this.h.x, -this.h.z); // turn to face the open plaza so the camera can see the hero
      html = `<div class="panel side">${X}<h2>🛡️ LEGENDARY ARMOR</h2><p class="sub">Armor is never bought. You EARN it by beating a boss - and every piece upgrades the whole city!</p>
        ${ARMOR.map((a, i) => `<button class="arow ${S.armor[i] ? 'got' : ''}" data-act="try" data-arg="${i}"><span class="aicon" style="background:${a.color}">${a.icon}</span><span class="ainfo"><b>${a.name}</b><small>${a.power}</small><em>${S.armor[i] ? '✅ EARNED' : `🔒 Beat ${a.from} in ${DISTRICTS[i].name} - FREE reward`}</em></span></button>`).join('')}
        <p class="sub">👆 Tap a piece to try it on!</p></div>`;
    } else if (id === 'rumble') {
      html = `<div class="dim lite"><div class="panel center">${X}<h2>🏟️ ROBOT RUMBLE</h2>${S.stage >= 3 ? `<p class="sub">Endless waves of robots in the stadium.<br>How far can you go? ${S.stats.rumble ? 'Your best: wave <b>' + S.stats.rumble + '</b>' : ''}</p><button class="btn red huge" data-act="rumble" data-key="enter">FIGHT!</button>` : '<p class="sub">🔒 The stadium opens after you beat the first boss<br>in Rusty Harbor.</p>'}</div></div>`;
    } else if (id === 'pause') {
      html = `<div class="dim"><div class="panel center">${X}<h2>⏸ PAUSED</h2><button class="btn gold" data-act="close" data-key="enter">▶ KEEP PLAYING</button>
        <div class="brow"><button class="btn" data-act="power">⚡ MY POWER</button><button class="btn" data-act="badges">🏅 BADGES</button><button class="btn" data-act="settings">⚙️ SETTINGS</button></div>
        ${this.mis ? '<button class="btn gray" data-act="abandon">🏳️ LEAVE MISSION</button>' : '<button class="btn gray" data-act="home">🏙️ JUMP TO THE PLAZA</button>'}</div></div>`;
    } else if (id === 'ko') {
      const near = this.nextDistrict(), rec = near >= 0 ? Calc.recPower(S.stage) : 0;
      html = `<div class="dim"><div class="panel center res">${X}<h2>BOLT RESCUED YOU!</h2><div class="tipbox"><b>BOLT:</b> Those robots were too strong! Look at the ⚡ number over a robot: <b style="color:#17914a">green</b> means you are ready, <b style="color:#c81e1e">red</b> means train first. Your Power is ${p}${rec ? `, and your next mission needs ${rec}` : ''}.</div>
        <div class="sub">You are safe in the plaza. Heroes never give up!</div><button class="btn gold" data-act="close" data-key="enter">OK!</button></div></div>`;
      say('Those robots were too strong! Red numbers mean train first.');
    } else if (id === 'badges') {
      const n = BADGES.filter(b => S.badges[b.id]).length;
      html = `<div class="dim"><div class="panel wide">${X}<h2>🏅 BADGES  ${n} / ${BADGES.length}</h2><div class="grid">${BADGES.map(b => `<div class="badge ${S.badges[b.id] ? 'on' : ''}"><div class="bi">${b.icon}</div>${b.name}<small>${b.desc}</small></div>`).join('')}</div></div></div>`;
    } else if (id === 'power') {
      const parts = Calc.powerParts(), mx = Math.max(...parts.map(q => q.v), 1);
      html = `<div class="dim"><div class="panel wide">${X}<h2>⚡ WHERE DOES MY POWER COME FROM?</h2>
        ${parts.map(q => `<div class="prow"><span class="pi">${q.icon}</span><span>${q.name}</span><div class="pbar"><i style="width:${q.v / mx * 100}%"></i></div><span class="pv">${q.v}</span><small>${q.how}</small></div>`).join('')}
        <div class="ptotal">TOTAL POWER: ⚡ ${p} ${S.stage <= 14 ? `<small style="display:inline;font-size:19px;color:#fff"> &nbsp; Next mission needs ⚡ ${Calc.recPower(S.stage)}</small>` : ''}</div>
        <p class="sub">Power is not luck. Every bar grows when YOU work on it: fight, train, earn armor and build. (Weapons help too, but they are tools - the power is yours.)</p></div></div>`;
    } else if (id === 'settings') {
      const t = k => `<button class="btn ${S.opts[k] ? 'green' : 'gray'}" data-act="opt" data-arg="${k}">${{ sound: '🔊 Sound', music: '🎵 Music', voice: '🗣️ BOLT voice' }[k]}: ${S.opts[k] ? 'ON' : 'OFF'}</button>`;
      html = `<div class="dim"><div class="panel center">${X}<h2>⚙️ SETTINGS</h2><div class="opts">${t('sound')}${t('music')}${t('voice')}</div>
        <label>Hero name</label><input id="nm" maxlength="12" value="${esc(S.name)}" autocomplete="off">${suits()}
        <div class="brow"><button class="btn" data-act="full">⛶ Full screen</button><button class="btn red" data-act="reset">🗑️ Start over</button></div>
        <div class="sub">↑ run • ← → turn • ↓ back up • SPACE jump (hold to fly with Jet Wings)<br>J hit • K blast • L super • Q / E swap weapons • ESC pause • a game controller works too</div></div></div>`;
    } else { // a city building you can build and upgrade
      const b = BUILDINGS.find(x => x.id === id), lv = S.build[id], can = this.canBuild(b), cost = b.cost[lv];
      const btn = can === 'max' ? '<div class="tag gold">★ MAX LEVEL</div>' : can === 'city' ? `<div class="tag lock">🔒 Needs City Level ${b.city} - earn more armor!</div>` : can === 'cap' ? '<div class="tag lock">🔒 Earn the next armor to upgrade more</div>' : `<button class="btn ${S.coins >= cost ? 'gold' : 'gray'}" data-act="buy" data-arg="${id}" ${id === 'workshop' && lv ? '' : 'data-key="enter"'}><i class="coin"></i> ${cost} &nbsp; ${lv ? 'UPGRADE' : 'BUILD IT!'}</button>`;
      let extra = '';
      if (id === 'workshop' && lv) {
        const row = (slot, k, w) => { const own = !w.cost || S.wp.own[k], eq = S.wp[slot] === k; const bt = own ? (eq ? '<div class="tag gold">✓ USING</div>' : `<button class="btn" data-act="wequip" data-arg="${slot}:${k}">USE</button>`) : S.build.workshop < w.lv ? `<div class="tag lock">🔒 Workshop Lv ${w.lv}</div>` : `<button class="btn ${S.coins >= w.cost ? 'gold' : 'gray'}" data-act="wbuy" data-arg="${slot}:${k}"><i class="coin"></i> ${w.cost}</button>`; return `<div class="wrow"><span class="aicon" style="background:#2b3a66">${w.icon}</span><span class="ainfo"><b>${w.name}</b><small>${w.desc}</small></span>${bt}</div>`; };
        extra = `<div class="wgrid"><div><h3>⚔️ Close-up weapons <small>swap with Q</small></h3>${Object.keys(MELEE).map(k => row('m', k, MELEE[k])).join('')}</div><div><h3>🔫 Blasters <small>swap with E</small></h3>${Object.keys(RANGED).map(k => row('r', k, RANGED[k])).join('')}</div></div>`;
      } else if (id === 'bank' && lv) extra = `<p class="sub">🐷 You have <b>${S.coins}</b> coins saved. After your next mission the Bank adds <b style="color:#ffe14d">+${Math.min(150 * lv, Math.floor(S.coins * lv * 0.05))}</b> interest. The more you save, the more you get!</p>`;
      else if (id === 'hospital' && lv) { const h = this.h; if (h.hp < h.maxHp) { h.hp = h.maxHp; Snd.play('heart'); } extra = '<p class="sub">💚 The doctors healed you. Your health is full!</p>'; }
      html = `<div class="dim lite"><div class="panel" style="width:${id === 'workshop' && lv ? 1040 : 640}px">${X}<h2>${b.icon} ${b.name.toUpperCase()}</h2>
        <div class="bcard"><div class="pips">${[0, 1, 2].map(i => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div><div class="binfo"><b>${b.fx}</b><small>${b.tip}</small></div>${btn}</div>
        <div class="coinsline"><i class="coin"></i> You have ${S.coins} coins &nbsp;•&nbsp; City Level ${this.L}: ${CITY_NAMES[this.L]}</div>${extra}</div></div>`;
    }
    UI.set(html, (a, arg, btn) => this.act(a, arg, btn));
    const nm = uiEl.querySelector('#nm'); if (nm) nm.addEventListener('input', () => { S.name = (nm.value.trim() || 'Hero').slice(0, 12); Save.save(); });
  },
  act(a, arg, btn) {
    const id = this.panel;
    switch (a) {
      case 'close': this.closePanel(); break;
      case 'stage': this.closePanel(); this.startMission(+arg); break;
      case 'locked': UI.toast('🔒 Beat the mission before this one first!'); break;
      case 'rumble': this.closePanel(); this.startMission(0, true); break;
      case 'train': this.panel = null; UI.clear(); Game.go(new Dojo(arg)); break;
      case 'try': this.preview = +arg; Snd.play('crystal'); say(ARMOR[+arg].name + '. ' + ARMOR[+arg].power); break;
      case 'power': case 'badges': case 'settings': this.openPanel(a); break;
      case 'opt': S.opts[arg] = !S.opts[arg]; if (!S.opts.voice) hush(); Save.save(); this.openPanel('settings'); break;
      case 'suit': S.suit = +arg; Save.save(); this.openPanel('settings'); break;
      case 'full': toggleFull(); break;
      case 'reset': if (btn.dataset.sure) { Save.reset(); WORLD = null; Game.go(new Title()); } else { btn.dataset.sure = '1'; btn.textContent = '⚠ Press again to erase everything'; } break;
      case 'abandon': this.closePanel(); this.endMission(); Music.play('hub'); this.setBanner('Mission stopped', 'Come back when you are ready!', '#ffffff', 1.8); break;
      case 'home': this.closePanel(); this.en = []; this.teleport(0, 6, 0); break;
      case 'buy': {
        const b = BUILDINGS.find(x => x.id === arg), cost = b.cost[S.build[arg]];
        if (this.canBuild(b) !== true) break;
        if (S.coins < cost) { Snd.play('wrong'); UI.toast(`You need ${cost - S.coins} more coins. Beat robots and smash crates!`); say('You need more coins. Beat robots and smash crates!'); break; }
        S.coins -= cost; S.build[arg]++; S.stats.built++; Snd.play('build'); this.build(); this.refresh(false);
        const got = checkBadges(); Save.save(); UI.toast(`${b.icon} ${b.name} is now level ${S.build[arg]}!`); UI.badgeToasts(got);
        const sp = SPOTS.find(s => s.id === arg); for (let i = 0; i < 5; i++) this.fx.spark(sp.x + rand(-4, 4), rand(2, 7), sp.z + rand(-4, 4), 14, '#ffd23f', 8);
        this.openPanel(arg); say(`${b.name} level ${S.build[arg]}! ${b.tip}`);
        break;
      }
      case 'wbuy': case 'wequip': {
        const [slot, k] = arg.split(':'), w = (slot === 'm' ? MELEE : RANGED)[k];
        if (a === 'wbuy') {
          if (S.coins < w.cost) { Snd.play('wrong'); UI.toast(`You need ${w.cost - S.coins} more coins for the ${w.name}.`); say('You need more coins. Saving up is smart!'); break; }
          S.coins -= w.cost; S.wp.own[k] = true; Snd.play('build'); UI.toast(`${w.icon} You got the ${w.name}!`); say(`You got the ${w.name}! ${w.desc}`);
        }
        S.wp[slot] = k; Save.save(); this.openPanel(id); break;
      }
    }
  },
  onResult(a, o) {
    this.closePanel(); Music.play('hub');
    if (a === 'next' && o.canNext) this.startMission(o.stage + 1);
    else if (a === 'retry') this.startMission(o.stage, o.rumble);
    else if (a === 'dojo') { const p = this.pads.find(q => q.id === 'dojo'); this.teleport(p.x, p.z, Math.PI); this.padLock = 'dojo'; this.openPanel('dojo'); }
    else if (a === 'city') this.teleport(0, 6, 0);
    else if (S.pendingCity > 0) this.startCut();
    else this.say(this.makeTip(), 6);
  }
});
