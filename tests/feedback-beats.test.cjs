const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

global.wx = {
  getStorageSync() { return null; },
  setStorageSync() {},
  createImage() { return { set src(_) {} }; },
};

const LABELS = ['轻松', '思考', '皱眉', '笑', '放弃', '不服'];

function snap(state) {
  return {
    phase: state.phase,
    selected: state.selected,
    income: state.income,
    pending: state.pending,
    collected: state.collection.length,
    evidence: (state.items || []).map((item) => [item.categoryKnown, item.conditionKnown]),
    statuses: (state.items || []).map((item) => item.status),
  };
}

function fakeCtx() {
  const texts = [];
  return {
    texts,
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left', filter: 'none',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', shadowColor: '', shadowBlur: 0, shadowOffsetY: 0,
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    fill() {}, stroke() {}, arc() {}, rect() {},
    fillRect() {}, strokeRect() {}, drawImage() {}, setTransform() {},
    fillText(value) { texts.push(String(value)); },
    measureText(value) { return { width: String(value).length * 12 }; },
  };
}

test('six expressions follow reaction text and settlement tiers', async () => {
  const { EXPRESSIONS, auctionExpression, settlementExpression, passedExpression, drawExpression } = await import('../src/features/auction/views/people/expressions.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  assert.deepEqual(Object.values(EXPRESSIONS).map((item) => item.label), LABELS);
  assert.deepEqual(Object.values(EXPRESSIONS).map((item) => item.frame), [0, 1, 2, 3, 4, 5]);

  const game = new Game();
  game.state.bidStep = 20;
  game.state.leader = '拍卖员';
  const rival = { name: '老周', active: true, estimate: 400, limit: 300, bluff: false, preferred: true, situation: '正常' };

  game.state.pending = false;
  game.state.price = 100;
  assert.equal(auctionExpression(game, rival).label, '轻松');

  game.state.pending = true;
  assert.equal(auctionExpression(game, rival).label, '不服');
  game.state.leader = '老周';
  assert.equal(auctionExpression(game, rival).label, '思考');

  game.state.leader = '拍卖员';
  game.state.pending = false;
  game.state.price = 450;
  assert.equal(auctionExpression(game, rival).label, '笑');

  game.state.price = 200;
  rival.limit = 210;
  assert.equal(auctionExpression(game, rival).label, '放弃');
  rival.limit = 240;
  assert.equal(auctionExpression(game, rival).label, '皱眉');
  rival.situation = '急着用钱';
  assert.equal(auctionExpression(game, { ...rival, active: true }).label, '皱眉');
  assert.equal(auctionExpression(game, { ...rival, active: false, limit: 999, estimate: 999 }).label, '放弃');

  game.state.price = 100;
  game.state.pending = false;
  assert.equal(auctionExpression(game, { name: '阿岚', active: true, estimate: 500, limit: 500, bluff: true, preferred: false, situation: '正常' }).label, '笑');

  assert.equal(settlementExpression('老周', 1.6).label, '皱眉');
  assert.equal(settlementExpression('老周', 1.2).label, '轻松');
  assert.equal(settlementExpression('老周', 0.7).label, '轻松');
  assert.equal(settlementExpression('老周', 0.3).label, '皱眉');
  assert.equal(settlementExpression('阿岚', 1.6).label, '不服');
  assert.equal(settlementExpression('阿岚', 1.2).label, '皱眉');
  assert.equal(settlementExpression('阿岚', 0.7).label, '笑');
  assert.equal(settlementExpression('阿岚', 0.3).label, '笑');
  assert.equal(passedExpression('老周', '老周').label, '笑');
  assert.equal(passedExpression('阿岚', '老周').label, '轻松');
  assert.equal(passedExpression('阿岚', '').label, '轻松');

  const limit = rival.limit;
  auctionExpression(game, rival);
  assert.equal(rival.limit, limit);
  drawExpression({ art: { get() { return null; } } }, fakeCtx(), 0, EXPRESSIONS.frown, 0, 0, 80, 80);
});

test('deal, flip and profit cues fire in a played round', async () => {
  const { cueFromTouch, cueFromResponse, audible } = await import('../src/features/auction/fx/cues.js');
  const { hammerPose, flipPose, pnlPose } = await import('../src/features/auction/fx/beats.js');
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.advancedFirstPayment, 600);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(economy.periodGrowth, 1.1);

  assert.equal(hammerPose(0).phase, 'lift');
  assert.equal(hammerPose(0.4).phase, 'strike');
  assert.equal(hammerPose(0.7).phase, 'seal');
  assert.equal(flipPose(0).showFront, false);
  assert.ok(flipPose(0).scaleX > 0.9);
  assert.equal(flipPose(1).showFront, true);
  assert.equal(flipPose(1).scaleX, 1);
  assert.equal(flipPose(0.2).phase, 'back');
  assert.equal(flipPose(0.7).phase, 'front');
  assert.equal(pnlPose(0.05).phase, 'in');
  assert.equal(pnlPose(0.4).phase, 'hold');
  assert.equal(pnlPose(0.9).phase, 'out');

  const open = cueFromTouch(
    { phase: 'briefing', selected: -1, income: 0, pending: false, collected: 0, evidence: [] },
    { phase: 'observe', selected: -1, income: 0, pending: false, collection: [], items: [] },
    {},
  );
  assert.equal(open.kind, 'open');
  assert.equal(open.sound, 'open');

  const loss = cueFromTouch(
    { phase: 'reveal', selected: 0, income: 20, pending: false, collected: 0, evidence: [] },
    { phase: 'settlement', selected: -1, income: 20, spent: 90, pending: false, collection: [], items: [] },
    {},
  );
  assert.equal(loss.kind, 'pnl');
  assert.equal(loss.sound, 'settlement');
  assert.equal(loss.detail.net, -70);
  assert.equal(loss.detail.win, false);
  assert.equal(loss.detail.beat, '盈亏大字');

  const game = new Game();
  game.state.phase = 'briefing';
  game.startRound();
  const seen = snap(game.state);
  game.inspect(1);
  assert.equal(cueFromTouch(seen, game.state, {}).kind, 'inspect');

  game.state.selected = 0;
  game.state.items[0].categoryKnown = true;
  const beforeLight = snap(game.state);
  beforeLight.evidence[0][0] = false;
  assert.equal(game.state.items[0].visibility, 2);
  assert.equal(cueFromTouch(beforeLight, game.state, {}), null);

  const beforeAuction = snap(game.state);
  game.beginBidding();
  assert.equal(cueFromTouch(beforeAuction, game.state, {}), null);
  game.state.rivals.forEach((entry) => { entry.limit = 0; entry.estimate = 0; });
  const beforeBid = snap(game.state);
  const limits = game.state.rivals.map((entry) => entry.limit);
  game.bid();
  assert.deepEqual(game.state.rivals.map((entry) => entry.limit), limits);
  const bid = cueFromTouch(beforeBid, game.state, {});
  assert.equal(bid.kind, 'bid');
  assert.equal(bid.sound, 'bid');

  game.respond();
  assert.equal(game.state.phase, 'auction');
  assert.equal(cueFromResponse(game.state).kind, 'bid');
  game.respond();
  assert.equal(game.state.phase, 'reveal');
  const hammer = cueFromResponse(game.state);
  assert.equal(hammer.kind, 'hammer');
  assert.equal(hammer.sound, 'hammer');
  assert.equal(hammer.detail.price, game.state.spent);
  assert.equal(hammer.detail.beat, '落槌');

  let sawSell = false;
  while (game.state.phase === 'reveal') {
    const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
    assert.ok(index >= 0);
    if (game.state.items[index].status === 'hidden') {
      const beforeOpen = snap(game.state);
      game.reveal(index);
      const flip = cueFromTouch(beforeOpen, game.state, {});
      assert.equal(flip.kind, 'reveal');
      assert.equal(flip.sound, 'reveal');
      assert.equal(flip.detail.beat, '揭晓翻牌');
    }
    const beforeHandle = snap(game.state);
    game.handle('sell');
    const dealt = cueFromTouch(beforeHandle, game.state, {});
    if (game.state.phase === 'settlement') {
      assert.equal(dealt.kind, 'pnl');
      assert.equal(dealt.sound, 'settlement');
      assert.equal(dealt.detail.net, game.state.income - game.state.spent);
    } else {
      sawSell = true;
      assert.equal(dealt.kind, 'sell');
    }
  }
  assert.equal(sawSell, true);
  assert.equal(game.state.phase, 'settlement');

  const passed = new Game();
  passed.state.phase = 'briefing';
  passed.startRound();
  passed.beginBidding();
  const beforePass = snap(passed.state);
  passed.pass();
  assert.equal(passed.state.phase, 'passed');
  assert.equal(cueFromTouch(beforePass, passed.state, {}), null);

  const sound = { kind: 'hammer', sound: 'hammer' };
  assert.equal(audible(sound, { soundEnabled: true, paused: false, hidden: false }), true);
  assert.equal(audible(sound, { soundEnabled: false, paused: false, hidden: false }), false);
  assert.equal(audible(sound, { soundEnabled: true, paused: true, hidden: false }), false);
  assert.equal(audible(sound, { soundEnabled: true, paused: false, hidden: true }), false);
  assert.equal(audible({ kind: 'flashlight' }, { soundEnabled: true, paused: false, hidden: false }), false);
  for (const name of ['hammer', 'reveal', 'settlement', 'bid', 'sell']) {
    const file = fs.readFileSync(`assets/audio/effects/${name}.wav`);
    assert.ok(file.length > 44);
  }
});

test('screens draw the four beats without throwing', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { reveal } = await import('../src/features/auction/views/screens/reveal.js');
  const { bidding } = await import('../src/features/auction/views/screens/bidding.js');
  const { settlement } = await import('../src/features/auction/views/screens/results.js');
  const { passed } = await import('../src/features/auction/views/screens/passed.js');
  const { drawFeedback } = await import('../src/features/auction/fx/beats.js');

  const game = new Game();
  game.state.phase = 'briefing';
  game.startRound();
  game.beginBidding();
  const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
  view.game = game;
  view.art = { get() { return null; } };
  view.menu = { view: '' };
  view.reviewing = false;
  const ctx = fakeCtx();

  bidding(view, ctx);
  assert.ok(ctx.texts.some((text) => LABELS.includes(text)));
  game.state.pending = true;
  game.state.pendingAt = Date.now();
  ctx.texts.length = 0;
  bidding(view, ctx);
  assert.ok(ctx.texts.some((text) => LABELS.includes(text)));

  game.state.rivals.forEach((entry) => { entry.limit = 0; entry.estimate = 0; entry.active = true; });
  game.state.pending = true;
  game.state.rivalIndex = 0;
  game.state.leader = '你';
  game.respond();
  game.respond();
  assert.equal(game.state.phase, 'reveal');
  view.effect = { kind: 'hammer', at: Date.now(), price: game.state.spent, beat: '落槌' };
  drawFeedback(view, ctx);
  assert.equal(view.effect.phase, 'lift');
  view.effect.at = Date.now() - 800;
  drawFeedback(view, ctx);
  assert.equal(view.effect.phase, 'seal');
  assert.ok(ctx.texts.includes('落槌'));
  assert.ok(ctx.texts.some((text) => text.includes(`成交 ${game.state.spent}`)));

  game.reveal(0);
  view.buttons = [];
  view.effect = { kind: 'reveal', at: Date.now(), index: 0, beat: '揭晓翻牌' };
  ctx.texts.length = 0;
  reveal(view, ctx);
  assert.equal(view.effect.phase, 'back');
  assert.ok(ctx.texts.includes('点击放大'));
  assert.equal(view.buttons.some((button) => button.label === '卖掉' || button.label === '收下'), false);
  view.effect.at = Date.now() - 5000;
  view.buttons = [];
  reveal(view, ctx);
  assert.ok(view.buttons.some((button) => button.label === '卖掉'));
  assert.ok(view.buttons.some((button) => button.label === '收下'));

  while (game.state.phase === 'reveal') {
    const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
    if (game.state.items[index].status === 'hidden') game.reveal(index);
    game.handle('sell');
  }
  view.effect = { kind: 'pnl', at: Date.now(), net: game.state.income - game.state.spent, win: game.state.income >= game.state.spent, beat: '盈亏大字' };
  ctx.texts.length = 0;
  drawFeedback(view, ctx);
  settlement(view, ctx);
  assert.equal(view.effect.phase, 'in');
  assert.ok(ctx.texts.includes('赚了') || ctx.texts.includes('亏了'));
  assert.ok(ctx.texts.includes('本场盈亏'));

  game.state.phase = 'passed';
  game.state.winner = '阿岚';
  ctx.texts.length = 0;
  passed(view, ctx);
  assert.ok(ctx.texts.includes('笑'));
  assert.ok(ctx.texts.includes('轻松'));
});

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

test('expressions and fx do not change the bid sequence', async () => {
  const fs = require('fs');
  const { round1Art, bandItemIds, bandPiecePath, bandUsesSilhouette } = await import('../src/features/auction/data/round1-art.js');
  const { lots } = await import('../src/features/auction/data/lots.js');
  const { auctionExpression } = await import('../src/features/auction/views/people/expressions.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  assert.deepEqual(round1Art, {
    topbarCta: 'assets/art/ui/topbar-cta-spec.jpg',
    styleboard: 'assets/art/style/styleboard-v2.jpg',
    bandSheet: 'assets/art/items/band/batch1-sheet.jpg',
  });
  assert.deepEqual(bandItemIds, ['bike_01', 'case_guitar_01', 'box_scores_01', 'crate_cloth_01', 'speaker_01']);
  assert.deepEqual(lots.find((lot) => lot.theme === 'band').items.map((item) => item.artId), bandItemIds);
  Object.values(round1Art).forEach((path) => assert.ok(fs.statSync(path).size > 1000));
  bandItemIds.forEach((id) => {
    assert.ok(fs.statSync(bandPiecePath(id, false)).size > 1000);
    assert.ok(fs.statSync(bandPiecePath(id, true)).size > 1000);
  });
  assert.equal(bandUsesSilhouette({ visibility: 0 }, false), true);
  assert.equal(bandUsesSilhouette({ visibility: 1 }, false), true);
  assert.equal(bandUsesSilhouette({ visibility: 2 }, false), false);
  assert.equal(bandUsesSilhouette({ visibility: 0 }, true), false);

  function trace(seed, fx) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.phase = 'briefing';
      game.state.coins = 6000;
      game.startRound();
      game.beginBidding();
      const steps = [];
      for (let n = 0; n < 6 && game.state.phase === 'auction'; n += 1) {
        if (fx) game.state.rivals.forEach((rival) => auctionExpression(game, rival));
        const price = game.state.price;
        game.bid();
        if (!game.state.pending && game.state.price === price) break;
        while (game.state.pending) {
          if (fx) game.state.rivals.forEach((rival) => auctionExpression(game, rival));
          game.respond();
        }
        steps.push([game.state.phase, game.state.price, game.state.leader, game.state.rivals.map((rival) => rival.active)]);
      }
      return steps;
    });
  }
  [1, 2, 7, 11, 19].forEach((seed) => assert.deepEqual(trace(seed, true), trace(seed, false)));

  const reads = withRandom(3, () => {
    const game = new Game();
    game.state.phase = 'briefing';
    game.startRound();
    const rival = game.state.rivals[1];
    const limit = rival.limit;
    rival.bluff = true;
    rival.estimate = 9999;
    rival.active = true;
    game.state.price = 100;
    game.state.bidStep = 20;
    game.state.pending = false;
    game.state.leader = '拍卖员';
    let calls = 0;
    const random = Math.random;
    Math.random = () => { calls += 1; return random(); };
    const mood = auctionExpression(game, rival);
    Math.random = random;
    assert.equal(mood.label, '笑');
    assert.equal(rival.limit, limit);
    assert.equal(calls, 0);
    return limit;
  });
  assert.equal(typeof reads, 'number');

  function bluffBids(bluff) {
    const game = withRandom(4, () => {
      const created = new Game();
      created.state.phase = 'briefing';
      created.state.coins = 6000;
      created.startRound();
      created.beginBidding();
      return created;
    });
    game.state.rivals[1].bluff = bluff;
    return withRandom(8, () => {
      const steps = [];
      for (let n = 0; n < 5 && game.state.phase === 'auction'; n += 1) {
        game.bid();
        while (game.state.pending) game.respond();
        steps.push([game.state.price, game.state.leader, game.state.phase, game.state.rivals.map((rival) => rival.active)]);
      }
      return steps;
    });
  }
  assert.deepEqual(bluffBids(true), bluffBids(false));
});
