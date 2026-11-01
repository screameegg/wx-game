import { palette, divider, panel } from '../../render/ui';
import { paymentDue } from '../../rules/debt';
import { auctionsRemaining } from '../../rules/debt-clock';
import { drawDebtCountdown } from '../../fx/debt-tick';

export function header(scene, ctx) {
  scene.text(ctx, '集装箱寻宝', 22, 33, 17);
  const coins = Number.isFinite(scene.coinPreview) ? scene.coinPreview : scene.game.state.coins;
  scene.text(ctx, `${coins} 金币`, 222, 32, 14, palette.gold);
  const s = scene.game.state; const due = paymentDue(s);
  const remaining = auctionsRemaining(s);
  // 债务条是剩余场数，不是日期。规格见 assets/art/ui/topbar-cta-spec.jpg。
  const label = `应还 ${due} · 剩 ${remaining} 场`;
  scene.text(ctx, label, 22, 55, 11, palette.muted);
  const barX = 30 + ctx.measureText(label).width;
  drawDebtCountdown(scene, ctx, barX, 46, Math.max(36, 308 - barX), 8);
  scene.button(ctx, scene.menu.view ? '首页' : '菜单', 318, 11, 43, 30, () => { scene.game.save(); scene.menu.view = scene.menu.view ? 'home' : 'pause'; }, true);
}
export function steps(scene, ctx, current) {
  panel(ctx, 24, 60, 327, 28, '#e9dfcd', 14);
  ['1 观察', '2 竞价', '3 结果'].forEach((name, i) => {
    const x = 26 + i * 108;
    if (i === current) panel(ctx, x, 62, 104, 24, palette.gold, 12);
    scene.text(ctx, name, x + 27, 79, 12, i === current ? '#fff9ee' : palette.muted);
  });
  divider(ctx, 24, 94, 327);
}
export function heading(scene, ctx, title, subtitle) {
  scene.text(ctx, title, 23, 125, 23);
  scene.text(ctx, subtitle, 24, 151, 13, palette.muted);
}
