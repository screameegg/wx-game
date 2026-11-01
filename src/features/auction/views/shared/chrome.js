import { palette, divider, panel } from '../../render/ui';
import { economy } from '../../data/economy';
import { paymentDue } from '../../rules/debt';

export function header(scene, ctx) {
  scene.text(ctx, '集装箱寻宝', 22, 33, 17);
  scene.text(ctx, `${scene.game.state.coins} 金币`, 222, 32, 14, palette.gold);
  const s = scene.game.state; const due = paymentDue(s);
  const completed = ['observe', 'auction', 'reveal'].includes(s.phase) ? Math.max(0, s.round - 1) : s.round;
  const cycle = economy.repaymentCycleRounds; const remaining = completed > 0 && completed % cycle === 0 && s.debtPeriod < completed / cycle ? 0 : cycle - completed % cycle;
  scene.text(ctx, `应还 ${due} · 剩 ${remaining} 场`, 22, 55, 11, palette.muted);
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
