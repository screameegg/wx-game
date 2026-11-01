import { palette, panel } from '../../render/ui';
import { paymentDue } from '../../rules/debt';
import { auctionsRemaining } from '../../rules/debt-clock';
import { chromePalette, layoutTokens } from '../../data/round7';
import { drawTopBar } from '../../fx/round7-chrome';

export function header(scene, ctx) {
  const coins = Number.isFinite(scene.coinPreview) ? scene.coinPreview : scene.game.state.coins;
  const due = paymentDue(scene.game.state);
  const remaining = auctionsRemaining(scene.game.state);
  const menuOpen = !!(scene.menu && scene.menu.view);
  const drawn = drawTopBar(scene, ctx, { coins, due, remaining, menuOpen });
  const hit = drawn.menu;
  scene.buttons.push({
    x: hit.x, y: hit.y, w: hit.w, h: hit.h,
    label: menuOpen ? '首页' : '菜单',
    role: 'menu',
    disabled: false,
    confirm: 'press',
    action: () => {
      scene.game.save();
      scene.menu.view = scene.menu && scene.menu.view ? 'home' : 'pause';
    },
  });
}
export function steps(scene, ctx, current) {
  const m = layoutTokens.margin;
  const width = layoutTokens.designWidth - m * 2;
  panel(ctx, m, 60, width, 28, chromePalette.cream, 14);
  const seg = Math.floor((width - 8) / 3);
  ['1 观察', '2 竞价', '3 结果'].forEach((name, i) => {
    const x = m + 2 + i * (seg + 2);
    if (i === current) panel(ctx, x, 62, seg, 24, chromePalette.amber, 12);
    scene.text(ctx, name, x + 16, 79, 12, i === current ? chromePalette.cream : chromePalette.ink);
  });
  ctx.fillStyle = chromePalette.kraft;
  ctx.fillRect(m, 94, width, 1);
}
export function heading(scene, ctx, title, subtitle) {
  scene.text(ctx, title, 23, 125, 23);
  scene.text(ctx, subtitle, 24, 151, 13, palette.muted);
}
