const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

global.wx = {
  getStorageSync() { return null; },
  setStorageSync() {},
  createImage() {
    const image = {};
    Object.defineProperty(image, 'src', {
      set(value) {
        image.value = value;
        if (String(value).includes('falcon-art-round10') && typeof image.onerror === 'function') image.onerror();
      },
    });
    return image;
  },
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
  const texts = [];
  const fills = [];
  const marks = [];
  const images = [];
  const ctx = {
    texts, fills, marks, images,
    strokeStyle: '', font: '', textAlign: 'left', textBaseline: 'alphabetic',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', shadowColor: '', shadowBlur: 0, shadowOffsetY: 0,
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    fill() {}, stroke() {}, arc() {}, rect() {}, fillRect() {}, strokeRect() {},
    setLineDash() {}, setTransform() {},
    measureText(value) { return { width: String(value).length * 12 }; },
    fillText(value) {
      const text = String(value);
      texts.push(text);
      marks.push({ text, font: ctx.font, fill: ctx.fillStyle });
    },
    drawImage(image) { images.push(image); },
  };
  let fill = '';
  Object.defineProperty(ctx, 'fillStyle', {
    get() { return fill; },
    set(value) { fill = value; fills.push(value); },
  });
  return ctx;
}

function lum(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

function sizeOf(mark) {
  const found = /(\d+)px/.exec(mark.font || '');
  return found ? Number(found[1]) : 0;
}

function ledger(state) {
  return JSON.stringify({
    phase: state.phase,
    price: state.price,
    spent: state.spent,
    income: state.income,
    collectedValue: state.collectedValue,
    coins: state.coins,
    collection: state.collection,
    discovered: state.discovered,
    equipment: state.equipment,
    items: (state.items || []).map((item) => item && item.result && item.result.slice()),
    debtPeriod: state.debtPeriod,
    arrears: state.arrears,
    prepaid: state.prepaid,
    overdue: state.overdue,
    tier: state.tier,
    tierPeriod: state.tierPeriod,
    profitTotal: state.profitTotal,
    round: state.round,
    ornament: state.ornament,
    notice: state.notice,
    creditorKey: state.creditorKey,
  });
}

function playHammer(Game, seed) {
  return withRandom(seed, () => {
    const game = new Game();
    game.state.phase = 'briefing';
    game.state.coins = 5000;
    game.startRound();
    game.beginBidding();
    let guard = 0;
    while (game.state.phase === 'auction' && guard++ < 40) {
      const next = game.state.leader === '拍卖员' ? game.state.price : game.state.price + game.state.bidStep;
      if (game.state.pending) game.respond();
      else if (game.state.coins < next) game.pass();
      else game.bid();
    }
    while (game.state.phase === 'reveal') {
      const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
      if (index < 0) break;
      if (game.state.items[index].status === 'hidden') game.reveal(index);
      const item = game.state.items[index];
      game.handle(item.collectible ? 'collect' : 'sell');
    }
    return game;
  });
}

function playDebt(Game, seed) {
  return withRandom(seed, () => {
    const game = new Game();
    game.state.phase = 'briefing';
    game.state.coins = 400;
    for (let i = 0; i < 6; i += 1) {
      game.startRound();
      game.beginBidding();
      game.pass();
      game.prepareRound();
    }
    return game;
  });
}

function viewFor(CanvasView, game) {
  const view = new CanvasView({ width: 375, height: 640, top: 0, bottom: 0, context: fakeCtx() });
  view.game = game;
  view.art = { get() { return null; } };
  view.menu = { view: '' };
  view.height = 640;
  return view;
}

function show(view, ctx, draw) {
  view.buttons = [];
  ctx.texts.length = 0;
  ctx.fills.length = 0;
  ctx.marks.length = 0;
  ctx.images.length = 0;
  draw();
}

test('round 10 skin is presentational and keeps the frozen debt', async () => {
  const dataSrc = fs.readFileSync('src/features/auction/data/round10.js', 'utf8');
  const drawSrc = fs.readFileSync('src/features/auction/fx/round10-present.js', 'utf8');
  const screenSrc = fs.readFileSync('src/features/auction/views/screens/results.js', 'utf8');
  const shopSrc = fs.readFileSync('src/features/auction/views/screens/workshop.js', 'utf8');
  [dataSrc, drawSrc, screenSrc, shopSrc].forEach((src) => {
    assert.ok(src.split('\n').length < 500);
  });
  [dataSrc, drawSrc].forEach((src) => {
    assert.equal(src.includes('1500'), false);
    assert.equal(src.includes('350'), false);
    assert.equal(src.includes('1.10'), false);
    assert.equal(src.includes('resolveRepayment'), false);
    assert.equal(src.includes('upgradeTier'), false);
    assert.equal(src.includes('repayEarly'), false);
    assert.equal(src.includes('游戏结束'), false);
    assert.equal(src.includes('Game Over'), false);
    assert.equal(src.includes('Math.random'), false);
  });
  assert.equal(screenSrc.includes('游戏结束'), false);
  assert.equal(shopSrc.includes('游戏结束'), false);

  const round10 = await import('../src/features/auction/data/round10.js');
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { paymentDue, resolveRepayment } = await import('../src/features/auction/rules/debt.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: AuctionArt } = await import('../src/features/auction/render/art.js');
  const { settlement, repayment } = await import('../src/features/auction/views/screens/results.js');
  const { business } = await import('../src/features/auction/views/screens/workshop.js');
  const { ctaTokens } = await import('../src/features/auction/data/round7.js');

  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(round10.round10DropRoot, '/workspace/falcon-art-round10');
  assert.equal(round10.round10Art.useSheet, true);
  assert.equal(round10.advanceCelebrate.frames, 1);
  assert.equal(round10.advanceCelebrate.loop, false);
  assert.equal(round10.advanceCelebrate.flash, false);
  assert.equal(round10.advancePose(0).phase, 'frame');
  assert.equal(round10.advancePose(0).frame, 0);
  assert.equal(round10.advancePose(639).frame, 0);
  assert.equal(round10.advancePose(640).phase, 'tip');
  assert.deepEqual(round10.round10Slots.map((slot) => slot.file), [
    'settlement_plate.png', 'repay_day_card.png', 'advance_tip.png',
  ]);
  round10.round10Slots.forEach((slot) => {
    assert.equal(slot.path, `assets/art/falcon-art-round10/${slot.file}`);
    assert.equal(slot.drop, `/workspace/falcon-art-round10/${slot.file}`);
  });
  assert.equal(round10.reactionLine(''), '没多说');
  assert.doesNotThrow(() => new AuctionArt(() => {}));

  const fills = Object.values(round10.pnlTones).map((tone) => tone.fill);
  assert.equal(new Set(fills).size, fills.length);
  Object.values(round10.pnlTones).forEach((tone) => {
    assert.ok(lum(tone.ink) + 40 < lum(tone.fill));
  });
  assert.ok(lum(round10.pnlTones.big_win.ink) < lum(round10.pnlTones.small_win.ink));
  assert.ok(lum(round10.pnlTones.big_loss.ink) < lum(round10.pnlTones.small_loss.ink));
  assert.notEqual(round10.repayTones.success.fill, round10.repayTones.overdue.fill);
  assert.equal(round10.repayCopy.seized.chip, '重新开张');

  const layout = round10.settlementLayout(640);
  assert.ok(layout.plate.y + layout.plate.h <= layout.reaction.y);
  assert.ok(layout.reaction.y + layout.reaction.h <= layout.link.y);
  assert.ok(layout.link.y + 36 <= layout.dock.primary.y);
  assert.ok(layout.dock.primary.x >= layout.dock.secondary.x + layout.dock.secondary.w);
  assert.ok(layout.dock.primary.w > layout.dock.secondary.w);
  const type = round10.plateType(layout.plate);
  assert.ok(type.amount.size > type.verb.size);
  assert.ok(type.verb.size > type.summary.size);
  const flat = round10.settlementModel({ income: 80, spent: 80 });
  assert.equal(flat.tone.verb, '打平');
  assert.equal(flat.amount, '0');
  assert.equal(round10.settlementModel({ income: 200, spent: 100 }).tone.band, '大赚');
  assert.equal(round10.settlementModel({ income: 20, spent: 100, collectedValue: 15 }).summary.includes('不计收入'), true);

  const desk = round10.businessLayout(640);
  assert.ok(desk.card.y + desk.card.h <= desk.buttonsY);
  assert.ok(desk.buttonsY + desk.buttonH <= desk.goalsY);
  assert.ok(desk.goalsY + 32 <= desk.advance.y);
  assert.ok(desk.advance.y + desk.advance.h <= desk.dock.y);
  const boxes = [0, 1, 2].map((index) => round10.repayButtonBox(index, desk));
  assert.ok(boxes[0].w >= 44 && boxes[0].h >= 40);
  assert.ok(boxes[0].x + boxes[0].w <= boxes[1].x);
  assert.ok(boxes[1].x + boxes[1].w <= boxes[2].x);
  const inner = round10.advanceInner(desk.advance, false);
  assert.ok(inner.bar.y + inner.bar.h <= inner.status.y);
  assert.ok(inner.status.y + 12 <= inner.tip.y);
  assert.ok(inner.tip.y + 12 <= inner.note.y);
  assert.ok(inner.note.y + 12 <= inner.button.y);
  assert.ok(inner.button.y + inner.button.h <= desk.advance.y + desk.advance.h);
  const linked = round10.advanceInner(desk.advance, true);
  assert.ok(linked.bar.y + linked.bar.h <= linked.status.y);
  assert.ok(linked.status.y + 12 <= linked.tip.y);
  assert.ok(linked.tip.y + 12 <= linked.button.y);
  assert.ok(linked.button.y + linked.button.h <= linked.link.y);
  assert.ok(linked.link.y + 32 <= desk.advance.y + desk.advance.h);
  assert.equal(round10.repayGlance({ phase: 'briefing', due: 0, remaining: 4, coins: 10 }).tone, 'clear');

  const bare = playHammer(Game, 20261110);
  const dressed = playHammer(Game, 20261110);
  assert.equal(bare.state.phase, 'settlement');
  assert.equal(bare.state.spent, bare.state.price);
  assert.equal(ledger(bare.state), ledger(dressed.state));
  const ctx = fakeCtx();
  const view = viewFor(CanvasView, bare);
  const beforeSkin = ledger(bare.state);
  show(view, ctx, () => settlement(view, ctx));
  assert.equal(ledger(bare.state), beforeSkin);
  assert.ok(ctx.texts.includes('本场盈亏'));
  assert.ok(ctx.texts.includes('对手反应'));
  assert.ok(ctx.texts.includes(round10.settlementModel(bare.state).amount));
  assert.ok(ctx.texts.some((text) => text.includes(`成交 ${bare.state.spent}`)));
  const amountMark = ctx.marks.find((mark) => mark.text === round10.settlementModel(bare.state).amount);
  const verb = round10.settlementModel(bare.state).tone.verb;
  const verbMark = ctx.marks.find((mark) => mark.text === verb);
  const summaryMark = ctx.marks.find((mark) => mark.text.includes('成交'));
  assert.ok(sizeOf(amountMark) > sizeOf(verbMark));
  assert.ok(sizeOf(verbMark) > sizeOf(summaryMark));
  const nextBox = view.buttons.find((button) => button.label === '去看下一箱');
  const gear = view.buttons.find((button) => button.label === '设备');
  assert.equal(nextBox.disabled, false);
  assert.equal(gear.confirm, 'press');
  assert.ok(nextBox.w > gear.w);
  assert.ok(nextBox.x >= gear.x + gear.w);

  view.art = { get(key) { return key === 'round10:settlement' ? { width: 20, height: 12 } : null; } };
  show(view, ctx, () => settlement(view, ctx));
  assert.equal(ctx.images.length > 0, true);
  assert.equal(ledger(bare.state), beforeSkin);

  const owed = playDebt(Game, 42);
  const owedAgain = playDebt(Game, 42);
  assert.equal(owed.state.phase, 'repayment');
  assert.equal(ledger(owed.state), ledger(owedAgain.state));
  assert.equal(owed.state.coins, 50);
  assert.equal(owed.state.arrears, 0);
  assert.equal(owed.state.debtPeriod, 1);
  assert.equal(paymentDue(owed.state), Math.round(350 * economy.periodGrowth));
  const owedSnap = ledger(owed.state);
  const owedView = viewFor(CanvasView, owed);
  show(owedView, ctx, () => { repayment(owedView, ctx); business(owedView, ctx); });
  assert.equal(ledger(owed.state), owedSnap);
  assert.ok(ctx.texts.includes('到了还款日'));
  assert.ok(ctx.texts.includes(String(paymentDue(owed.state))));
  assert.ok(ctx.texts.includes('剩 6 场'));
  assert.ok(ctx.texts.includes('已还上'));
  assert.ok(ctx.texts.includes(`当前余额 ${owed.state.coins} 金币`));

  const shop = new Game();
  shop.state.phase = 'briefing';
  shop.state.coins = 800;
  shop.state.arrears = 0;
  shop.state.prepaid = 0;
  const twin = new Game();
  twin.state.phase = 'briefing';
  twin.state.coins = 800;
  twin.state.arrears = 0;
  twin.state.prepaid = 0;
  const shopView = viewFor(CanvasView, shop);
  show(shopView, ctx, () => business(shopView, ctx));
  assert.ok(ctx.texts.includes('还得起'));
  assert.ok(ctx.texts.includes('剩 6 场'));
  assert.ok(ctx.texts.includes(String(paymentDue(shop.state))));
  const pay = shopView.buttons.find((button) => button.label === '还 50');
  assert.equal(pay.disabled, false);
  assert.equal(pay.confirm, 'release');
  shopView.pointerDown(pay.x + 4, pay.y + 4);
  show(shopView, ctx, () => business(shopView, ctx));
  assert.ok(ctx.fills.includes(ctaTokens.pressed.fill));
  assert.equal(shop.state.coins, 800);
  shopView.pointerUp(pay.x + 4, pay.y + 4);
  twin.repayEarly(50);
  assert.equal(shop.state.coins, twin.state.coins);
  assert.equal(shop.state.prepaid, twin.state.prepaid);
  assert.equal(shop.state.arrears, twin.state.arrears);

  const broke = new Game();
  broke.state.phase = 'briefing';
  broke.state.coins = 0;
  const brokeView = viewFor(CanvasView, broke);
  show(brokeView, ctx, () => business(brokeView, ctx));
  const blockedPay = brokeView.buttons.find((button) => button.label === '还 50');
  assert.equal(blockedPay.disabled, true);
  show(brokeView, ctx, () => business(brokeView, ctx));
  brokeView.pointer = { down: true, swallowed: true, role: blockedPay.role };
  show(brokeView, ctx, () => business(brokeView, ctx));
  assert.ok(ctx.fills.includes(ctaTokens.disabled.fill));
  assert.equal(brokeView.pointerDown(blockedPay.x + 4, blockedPay.y + 4), false);
  assert.equal(broke.state.coins, 0);
  assert.ok(ctx.texts.includes('还不起'));
  assert.ok(ctx.texts.includes('还没开始攒进阶档'));
  assert.ok(ctx.texts.includes(`0 / ${economy.advancedEntryCoins}`));

  const ready = new Game();
  ready.state.phase = 'briefing';
  ready.state.coins = economy.advancedEntryCoins;
  ready.state.arrears = 0;
  const mirror = new Game();
  mirror.state.phase = 'briefing';
  mirror.state.coins = economy.advancedEntryCoins;
  mirror.state.arrears = 0;
  mirror.upgradeTier();
  const readyView = viewFor(CanvasView, ready);
  show(readyView, ctx, () => business(readyView, ctx));
  const enter = readyView.buttons.find((button) => button.label === '进入进阶档');
  assert.equal(enter.disabled, false);
  assert.ok(ctx.texts.includes(`${economy.advancedEntryCoins} / ${economy.advancedEntryCoins}`));
  readyView.pointerDown(enter.x + 8, enter.y + 8);
  readyView.pointerUp(enter.x + 8, enter.y + 8);
  show(readyView, ctx, () => business(readyView, ctx));
  assert.equal(ready.state.tier, mirror.state.tier);
  assert.equal(ready.state.coins, mirror.state.coins);
  assert.equal(ready.state.tierPeriod, mirror.state.tierPeriod);
  assert.equal(ready.state.notice, mirror.state.notice);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.ok(ctx.texts.includes('进阶成功'));
  assert.ok(ctx.texts.some((text) => text.includes(`起拍 ${economy.advancedBidStart}`)));
  assert.ok(ctx.texts.some((text) => text.includes(`加价 ${economy.advancedBidStep}`)));
  assert.ok(ctx.texts.some((text) => text.includes(`下期从 ${economy.advancedFirstPayment}`)));
  assert.ok(ctx.texts.includes('已进入进阶档') || ctx.marks.some((mark) => mark.text === '已进入进阶档'));

  const late = new Game();
  late.state.phase = 'briefing';
  late.state.coins = 2000;
  late.state.arrears = 40;
  const lateView = viewFor(CanvasView, late);
  show(lateView, ctx, () => business(lateView, ctx));
  const lateButton = lateView.buttons.find((button) => button.label === '先结清逾期');
  assert.equal(lateButton.disabled, true);
  assert.equal(lateView.pointerDown(lateButton.x + 6, lateButton.y + 6), false);
  assert.equal(late.state.tier, 'starter');
  assert.equal(late.state.coins, 2000);
  assert.ok(ctx.texts.includes('临近收场') === false);
  assert.ok(ctx.texts.includes('先结清逾期，才能进阶'));

  const seized = {
    coins: 0, tier: 'starter', tierPeriod: 0, arrears: 0, prepaid: 0, overdue: 0,
    debtPeriod: 0, round: 0, phase: 'settlement', collection: [], equipment: [],
    pledged: null, notice: '', unlocked: ['band'], discovered: [],
  };
  assert.equal(resolveRepayment({ ...seized, round: 6, coins: 0 }), true);
  const once = { ...seized, collection: [], equipment: [] };
  once.round = 6;
  once.coins = 0;
  resolveRepayment(once);
  assert.equal(once.overdue, 1);
  assert.equal(once.arrears, Math.ceil(350 * economy.overduePenalty));
  assert.notEqual(once.creditorKey, 'seize');
  once.round = 12;
  once.coins = 0;
  resolveRepayment(once);
  assert.equal(once.overdue, 2);
  once.round = 18;
  once.coins = 0;
  resolveRepayment(once);
  assert.equal(once.creditorKey, 'seize');
  assert.equal(once.coins, economy.seizureResetCoins);
  assert.equal(once.tier, 'starter');
  const seizedGame = new Game();
  Object.assign(seizedGame.state, once, { phase: 'repayment' });
  const seizedSnap = ledger(seizedGame.state);
  const seizedView = viewFor(CanvasView, seizedGame);
  show(seizedView, ctx, () => repayment(seizedView, ctx));
  assert.equal(ledger(seizedGame.state), seizedSnap);
  assert.ok(ctx.texts.includes('重新开张'));
  assert.equal(ctx.texts.some((text) => text.includes('游戏结束')), false);
  assert.ok(ctx.texts.includes(String(paymentDue(seizedGame.state))));
  assert.ok(ctx.texts.includes('剩 6 场'));
});
