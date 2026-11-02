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
  const dashes = [];
  return {
    texts: [], dashes, strokeRects: 0,
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left', filter: 'none',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', lineJoin: 'miter',
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, fill() {}, stroke() {},
    arc() {}, ellipse() {}, rect() {}, fillRect() {},
    strokeRect() { this.strokeRects += 1; },
    setLineDash(pattern) { dashes.push(pattern.slice()); },
    fillText(value) { this.texts.push(String(value)); },
    measureText(value) { return { width: String(value).length * 12 }; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
}

test('three observe tiers keep strokes, 44px hotspots, and doorway priority', async () => {
  const { cargoLayout } = await import('../src/features/auction/render/cargo.js');
  const { observeArt, tierVisual, tierVisuals, hotspotRules } = await import('../src/features/auction/data/observe-tiers.js');
  const { overlapArea, resolveHotspots, topHotspot } = await import('../src/features/auction/render/hotspots.js');
  const { strokeTierBox } = await import('../src/features/auction/render/tier-stroke.js');

  assert.equal(hotspotRules.debug, false);
  assert.equal(hotspotRules.minSize, 44);
  assert.equal(tierVisual(2).id, 'doorway');
  assert.equal(tierVisual(1).id, 'silhouette');
  assert.equal(tierVisual(0).id, 'deep');
  assert.equal(tierVisuals.doorway.dash.length, 0);
  assert.ok(tierVisuals.silhouette.dash.length >= 2);
  assert.ok(tierVisuals.deep.dash.length >= 2);
  assert.ok(tierVisuals.doorway.spriteAlpha > tierVisuals.deep.spriteAlpha);
  assert.equal(observeArt.visibilityTiers, 'assets/art/falcon-art-round4/observe_visibility_tiers.png');
  assert.equal(observeArt.hotzoneRules, 'assets/art/falcon-art-round4/observe_hotzone_rules.png');
  assert.ok(fs.statSync(observeArt.visibilityTiers).size > 1000);
  assert.ok(fs.statSync(observeArt.hotzoneRules).size > 1000);

  const ctx = fakeCtx();
  strokeTierBox(ctx, { x: 10, y: 10, w: 40, h: 40 }, 2);
  strokeTierBox(ctx, { x: 10, y: 10, w: 40, h: 40 }, 1);
  strokeTierBox(ctx, { x: 10, y: 10, w: 40, h: 40 }, 0);
  assert.equal(ctx.dashes.some((dash) => dash.length === 0), true);
  assert.equal(ctx.dashes.some((dash) => dash[0] === tierVisuals.silhouette.dash[0]), true);
  assert.equal(ctx.dashes.some((dash) => dash[0] === tierVisuals.deep.dash[0]), true);

  const maps = [[2, 1, 0, 1, 0], [2, 1, 2, 1, 0], [2, 2, 2, 1, 0]];
  maps.forEach((vis) => {
    const rects = resolveHotspots(cargoLayout, vis);
    rects.forEach((rect, index) => {
      assert.ok(rect.w >= 44 && rect.h >= 44);
      const cx = cargoLayout[index].x + cargoLayout[index].w / 2;
      const cy = cargoLayout[index].y + cargoLayout[index].h / 2;
      assert.equal(topHotspot(cx, cy, rects, vis), index);
    });
    const grew = rects.some((rect, index) => vis[index] >= 2 && (rect.x < cargoLayout[index].x || rect.y < cargoLayout[index].y || rect.x + rect.w > cargoLayout[index].x + cargoLayout[index].w || rect.y + rect.h > cargoLayout[index].y + cargoLayout[index].h));
    assert.equal(grew, true);
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) assert.equal(overlapArea(rects[i], rects[j]), 0);
    }
  });

  const layout = [{ x: 20, y: 180, w: 90, h: 80 }, { x: 80, y: 180, w: 90, h: 80 }];
  const vis = [0, 2];
  const rects = resolveHotspots(layout, vis);
  assert.equal(overlapArea(rects[0], rects[1]), 0);
  assert.equal(topHotspot(95, 220, rects, vis), 1);
  assert.equal(topHotspot(40, 220, rects, vis), 0);
});

test('device steps rise by one, exhausted taps do not skip, inspect does not raise', async () => {
  const { infoLevel } = await import('../src/features/auction/rules/info-level.js');
  const { tryDeviceStep, deviceExhausted } = await import('../src/features/auction/rules/device-use.js');
  const { cueFromTouch } = await import('../src/features/auction/fx/cues.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { economy } = await import('../src/features/auction/data/economy.js');

  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);

  const game = new Game();
  game.state.phase = 'briefing';
  game.state.coins = 5000;
  game.startRound();
  const limits = game.state.rivals.map((rival) => rival.limit);
  const results = game.state.items.map((item) => item.result.slice());
  const deep = game.state.items.findIndex((item) => item.visibility === 0);
  const silhouette = game.state.items.findIndex((item) => item.visibility === 1);
  const doorway = game.state.items.findIndex((item) => item.visibility >= 2);
  assert.ok(deep >= 0 && silhouette >= 0 && doorway >= 0);
  game.state.equipment = ['手电', '放大镜'];

  const beforeLevels = game.state.items.map((item) => infoLevel(item));
  game.inspect(deep);
  game.inspect(silhouette);
  game.inspect(doorway);
  assert.deepEqual(game.state.items.map((item) => infoLevel(item)), beforeLevels);
  assert.equal(game.state.items[silhouette].categoryKnown, undefined);

  game.inspect(deep);
  game.useTool('手电');
  game.useTool('放大镜');
  assert.equal(infoLevel(game.state.items[deep]), 0);
  assert.equal(game.state.items[deep].categoryKnown, undefined);
  assert.equal(game.state.items[deep].conditionKnown, undefined);
  assert.equal(game.clue(deep).includes(game.lot.items[deep].shape), false);
  assert.equal(game.clue(deep).includes(game.lot.items[deep].category), false);

  game.inspect(doorway);
  game.useTool('手电');
  assert.equal(infoLevel(game.state.items[doorway]), 3);
  assert.equal(game.state.items[doorway].categoryKnown, undefined);

  game.inspect(silhouette);
  const skip = tryDeviceStep(game.state.items[silhouette], '放大镜', { roundUses: [], owned: true });
  assert.equal(skip.ok, false);
  assert.equal(infoLevel(game.state.items[silhouette]), 1);
  assert.equal(game.state.items[silhouette].conditionKnown, undefined);

  const beforeLight = { evidence: game.state.items.map((item) => [item.categoryKnown, item.conditionKnown]) };
  game.useTool('手电');
  assert.equal(infoLevel(game.state.items[silhouette]), 2);
  assert.equal(cueFromTouch(beforeLight, game.state, {}).detail.to, 2);
  assert.equal(game.clue(silhouette).includes(game.lot.items[silhouette].category), true);
  assert.equal(game.clue(silhouette).includes(game.lot.items[silhouette].hint), false);
  assert.equal(game.clue(silhouette).includes('需要手电'), false);

  game.useTool('手电');
  assert.equal(infoLevel(game.state.items[silhouette]), 2);
  assert.equal(deviceExhausted(game.state.items[silhouette], '手电', game.state.toolsUsed), true);

  const beforeGlass = { evidence: game.state.items.map((item) => [item.categoryKnown, item.conditionKnown]) };
  game.useTool('放大镜');
  assert.equal(infoLevel(game.state.items[silhouette]), 3);
  assert.equal(cueFromTouch(beforeGlass, game.state, {}).detail.from, 2);
  assert.equal(cueFromTouch(beforeGlass, game.state, {}).kind, 'deviceUpgrade');
  game.useTool('放大镜');
  assert.equal(infoLevel(game.state.items[silhouette]), 3);
  assert.equal(game.state.toolsUsed.includes('手电'), true);
  assert.equal(game.state.toolsUsed.includes('放大镜'), true);

  const other = game.state.items.findIndex((item, index) => item.visibility === 1 && index !== silhouette);
  if (other >= 0) {
    game.inspect(other);
    const level = infoLevel(game.state.items[other]);
    game.useTool('手电');
    assert.equal(infoLevel(game.state.items[other]), level);
  }

  assert.deepEqual(game.state.rivals.map((rival) => rival.limit), limits);
  assert.deepEqual(game.state.items.map((item) => item.result), results);
});

test('thirty rounds: outlines do not rewrite bids or leak grade and price', async () => {
  const { default: Game } = await import('../src/features/auction/game.js');
  const { cargoLayout } = await import('../src/features/auction/render/cargo.js');
  const { resolveHotspots } = await import('../src/features/auction/render/hotspots.js');
  const { default: CanvasView } = await import('../src/features/auction/render/canvas-view.js');
  const { observe } = await import('../src/features/auction/views/screens/observe.js');
  const { infoLevel } = await import('../src/features/auction/rules/info-level.js');

  function trace(seed, viz) {
    return withRandom(seed, () => {
      const game = new Game();
      game.state.phase = 'briefing';
      game.state.coins = 6000;
      game.state.unlocked = ['band', 'photo', 'repair'];
      game.state.round = seed % 3;
      game.startRound();
      if (viz) {
        resolveHotspots(cargoLayout, game.state.items.map((item) => item.visibility));
        game.state.items.forEach((_, index) => game.clue(index));
        game.hotspotDebug = true;
      }
      const hidden = {
        results: game.state.items.map((item) => item.result.slice()),
        visibility: game.state.items.map((item) => item.visibility),
        fair: game.state.fairValue,
        rivals: game.state.rivals.map((rival) => [rival.limit, rival.estimate, rival.budget, rival.bluff, rival.situation]),
      };
      game.state.items.forEach((entry, index) => {
        const item = game.lot.items[index];
        const copy = game.clue(index);
        assert.equal(copy.includes(`${entry.result[2]}`), false);
        if ((entry.visibility || 0) < 2) assert.equal(copy.includes(entry.result[1]), false);
        assert.equal(copy.includes('金币'), false);
        if ((entry.visibility || 0) <= 0) {
          assert.equal(copy.includes(item.shape), false);
          assert.equal(copy.includes(item.category), false);
          assert.equal(copy.includes(item.hint), false);
        }
        if (entry.visibility === 1 && !entry.categoryKnown) {
          assert.equal(copy.includes(item.shape), true);
          assert.equal(copy.includes('需要手电'), true);
          assert.equal(copy.includes(item.category), false);
          assert.equal(copy.includes(item.hint), false);
        }
        if (entry.visibility >= 2) assert.equal(infoLevel(entry), 3);
      });
      game.beginBidding();
      const steps = [];
      for (let n = 0; n < 8 && game.state.phase === 'auction'; n += 1) {
        const price = game.state.price;
        game.bid();
        if (!game.state.pending && game.state.price === price) break;
        while (game.state.pending) game.respond();
        steps.push([game.state.phase, game.state.price, game.state.leader]);
      }
      return { hidden, steps };
    });
  }

  for (let seed = 1; seed <= 30; seed += 1) assert.deepEqual(trace(seed, true), trace(seed, false));

  const game = new Game();
  game.state.phase = 'briefing';
  game.state.coins = 5000;
  game.startRound();
  const view = new CanvasView({ width: 375, height: 700, top: 0, bottom: 0 });
  view.game = game;
  view.art = { get() { return null; } };
  view.reviewing = false;
  view.hotspotDebug = false;
  const ctx = fakeCtx();
  observe(view, ctx);
  assert.equal(ctx.strokeRects, 0);
  const hits = view.buttons.filter((button) => String(button.label).startsWith('货物'));
  assert.equal(hits.length, 5);
  hits.forEach((hit) => assert.ok(hit.w >= 44 && hit.h >= 44));
  const level = game.state.items.map((item) => infoLevel(item));
  const texts = [];
  [0, 1, 2].forEach((visibility) => {
    const hit = hits.find((button) => game.state.items[Number(button.label.replace('货物', '')) - 1].visibility === visibility);
    hit.action();
    const drawn = fakeCtx();
    view.buttons = [];
    observe(view, drawn);
    texts.push(...drawn.texts);
  });
  assert.deepEqual(game.state.items.map((item) => infoLevel(item)), level);
  assert.equal(texts.includes('轮廓'), true);
  assert.equal(texts.includes('门口'), true);
  assert.equal(texts.includes('深处'), true);
  assert.equal(texts.some((text) => text.includes('需要手电')), true);
  view.hotspotDebug = true;
  view.buttons = [];
  const debug = fakeCtx();
  observe(view, debug);
  assert.ok(debug.strokeRects >= 5);

  game.inspect(0);
  view.buttons = [];
  observe(view, fakeCtx());
  const other = cargoLayout.findIndex((_, index) => index !== game.state.selected);
  const spot = cargoLayout[other];
  view.pointerDown(spot.x + spot.w / 2, spot.y + spot.h / 2);
  assert.equal(game.state.selected, -1);
  assert.notEqual(game.state.items[other].categoryKnown, true);
});
