const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

global.wx = {
  getStorageSync() { return null; },
  setStorageSync() {},
  createImage() { return { set src(_) {} }; },
};

function fakeCtx() {
  return {
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left', filter: 'none',
    lineWidth: 1, globalAlpha: 1, lineCap: 'butt', shadowColor: '', shadowBlur: 0, shadowOffsetY: 0,
    save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    fill() {}, stroke() {}, arc() {}, rect() {}, ellipse() {},
    fillRect() {}, strokeRect() {}, drawImage() {}, setTransform() {},
    fillText() {},
    measureText(value) { return { width: String(value).length * 11 }; },
  };
}

function snap(state) {
  return {
    phase: state.phase,
    selected: state.selected,
    income: state.income,
    pending: state.pending,
    collected: state.collection.length,
    ornament: state.ornament,
    remaining: undefined,
    evidence: (state.items || []).map((item) => [item.categoryKnown, item.conditionKnown]),
  };
}

test('device flash is at most 300ms and only when info level rises', async () => {
  const { infoLevel } = await import('../src/features/auction/rules/info-level.js');
  const { deviceUpgradePose } = await import('../src/features/auction/fx/device-upgrade.js');
  const { durations } = await import('../src/features/auction/render/motion.js');
  const { cueFromTouch } = await import('../src/features/auction/fx/cues.js');
  const { deviceUpgradeBeat } = await import('../src/features/auction/data/round3.js');
  const { default: Game } = await import('../src/features/auction/game.js');

  assert.equal(infoLevel({ visibility: 0, status: 'hidden' }), 0);
  assert.equal(infoLevel({ visibility: 1, status: 'hidden' }), 1);
  assert.equal(infoLevel({ visibility: 1, status: 'hidden', categoryKnown: true }), 2);
  assert.equal(infoLevel({ visibility: 1, status: 'hidden', categoryKnown: true, conditionKnown: true }), 3);
  assert.equal(infoLevel({ visibility: 2, status: 'hidden' }), 3);
  assert.equal(infoLevel({ visibility: 1, status: 'revealed', categoryKnown: true }), 4);

  const start = deviceUpgradePose(0);
  assert.equal(start.phase, 'flash');
  assert.ok(start.flash > 0);
  assert.equal(start.outline, 0);
  assert.equal(start.total, 300);
  assert.equal(durations.deviceUpgrade, 300);
  const outline = deviceUpgradePose(100);
  assert.equal(outline.phase, 'outline');
  assert.ok(outline.outline > 0);
  assert.equal(outline.arrow, 0);
  const mid = deviceUpgradePose(150);
  assert.equal(mid.phase, 'arrow');
  assert.ok(mid.outline > 0);
  assert.ok(mid.arrow > 0);
  const late = deviceUpgradePose(250);
  assert.equal(late.phase, 'arrow');
  assert.ok(late.arrow > 0);
  assert.notEqual(deviceUpgradePose(299).phase, 'done');
  assert.equal(deviceUpgradePose(300).phase, 'done');
  assert.equal(deviceUpgradePose(0, { ...deviceUpgradeBeat, durationMs: 900, capMs: 900 }).total, 300);

  const game = new Game();
  game.state.phase = 'briefing';
  game.state.coins = 5000;
  game.startRound();
  const silhouette = game.state.items.findIndex((item) => item.visibility === 1);
  const clear = game.state.items.findIndex((item) => item.visibility >= 2);
  assert.ok(silhouette >= 0);
  game.state.equipment = ['手电', '放大镜'];
  game.state.toolsUsed = [];
  game.inspect(silhouette);
  const limits = game.state.rivals.map((rival) => rival.limit);

  const beforeLight = snap(game.state);
  game.useTool('手电');
  const light = cueFromTouch(beforeLight, game.state, {});
  assert.equal(light.kind, 'deviceUpgrade');
  assert.equal(light.detail.tool, '手电');
  assert.equal(light.detail.from, 1);
  assert.equal(light.detail.to, 2);
  assert.equal(light.sound, undefined);
  assert.deepEqual(game.state.rivals.map((rival) => rival.limit), limits);

  const beforeRepeat = snap(game.state);
  game.useTool('手电');
  assert.equal(cueFromTouch(beforeRepeat, game.state, {}), null);

  const beforeGlass = snap(game.state);
  game.useTool('放大镜');
  const glass = cueFromTouch(beforeGlass, game.state, {});
  assert.equal(glass.kind, 'deviceUpgrade');
  assert.equal(glass.detail.tool, '放大镜');
  assert.equal(glass.detail.from, 2);
  assert.equal(glass.detail.to, 3);
  assert.deepEqual(game.state.rivals.map((rival) => rival.limit), limits);

  game.state.selected = clear;
  game.state.items[clear].categoryKnown = true;
  const beforeClear = snap(game.state);
  beforeClear.evidence[clear][0] = false;
  assert.equal(infoLevel(game.state.items[clear]), 3);
  assert.equal(cueFromTouch(beforeClear, game.state, {}), null);
});

test('debt countdown ticks once per remaining drop of 1', async () => {
  const { auctionsRemaining } = await import('../src/features/auction/rules/debt-clock.js');
  const { extraCues, cueFromTouch } = await import('../src/features/auction/fx/cues.js');
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { debtTickPose } = await import('../src/features/auction/fx/debt-tick.js');
  const { default: GameScene } = await import('../src/features/auction/scene.js');

  assert.equal(economy.starterFirstPayment, 350);
  assert.equal(economy.periodGrowth, 1.1);
  assert.equal(economy.advancedEntryCoins, 1500);
  assert.equal(economy.seizureOverdueCount, 3);
  assert.equal(economy.overduePenalty, 1.1);
  assert.equal(economy.repaymentCycleRounds, 6);

  assert.equal(debtTickPose(0).phase, 'shake');
  assert.equal(debtTickPose(0).frame, 0);
  assert.ok(debtTickPose(0).shake > 0);
  assert.equal(debtTickPose(200).frame, 1);
  assert.equal(debtTickPose(420).phase, 'done');

  const game = new Game();
  game.state.phase = 'briefing';
  game.state.coins = 5000;
  const beforeStart = auctionsRemaining(game.state);
  game.startRound();
  assert.equal(auctionsRemaining(game.state), beforeStart);
  game.beginBidding();
  const during = auctionsRemaining(game.state);
  const limits = game.state.rivals.map((rival) => rival.limit);
  game.pass();
  const afterPass = auctionsRemaining(game.state);
  assert.equal(during - afterPass, 1);
  const passedBefore = { remaining: during, ornament: game.state.ornament };
  const ticks = extraCues(passedBefore, game.state);
  assert.equal(ticks.length, 1);
  assert.equal(ticks[0].kind, 'debtTick');
  assert.equal(ticks[0].sound, 'sfx_debt_tick');
  assert.equal(ticks[0].detail.sfxId, 'sfx_debt_tick');
  assert.equal(ticks[0].detail.sfxFile, 'assets/audio/effects/sfx_debt_tick.wav');
  assert.equal(ticks[0].detail.from, during);
  assert.equal(ticks[0].detail.to, afterPass);
  assert.equal(extraCues({ remaining: afterPass, ornament: 0 }, game.state).length, 0);
  assert.equal(extraCues({ remaining: 4, ornament: 0 }, { ...game.state, phase: 'briefing', round: 2, debtPeriod: 0 }).length, 0);
  assert.equal(extraCues({ remaining: 6, ornament: 0 }, { phase: 'briefing', round: 2, debtPeriod: 0, ornament: 0 }).length, 0);
  assert.deepEqual(game.state.rivals.map((rival) => rival.limit), limits);

  const screen = { width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() };
  const scene = new GameScene(screen, game, () => {});
  scene.playEffect('debtTick', ticks[0].detail);
  scene.playEffect('pnl', { net: 0 });
  assert.equal(scene.debtTick.kind, 'debtTick');
  assert.equal(scene.effect.kind, 'pnl');
  const primary = cueFromTouch(
    { phase: 'reveal', selected: -1, income: 10, pending: false, collected: 0, evidence: [] },
    { phase: 'settlement', selected: -1, income: 10, spent: 40, pending: false, collection: [], items: [] },
    {},
  );
  assert.equal(primary.kind, 'pnl');
});

test('old watch unlock plays once on stage 0 to 1 only', async () => {
  const { extraCues } = await import('../src/features/auction/fx/cues.js');
  const { watchUnlockPose } = await import('../src/features/auction/fx/watch-unlock.js');
  const { economy } = await import('../src/features/auction/data/economy.js');
  const { default: Game } = await import('../src/features/auction/game.js');
  const { default: GameScene } = await import('../src/features/auction/scene.js');
  const { settlement } = await import('../src/features/auction/views/screens/results.js');
  const { header } = await import('../src/features/auction/views/shared/chrome.js');
  const { drawDeviceUpgrade } = await import('../src/features/auction/fx/device-upgrade.js');
  const { round3Art } = await import('../src/features/auction/data/round3.js');

  assert.equal(watchUnlockPose(0).phase, 'flash');
  assert.ok(watchUnlockPose(0).alpha > 0);
  assert.equal(watchUnlockPose(680).phase, 'done');
  assert.equal(economy.starterFirstPayment, 350);

  Object.values(round3Art).forEach((file) => {
    if (file.endsWith('.wav')) {
      assert.equal(fs.existsSync(file), false);
      return;
    }
    assert.ok(fs.statSync(file).size > 1000, file);
  });

  function finishRound(profitTotal, value) {
    const game = new Game();
    game.state.phase = 'briefing';
    game.state.coins = 8000;
    game.state.profitTotal = profitTotal;
    game.startRound();
    game.beginBidding();
    game.state.rivals.forEach((rival) => { rival.limit = 0; rival.estimate = 0; });
    const limits = game.state.rivals.map((rival) => rival.limit);
    game.bid();
    while (game.state.pending) game.respond();
    assert.equal(game.state.phase, 'reveal');
    game.state.items.forEach((item) => { item.result[2] = value; });
    game.state.spent = 0;
    const beforeOrnament = game.state.ornament;
    while (game.state.phase === 'reveal') {
      const index = game.state.items.findIndex((item) => item.status === 'hidden' || item.status === 'revealed');
      if (game.state.items[index].status === 'hidden') game.reveal(index);
      game.handle('sell');
    }
    return { game, beforeOrnament, limits };
  }

  const first = finishRound(0, 100);
  assert.equal(first.beforeOrnament, 0);
  assert.equal(first.game.state.ornament, 1);
  assert.equal(first.game.state.phase, 'settlement');
  const watch = extraCues({ ornament: 0, remaining: 6 }, first.game.state);
  assert.equal(watch.filter((beat) => beat.kind === 'watchUnlock').length, 1);
  assert.equal(extraCues({ ornament: 1, remaining: 6 }, first.game.state).some((beat) => beat.kind === 'watchUnlock'), false);
  assert.deepEqual(first.game.state.rivals.map((rival) => rival.limit), first.limits);
  assert.equal(first.game.state.coins >= 0, true);

  const skipped = finishRound(1400, 40);
  assert.equal(skipped.game.state.ornament, 2);
  assert.equal(extraCues({ ornament: 0 }, skipped.game.state).some((beat) => beat.kind === 'watchUnlock'), false);

  const screen = { width: 375, height: 700, top: 0, bottom: 0, context: fakeCtx() };
  const scene = new GameScene(screen, first.game, () => {});
  scene.art = { get() { return { width: 8, height: 8 }; } };
  const ctx = fakeCtx();
  scene.playEffect('watchUnlock', { from: 0, to: 1 });
  const started = scene.watchUnlock.at;
  scene.playEffect('watchUnlock', { from: 0, to: 1 });
  assert.equal(scene.watchUnlock.at, started);
  header(scene, ctx);
  settlement(scene, ctx);
  scene.effect = { kind: 'deviceUpgrade', at: Date.now(), index: 1, from: 1, to: 2 };
  drawDeviceUpgrade(scene, ctx, Date.now());
  assert.equal(scene.effect.phase, 'flash');
  drawDeviceUpgrade(scene, ctx, Date.now() + 300);
  assert.equal(scene.effect.phase, 'done');
});
