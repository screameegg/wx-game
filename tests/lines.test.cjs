const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

global.wx = {
  getStorageSync() { return null; },
  setStorageSync() {},
  createImage() { return { set src(_) {} }; },
};

function fakeCtx() {
  const texts = [];
  return {
    texts,
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', shadowColor: '', shadowBlur: 0, shadowOffsetY: 0,
    save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, fill() {}, stroke() {}, arc() {}, rect() {},
    fillRect() {}, strokeRect() {}, drawImage() {}, setTransform() {},
    fillText(value) { texts.push(String(value)); },
    measureText(value) { return { width: String(value).length * 12 }; },
  };
}

test('frozen lines and stub keys stay out of the widgets', async () => {
  const src = fs.readFileSync('src/features/auction/data/lots.js', 'utf8');
  assert.equal(src.includes('TODO(round-2)'), false);
  const { lines, debtorLine, auctioneerLineFor, roiBand, judgeLine, passLine } = await import('../src/features/auction/data/lines.js');
  assert.equal(lines.debtor.opener, '六场之内把第一笔还上。拍得聪明点。');
  assert.equal(lines.debtor.onTime, '这笔结了。下一期别掉以轻心。');
  assert.equal(lines.debtor.shortfall, '先扣你能给的。缺口加息，收藏先押一件。');
  assert.equal(lines.debtor.overdue, '再拖一期，场子就不留你了。');
  assert.equal(lines.debtor.seize, '场子收了。金币清到 300，图鉴和主题还在——再站起来。');
  assert.equal(lines.auctioneer.band.hard, '巡演收摊的货，路上淋过雨——纸和琴，自己看。');
  assert.equal(lines.auctioneer.band.openers.length >= 3, true);
  assert.equal(lines.debtor.countdown1, '还剩一场。下一场就是还款日，钱备齐。');
  assert.equal(lines.debtor.collateral, '逾期记一次。这件押着，补齐再还你。');
  assert.equal(lines.debtor.seizeEntry, '场子留着。六场之内，第一笔重新还。');
  assert.equal(lines.debtor.pressure, '账还挂着。再逾期，就往查封走。');
  assert.equal(lines.debtor.redeem, '押的那件退你。账清了，下期照还。');
  assert.equal(lines.auctioneer.photo.openers.length >= 3, true);
  assert.equal(lines.auctioneer.repair.openers.length >= 3, true);
  assert.equal(lines.auctioneer.photo.hard, lines.auctioneer.photo.openers[0]);
  assert.equal(lines.auctioneer.repair.hard, lines.auctioneer.repair.openers[0]);
  assert.equal(lines.auctioneer.photo.openers.every((line) => line && !line.startsWith('TODO')), true);
  assert.equal(lines.auctioneer.repair.openers.every((line) => line && !line.startsWith('TODO')), true);
  assert.equal(lines.judge.big_win.laozhou, '看走眼了。');
  assert.equal(lines.judge.big_win.alan, '……哼。');
  assert.equal(lines.judge.small_win.laozhou, '还行。');
  assert.equal(lines.judge.small_win.alan, '切。');
  assert.equal(lines.judge.small_loss.laozhou, '幸亏没跟。');
  assert.equal(lines.judge.small_loss.alan, '哈哈。');
  assert.equal(lines.judge.big_loss.laozhou, '啧……');
  assert.equal(lines.judge.big_loss.alan, '笑死。');
  assert.equal(lines.judge.pass.other, '随便。');
  assert.equal(debtorLine('countdown1'), lines.debtor.countdown1);
  assert.equal(debtorLine('collateral'), lines.debtor.collateral);
  assert.equal(debtorLine('seizeEntry'), lines.debtor.seizeEntry);
  assert.equal(debtorLine('pressure'), lines.debtor.pressure);
  assert.equal(debtorLine('redeem'), lines.debtor.redeem);
  assert.equal(auctioneerLineFor({ theme: 'band' }), lines.auctioneer.band.hard);
  assert.equal(auctioneerLineFor({ theme: 'photo' }), lines.auctioneer.photo.hard);
  assert.equal(auctioneerLineFor({ theme: 'repair' }), lines.auctioneer.repair.hard);
  assert.equal(roiBand(1.5), 'big_win');
  assert.equal(roiBand(1.49), 'small_win');
  assert.equal(roiBand(1), 'small_win');
  assert.equal(roiBand(0.5), 'small_loss');
  assert.equal(roiBand(0.49), 'big_loss');
  assert.equal(judgeLine(1.5, '老周'), '看走眼了。');
  assert.equal(judgeLine(0.2, '阿岚'), '笑死。');
  assert.equal(passLine('老周', '老周'), lines.judge.pass.winner.laozhou);
  assert.equal(passLine('阿岚', '老周'), '随便。');
  assert.equal(passLine('阿岚', ''), '随便。');
  const calls = { n: 0 };
  const random = Math.random;
  Math.random = () => { calls.n += 1; return random(); };
  judgeLine(1.2, '老周');
  passLine('阿岚', '阿岚');
  debtorLine('onTime');
  Math.random = random;
  assert.equal(calls.n, 0);
});

test('triggers show copy and leave debt numbers alone', async () => {
  const { lines } = await import('../src/features/auction/data/lines.js');
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { resolveRepayment, paymentDue } = await import('../src/features/auction/rules/debt.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { briefing } = await import('../src/features/auction/views/screens/briefing.js');
  const { settlement, repayment } = await import('../src/features/auction/views/screens/results.js');
  const { passed } = await import('../src/features/auction/views/screens/passed.js');
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.seizureResetCoins, 300);

  const game = new Game();
  game.reset();
  assert.equal(game.state.phase, 'briefing');
  assert.equal(game.state.creditorLine, lines.debtor.opener);
  assert.equal(game.state.coins, 600);
  const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
  view.game = game;
  view.art = { get() { return null; } };
  const ctx = fakeCtx();
  briefing(view, ctx);
  assert.ok(ctx.texts.includes(lines.debtor.opener));
  assert.ok(view.buttons.some((button) => String(button.label).includes('打开集装箱')));

  game.state.creditorLine = '';
  game.startRound();
  assert.equal(game.state.auctioneerLine, lines.auctioneer.band.hard);
  const limits = game.state.rivals.map((rival) => rival.limit);
  assert.equal(game.state.price, economy.starterBidStart);

  const paid = blankDebt({ round: 6, coins: 1000, collection: ['旧吉他'], pledged: { type: 'collection', name: '旧吉他' } });
  assert.equal(paymentDue(paid), 350);
  resolveRepayment(paid);
  assert.equal(paid.coins, 650);
  assert.equal(paid.arrears, 0);
  assert.equal(paid.overdue, 0);
  assert.equal(paid.pledged, null);
  assert.equal(paid.collection.includes('旧吉他'), true);
  assert.equal(paid.creditorLine, lines.debtor.redeem);

  const paidPlain = blankDebt({ round: 6, coins: 1000 });
  resolveRepayment(paidPlain);
  assert.equal(paidPlain.coins, 650);
  assert.equal(paidPlain.arrears, 0);
  assert.equal(paidPlain.pledged, null);
  assert.equal(paidPlain.creditorLine, lines.debtor.onTime);

  const short = blankDebt({ round: 6, coins: 100, collection: ['旧吉他'] });
  resolveRepayment(short);
  assert.equal(short.coins, 0);
  assert.equal(short.arrears, 275);
  assert.equal(short.overdue, 1);
  assert.equal(short.pledged.name, '旧吉他');
  assert.equal(short.creditorLine, lines.debtor.collateral);
  assert.equal(short.notice.includes('275'), true);

  const shortBare = blankDebt({ round: 6, coins: 100 });
  resolveRepayment(shortBare);
  assert.equal(shortBare.coins, 0);
  assert.equal(shortBare.arrears, 275);
  assert.equal(shortBare.overdue, 1);
  assert.equal(shortBare.pledged, null);
  assert.equal(shortBare.creditorLine, lines.debtor.shortfall);

  const warn = blankDebt({ round: 12, debtPeriod: 1, tierPeriod: 1, overdue: 1, arrears: 275, coins: 0 });
  const warnDue = paymentDue(warn);
  resolveRepayment(warn);
  assert.equal(warn.coins, 0);
  assert.equal(warn.overdue, 2);
  assert.equal(warn.arrears, Math.ceil(warnDue * 1.1));
  assert.equal(warn.creditorLine, lines.debtor.overdue);

  const seized = blankDebt({ round: 18, debtPeriod: 2, tierPeriod: 2, overdue: 2, coins: 0, collection: ['旧吉他'] });
  resolveRepayment(seized);
  assert.equal(seized.coins, 300);
  assert.equal(seized.overdue, 0);
  assert.equal(seized.arrears, 0);
  assert.equal(seized.round, 0);
  assert.equal(seized.tier, 'starter');
  assert.equal(seized.pledged, null);
  assert.equal(seized.creditorLine, lines.debtor.seize);
  assert.equal(seized.notice.includes('300'), true);

  seized.phase = 'repayment';
  const repayGame = new Game();
  repayGame.state = seized;
  const repayView = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
  repayView.game = repayGame;
  const repayCtx = fakeCtx();
  repayment(repayView, repayCtx);
  assert.equal(repayCtx.texts.join('').includes(lines.debtor.seize), true);
  assert.equal(repayCtx.texts.some((text) => text.includes('…')), false);
  assert.equal(repayView.buttons.some((button) => button.label === '继续经营'), true);
  repayView.buttons.find((button) => button.label === '继续经营').action();
  assert.equal(seized.phase, 'briefing');
  assert.equal(seized.creditorKey, 'seizeEntry');
  assert.equal(seized.creditorLine, lines.debtor.seizeEntry);

  const dueSoon = new Game();
  dueSoon.reset();
  dueSoon.state.round = 5;
  dueSoon.state.phase = 'settlement';
  dueSoon.state.arrears = 0;
  dueSoon.prepareRound();
  assert.equal(dueSoon.state.phase, 'briefing');
  assert.equal(dueSoon.state.creditorLine, lines.debtor.countdown1);
  const dueView = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
  dueView.game = dueSoon;
  dueView.art = { get() { return null; } };
  const dueCtx = fakeCtx();
  briefing(dueView, dueCtx);
  assert.equal(dueCtx.texts.join('').includes(lines.debtor.countdown1), true);
  assert.equal(dueCtx.texts.some((text) => text.includes('…')), false);

  const pressed = new Game();
  pressed.reset();
  pressed.state.round = 4;
  pressed.state.phase = 'settlement';
  pressed.state.arrears = 100;
  pressed.prepareRound();
  assert.equal(pressed.state.phase, 'briefing');
  assert.equal(pressed.state.creditorLine, lines.debtor.pressure);
  assert.equal(pressed.state.arrears, 100);
  assert.equal(pressed.state.coins, economy.startingCoins);
  const pressView = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
  pressView.game = pressed;
  pressView.art = { get() { return null; } };
  const pressCtx = fakeCtx();
  briefing(pressView, pressCtx);
  assert.equal(pressCtx.texts.join('').includes(lines.debtor.pressure), true);
  assert.equal(pressCtx.texts.some((text) => text.includes('…')), false);

  game.state.income = 120;
  game.state.spent = 100;
  game.state.phase = 'settlement';
  game.state.collectedValue = 0;
  const settleCtx = fakeCtx();
  settlement(view, settleCtx);
  assert.ok(settleCtx.texts.includes('老周：还行。'));
  assert.ok(settleCtx.texts.includes('阿岚：切。'));
  assert.deepEqual(game.state.rivals.map((rival) => rival.limit), limits);

  game.state.phase = 'passed';
  game.state.winner = '老周';
  const passCtx = fakeCtx();
  passed(view, passCtx);
  assert.ok(passCtx.texts.includes(`老周：${lines.judge.pass.winner.laozhou}`));
  assert.ok(passCtx.texts.includes('阿岚：随便。'));
  assert.equal(view.buttons.some((button) => String(button.label).includes('继续')), true);
});

function blankDebt(extra) {
  return {
    round: 0, debtPeriod: 0, tier: 'starter', tierPeriod: 0, coins: 0, arrears: 0, prepaid: 0, overdue: 0,
    pledged: null, collection: [], equipment: [], notice: '', ...extra,
  };
}
