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

function fakeCtx(bag) {
  const nop = () => {};
  return {
    fillStyle: '', strokeStyle: '', font: '16px sans', textAlign: 'left', textBaseline: 'alphabetic',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', lineJoin: 'miter',
    shadowColor: '', shadowBlur: 0, shadowOffsetY: 0, filter: 'none',
    save: nop, restore: nop, translate: nop, rotate: nop, scale: nop,
    beginPath: nop, moveTo: nop, lineTo: nop, quadraticCurveTo: nop, bezierCurveTo: nop,
    closePath: nop, fill: nop, stroke: nop, arc: nop, ellipse: nop, rect: nop,
    fillRect: nop, strokeRect: nop, setTransform: nop, setLineDash: nop, clip: nop, fillText: nop,
    measureText(value) { return { width: String(value).length * 10 }; },
    drawImage(img) { if (img && img.slot) bag.push(img.slot); },
    createRadialGradient() { return { addColorStop: nop }; },
  };
}

function artBank(withPieces) {
  const images = {};
  const sheet = { width: 480, height: 480, slot: 'sheet' };
  images.itemSheet = sheet;
  images.resultSheet = sheet;
  images.extraSheet = sheet;
  images.harbor = sheet;
  return {
    images,
    get(key) { return images[key] || null; },
    mount(slots) {
      if (!withPieces) return;
      slots.forEach((slot) => { images[slot.key] = { width: 96, height: 96, slot: slot.key }; });
    },
  };
}

test('round 8 paths match photo and repair art ids', async () => {
  const src = fs.readFileSync('src/features/auction/data/round8-art.js', 'utf8');
  assert.ok(src.split('\n').length < 500);
  assert.equal(src.includes('economy'), false);
  assert.equal(src.includes('bid'), false);

  const {
    photoItemIds, repairItemIds, round8DropRoot, round8Listing, round8Manifest, round8Slots, round8Sparkle,
  } = await import('../src/features/auction/data/round8-art.js');
  const { lots } = await import('../src/features/auction/data/lots.js');
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { rareSparkleBeat } = await import('../src/features/auction/data/round6.js');

  assert.deepEqual(photoItemIds, ['camera_01', 'tripod_01', 'album_01', 'softbox_01', 'backdrop_tube_01']);
  assert.deepEqual(repairItemIds, ['cabinet_01', 'clock_01', 'radio_01', 'parts_01', 'crate_01']);
  assert.equal(round8DropRoot, '/workspace/falcon-art-round8');
  assert.equal(round8Sparkle.spots, 1);
  assert.equal(round8Sparkle.loop, false);
  assert.equal(rareSparkleBeat.frames, 1);
  assert.equal(rareSparkleBeat.loop, false);
  assert.equal(round8Slots.length, 20);

  const listing = round8Listing();
  assert.equal(listing.length, 10);
  listing.forEach((row) => {
    assert.equal(row.full, `assets/art/lots/${row.theme}/${row.artId}.png`);
    assert.equal(row.silhouette, `assets/art/lots/${row.theme}/${row.artId}_silhouette.png`);
    assert.equal(row.dropFull, `/workspace/falcon-art-round8/${row.theme}/${row.artId}.png`);
    assert.equal(row.dropSilhouette, `/workspace/falcon-art-round8/${row.theme}/${row.artId}_silhouette.png`);
    const front = fs.statSync(row.full);
    const outline = fs.statSync(row.silhouette);
    assert.ok(front.size > 1000);
    assert.ok(outline.size > 1000);
    const lot = lots.find((entry) => entry.theme === row.theme);
    const item = lot.items.find((entry) => entry.artId === row.artId);
    assert.equal(item.art, row.artKey);
  });
  assert.deepEqual(lots.find((lot) => lot.theme === 'photo').items.map((item) => item.artId), photoItemIds);
  assert.deepEqual(lots.find((lot) => lot.theme === 'repair').items.map((item) => item.artId), repairItemIds);
  assert.deepEqual(round8Manifest.map((row) => row.artKey), [
    'cameraBag', 'tripod', 'album', 'cloth', 'crate',
    'repairCabinet', 'repairClock', 'repairRadio', 'repairParts', 'repairCrate',
  ]);

  const prices = (theme) => lots.find((lot) => lot.theme === theme).items.map((item) => [item.good[2], item.bad[2]]);
  assert.deepEqual(prices('photo'), [[250, 30], [80, 30], [80, 20], [120, 40], [65, 15]]);
  assert.deepEqual(prices('repair'), [[140, 50], [150, 35], [120, 30], [80, 30], [90, 25]]);
  assert.deepEqual(prices('band'), [[60, 35], [260, 30], [100, 15], [100, 60], [55, 20]]);
  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(economy.starterBidStart, 100);
  assert.equal(economy.starterBidStep, 20);
});

test('missing photo and repair files fall back; loaded files use full or silhouette', async () => {
  const { round8Slots } = await import('../src/features/auction/data/round8-art.js');
  const { lots } = await import('../src/features/auction/data/lots.js');
  const { cargoSprite, dedicatedPiece } = await import('../src/features/auction/render/sprites.js');
  const box = { x: 0, y: 0, w: 80, h: 70 };

  function sceneFor(theme, visibility, withPieces) {
    const lot = lots.find((entry) => entry.theme === theme);
    const art = artBank(withPieces);
    art.mount(round8Slots);
    return {
      art,
      game: {
        lot,
        state: {
          items: lot.items.map((item) => ({
            visibility,
            status: 'hidden',
            result: [...item.good],
            categoryKnown: false,
          })),
        },
      },
    };
  }

  const photo = lots.find((entry) => entry.theme === 'photo');
  const withArt = sceneFor('photo', 0, true);
  const drawn = [];
  assert.equal(cargoSprite(withArt, fakeCtx(drawn), 0, box, false), true);
  assert.deepEqual(drawn, ['photo:camera_01:silhouette']);
  assert.equal(dedicatedPiece(withArt, 0, false).slot, 'photo:camera_01:silhouette');

  const doorway = [];
  const clear = sceneFor('photo', 2, true);
  cargoSprite(clear, fakeCtx(doorway), 2, box, false);
  assert.deepEqual(doorway, ['photo:album_01:normal']);

  const opened = [];
  cargoSprite(sceneFor('photo', 0, true), fakeCtx(opened), 4, box, true);
  assert.deepEqual(opened, ['photo:backdrop_tube_01:normal']);

  const repair = [];
  cargoSprite(sceneFor('repair', 1, true), fakeCtx(repair), 3, box, false);
  assert.deepEqual(repair, ['repair:parts_01:silhouette']);

  const missing = [];
  const bare = sceneFor('photo', 0, false);
  assert.equal(dedicatedPiece(bare, 0, false), null);
  assert.equal(cargoSprite(bare, fakeCtx(missing), 0, box, false), true);
  assert.deepEqual(missing, ['sheet']);
  assert.equal(cargoSprite(bare, fakeCtx([]), 1, box, true), true);

  const noAtlas = sceneFor('repair', 0, false);
  noAtlas.art.images.itemSheet = null;
  noAtlas.art.images.extraSheet = null;
  assert.equal(cargoSprite(noAtlas, fakeCtx([]), 1, box, false), false);

  const band = sceneFor('band', 0, false);
  assert.equal(cargoSprite(band, fakeCtx([]), 0, box, false), false);
  assert.equal(photo.items[0].artId, 'camera_01');
});

test('same seed with or without photo and repair art keeps hammer, pnl, and inventory', async () => {
  const { round8Slots } = await import('../src/features/auction/data/round8-art.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { observe } = await import('../src/features/auction/views/screens/observe.js');
  const { reveal } = await import('../src/features/auction/views/screens/reveal.js');

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
      discovered: [...(s.discovered || [])],
      debtPeriod: s.debtPeriod,
      arrears: s.arrears,
      prepaid: s.prepaid,
      overdue: s.overdue,
      inventory: (s.items || []).map((item) => [item.result[0], item.result[2], item.status, item.collectible, item.good, item.isBigWin]),
    };
  }

  function paint(game, art, bag) {
    const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0 });
    view.game = game;
    view.art = art;
    view.menu = { view: null };
    view.reviewing = false;
    view.effect = null;
    const ctx = fakeCtx(bag);
    if (game.state.phase === 'observe') {
      game.state.selected = 0;
      observe(view, ctx);
      game.state.selected = -1;
    }
    if (game.state.phase === 'reveal') reveal(view, ctx);
  }

  function play(seed, withPieces) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.phase = 'briefing';
      game.state.coins = 20000;
      game.state.unlocked = ['band', 'photo', 'repair'];
      game.state.round = 0;
      const art = artBank(withPieces);
      art.mount(round8Slots);
      const bag = [];
      const rows = [];
      for (let n = 0; n < 6; n += 1) {
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        if (game.state.phase !== 'briefing') game.prepareRound();
        if (game.state.phase === 'repayment') game.continueAfterRepayment();
        game.startRound();
        if (game.state.phase !== 'observe') {
          rows.push(snapshot(game));
          continue;
        }
        paint(game, art, bag);
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
          paint(game, art, bag);
          let spins = 0;
          while (game.state.phase === 'reveal' && spins < 12) {
            spins += 1;
            const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
            if (index < 0) break;
            const item = game.state.items[index];
            if (item.status === 'hidden') {
              game.reveal(index);
              paint(game, art, bag);
            }
            const before = item.status;
            game.handle(item.collectible ? 'collect' : 'sell');
            if (item.status === before) game.handle('sell');
          }
        }
        if (game.state.phase === 'settlement' || game.state.phase === 'passed') game.prepareRound();
        rows.push(snapshot(game));
      }
      return { rows, pieces: bag.filter((slot) => slot.startsWith('photo:') || slot.startsWith('repair:')) };
    });
  }

  [1, 7, 11, 19, 23].forEach((seed) => {
    const bare = play(seed, false);
    const dressed = play(seed, true);
    assert.deepEqual(dressed.rows, bare.rows);
    assert.equal(bare.pieces.length, 0);
    assert.ok(dressed.pieces.some((slot) => slot.startsWith('photo:') || slot.startsWith('repair:')));
    const themes = dressed.rows.map((row) => row.theme);
    assert.ok(themes.includes('photo'));
    assert.ok(themes.includes('repair'));
  });
});
