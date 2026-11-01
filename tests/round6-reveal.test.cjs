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

function screen() {
  return { width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() };
}

test('round 6 timings, zones and rarity stay off the price', async () => {
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { hotspotRules } = await import('../src/features/auction/data/observe-tiers.js');
  const {
    clampConfirm, clampEnter, clampNext, clampScale, rareSparkleBeat, rarityTier, revealQueueBeat, round6Art, settleBeat,
  } = await import('../src/features/auction/data/round6.js');
  const {
    enterProgress, flipFrame, flipProgress, rareFlash, settleLook, settleZones, slotPose, sparkElapsed, zoneAt,
  } = await import('../src/features/auction/fx/round6-beats.js');

  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(hotspotRules.minSize, 44);
  assert.equal(revealQueueBeat.useSheet, false);
  assert.equal(clampEnter(400), 400);
  assert.equal(clampEnter(10), 300);
  assert.equal(clampEnter(900), 500);
  assert.equal(clampNext(400), 400);
  assert.equal(clampNext(1), 300);
  assert.equal(clampNext(900), 500);
  assert.equal(clampConfirm(220), 220);
  assert.ok(clampConfirm(9000) <= 320);
  assert.equal(clampScale(1.2), 1.2);
  assert.equal(clampScale(9), 1.25);
  assert.equal(clampScale(0), 1.15);
  assert.equal(rareSparkleBeat.frames, 1);
  assert.equal(rareSparkleBeat.loop, false);
  assert.ok(rareSparkleBeat.durationMs <= rareSparkleBeat.capMs);
  assert.ok(rareSparkleBeat.capMs <= 300);
  assert.equal(settleBeat.minHit, 44);
  assert.ok(settleBeat.gap >= 32);
  assert.equal(settleBeat.sell.label, '卖掉');
  assert.equal(settleBeat.collect.label, '收下');
  Object.values(round6Art).forEach((file) => assert.ok(fs.statSync(file).size > 1000));

  assert.equal(rarityTier({ isBigWin: true, result: ['甲', '乙', 1] }), 'rare');
  assert.equal(rarityTier({ isBigWin: false, result: ['甲', '乙', 99999] }), 'normal');
  assert.equal(rarityTier({ result: ['甲', '乙', 99999] }), 'normal');
  assert.equal(rareFlash(20, 'normal').on, false);
  assert.equal(rareFlash(20, 'rare').on, true);
  assert.equal(rareFlash(20, 'rare').frame, 0);
  assert.equal(rareFlash(200, 'rare').frame, 0);
  assert.equal(rareFlash(rareSparkleBeat.durationMs, 'rare').on, false);
  assert.equal(rareFlash(5000, 'rare').on, false);

  const resting = slotPose(1, 1, 4, 1);
  const receded = slotPose(0, 1, 4, 1);
  assert.ok(resting.scale >= 1.15 && resting.scale <= 1.25);
  assert.ok(receded.scale < 1);
  assert.ok(receded.alpha < resting.alpha);
  assert.equal(resting.x, 188);
  assert.equal(flipFrame(0).caption, '点击放大');
  assert.equal(flipFrame(0).phase, 'back');
  assert.equal(flipFrame(0).ready, false);
  assert.ok(flipFrame(0).scale >= 1.15 && flipFrame(0).scale <= 1.25);
  assert.equal(flipFrame(0.5).caption, '翻牌');
  assert.equal(flipFrame(0.5).lines, true);
  assert.equal(flipFrame(1).ready, true);
  assert.equal(flipFrame(1).showFront, true);
  assert.equal(flipProgress({ skip: true }, { kind: 'reveal', at: 5000 }, 5000), 1);
  assert.equal(flipProgress(null, { kind: 'reveal', at: 1000 }, 1000), 0);

  const reel = { skip: false, enterAt: 1000 };
  assert.equal(enterProgress(reel, 900), 0);
  assert.equal(enterProgress(reel, 1000), 0);
  assert.ok(enterProgress(reel, 1200) > 0 && enterProgress(reel, 1200) < 1);
  assert.equal(enterProgress(reel, 1400), 1);
  assert.equal(enterProgress({ skip: true, enterAt: 1000 }, 1000), 1);

  const zones = settleZones(375, 700);
  assert.ok(zones.sell.w >= 44 && zones.sell.h >= 44);
  assert.ok(zones.collect.w >= 44 && zones.collect.h >= 44);
  assert.ok(zones.collect.x >= zones.sell.x + zones.sell.w + 32);
  assert.equal(zoneAt(zones, zones.sell.x + zones.sell.w + zones.gap / 2, zones.sell.y + 8), null);
  assert.equal(settleLook('sell', {}).state, 'idle');
  assert.equal(settleLook('sell', { pressed: true }).state, 'pressed');
  assert.ok(settleLook('sell', { pressed: true }).scale < 1);
  assert.notEqual(settleLook('sell', {}).fill, settleLook('collect', {}).fill);
  assert.equal(settleLook('collect', { disabled: true, pressed: true }).state, 'disabled');

  const sparked = { sparked: {} };
  assert.equal(sparkElapsed(sparked, 2, 1000), 0);
  assert.equal(sparkElapsed(sparked, 2, 1100), 100);
  assert.equal(sparked.sparked[2], 1000);

  ['src/features/auction/data/round6.js', 'src/features/auction/fx/round6-beats.js', 'src/features/auction/views/screens/reveal.js'].forEach((file) => {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(text.split('\n').length < 500, file);
    assert.equal(/\bMath\.random\b/.test(text), false, file);
    assert.equal(/result\[2\]\s*[+=]/.test(text), false, file);
    assert.equal(/\.income\s*[+=]/.test(text), false, file);
    assert.equal(/\.coins\s*[+=]/.test(text), false, file);
  });
  assert.equal(fs.readFileSync('src/features/auction/fx/round6-beats.js', 'utf8').includes('.handle('), false);
  ['src/features/auction/game.js', 'src/features/auction/data/lines.js', 'src/features/auction/data/economy.js', 'src/features/auction/data/observe-tiers.js', 'src/features/auction/data/round5.js', 'src/features/auction/rules/round.js', 'src/features/auction/fx/round5-beats.js'].forEach((file) => {
    assert.equal(fs.readFileSync(file, 'utf8').includes('round6'), false, file);
  });
});

test('sell and collect stay on release, skip does not settle, rare flash is one shot', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { reveal } = await import('../src/features/auction/views/screens/reveal.js');
  const { settleZones } = await import('../src/features/auction/fx/round6-beats.js');

  function viewFor(game) {
    const view = new CanvasView(screen());
    view.game = game;
    view.art = { get() { return null; } };
    return view;
  }

  const game = new Game();
  game.state.phase = 'briefing';
  game.state.coins = 5000;
  game.startRound();
  game.state.phase = 'reveal';
  game.state.income = 0;
  game.state.selected = -1;
  const hiddenPrice = game.state.items[1].result[2];
  game.state.items[1].result[2] = 424242;
  const view = viewFor(game);
  const now = 10_000;
  view.buttons = [];
  reveal(view, fakeCtx(), now);
  const card = view.buttons.find((button) => button.label === '翻开这件');
  assert.ok(card);
  assert.ok(card.w >= 44 && card.h >= 44);
  const price = game.state.items[0].result[2];
  assert.equal(view.pointerDown(card.x + card.w / 2, card.y + card.h / 2), true);
  assert.equal(game.state.items[0].status, 'revealed');
  assert.equal(game.state.items[0].result[2], price);
  assert.equal(game.state.income, 0);
  assert.equal(game.state.items[1].status, 'hidden');
  assert.equal(game.state.items[1].result[2], 424242);

  view.effect = { kind: 'reveal', at: now, index: 0 };
  view.buttons = [];
  const early = fakeCtx();
  reveal(view, early, now);
  assert.equal(early.texts.includes('424242'), false);
  assert.equal(early.texts.includes('点击放大'), true);
  assert.equal(view.buttons.some((button) => button.label === '卖掉'), false);
  assert.equal(game.state.items[0].result[2], price);

  view.effect.at = now - 5000;
  view.buttons = [];
  const ready = fakeCtx();
  reveal(view, ready, now);
  assert.equal(ready.texts.includes('424242'), false);
  assert.ok(ready.texts.includes(`可卖 ${price} 金币`));
  const zones = settleZones(375, view.height);
  const sell = view.buttons.find((button) => button.label === '卖掉');
  const collect = view.buttons.find((button) => button.label === '收下');
  assert.equal(sell.x, zones.sell.x);
  assert.equal(sell.w, zones.sell.w);
  assert.equal(collect.x, zones.collect.x);
  assert.ok(collect.x >= sell.x + sell.w + 32);
  assert.ok(sell.w >= 44 && sell.h >= 44);
  assert.ok(collect.h >= 44);
  const gapX = sell.x + sell.w + (collect.x - (sell.x + sell.w)) / 2;
  assert.equal(view.pick(gapX, sell.y + 10), null);
  assert.equal(view.pointerDown(gapX, sell.y + 10), false);
  assert.equal(game.state.income, 0);

  assert.equal(view.pointerDown(sell.x + 8, sell.y + 8), false);
  assert.equal(game.state.income, 0);
  const pressed = fakeCtx();
  reveal(view, pressed, now);
  assert.ok(pressed.scales.includes(0.96));
  assert.equal(view.pointerUp(sell.x + 8, sell.y + 8), true);
  assert.equal(game.state.items[0].status, 'sold');
  assert.equal(game.state.income, price);
  assert.equal(game.state.items[0].result[2], price);
  assert.equal(game.state.items[1].status, 'hidden');
  assert.equal(game.state.coins >= 5000, true);

  const rare = new Game();
  rare.state.phase = 'briefing';
  rare.state.coins = 5000;
  rare.startRound();
  rare.state.phase = 'reveal';
  rare.state.income = 0;
  rare.state.collection = [];
  rare.reveal(0);
  rare.state.items[0].isBigWin = true;
  rare.state.items[0].result[2] = 17;
  rare.state.items[0].collectible = false;
  const rareView = viewFor(rare);
  rareView.effect = { kind: 'reveal', at: now - 5000, index: 0 };
  reveal(rareView, fakeCtx(), now);
  const started = rareView.revealReel.sparked[0];
  assert.equal(typeof started, 'number');
  reveal(rareView, fakeCtx(), now + 50);
  assert.equal(rareView.revealReel.sparked[0], started);
  reveal(rareView, fakeCtx(), now + 5000);
  assert.equal(rareView.revealReel.sparked[0], started);
  assert.equal(rare.state.items[0].result[2], 17);
  const blocked = rareView.buttons.find((button) => button.label === '收下');
  assert.equal(blocked.disabled, true);
  assert.equal(rareView.pointerDown(blocked.x + 8, blocked.y + 8), false);
  assert.equal(rareView.pointerUp(blocked.x + 8, blocked.y + 8), false);
  assert.equal(rare.state.items[0].status, 'revealed');
  assert.deepEqual(rare.state.collection, []);
  assert.equal(rare.state.income, 0);

  const plain = new Game();
  plain.state.phase = 'briefing';
  plain.state.coins = 5000;
  plain.startRound();
  plain.state.phase = 'reveal';
  plain.state.income = 0;
  plain.state.selected = -1;
  plain.state.items[0].isBigWin = false;
  plain.state.items[0].result[2] = 88888;
  const plainView = viewFor(plain);
  plainView.revealReel = { skip: true, sparked: {}, armed: true, enterAt: 1, stamp: 0 };
  reveal(plainView, fakeCtx(), now);
  assert.equal(plain.state.items[0].status, 'hidden');
  assert.equal(plain.state.income, 0);
  assert.equal(plain.state.items[0].result[2], 88888);
  assert.equal(plainView.revealReel.sparked[0], undefined);
  assert.equal(plainView.buttons.some((button) => button.label === '卖掉'), false);

  const skipping = new Game();
  skipping.state.phase = 'briefing';
  skipping.state.coins = 5000;
  skipping.startRound();
  skipping.state.phase = 'reveal';
  skipping.state.income = 0;
  skipping.state.selected = -1;
  const skipView = viewFor(skipping);
  reveal(skipView, fakeCtx(), now);
  const prices = skipping.state.items.map((item) => item.result[2]);
  const skip = skipView.buttons.find((button) => button.label === '跳过动画');
  assert.equal(skipView.pointerDown(skip.x + 4, skip.y + 4), true);
  assert.equal(skipping.state.items[0].status, 'revealed');
  assert.equal(skipping.state.items[1].status, 'hidden');
  assert.equal(skipping.state.income, 0);
  assert.deepEqual(skipping.state.items.map((item) => item.result[2]), prices);
  skipView.buttons = [];
  reveal(skipView, fakeCtx(), now + 10);
  const skippedSell = skipView.buttons.find((button) => button.label === '卖掉');
  assert.ok(skippedSell);
  assert.equal(skipView.pointerUp(skippedSell.x + 6, skippedSell.y + 6), false);
  assert.equal(skipView.pointerDown(skippedSell.x + 6, skippedSell.y + 6), false);
  assert.equal(skipView.pointerUp(skippedSell.x + 6, skippedSell.y + 6), true);
  assert.equal(skipping.state.items[0].status, 'sold');
  assert.equal(skipping.state.items[1].status, 'revealed');
  assert.equal(skipping.state.items[2].status, 'hidden');
  assert.equal(skipping.state.income, prices[0]);
  assert.deepEqual(skipping.state.items.map((item) => item.result[2]), prices);
});

test('same seed, with or without reveal flip, hammer and inventory match', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { reveal } = await import('../src/features/auction/views/screens/reveal.js');
  const { economy } = await import('../src/features/auction/data/economy.js');
  const {
    enterProgress, flipFrame, rareFlash, settleZones, slotPose,
  } = await import('../src/features/auction/fx/round6-beats.js');
  const { rarityTier } = await import('../src/features/auction/data/round6.js');

  function viewFor(game) {
    const view = new CanvasView(screen());
    view.game = game;
    view.art = { get() { return null; } };
    return view;
  }

  function present(view, game, index, now) {
    view.buttons = [];
    view.effect = { kind: 'reveal', at: now - 4000, index };
    const ctx = fakeCtx();
    reveal(view, ctx, now);
    const item = game.state.items[index];
    rareFlash(30, rarityTier(item));
    rareFlash(4000, rarityTier(item));
    flipFrame(0.15);
    flipFrame(1);
    slotPose(0, 0, game.state.items.length, enterProgress(view.revealReel, now));
    settleZones(375, view.height);
    return ctx.texts.includes('卖掉') || ctx.texts.includes(item.result[0]);
  }

  function play(seed, show) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.coins = 100000;
      const view = show ? viewFor(game) : null;
      const rounds = [];
      let beats = 0;
      for (let round = 0; round < 8; round += 1) {
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (['home', 'passed', 'settlement'].includes(game.state.phase)) game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (game.state.phase !== 'briefing') {
          rounds.push({ phase: game.state.phase, coins: game.state.coins });
          continue;
        }
        game.startRound();
        if (game.state.phase !== 'observe') {
          rounds.push({ phase: game.state.phase, coins: game.state.coins, price: game.state.price });
          continue;
        }
        game.beginBidding();
        let guard = 0;
        while (game.state.phase === 'auction' && guard < 24) {
          guard += 1;
          if (!game.state.pending) game.bid();
          if (game.state.phase !== 'auction') break;
          if (!game.state.pending) { game.pass(); break; }
          let hops = 0;
          while (game.state.pending && hops < 4) {
            hops += 1;
            game.respond();
          }
        }
        if (game.state.phase === 'auction') game.pass();
        const hammer = game.state.phase === 'reveal' ? game.state.spent : game.state.price;
        if (game.state.phase === 'reveal') {
          let step = 0;
          while (game.state.phase === 'reveal' && step < 12) {
            step += 1;
            const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
            if (index < 0) break;
            if (game.state.items[index].status === 'hidden') game.reveal(index);
            if (show && present(view, game, index, 5000 + round * 100 + step)) beats += 1;
            const action = game.state.items[index].collectible && index % 2 === 0 ? 'collect' : 'sell';
            game.handle(action);
          }
        }
        rounds.push({
          hammer,
          phase: game.state.phase,
          coins: game.state.coins,
          price: game.state.price,
          spent: game.state.spent || 0,
          income: game.state.income || 0,
          collectedValue: game.state.collectedValue || 0,
          collection: [...game.state.collection],
          overdue: game.state.overdue,
          arrears: game.state.arrears,
          debtPeriod: game.state.debtPeriod,
          items: (game.state.items || []).map((item) => [item.result[0], item.result[2], item.status]),
        });
        if (['passed', 'settlement'].includes(game.state.phase)) game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
      }
      return { rounds, beats };
    });
  }

  [1, 7, 11].forEach((seed) => {
    const shown = play(seed, true);
    const plain = play(seed, false);
    assert.ok(shown.beats > 0);
    assert.equal(plain.beats, 0);
    assert.equal(shown.rounds.length, 8);
    assert.deepEqual(shown.rounds, plain.rounds);
  });
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
});
