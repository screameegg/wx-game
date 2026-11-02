import CanvasView from './render/canvas-view';
import Menu from './menu';
import AuctionArt from './render/art';
import { header } from './views/shared/chrome';
import { gameRoutes } from './views/screens/index';
import { observe } from './views/screens/observe';
import { stage } from './render/cargo';
import { durations, effectProgress } from './render/motion';
import { drawFeedback } from './fx/beats';
import { drawDeviceUpgrade } from './fx/device-upgrade';
import { clampPause, preHammerBeat } from './data/round5';
import { advanceCelebrate } from './data/round10';
import { drawPreHammerHold, syncAuctionBeat } from './fx/round5-beats';
import { revealNeedsFrame, syncRevealReel } from './fx/round6-beats';

// 场景只负责路由与局部动效；每个阶段有自己的绘制模块。
export default class GameScene extends CanvasView {
  constructor(screen, game, redraw) {
    super(screen); this.game = game; this.menu = new Menu(game); this.art = new AuctionArt(redraw); this.reviewing = false;
  }
  playEffect(kind, detail = {}) {
    const fx = { ...detail, kind, at: Date.now() };
    // 落槌动画晚半拍再开始。对局已经记好成交价，这里只改时间轴。
    if (kind === 'hammer') {
      fx.startedAt = fx.at;
      fx.pauseMs = clampPause(preHammerBeat.pauseMs);
      fx.at = fx.startedAt + fx.pauseMs;
    }
    if (kind === 'debtTick') { this.debtTick = fx; return; }
    if (kind === 'watchUnlock') {
      if (this.watchShown) return;
      this.watchShown = true;
      this.watchUnlock = fx;
      return;
    }
    this.effect = fx;
  }
  hammerHolding(now = Date.now()) {
    const fx = this.effect;
    return !!(fx && fx.kind === 'hammer' && Number.isFinite(fx.at) && now < fx.at);
  }
  get motionActive() {
    const now = Date.now();
    const alive = (fx) => !!fx && now - fx.at < (durations[fx.kind] || 1000);
    const advance = Number.isFinite(this.advanceCueAt) && now - this.advanceCueAt >= 0 && now - this.advanceCueAt < advanceCelebrate.holdMs;
    return alive(this.effect) || alive(this.debtTick) || alive(this.watchUnlock) || advance || this.hammerClock(now) || revealNeedsFrame(this, now);
  }
  hammerClock(now = Date.now()) {
    const fx = this.effect;
    if (!fx || fx.kind !== 'hammer' || this.game.state.phase !== 'reveal' || !Number.isFinite(fx.at)) return false;
    return now < fx.at + (durations.hammer || 1200);
  }
  render(ctx) {
    this.prepare(ctx); const phase = this.game.state.phase;
    if (this.effect && this.effect.kind === 'hammer' && phase !== 'reveal') this.effect = null;
    if (phase !== 'auction') this.reviewing = false;
    if (phase !== 'auction' && this.pointer && this.pointer.role === 'raise') this.pointer = null;
    syncAuctionBeat(this);
    syncRevealReel(this);
    const holding = this.hammerHolding() && phase === 'reveal' && !this.menu.view;
    if (holding && this.game.state.winner === '你' && Number.isFinite(this.game.state.spent)) {
      this.coinPreview = this.game.state.coins + this.game.state.spent;
    }
    // 停顿时不画货柜，避免提前露出真货。
    if (!holding && !this.menu.view && (['observe', 'reveal'].includes(phase) || this.reviewing)) stage(this, ctx);
    header(this, ctx);
    this.coinPreview = null;
    if (this.menu.view) { this.menu.render(this, ctx); return; }
    if (this.reviewing) { observe(this, ctx); drawDeviceUpgrade(this, ctx); return; }
    if (holding) { drawPreHammerHold(this, ctx); blockHammer(this); return; }
    // passed（放弃/被抢走）直接渲染为轻量提示
    if (gameRoutes[phase]) gameRoutes[phase](this, ctx);
    if (this.hammerClock() && effectProgress(this, 'hammer') < 1) blockHammer(this);
    drawFeedback(this, ctx);
    drawDeviceUpgrade(this, ctx);
  }
}

// 落槌这一拍只许看，不许点到下面的翻牌或卖掉。菜单仍留在顶栏。
function blockHammer(scene) {
  scene.buttons.push({
    x: 0, y: 60, w: 375, h: Math.max(0, scene.height - 60),
    label: '落槌', disabled: true, role: 'hammer', confirm: 'press', action() {},
  });
}
