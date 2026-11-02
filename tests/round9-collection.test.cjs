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
        if (String(value).includes('reference/round9') && typeof image.onerror === 'function') image.onerror();
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
  const images = [];
  const nop = () => {};
  return {
    texts, images,
    fillStyle: '', strokeStyle: '', font: '16px sans', textAlign: 'left', textBaseline: 'alphabetic',
    lineWidth: 1, globalAlpha: 1,
    save: nop, restore: nop, translate: nop, rotate: nop, scale: nop,
    beginPath: nop, moveTo: nop, lineTo: nop, quadraticCurveTo: nop, closePath: nop,
    fill: nop, stroke: nop, arc: nop, rect: nop, fillRect: nop, strokeRect: nop,
    setLineDash: nop,
    fillText(value) { texts.push(String(value)); },
    measureText(value) { return { width: String(value).length * 10 }; },
    drawImage(image) { images.push(image); },
  };
}

function blankState(extra = {}) {
  return {
    phase: 'home', coins: 600, round: 0, collection: [], discovered: [],
    unlocked: ['band', 'photo', 'repair'], tier: 'starter', pledged: null,
    debtPeriod: 0, arrears: 0, prepaid: 0, overdue: 0, ...extra,
  };
}

test('round 9 paths, badge, and layout stay presentational', async () => {
  const dataSrc = fs.readFileSync('src/features/auction/data/round9.js', 'utf8');
  const drawSrc = fs.readFileSync('src/features/auction/fx/round9-present.js', 'utf8');
  const screenSrc = fs.readFileSync('src/features/auction/views/screens/collection.js', 'utf8');
  [dataSrc, drawSrc, screenSrc].forEach((src) => {
    assert.ok(src.split('\n').length < 500);
    assert.equal(src.includes('economy'), false);
    assert.equal(src.includes('paymentDue'), false);
    assert.equal(/\bbid\(/.test(src), false);
    assert.equal(src.includes('Math.random'), false);
  });
  assert.equal(drawSrc.includes('requestAnimationFrame'), false);
  assert.equal(drawSrc.includes('setInterval'), false);

  const round9 = await import('../src/features/auction/data/round9.js');
  const { lots } = await import('../src/features/auction/data/lots.js');
  const { economy } = await import('../src/features/auction/data/economy.js');

  assert.equal(round9.round9DropRoot, '/workspace/falcon-art-round9');
  assert.equal(round9.round9Art.useSheet, false);
  assert.equal(round9.rareBadgeSpec.loop, false);
  assert.equal(round9.rareBadgeSpec.flash, false);
  assert.equal(round9.rareBadgeSpec.frames, 1);
  assert.equal(round9.rareBadgeSpec.flashMs, 0);
  assert.equal(round9.rareBadgeSpec.corner, 'top-right');
  assert.equal(round9.rareBadgeSpec.label, '珍品');
  assert.equal(round9.cellTokens.margin, 16);
  assert.equal(round9.cellTokens.gap, 16);
  assert.ok(round9.cellTokens.height >= 44);
  assert.ok(round9.warehouseTokens.rowH >= 44);

  round9.round9Slots.forEach((slot) => {
    assert.equal(slot.path, `assets/resources/art/reference/round9/${slot.file}`);
    assert.equal(slot.drop, `/workspace/falcon-art-round9/${slot.file}`);
    assert.equal(slot.key, `round9:${Object.keys(round9.round9Files).find((key) => round9.round9Files[key] === slot.file)}`);
    assert.ok(fs.statSync(slot.path).size > 1000);
  });
  assert.deepEqual(round9.round9Slots.map((slot) => slot.file), [
    'collection_grid_spec.png', 'rare_corner_badge.png', 'warehouse_list_mock.png',
    'empty_collection_state.png', 'empty_warehouse_state.png',
  ]);

  const names = round9.collectTreasureNames(lots);
  assert.deepEqual([...names].sort(), [
    '大师签名底片', '师傅签名怀表', '旧吉他', '旧唱片', '旧相机', '未发行的巡演母带', '签名海报',
  ].sort());
  const sample = round9.collectTreasureNames([{
    items: [
      { collectible: true, good: ['刚好', '说明', 250] },
      { collectible: true, good: ['差一点', '说明', 249] },
      { collectible: true, good: ['受潮乐谱', '说明', 300] },
      { collectible: false, good: ['不收', '说明', 400] },
    ],
    presetResults: [[
      ['刚好', '说明', 250],
      ['差一点', '说明', 249],
      ['受潮乐谱', '说明', 300],
      ['签名海报样', '说明', 380],
    ]],
    bonusPool: [
      { name: '大奖样', collectible: true, jackpot: true, minVal: 10 },
      { name: '便宜样', collectible: true, minVal: 20 },
    ],
  }]);
  assert.deepEqual([...sample].sort(), ['刚好', '大奖样', '签名海报样'].sort());

  const cell = round9.collectionCellBox(0, 220);
  const next = round9.collectionCellBox(1, 220);
  const badge = round9.badgeBox(cell);
  const thumb = round9.thumbBox(cell);
  const column = round9.cellTextColumn(cell);
  assert.equal(cell.x, 16);
  assert.equal(cell.w, 343);
  assert.equal(cell.h, 112);
  assert.equal(next.y - (cell.y + cell.h), 16);
  assert.equal(badge.y, cell.y + 8);
  assert.equal(badge.x + badge.w, cell.x + cell.w - 8);
  assert.ok(badge.x >= thumb.x + thumb.w);
  assert.ok(column.x + column.w <= badge.x);
  assert.ok(next.y + next.h < round9.pagerY(640));

  const row = round9.warehouseRowBox(0, 220);
  assert.ok(row.h >= 44);
  assert.ok(row.w >= 44);
  const page = round9.warehousePageSize(640);
  const last = round9.warehouseRowBox(page - 1, 220);
  assert.ok(last.y + last.h < round9.pagerY(640));

  const home = round9.atlasHomeLayout(640, 4, true);
  assert.ok(home.emptyBox);
  assert.ok(home.emptyBox.y + home.emptyBox.h <= home.themeTop);
  assert.ok(home.themeTop + 4 * 60 <= home.dockY);
  assert.equal(round9.themeRowBox(0, home.themeTop).h, 52);

  const held = { collection: ['旧吉他', '旧相机', '旧吉他'], pledged: { type: 'collection', name: '旧唱片' } };
  const before = held.collection.slice();
  const stacks = round9.warehouseStacks(held);
  assert.deepEqual(held.collection, before);
  assert.equal(held.pledged.name, '旧唱片');
  assert.deepEqual(stacks.map((item) => [item.name, item.count, item.pledged]), [
    ['旧吉他', 2, false], ['旧相机', 1, false], ['旧唱片', 0, true],
  ]);
  assert.deepEqual(round9.warehouseStacks({ collection: ['旧吉他'], pledged: { type: 'equipment', name: '手电' } }), [
    { name: '旧吉他', count: 1, pledged: false },
  ]);
  assert.equal(round9.cellStatusLine({ found: false, count: 0, pledged: false }), '在拍卖中发现');
  assert.equal(round9.cellStatusLine({ found: true, count: 2, pledged: false }), '已收藏 2 件');
  assert.equal(round9.warehouseStatusLine({ count: 2, pledged: true }), '在库 2 件 · 抵押中');
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
});

test('collection cells, badge, warehouse rows, and empty states', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { collection, collectionDetail } = await import('../src/features/auction/views/screens/collection.js');
  const { catalogEntries } = await import('../src/features/auction/data/catalog.js');
  const { emptyCopy, rareBadgeSpec } = await import('../src/features/auction/data/round9.js');
  const { drawRareBadge } = await import('../src/features/auction/fx/round9-present.js');
  const { default: AuctionArt } = await import('../src/features/auction/render/art.js');

  function render(state, menu, art) {
    const view = new CanvasView({ width: 375, height: 640, top: 0, bottom: 0 });
    view.game = { state };
    view.art = art || { get() { return null; } };
    view.menu = menu;
    view.buttons = [];
    const ctx = fakeCtx();
    const finger = JSON.stringify(state);
    collection(view, ctx);
    assert.equal(JSON.stringify(state), finger);
    return { view, ctx };
  }

  function pageFor(state, name) {
    const entries = catalogEntries(state).filter((entry) => entry.theme === 'band');
    const index = entries.findIndex((entry) => entry.name === name);
    assert.ok(index >= 0);
    return Math.floor(index / 2);
  }

  const hidden = blankState();
  const hiddenPage = render(hidden, {
    view: 'collection', collectionPane: 'atlas', collectionTheme: 'band', collectionPage: pageFor(hidden, '旧吉他'),
  });
  const hiddenText = hiddenPage.ctx.texts.join('');
  assert.ok(hiddenText.includes('尚未收藏'));
  assert.equal(hiddenText.includes('旧吉他'), false);
  assert.equal(hiddenText.includes('珍品'), false);
  assert.equal(hiddenPage.ctx.images.length, 0);

  const guitar = blankState({ collection: ['旧吉他'], discovered: ['旧吉他'] });
  const guitarPage = render(guitar, {
    view: 'collection', collectionPane: 'atlas', collectionTheme: 'band', collectionPage: pageFor(guitar, '旧吉他'),
  });
  const guitarText = guitarPage.ctx.texts.join('');
  assert.ok(guitarText.includes('旧吉他'));
  assert.ok(guitarText.includes('珍品'));
  assert.ok(guitarText.includes('已收藏 1 件'));
  const guitarHit = guitarPage.view.buttons.find((button) => button.label === '图鉴：旧吉他');
  assert.ok(guitarHit);
  assert.ok(guitarHit.w >= 44 && guitarHit.h >= 44);

  const bass = blankState({ collection: ['旧贝斯'], discovered: ['旧贝斯'] });
  const bassPage = render(bass, {
    view: 'collection', collectionPane: 'atlas', collectionTheme: 'band', collectionPage: pageFor(bass, '旧贝斯'),
  });
  const bassText = bassPage.ctx.texts.join('');
  assert.ok(bassText.includes('旧贝斯'));
  assert.equal(bassText.includes('珍品'), false);

  const emptyHome = render(blankState(), { view: 'collection', collectionPane: 'atlas', collectionTheme: '' });
  const emptyHomeText = emptyHome.ctx.texts.join('');
  assert.ok(emptyHomeText.includes('已收藏过 0 /'));
  assert.ok(emptyHomeText.includes(emptyCopy.collection));
  assert.ok(emptyHome.view.buttons.some((button) => button.label.startsWith('乐队巡演')));

  const emptyWarehouse = render(blankState(), { view: 'collection', collectionPane: 'warehouse', warehousePage: 0 });
  const emptyWarehouseText = emptyWarehouse.ctx.texts.join('');
  assert.ok(emptyWarehouseText.includes('在库 0 件'));
  assert.ok(emptyWarehouseText.includes(emptyCopy.warehouse));
  assert.equal(emptyWarehouseText.includes('卖掉'), false);
  assert.equal(emptyWarehouse.view.buttons.some((button) => button.label === '卖掉'), false);

  const stocked = blankState({ collection: ['旧吉他', '旧吉他', '旧相机'], discovered: ['旧吉他', '旧相机'] });
  const warehouse = render(stocked, { view: 'collection', collectionPane: 'warehouse', warehousePage: 0 });
  const warehouseText = warehouse.ctx.texts.join('');
  assert.ok(warehouseText.includes('在库 3 件'));
  assert.ok(warehouseText.includes('在库 2 件'));
  assert.ok(warehouseText.includes('在库 1 件'));
  assert.ok(warehouseText.includes('旧吉他'));
  assert.equal(warehouseText.includes('卖掉'), false);
  const rows = warehouse.view.buttons.filter((button) => String(button.label).startsWith('仓库：'));
  assert.equal(rows.length, 2);
  rows.forEach((button) => { assert.ok(button.w >= 44 && button.h >= 44); });

  const detail = new CanvasView({ width: 375, height: 640, top: 0, bottom: 0 });
  detail.game = { state: guitar };
  detail.art = { get() { return null; } };
  detail.menu = { view: 'collectionDetail', collectionPane: 'warehouse', collectionEntry: '旧吉他' };
  detail.buttons = [];
  const detailCtx = fakeCtx();
  const detailFinger = JSON.stringify(guitar);
  collectionDetail(detail, detailCtx);
  assert.equal(JSON.stringify(guitar), detailFinger);
  assert.ok(detailCtx.texts.join('').includes('珍品'));
  assert.ok(detail.buttons.some((button) => button.label === '返回仓库'));

  const dressed = {
    get(key) { return String(key).startsWith('round9:') ? { width: 80, height: 48, key } : null; },
  };
  const dressedPage = render(guitar, {
    view: 'collection', collectionPane: 'atlas', collectionTheme: 'band', collectionPage: pageFor(guitar, '旧吉他'),
  }, dressed);
  assert.equal(dressedPage.ctx.images.length, 0);

  let clock = 0;
  const now = Date.now;
  Date.now = () => { clock += 1; return 0; };
  drawRareBadge({ art: dressed }, fakeCtx(), { x: 300, y: 8, w: 52, h: 22 });
  Date.now = now;
  assert.equal(clock, 0);
  assert.equal(rareBadgeSpec.loop, false);

  const art = new AuctionArt(() => {});
  assert.equal(art.get('round9:rareBadge'), undefined);
  assert.equal(art.get('round9:cellSpec'), undefined);
  const fallback = render(blankState(), { view: 'collection', collectionPane: 'atlas', collectionTheme: '' }, art);
  assert.ok(fallback.ctx.texts.join('').includes(emptyCopy.collection));
});

test('same seed, collection warehouse ui on or off, collection coins and debt match', async () => {
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { collection } = await import('../src/features/auction/views/screens/collection.js');
  const { paymentDue } = await import('../src/features/auction/rules/debt.js');
  const { warehouseStacks } = await import('../src/features/auction/data/round9.js');
  const { economy } = await import('../src/features/auction/data/economy.js');

  function finger(game) {
    const s = game.state;
    return JSON.stringify({
      coins: s.coins,
      collection: s.collection,
      discovered: s.discovered,
      pledged: s.pledged,
      price: s.price,
      spent: s.spent,
      income: s.income,
      debtPeriod: s.debtPeriod,
      arrears: s.arrears,
      prepaid: s.prepaid,
      overdue: s.overdue,
      items: (s.items || []).map((item) => [item.result[0], item.result[2], item.status]),
    });
  }

  function snapshot(game) {
    const s = game.state;
    return {
      hammer: s.phase === 'reveal' ? s.spent : s.price,
      price: s.price,
      spent: s.spent || 0,
      income: s.income || 0,
      pnl: (s.income || 0) - (s.spent || 0),
      profitTotal: s.profitTotal,
      coins: s.coins,
      collection: [...(s.collection || [])],
      discovered: [...(s.discovered || [])],
      pledged: s.pledged ? { type: s.pledged.type, name: s.pledged.name } : null,
      warehouse: warehouseStacks(s).map((row) => [row.name, row.count, row.pledged]),
      debtPeriod: s.debtPeriod,
      arrears: s.arrears,
      prepaid: s.prepaid,
      overdue: s.overdue,
      due: paymentDue(s),
      inventory: (s.items || []).map((item) => [item.result[0], item.result[2], item.status, item.collectible]),
    };
  }

  function paint(game) {
    const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0 });
    view.game = game;
    view.art = { get() { return null; } };
    view.buttons = [];
    const before = finger(game);
    view.menu = { view: 'collection', collectionPane: 'atlas', collectionTheme: '', collectionPage: 0, warehousePage: 0 };
    const atlas = fakeCtx();
    collection(view, atlas);
    view.buttons = [];
    view.menu.collectionPane = 'warehouse';
    const house = fakeCtx();
    collection(view, house);
    assert.equal(finger(game), before);
    return atlas.texts.join('') + house.texts.join('');
  }

  function play(seed, show) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.coins = 100000;
      const rounds = [];
      let marks = 0;
      for (let round = 0; round < 8; round += 1) {
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (['home', 'passed', 'settlement'].includes(game.state.phase)) game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (game.state.phase !== 'briefing') {
          rounds.push(snapshot(game));
          continue;
        }
        game.startRound();
        if (game.state.phase !== 'observe') {
          rounds.push(snapshot(game));
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
          while (game.state.pending && hops < 4) { hops += 1; game.respond(); }
        }
        if (game.state.phase === 'auction') game.pass();
        if (game.state.phase === 'reveal') {
          let step = 0;
          while (game.state.phase === 'reveal' && step < 12) {
            step += 1;
            const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
            if (index < 0) break;
            if (game.state.items[index].status === 'hidden') game.reveal(index);
            const action = game.state.items[index].collectible && index % 2 === 0 ? 'collect' : 'sell';
            game.handle(action);
          }
        }
        if (show) {
          const text = paint(game);
          if (text.includes('收藏图鉴') && text.includes('仓库')) marks += 1;
        }
        rounds.push(snapshot(game));
        if (['passed', 'settlement'].includes(game.state.phase)) game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
      }
      return { rounds, marks };
    });
  }

  [1, 7, 11, 19].forEach((seed) => {
    const shown = play(seed, true);
    const plain = play(seed, false);
    assert.ok(shown.marks > 0);
    assert.equal(plain.marks, 0);
    assert.equal(shown.rounds.length, 8);
    assert.deepEqual(shown.rounds, plain.rounds);
  });
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
});
