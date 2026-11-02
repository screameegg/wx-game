const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

global.wx = {
  getStorageSync() { return null; },
  setStorageSync() {},
  createImage() { return { set src(_) {} }; },
};

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value = value + 0x6D2B79F5 | 0;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function withRandom(seed, run) {
  const original = Math.random;
  Math.random = mulberry32(seed);
  try { return run(); } finally { Math.random = original; }
}

function fakeCtx() {
  return {
    texts: [], scales: [],
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left', filter: 'none',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', shadowColor: '', shadowBlur: 0, shadowOffsetY: 0,
    save() {}, restore() {}, translate() {}, rotate() {},
    scale(x) { this.scales.push(x); },
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    fill() {}, stroke() {}, arc() {}, rect() {}, fillRect() {}, strokeRect() {},
    drawImage() {}, setTransform() {},
    fillText(value) { this.texts.push(String(value)); },
    measureText(value) { return { width: String(value).length * 12 }; },
  };
}

function shot(game) {
  const s = game.state;
  return {
    phase: s.phase,
    price: s.price,
    leader: s.leader,
    spent: s.spent || 0,
    winner: s.winner || '',
    active: (s.rivals || []).map((rival) => rival.active !== false),
    limits: (s.rivals || []).map((rival) => rival.limit),
  };
}

test('round 5 timings stay on the animation clock', async () => {
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { hotspotRules } = await import('../src/features/auction/data/observe-tiers.js');
  const {
    clampHold, clampPause, expressionBeat, leaderHighlightBeat, preHammerBeat, raiseButtonBeat, round5Art,
  } = await import('../src/features/auction/data/round5.js');
  const {
    auctionEvents, drawAuctionBeat, isLeader, liveExpression, offerExpression, preHammerPose, raiseLook, waveFrame,
  } = await import('../src/features/auction/fx/round5-beats.js');

  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(hotspotRules.minSize, 44);
  assert.equal(expressionBeat.holdMs, 1500);
  assert.equal(clampHold(1500), 1500);
  assert.equal(clampHold(50), 1000);
  assert.equal(clampHold(9000), 2000);
  assert.equal(preHammerBeat.pauseMs, 500);
  assert.equal(clampPause(500), 500);
  assert.equal(clampPause(100), 400);
  assert.equal(clampPause(2000), 600);
  assert.equal(leaderHighlightBeat.showCrown, false);
  assert.equal(leaderHighlightBeat.label, '领先');
  assert.equal(raiseButtonBeat.confirm, 'release');
  assert.equal(raiseButtonBeat.useSheet, false);
  assert.equal(expressionBeat.maxOnScreen, 1);
  assert.equal(expressionBeat.waveFrames, 3);
  Object.values(round5Art).forEach((path) => assert.ok(fs.statSync(path).size > 1000));

  assert.equal(raiseLook({}).state, 'default');
  assert.equal(raiseLook({ pressed: true }).state, 'pressed');
  assert.ok(raiseLook({ pressed: true }).scale < 1);
  assert.equal(raiseLook({ disabled: true, pressed: true }).state, 'disabled');
  assert.equal(isLeader('你', '你'), true);
  assert.equal(isLeader('老周', '你'), false);
  assert.equal(isLeader('拍卖员', '拍卖员'), false);

  const reel = { current: null };
  offerExpression(reel, { type: 'raise', index: 1, expression: { id: 'thinking', label: '思考', frame: 1 } }, 0);
  offerExpression(reel, { type: 'raise', index: 0, expression: { id: 'smile', label: '笑', frame: 3 } }, 200);
  assert.equal(liveExpression(reel, 200).index, 1);
  offerExpression(reel, { type: 'abandon', index: 0, expression: { id: 'giveup', label: '放弃', frame: 4 } }, 400);
  assert.equal(liveExpression(reel, 400).type, 'abandon');
  assert.equal(liveExpression(reel, 400).frame, 0);
  assert.equal(waveFrame(0, 1500), 0);
  assert.equal(waveFrame(500, 1500), 1);
  assert.equal(waveFrame(1000, 1500), 2);
  assert.equal(liveExpression(reel, 400 + 500).frame, 1);
  assert.equal(liveExpression(reel, 400 + 1000).frame, 2);
  offerExpression(reel, { type: 'raise', index: 1 }, 800);
  assert.equal(liveExpression(reel, 800).type, 'abandon');
  assert.ok(liveExpression(reel, 400 + 1499));
  assert.equal(liveExpression(reel, 400 + 1500), null);

  const before = { leader: '你', rivals: [{ name: '老周', active: true }, { name: '阿岚', active: true }] };
  const dropped = { leader: '你', rivals: [{ name: '老周', active: true }, { name: '阿岚', active: false }] };
  assert.equal(auctionEvents(before, dropped)[0].type, 'abandon');
  assert.equal(auctionEvents(before, dropped)[0].index, 1);
  const raised = { leader: '老周', rivals: [{ name: '老周', active: true }, { name: '阿岚', active: true }] };
  assert.equal(auctionEvents(before, raised)[0].type, 'raise');
  const overtaken = { leader: '你', rivals: [{ name: '老周', active: true }, { name: '阿岚', active: true }] };
  assert.equal(auctionEvents({ leader: '老周', rivals: before.rivals }, overtaken)[0].type, 'overtaken');
  assert.equal(auctionEvents(before, before).length, 0);

  const waveCtx = fakeCtx();
  waveCtx.drawn = [];
  waveCtx.drawImage = function (...args) { this.drawn.push(args); };
  const waveScene = { art: { get(key) { return key === 'passWave' ? { width: 1280, height: 720 } : null; } } };
  drawAuctionBeat(waveScene, waveCtx, { type: 'abandon', index: 0, frame: 2, fade: 1 }, 10, 20, 80, 90);
  assert.equal(waveCtx.drawn.length, 1);
  assert.equal(waveCtx.drawn[0][1], expressionBeat.waveCrops[2].x);
  assert.equal(waveCtx.drawn[0][2], expressionBeat.waveCrops[2].y);
  drawAuctionBeat({ art: { get() { return null; } } }, fakeCtx(), { type: 'abandon', index: 0, frame: 1, fade: 1 }, 0, 0, 80, 80);

  const pose = preHammerPose(1000, { at: 1500, pauseMs: 500 });
  assert.equal(pose.holding, true);
  assert.equal(pose.scale, preHammerBeat.scale);
  assert.ok(pose.vignette > 0 && pose.vignette <= 0.6);
  assert.equal(preHammerPose(1500, { at: 1500, pauseMs: 500 }).holding, false);

  const beats = fs.readFileSync('src/features/auction/fx/round5-beats.js', 'utf8');
  assert.equal(/\bMath\.random\b/.test(beats), false);
  assert.equal(beats.includes('.bid('), false);
  assert.equal(beats.includes('.respond('), false);
  assert.equal(beats.includes('.limit'), false);
  assert.equal(beats.includes('.estimate'), false);
  assert.equal(beats.includes('.result'), false);
  ['src/features/auction/game.js', 'src/features/auction/data/lines.js', 'src/features/auction/rules/round.js', 'src/features/auction/data/economy.js', 'src/features/auction/data/observe-tiers.js'].forEach((file) => {
    assert.equal(fs.readFileSync(file, 'utf8').includes('round5'), false);
  });
  assert.match(fs.readFileSync('src/app/index.js', 'utf8'), /1200 - \(Date\.now\(\) - s\.pendingAt\)/);
});

test('raise confirms on release, disabled does not click through, leader glow extinguishes', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { bidding } = await import('../src/features/auction/views/screens/bidding.js');

  function viewFor(game) {
    const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
    view.game = game;
    view.art = { get() { return null; } };
    view.buttons = [];
    return view;
  }

  const game = new Game();
  game.state.phase = 'briefing';
  game.state.coins = 5000;
  game.startRound();
  game.beginBidding();
  const view = viewFor(game);
  const ctx = fakeCtx();
  bidding(view, ctx);
  const y = view.height - 44;
  assert.equal(view.pointerDown(200, y), false);
  assert.equal(game.state.pending, false);
  assert.equal(view.pointerUp(0, 0), false);
  assert.equal(game.state.pending, false);
  assert.equal(view.pointerDown(200, y), false);
  assert.equal(view.pointerUp(200, y), true);
  assert.equal(game.state.pending, true);
  assert.equal(game.state.leader, '你');

  const blocked = new Game();
  blocked.state.phase = 'briefing';
  blocked.state.coins = 5000;
  blocked.startRound();
  blocked.beginBidding();
  blocked.state.pending = true;
  blocked.state.leader = '老周';
  const blockedView = viewFor(blocked);
  let leaked = 0;
  blockedView.buttons.push({ x: 0, y: 0, w: 400, h: 900, role: 'under', disabled: false, confirm: 'press', action() { leaked += 1; } });
  bidding(blockedView, fakeCtx());
  assert.equal(blockedView.pointerDown(200, y), false);
  assert.equal(blockedView.pointerUp(200, y), false);
  assert.equal(leaked, 0);
  assert.equal(blocked.state.leader, '老周');
  assert.equal(blocked.state.pending, true);

  const passed = new Game();
  passed.state.phase = 'briefing';
  passed.state.coins = 5000;
  passed.startRound();
  passed.beginBidding();
  const passView = viewFor(passed);
  bidding(passView, fakeCtx());
  assert.equal(passView.pointerDown(40, y), true);
  assert.equal(passed.state.phase, 'passed');

  const glow = new Game();
  glow.state.phase = 'briefing';
  glow.state.coins = 5000;
  glow.startRound();
  glow.beginBidding();
  const glowView = viewFor(glow);
  const paint = (leader) => {
    glow.state.leader = leader;
    glowView.buttons = [];
    const box = fakeCtx();
    bidding(glowView, box);
    return box.texts.filter((value) => value === '领先').length;
  };
  assert.equal(paint('你'), 1);
  assert.equal(paint('老周'), 1);
  assert.equal(paint('拍卖员'), 0);

  const narrow = new Game();
  narrow.state.phase = 'briefing';
  narrow.state.coins = 5000;
  narrow.startRound();
  narrow.beginBidding();
  const board = new CanvasView({ width: 375, height: 640, top: 0, bottom: 0, context: fakeCtx() });
  board.game = narrow;
  board.art = { get() { return null; } };
  board.reviewing = false;
  bidding(board, fakeCtx());
  const link = board.buttons.find((button) => button.label === '回看箱内线索');
  const pass = board.buttons.find((button) => button.label === '放弃');
  const raise = board.buttons.find((button) => button.role === 'raise');
  const textX = link.x + 20;
  const textY = link.y + 23;
  assert.ok(textY + 4 <= pass.y);
  assert.ok(textY + 4 <= raise.y);
  assert.equal(board.pointerDown(textX, textY), true);
  assert.equal(board.reviewing, true);
  assert.equal(narrow.state.phase, 'auction');
  assert.equal(narrow.state.pending, false);
});

test('pre-hammer hold hides the grade and keeps the hammer price', async () => {
  const { default: Game } = await import('../src/features/auction/game.js');
  const { default: GameScene } = await import('../src/features/auction/scene.js');
  const { preHammerBeat } = await import('../src/features/auction/data/round5.js');

  const game = new Game();
  game.state.phase = 'briefing';
  game.state.coins = 5000;
  game.startRound();
  const limits = game.state.rivals.map((rival) => rival.limit);
  game.state.phase = 'reveal';
  game.state.winner = '你';
  game.state.price = 120;
  game.state.spent = 120;
  game.state.coins = 480;
  game.state.items[0].result = ['秘密封级货', '隐藏品相', 9999];
  const scene = new GameScene({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() }, game, () => {});
  scene.menu.view = '';
  scene.playEffect('hammer', { price: 120, beat: '落槌' });
  assert.equal(scene.effect.pauseMs, preHammerBeat.pauseMs);
  assert.equal(scene.effect.at - scene.effect.startedAt, preHammerBeat.pauseMs);
  assert.equal(scene.hammerHolding(), true);
  assert.equal(game.state.coins, 480);
  assert.deepEqual(game.state.rivals.map((rival) => rival.limit), limits);

  const ctx = fakeCtx();
  scene.render(ctx);
  assert.equal(game.state.coins, 480);
  assert.equal(game.state.items[0].result[0], '秘密封级货');
  assert.equal(game.state.items[0].result[2], 9999);
  assert.ok(ctx.texts.includes('当前价'));
  assert.ok(ctx.texts.includes('120 金币'));
  assert.ok(ctx.texts.includes('600 金币'));
  assert.ok(ctx.texts.includes('槌还举着'));
  assert.equal(ctx.texts.includes('秘密封级货'), false);
  assert.equal(ctx.texts.includes('隐藏品相'), false);
  assert.equal(ctx.texts.includes('9999'), false);
  assert.equal(ctx.texts.includes('成交'), false);
  assert.equal(ctx.texts.includes('落槌'), false);
  assert.ok(ctx.scales.includes(preHammerBeat.scale));
  assert.deepEqual(game.state.rivals.map((rival) => rival.limit), limits);
  assert.equal(scene.buttons.some((button) => button.role === 'hammer'), true);
  assert.equal(scene.pointerDown(180, 320), false);
  assert.equal(game.state.items[0].status, 'hidden');
  assert.equal(game.state.phase, 'reveal');
  scene.effect.at = Date.now() - 10;
  scene.render(fakeCtx());
  assert.equal(scene.pointerDown(180, 320), false);
  assert.equal(game.state.items[0].status, 'hidden');
  scene.effect.at = Date.now() - 1250;
  scene.render(fakeCtx());
  assert.equal(scene.hammerClock(), false);
  assert.equal(scene.buttons.some((button) => button.role === 'hammer'), false);
  assert.equal(game.state.items[0].status, 'hidden');
  assert.equal(game.state.coins, 480);
});

test('same seed, 30 rounds, beats on or off, bids and hammer match', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { bidding } = await import('../src/features/auction/views/screens/bidding.js');
  const { isLeader, preHammerPose, raiseLook, syncAuctionBeat } = await import('../src/features/auction/fx/round5-beats.js');
  const { preHammerBeat } = await import('../src/features/auction/data/round5.js');

  function finish(game) {
    let guard = 0;
    while (game.state.phase === 'reveal' && guard++ < 12) {
      const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
      if (index < 0) break;
      if (game.state.items[index].status === 'hidden') game.reveal(index);
      game.handle('sell');
    }
    if (['passed', 'settlement', 'home'].includes(game.state.phase)) game.prepareRound();
    if (game.state.phase === 'repayment') game.continueAfterRepayment();
  }

  function play(seed, present) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.coins = 100000;
      const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
      view.game = game;
      view.art = { get() { return null; } };
      const ctx = fakeCtx();
      let beats = 0;
      const tick = (now) => {
        raiseLook({ disabled: !!game.state.pending, pressed: now % 2 === 0 });
        isLeader(game.state.leader, '你');
        preHammerPose(now, { at: now + preHammerBeat.pauseMs, pauseMs: preHammerBeat.pauseMs });
        const live = syncAuctionBeat(view, now);
        if (live) beats += 1;
        if (game.state.phase === 'auction') bidding(view, ctx, now);
      };
      const rounds = [];
      for (let round = 0; round < 30; round += 1) {
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (['home', 'passed', 'settlement'].includes(game.state.phase)) game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (game.state.phase !== 'briefing') {
          rounds.push({ skip: game.state.phase });
          continue;
        }
        game.startRound();
        if (game.state.phase !== 'observe') {
          rounds.push({ skip: game.state.phase, price: game.state.price });
          continue;
        }
        game.beginBidding();
        const steps = [];
        let guard = 0;
        while (game.state.phase === 'auction' && guard < 20) {
          guard += 1;
          if (present) tick(guard * 2000);
          if (!game.state.pending) game.bid();
          if (present) tick(guard * 2000 + 20);
          if (game.state.phase !== 'auction') break;
          if (!game.state.pending) { game.pass(); break; }
          let hops = 0;
          while (game.state.pending && hops < 4) {
            hops += 1;
            if (present) tick(guard * 2000 + hops * 30);
            game.respond();
            if (present) tick(guard * 2000 + hops * 30 + 5);
          }
          steps.push(shot(game));
        }
        if (game.state.phase === 'auction') game.pass();
        rounds.push({
          steps,
          phase: game.state.phase,
          price: game.state.price,
          spent: game.state.spent || 0,
          leader: game.state.leader,
          winner: game.state.winner || '',
          hammer: game.state.phase === 'reveal' ? game.state.spent : game.state.price,
          limits: (game.state.rivals || []).map((rival) => rival.limit),
        });
        finish(game);
      }
      return { rounds, beats };
    });
  }

  [1, 7, 11].forEach((seed) => {
    const withBeats = play(seed, true);
    const plain = play(seed, false);
    assert.ok(withBeats.beats > 0);
    assert.equal(plain.beats, 0);
    assert.equal(withBeats.rounds.length, 30);
    assert.deepEqual(withBeats.rounds, plain.rounds);
  });
});
