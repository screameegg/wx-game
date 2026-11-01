import CanvasView from './render/canvas-view';
import Menu from './menu';
import AuctionArt from './render/art';
import { header } from './views/shared/chrome';
import { gameRoutes } from './views/screens/index';
import { observe } from './views/screens/observe';
import { stage } from './render/cargo';
import { durations } from './render/motion';
import { drawFeedback } from './fx/beats';
import { drawDeviceUpgrade } from './fx/device-upgrade';

// 场景只负责路由与局部动效；每个阶段有自己的绘制模块。
export default class GameScene extends CanvasView {
  constructor(screen, game, redraw) {
    super(screen); this.game = game; this.menu = new Menu(game); this.art = new AuctionArt(redraw); this.reviewing = false;
  }
  playEffect(kind, detail = {}) {
    const fx = { ...detail, kind, at: Date.now() };
    if (kind === 'debtTick') { this.debtTick = fx; return; }
    if (kind === 'watchUnlock') {
      if (this.watchShown) return;
      this.watchShown = true;
      this.watchUnlock = fx;
      return;
    }
    this.effect = fx;
  }
  get motionActive() {
    const now = Date.now();
    const alive = (fx) => !!fx && now - fx.at < (durations[fx.kind] || 1000);
    return alive(this.effect) || alive(this.debtTick) || alive(this.watchUnlock);
  }
  render(ctx) {
    this.prepare(ctx); const phase = this.game.state.phase;
    if (phase !== 'auction') this.reviewing = false;
    // 货柜背景：观察和揭晓时都显示，让玩家始终身处货柜前
    if (!this.menu.view && (['observe', 'reveal'].includes(phase) || this.reviewing)) stage(this, ctx);
    header(this, ctx);
    if (this.menu.view) { this.menu.render(this, ctx); return; }
    if (this.reviewing) { observe(this, ctx); drawDeviceUpgrade(this, ctx); return; }
    // passed（放弃/被抢走）直接渲染为轻量提示
    if (gameRoutes[phase]) gameRoutes[phase](this, ctx);
    drawFeedback(this, ctx);
    drawDeviceUpgrade(this, ctx);
  }
}
