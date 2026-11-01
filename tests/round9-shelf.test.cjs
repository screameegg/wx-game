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

function fakeCtx(bag = []) {
  const nop = () => {};
  const ctx = {
    fillStyle: '', strokeStyle: '', font: '16px sans', textAlign: 'left', textBaseline: 'alphabetic',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', lineJoin: 'miter',
    shadowColor: '', shadowBlur: 0, shadowOffsetY: 0, filter: 'none',
    fills: [], dashes: [], texts: [],
    save: nop, restore: nop, translate: nop, rotate: nop, scale: nop,
    beginPath: nop, moveTo: nop, lineTo: nop, quadraticCurveTo: nop, bezierCurveTo: nop,
    closePath: nop, fill: nop, stroke: nop, arc: nop, ellipse: nop, rect: nop,
    fillRect: nop, strokeRect: nop, setTransform: nop, clip: nop,
    setLineDash(pattern) { ctx.dashes.push(pattern.slice()); },
    fillText(value) { ctx.texts.push(String(value)); },
    measureText(value) { return { width: String(value).length * 10 }; },
    drawImage(img) { if (img && img.slot) bag.push(img.slot); },
    createRadialGradient() { return { addColorStop: nop }; },
  };
  let fill = '';
  Object.defineProperty(ctx, 'fillStyle', {
    get() { return fill; },
    set(value) { fill = value; ctx.fills.push(value); },
  });
  return ctx;
}

function blankState(extra) {
  return {
    phase: 'home', coins: 600, round: 0, collection: [], discovered: [], unlocked: ['band'],
    tier: 'starter', tierPeriod: 0, tutorialDone: true, soundEnabled: true, equipment: [],
    debtPeriod: 0, arrears: 0, prepaid: 0, overdue: 0, pledged: null, profitTotal: 0, ornament: 0,
    ...extra,
  };
}

test('round 9 paths, plates, and rare seal stay off the ledger', async () => {
  const src = fs.readFileSync('src/features/auction/data/round9.js', 'utf8');
  const paint = fs.readFileSync('src/features/auction/fx/round9-shelf.js', 'utf8');
  const screen = fs.readFileSync('src/features/auction/views/screens/collection.js', 'utf8');
  assert.ok(src.split('\n').length < 500);
  assert.equal(src.includes('economy'), false);
  assert.equal(src.includes('bid'), false);
  assert.equal(paint.includes('Date.now'), false);
  assert.equal(paint.includes('requestAnimationFrame'), false);
  assert.equal(paint.includes('globalAlpha'), false);
  assert.equal(/collection\.push/.test(screen), false);
  assert.equal(/coins\s*[+\-]?=/.test(screen), false);
  assert.equal(screen.includes('economy'), false);

  const {
    badgeBox, catalogBlocks, catalogStateCopy, clampShelfScroll, emptyCopy, gridMetrics, hitInView,
    listBlocks, placeContent, plateFill, rareCatalogNames, resolveArt, round9Art, round9Listing,
    rowContent, shelfLayout, shelfTokens, snapShelfScroll, warehouseEntries,
  } = await import('../src/features/auction/data/round9.js');
  const { paintCellPlate, paintRareBadge } = await import('../src/features/auction/fx/round9-shelf.js');
  const { lots } = await import('../src/features/auction/data/lots.js');
  const { economy } = await import('../src/features/auction/data/economy.js');

  assert.equal(round9Art.useSheet, false);
  assert.equal(shelfTokens.badge.count, 1);
  assert.equal(shelfTokens.badge.loop, false);
  assert.equal(shelfTokens.badge.blink, false);
  assert.equal(shelfTokens.badge.corner, 'tr');
  assert.notEqual(plateFill.found, plateFill.idle);
  assert.equal(emptyCopy.collection, '还没有收藏。');
  assert.equal(emptyCopy.warehouse, '仓库是空的。');
  assert.equal(emptyCopy.collection.includes('\n'), false);
  assert.equal(emptyCopy.warehouse.includes('\n'), false);

  const listing = round9Listing();
  assert.equal(listing.length, 5);
  listing.forEach((row) => {
    assert.equal(row.path, `assets/art/falcon-art-round9/${row.path.split('/').pop()}`);
    assert.equal(row.drop, `/workspace/falcon-art-round9/${row.path.split('/').pop()}`);
    assert.ok(fs.statSync(row.path).size > 1000, row.path);
  });
  assert.deepEqual(rareCatalogNames(lots), ['未发行的巡演母带', '大师签名底片', '师傅签名怀表']);
  assert.deepEqual(catalogStateCopy({ found: false, count: 0, pledged: false }), { mode: 'idle', detail: '' });
  assert.deepEqual(catalogStateCopy({ found: true, count: 2, pledged: false }).detail, '已收藏 2 件');
  assert.equal(catalogStateCopy({ found: true, count: 0, pledged: true }).detail, '抵押中');

  const grid = catalogBlocks(4, false, 375);
  assert.equal(grid.slots[0].w, grid.slots[1].w);
  assert.equal(grid.slots[0].h, grid.slots[3].h);
  assert.equal(grid.slots[1].x - (grid.slots[0].x + grid.slots[0].w), grid.metrics.gap);
  assert.equal(grid.slots[2].y - (grid.slots[0].y + grid.slots[0].h), grid.metrics.gap);
  assert.equal(grid.metrics.gap, shelfTokens.gridGap);
  assert.ok(grid.slots[0].w >= shelfTokens.minHit);
  assert.ok(grid.slots[0].h >= shelfTokens.minHit);
  const withHead = catalogBlocks(2, true, 375);
  assert.equal(withHead.slots[0].y, shelfTokens.emptyBlockH);
  assert.equal(withHead.slots[0].w, grid.slots[0].w);

  const rows = listBlocks(3, 375);
  assert.equal(rows.slots[0].h, shelfTokens.listRowH);
  assert.ok(rows.slots[0].h >= shelfTokens.minHit);
  assert.ok(rows.slots[0].w >= 300);
  assert.equal(rows.slots[1].y - (rows.slots[0].y + rows.slots[0].h), shelfTokens.listGap);
  const inner = rowContent(rows.slots[0]);
  assert.ok(inner.nameX >= inner.thumb.x + inner.thumb.w + 8);
  assert.ok(inner.statusY > inner.nameY);
  assert.equal(inner.thumb.w, shelfTokens.thumb);

  const spot = badgeBox(grid.slots[0]);
  assert.ok(spot.x >= grid.slots[0].x + grid.slots[0].w / 2);
  assert.ok(spot.y + spot.h <= grid.slots[0].y + grid.slots[0].h / 2);
  assert.ok(spot.x + spot.w <= grid.slots[0].x + grid.slots[0].w);
  assert.ok(spot.y >= grid.slots[0].y);

  const themes = [
    { id: 'band', label: '乐队' },
    { id: 'photo', label: '摄影' },
    { id: 'repair', label: '维修' },
  ];
  const layout = shelfLayout(700, { tab: 'catalog', themes, showEmpty: false, itemCount: 15 });
  assert.ok(layout.max > 0);
  assert.ok(layout.view.h >= shelfTokens.minHit);
  assert.ok(layout.chips.every((chip) => chip.y + chip.h <= layout.view.y));
  assert.ok(layout.pager.up.y >= layout.view.y + layout.view.h);
  assert.ok(layout.pager.up.y + layout.pager.up.h <= layout.dock.y);
  assert.ok(layout.pager.down.y + layout.pager.down.h <= layout.dock.y);
  assert.equal(layout.slots[0].w, gridMetrics(375).cellW);
  const placed = placeContent(layout.slots[0], layout.view, 0);
  const hit = hitInView(placed, layout.view);
  assert.equal(hit.h, layout.slots[0].h);
  assert.equal(clampShelfScroll(-20, layout.max), 0);
  assert.equal(clampShelfScroll(9999, layout.max), layout.max);
  assert.equal(snapShelfScroll(layout.stride * 0.7, layout.stride, layout.max), layout.stride);

  const held = warehouseEntries({
    collection: ['旧吉他', '未发行的巡演母带', '未发行的巡演母带'],
    pledged: null,
  });
  assert.deepEqual(held.map((row) => [row.name, row.count, row.status]), [
    ['旧吉他', 1, '在库'],
    ['未发行的巡演母带', 2, '在库 2 件'],
  ]);
  assert.deepEqual(warehouseEntries({ collection: [], pledged: { type: 'collection', name: '旧吉他' } }), [
    { name: '旧吉他', count: 0, pledged: true, status: '抵押中' },
  ]);
  assert.deepEqual(warehouseEntries(blankState()), []);

  const art = { get(key) { return key === 'round9:cellPlate' ? { width: 32, height: 32, slot: key } : null; } };
  assert.equal(resolveArt(art, 'cellPlate'), null);
  assert.equal(resolveArt(art, 'cellPlate', true).slot, 'round9:cellPlate');
  const drawn = [];
  paintCellPlate(fakeCtx(drawn), { x: 0, y: 0, w: 40, h: 40 }, 'found', resolveArt(art, 'cellPlate', true));
  assert.deepEqual(drawn, ['round9:cellPlate']);
  const seal = fakeCtx();
  paintRareBadge(seal, { x: 1, y: 2, w: 22, h: 22 }, null);
  assert.deepEqual(seal.texts, ['珍']);
  const sealed = [];
  const quiet = fakeCtx(sealed);
  paintRareBadge(quiet, { x: 0, y: 0, w: 22, h: 22 }, { width: 16, height: 16, slot: 'round9:rareBadge' });
  assert.deepEqual(quiet.texts, []);
  assert.deepEqual(sealed, ['round9:rareBadge']);

  const prices = (theme) => lots.find((lot) => lot.theme === theme).items.map((item) => [item.good[2], item.bad[2]]);
  assert.deepEqual(prices('photo'), [[250, 30], [80, 30], [80, 20], [120, 40], [65, 15]]);
  assert.deepEqual(prices('repair'), [[140, 50], [150, 35], [120, 30], [80, 30], [90, 25]]);
  assert.deepEqual(prices('band'), [[60, 35], [260, 30], [100, 15], [100, 60], [55, 20]]);
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
});

test('collection grid and warehouse list keep states, badge, and empty copy', async () => {
  const { plateFill, shelfTokens } = await import('../src/features/auction/data/round9.js');
  const { collection, collectionDetail } = await import('../src/features/auction/views/screens/collection.js');
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { catalogEntries } = await import('../src/features/auction/data/catalog.js');
  const { shelfLayout, placeContent, hitInView, rowContent } = await import('../src/features/auction/data/round9.js');

  function viewFor(state, tab, theme) {
    const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0 });
    view.game = { state };
    view.art = { get() { return null; } };
    view.menu = { view: 'collection', collectionTab: tab, collectionTheme: theme || '', shelfOffset: 0, collectionEntry: '' };
    view.buttons = [];
    const marks = [];
    const orig = view.text.bind(view);
    view.text = (ctx, value, x, y, size, color) => {
      marks.push({ value: String(value), x, y, size: size || 16, color });
      return orig(ctx, value, x, y, size, color);
    };
    const ctx = fakeCtx();
    collection(view, ctx);
    return { view, ctx, marks };
  }

  const fresh = blankState();
  const catalog = viewFor(fresh, 'catalog', 'band');
  assert.ok(catalog.ctx.texts.includes('还没有收藏。'));
  assert.equal(catalog.ctx.texts.includes('仓库是空的。'), false);
  assert.ok(catalog.ctx.texts.includes('未收集'));
  assert.equal(catalog.ctx.texts.includes('旧吉他'), false);
  assert.equal(catalog.ctx.texts.includes('未发行的巡演母带'), false);
  assert.equal(catalog.ctx.texts.includes('珍'), false);
  assert.ok(catalog.ctx.fills.includes(plateFill.idle));
  assert.equal(catalog.ctx.fills.includes(plateFill.found), false);
  assert.ok(catalog.ctx.dashes.some((dash) => dash[0] === 5 && dash[1] === 4));
  assert.equal(catalog.view.buttons.some((button) => String(button.label).startsWith('图鉴：')), false);

  const warehouse = viewFor(fresh, 'warehouse');
  assert.ok(warehouse.ctx.texts.includes('仓库是空的。'));
  assert.equal(warehouse.ctx.texts.includes('还没有收藏。'), false);
  assert.equal(warehouse.view.buttons.some((button) => String(button.label).startsWith('仓库：')), false);

  const mixed = blankState({
    collection: ['旧吉他', '未发行的巡演母带', '未发行的巡演母带'],
    discovered: ['旧吉他', '未发行的巡演母带', '旧相机'],
  });
  const found = viewFor(mixed, 'catalog', 'band');
  assert.equal(found.ctx.texts.includes('还没有收藏。'), false);
  assert.ok(found.ctx.texts.includes('未收集'));
  assert.ok(found.ctx.texts.includes('旧吉他'));
  assert.equal(found.ctx.texts.filter((value) => value === '珍').length, 1);
  assert.ok(found.ctx.fills.includes(plateFill.found));
  assert.ok(found.ctx.fills.includes(plateFill.idle));
  const entries = catalogEntries(mixed).filter((entry) => entry.theme === 'band');
  const guitar = entries.findIndex((entry) => entry.name === '旧吉他');
  const layout = shelfLayout(found.view.height, {
    tab: 'catalog',
    themes: [
      { id: 'band', label: '乐队' },
      { id: 'photo', label: '摄影' },
      { id: 'repair', label: '维修' },
    ],
    showEmpty: false,
    itemCount: entries.length,
  });
  const guitarHit = hitInView(placeContent(layout.slots[guitar], layout.view, 0), layout.view);
  const guitarButton = found.view.buttons.find((button) => button.label === '图鉴：旧吉他');
  assert.deepEqual(
    { x: guitarButton.x, y: guitarButton.y, w: guitarButton.w, h: guitarButton.h },
    guitarHit,
  );
  assert.ok(guitarButton.h >= shelfTokens.minHit);

  const shelf = viewFor(mixed, 'warehouse');
  const shelfLayoutRows = shelfLayout(shelf.view.height, { tab: 'warehouse', themes: [], showEmpty: false, itemCount: 2 });
  const rowHit = hitInView(placeContent(shelfLayoutRows.slots[0], shelfLayoutRows.view, 0), shelfLayoutRows.view);
  const rowButton = shelf.view.buttons.find((button) => button.label === '仓库：旧吉他');
  assert.deepEqual({ x: rowButton.x, y: rowButton.y, w: rowButton.w, h: rowButton.h }, rowHit);
  assert.ok(rowButton.h >= shelfTokens.minHit);
  assert.ok(rowButton.w >= 300);
  const name = shelf.marks.find((mark) => mark.value === '旧吉他');
  const status = shelf.marks.find((mark) => mark.value === '在库' && mark.y > shelfLayoutRows.view.y);
  const rareStatus = shelf.marks.find((mark) => mark.value === '在库 2 件' && mark.y > shelfLayoutRows.view.y);
  assert.ok(name.size > status.size);
  assert.ok(status.y > name.y);
  assert.equal(name.x, rowContent(placeContent(shelfLayoutRows.slots[0], shelfLayoutRows.view, 0)).nameX);
  assert.ok(rareStatus);
  assert.equal(shelf.ctx.texts.filter((value) => value === '珍').length, 0);
  const rowButtons = shelf.view.buttons.filter((button) => String(button.label).startsWith('仓库：'));
  for (let i = 1; i < rowButtons.length; i += 1) {
    assert.ok(rowButtons[i].y >= rowButtons[i - 1].y + rowButtons[i - 1].h);
  }

  const remembered = viewFor(blankState({ collection: [], discovered: ['旧吉他'] }), 'catalog', 'band');
  assert.ok(remembered.ctx.texts.includes('曾收藏'));
  assert.equal(remembered.ctx.texts.includes('还没有收藏。'), false);
  const emptyShelf = viewFor(blankState({ collection: [], discovered: ['旧吉他'] }), 'warehouse');
  assert.ok(emptyShelf.ctx.texts.includes('仓库是空的。'));

  const pledged = blankState({
    collection: [],
    discovered: ['旧吉他'],
    pledged: { type: 'collection', name: '旧吉他' },
  });
  const pawn = viewFor(pledged, 'warehouse');
  assert.ok(pawn.ctx.texts.includes('抵押中'));
  assert.equal(pawn.ctx.texts.includes('仓库是空的。'), false);

  const detail = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0 });
  detail.game = { state: mixed };
  detail.art = { get() { return null; } };
  detail.menu = { view: 'collectionDetail', collectionTab: 'catalog', collectionEntry: '未发行的巡演母带' };
  const detailCtx = fakeCtx();
  collectionDetail(detail, detailCtx);
  assert.equal(detailCtx.texts.filter((value) => value === '珍').length, 1);
});

test('shelf drag scrolls the list without touching inventory', async () => {
  const { default: Game } = await import('../src/features/auction/game.js');
  const { default: GameScene } = await import('../src/features/auction/scene.js');
  const game = new Game();
  const scene = new GameScene({ width: 375, height: 700, top: 0, bottom: 0 }, game, () => {});
  scene.menu.view = 'collection';
  scene.menu.collectionTab = 'catalog';
  scene.menu.collectionTheme = 'band';
  const before = {
    collection: game.state.collection.slice(),
    coins: game.state.coins,
    profitTotal: game.state.profitTotal,
  };
  scene.render(fakeCtx());
  assert.ok(scene.shelf.max > 0);
  const y = scene.shelf.viewport.y + 36;
  scene.pointerDown(180, y);
  scene.pointerMove(180, y - 100);
  scene.pointerUp(180, y - 100);
  assert.equal(scene.menu.shelfOffset, scene.shelf.stride);
  assert.equal(scene.menu.view, 'collection');
  assert.deepEqual(game.state.collection, before.collection);
  assert.equal(game.state.coins, before.coins);
  assert.equal(game.state.profitTotal, before.profitTotal);
});

test('same seed with or without the shelf keeps collection, warehouse, hammer, pnl, and debt', async () => {
  const { round9Slots } = await import('../src/features/auction/data/round9.js');
  const { warehouseEntries } = await import('../src/features/auction/data/round9.js');
  const { catalogEntries, catalogStatus } = await import('../src/features/auction/data/catalog.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { collection } = await import('../src/features/auction/views/screens/collection.js');
  const { economy } = await import('../src/features/auction/data/economy.js');

  function artBank(withPieces) {
    const images = {};
    return {
      images,
      get(key) { return images[key] || null; },
      mount(slots) {
        if (!withPieces) return;
        slots.forEach((slot) => { images[slot.key] = { width: 96, height: 96, slot: slot.key }; });
      },
    };
  }

  function snapshot(game) {
    const s = game.state;
    return {
      phase: s.phase,
      theme: game.lot && game.lot.theme,
      hammer: s.spent,
      price: s.price,
      income: s.income,
      pnl: (s.income || 0) - (s.spent || 0),
      profitTotal: s.profitTotal,
      coins: s.coins,
      collection: [...(s.collection || [])],
      warehouse: warehouseEntries(s),
      discovered: [...(s.discovered || [])],
      catalog: catalogEntries(s).map((entry) => {
        const status = catalogStatus(s, entry.name);
        return [entry.name, entry.theme, status.count, status.found, status.pledged];
      }),
      debtPeriod: s.debtPeriod,
      arrears: s.arrears,
      prepaid: s.prepaid,
      overdue: s.overdue,
      pledged: s.pledged ? { type: s.pledged.type, name: s.pledged.name } : null,
      inventory: (s.items || []).map((item) => [item.result[0], item.result[2], item.status, item.collectible, item.good, item.isBigWin]),
    };
  }

  function paint(game, art) {
    const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0 });
    view.game = game;
    view.art = art;
    view.menu = { view: 'collection', collectionTab: 'catalog', collectionTheme: '', shelfOffset: 0 };
    collection(view, fakeCtx());
    view.buttons = [];
    view.menu.collectionTab = 'warehouse';
    collection(view, fakeCtx());
  }

  function play(seed, mode) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.phase = 'briefing';
      game.state.coins = 20000;
      game.state.unlocked = ['band', 'photo', 'repair'];
      game.state.round = 0;
      const art = artBank(mode === 'mounted');
      art.mount(round9Slots);
      const rows = [];
      for (let n = 0; n < 6; n += 1) {
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (game.state.phase !== 'briefing') game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        game.startRound();
        if (mode !== 'quiet' && game.state.phase === 'observe') paint(game, art);
        if (game.state.phase !== 'observe') {
          if (mode !== 'quiet') paint(game, art);
          rows.push(snapshot(game));
          continue;
        }
        game.beginBidding();
        let guard = 0;
        while (game.state.phase === 'auction' && guard < 40) {
          guard += 1;
          if (game.state.pending) game.respond();
          else if (game.state.price >= 280) game.pass();
          else {
            const before = game.state.price;
            game.bid();
            if (game.state.phase === 'auction' && !game.state.pending && game.state.price === before) {
              game.pass();
              break;
            }
          }
        }
        if (game.state.phase === 'reveal') {
          if (mode !== 'quiet') paint(game, art);
          let spins = 0;
          while (game.state.phase === 'reveal' && spins < 12) {
            spins += 1;
            const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
            if (index < 0) break;
            const item = game.state.items[index];
            if (item.status === 'hidden') game.reveal(index);
            const before = item.status;
            game.handle(item.collectible ? 'collect' : 'sell');
            if (item.status === before) game.handle('sell');
          }
        }
        if (mode !== 'quiet') paint(game, art);
        if (game.state.phase === 'settlement' || game.state.phase === 'passed') game.prepareRound();
        rows.push(snapshot(game));
      }
      return rows;
    });
  }

  [1, 7, 11, 19, 23].forEach((seed) => {
    const quiet = play(seed, 'quiet');
    const painted = play(seed, 'painted');
    const mounted = play(seed, 'mounted');
    assert.deepEqual(painted, quiet);
    assert.deepEqual(mounted, quiet);
    assert.ok(quiet.some((row) => row.hammer > 0 || row.phase === 'passed' || row.pnl !== 0 || row.collection.length >= 0));
  });
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
});
