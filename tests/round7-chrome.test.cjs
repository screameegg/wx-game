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
  const texts = [];
  const marks = [];
  const fills = [];
  const ctx = {
    texts, marks, fills, scales: [],
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left', textBaseline: 'alphabetic',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', shadowColor: '', shadowBlur: 0, shadowOffsetY: 0,
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    fill() {}, stroke() {}, arc() {}, rect() {}, fillRect() {}, strokeRect() {},
    drawImage() {}, setTransform() {},
    fillText(value) {
      const text = String(value);
      texts.push(text);
      marks.push({ text, font: ctx.font, fill: ctx.fillStyle });
    },
    measureText(value) { return { width: String(value).length * 12 }; },
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
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

test('round 7 tokens, debt copy, and CTA states stay off the ledger', async () => {
  const { economy } = await import('../src/features/auction/data/economy.js');
  const {
    chromePalette, ctaLook, ctaTokens, debtStripLabel, dockBox, layoutTokens, menuSpot, placeTopBar, round7Art, splitDock,
  } = await import('../src/features/auction/data/round7.js');
  const { paymentDue } = await import('../src/features/auction/rules/debt.js');
  const { auctionsRemaining } = await import('../src/features/auction/rules/debt-clock.js');
  const { header } = await import('../src/features/auction/views/shared/chrome.js');
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { bidding } = await import('../src/features/auction/views/screens/bidding.js');

  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(round7Art.useSheet, false);
  Object.values(round7Art).forEach((file) => {
    if (file === false) return;
    assert.ok(fs.statSync(file).size > 1000, file);
  });

  assert.equal(layoutTokens.margin, 16);
  assert.ok(layoutTokens.goldSize > layoutTokens.debtSize);
  assert.ok(layoutTokens.goldHeight > layoutTokens.debtHeight);
  assert.deepEqual(chromePalette, {
    green: '#2F5D50', amber: '#E8A54B', kraft: '#C4A484', cream: '#F5EDE0', ink: '#2B2B2B', rust: '#B85C38',
  });
  assert.equal(ctaTokens.default.fill, '#E8A54B');
  assert.equal(ctaTokens.disabled.fill, '#C4A484');
  assert.equal(ctaTokens.confirm, 'release');
  assert.ok(lum(ctaTokens.pressed.fill) < lum(ctaTokens.default.fill));
  assert.notEqual(ctaLook({}).fill, ctaLook({ disabled: true }).fill);
  assert.equal(ctaLook({ disabled: true, pressed: true }).state, 'disabled');
  assert.equal(ctaLook({ pressed: true }).state, 'pressed');
  assert.equal(ctaLook({}).lip, '#B85C38');

  const boxes = placeTopBar(375, 72, 168);
  assert.equal(boxes.gold.x, 16);
  assert.equal(boxes.gold.y, 16);
  assert.equal(boxes.debt.x + boxes.debt.w, 375 - 16);
  assert.ok(boxes.debt.x >= boxes.gold.x + boxes.gold.w);
  assert.ok(boxes.gold.h > boxes.debt.h);
  const menu = menuSpot(boxes);
  assert.ok(menu.x >= 16);
  assert.ok(menu.x + menu.w <= boxes.debt.x);
  assert.ok(menu.y >= 16);

  const bar = splitDock(700);
  assert.equal(bar.secondary.x, 16);
  assert.equal(bar.primary.x + bar.primary.w, 375 - 16);
  assert.equal(bar.primary.y + bar.primary.h, 700 - 16);
  assert.ok(40 >= bar.secondary.x && 40 <= bar.secondary.x + bar.secondary.w);
  assert.ok(200 >= bar.primary.x && 200 <= bar.primary.x + bar.primary.w);
  assert.ok(700 - 44 >= bar.primary.y && 700 - 44 <= bar.primary.y + bar.primary.h);
  const full = dockBox(700);
  assert.equal(full.x, 16);
  assert.equal(full.x + full.w, 359);
  assert.equal(full.y + full.h, 684);

  assert.equal(debtStripLabel(350, 6), '应还 350 · 剩 6 场');
  assert.match(debtStripLabel(361, 2), /^应还 \d+ · 剩 \d+ 场$/);
  const sources = [
    'src/features/auction/data/round7.js',
    'src/features/auction/fx/round7-chrome.js',
    'src/features/auction/views/shared/chrome.js',
  ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.equal(sources.includes('债期'), false);
  assert.equal(sources.includes('日历'), false);
  assert.equal(sources.includes('小时'), false);
  ['src/features/auction/game.js', 'src/features/auction/rules/debt.js', 'src/features/auction/data/lines.js', 'src/features/auction/data/observe-tiers.js', 'src/features/auction/data/round5.js', 'src/features/auction/fx/round5-beats.js', 'src/features/auction/data/economy.js'].forEach((file) => {
    const body = fs.readFileSync(file, 'utf8');
    assert.equal(body.includes('round7'), false, file);
  });
  assert.equal(/\.bid\(/.test(fs.readFileSync('src/features/auction/fx/round7-chrome.js', 'utf8')), false);
  assert.equal(fs.readFileSync('src/features/auction/fx/round7-chrome.js', 'utf8').includes('resolveRepayment'), false);
  ['src/features/auction/data/round7.js', 'src/features/auction/fx/round7-chrome.js', 'src/features/auction/views/shared/chrome.js', 'src/features/auction/render/canvas-view.js'].forEach((file) => {
    assert.ok(fs.readFileSync(file, 'utf8').split('\n').length < 500, file);
  });

  const game = new Game();
  game.state.arrears = 15;
  game.state.prepaid = 4;
  const due = paymentDue(game.state);
  const remaining = auctionsRemaining(game.state);
  const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
  view.game = game;
  view.menu = { view: '' };
  view.art = { get() { return null; } };
  const ctx = fakeCtx();
  header(view, ctx);
  assert.equal(game.state.coins, 600);
  assert.equal(game.state.arrears, 15);
  assert.equal(game.state.prepaid, 4);
  assert.ok(ctx.texts.includes('600 金币'));
  assert.ok(ctx.texts.includes(debtStripLabel(due, remaining)));
  assert.equal(debtStripLabel(due, remaining), '应还 361 · 剩 6 场');
  const goldMark = ctx.marks.find((mark) => mark.text === '600 金币');
  const debtMark = ctx.marks.find((mark) => mark.text.startsWith('应还'));
  assert.match(goldMark.font, /20px/);
  assert.match(debtMark.font, /12px/);
  assert.equal(goldMark.fill, '#2B2B2B');
  const hit = view.buttons.find((button) => button.label === '菜单');
  assert.ok(hit);
  assert.equal(view.pointerDown(hit.x + 4, hit.y + 4), true);
  assert.equal(view.menu.view, 'pause');

  function arm(coins = 5000) {
    const played = new Game();
    played.state.phase = 'briefing';
    played.state.coins = coins;
    played.startRound();
    played.beginBidding();
    const board = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
    board.game = played;
    board.art = { get() { return null; } };
    board.menu = { view: '' };
    return { played, board };
  }

  const open = arm();
  const openCtx = fakeCtx();
  bidding(open.board, openCtx);
  const release = open.board.buttons.filter((button) => button.confirm === 'release');
  assert.equal(release.length, 1);
  assert.equal(release[0].role, 'raise');
  assert.equal(release[0].disabled, false);
  assert.ok(openCtx.fills.includes('#E8A54B'));
  assert.ok(openCtx.fills.includes('#B85C38'));
  assert.equal(open.board.pointerDown(200, open.board.height - 44), false);
  assert.equal(open.played.state.pending, false);
  assert.equal(open.board.pointerUp(200, open.board.height - 44), true);
  assert.equal(open.played.state.leader, '你');

  const blocked = arm();
  blocked.played.state.pending = true;
  blocked.played.state.leader = '老周';
  let leaked = 0;
  blocked.board.buttons.push({ x: 0, y: 0, w: 400, h: 900, role: 'under', disabled: false, confirm: 'press', action() { leaked += 1; } });
  const blockedCtx = fakeCtx();
  bidding(blocked.board, blockedCtx);
  assert.ok(blockedCtx.fills.includes('#C4A484'));
  assert.equal(blocked.board.buttons.filter((button) => button.role === 'raise' && button.disabled).length, 1);
  assert.equal(blocked.board.pointerDown(200, blocked.board.height - 44), false);
  assert.equal(blocked.board.pointerUp(200, blocked.board.height - 44), false);
  assert.equal(leaked, 0);
  assert.equal(blocked.played.state.leader, '老周');

  const held = arm();
  held.board.pointer = { down: true, swallowed: false, role: 'raise' };
  const heldCtx = fakeCtx();
  bidding(held.board, heldCtx);
  assert.ok(heldCtx.fills.includes('#C17A2A'));
  assert.equal(held.played.state.pending, false);
});

test('same seed, with or without the chrome, gold due remaining and results match', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { header } = await import('../src/features/auction/views/shared/chrome.js');
  const { bidding } = await import('../src/features/auction/views/screens/bidding.js');
  const { paymentDue } = await import('../src/features/auction/rules/debt.js');
  const { auctionsRemaining } = await import('../src/features/auction/rules/debt-clock.js');
  const { economy } = await import('../src/features/auction/data/economy.js');

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

  function shot(game) {
    const s = game.state;
    return {
      coins: s.coins,
      due: paymentDue(s),
      remaining: auctionsRemaining(s),
      arrears: s.arrears || 0,
      prepaid: s.prepaid || 0,
      overdue: s.overdue || 0,
      debtPeriod: s.debtPeriod || 0,
      round: s.round,
      phase: s.phase,
      price: s.price,
      spent: s.spent || 0,
      income: s.income || 0,
      leader: s.leader || '',
      winner: s.winner || '',
      limits: (s.rivals || []).map((rival) => rival.limit),
    };
  }

  function paint(game) {
    const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() });
    view.game = game;
    view.menu = { view: '' };
    view.art = { get() { return null; } };
    view.buttons = [];
    const ctx = fakeCtx();
    header(view, ctx);
    if (game.state.phase === 'auction') bidding(view, ctx);
    return ctx.texts.some((text) => text.includes('金币')) && ctx.texts.some((text) => text.startsWith('应还'));
  }

  function play(seed, present) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.coins = 100000;
      let painted = 0;
      const rounds = [];
      for (let round = 0; round < 30; round += 1) {
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (['home', 'passed', 'settlement'].includes(game.state.phase)) game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (game.state.phase !== 'briefing') {
          if (present && paint(game)) painted += 1;
          rounds.push({ skip: game.state.phase, ...shot(game) });
          continue;
        }
        game.startRound();
        if (game.state.phase !== 'observe') {
          if (present && paint(game)) painted += 1;
          rounds.push({ skip: game.state.phase, ...shot(game) });
          continue;
        }
        game.beginBidding();
        const steps = [];
        let guard = 0;
        while (game.state.phase === 'auction' && guard < 20) {
          guard += 1;
          if (present && paint(game)) painted += 1;
          if (!game.state.pending) game.bid();
          if (present && paint(game)) painted += 1;
          if (game.state.phase !== 'auction') break;
          if (!game.state.pending) { game.pass(); break; }
          let hops = 0;
          while (game.state.pending && hops < 4) {
            hops += 1;
            if (present && paint(game)) painted += 1;
            game.respond();
          }
          steps.push(shot(game));
        }
        if (game.state.phase === 'auction') game.pass();
        if (present && paint(game)) painted += 1;
        rounds.push({ steps, ...shot(game) });
        finish(game);
        if (present && paint(game)) painted += 1;
      }
      return { rounds, painted };
    });
  }

  [1, 7, 11].forEach((seed) => {
    const shown = play(seed, true);
    const plain = play(seed, false);
    assert.ok(shown.painted > 0);
    assert.equal(plain.painted, 0);
    assert.equal(shown.rounds.length, 30);
    assert.deepEqual(shown.rounds, plain.rounds);
  });
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
});
