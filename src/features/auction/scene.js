import CanvasView from './render/canvas-view';
import Menu from './menu';
import AuctionArt from './render/art';
import { header } from './views/shared/chrome';
import { gameRoutes } from './views/screens/index';
import { stage } from './render/cargo';
import { drawFeedback, durations } from './render/motion';

// 场景只负责路由与局部动效；每个阶段有自己的绘制模块。
export default class GameScene extends CanvasView {
  constructor(screen, game, redraw) {
    super(screen); this.game = game; this.menu = new Menu(game); this.art = new AuctionArt(redraw); this.reviewing = false;
  }
  playEffect(kind, detail = {}) { this.effect = { ...detail, kind, at: Date.now() }; }
  get motionActive() { return !!this.effect && Date.now() - this.effect.at < (durations[this.effect.kind] || 1000); }
  render(ctx) {
    this.prepare(ctx); const phase = this.game.state.phase;
    if (phase !== 'auction') this.reviewing = false;
    // 货柜背景：观察和揭晓时都显示，让玩家始终身处货柜前
    if (!this.menu.view && (['observe', 'reveal'].includes(phase) || this.reviewing)) stage(this, ctx);
    header(this, ctx);
    if (this.menu.view) { this.menu.render(this, ctx); return; }
    if (this.reviewing) { observe(this, ctx); return; }
    // passed（放弃/被抢走）直接渲染为轻量提示
    if (gameRoutes[phase]) gameRoutes[phase](this, ctx);
    drawFeedback(this, ctx);
  }
}
