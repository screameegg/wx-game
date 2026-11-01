import { divider, palette, panel } from '../../render/ui';
import { drawPlayerPaddle } from '../people/actors';
import { drawExpression, settlementExpression } from '../people/expressions';

export function settlement(scene, ctx) {
  const s = scene.game.state; const net = s.income - s.spent;
  const roi = s.spent > 0 ? (s.income / s.spent) : 0;
  const win = net >= 0; const tone = win ? palette.green : palette.red;
  panel(ctx, 24, 88, 327, 128, win ? '#e7f3e4' : '#f8e6e1', 16);
  scene.text(ctx, '本场盈亏', 40, 112, 13, palette.muted);
  scene.text(ctx, win ? '赚了' : '亏了', 40, 150, 30, tone);
  const amount = `${net > 0 ? '+' : ''}${net}`;
  scene.text(ctx, amount, 132, 156, 48, tone);
  scene.text(ctx, '金币', 132, 184, 13, palette.muted);
  scene.text(ctx, `出售 ${s.income} − 成交 ${s.spent}`, 196, 184, 12, palette.muted);
  const extra = s.collectedValue ? 28 : 0;
  if (s.collectedValue) scene.text(ctx, `收藏参考 ${s.collectedValue}，不计收入`, 40, 236, 12, palette.muted);
  divider(ctx, 24, 220 + extra, 327);
  const zhou = settlementExpression('老周', roi);
  const lan = settlementExpression('阿岚', roi);
  drawExpression(scene, ctx, 0, zhou, 28, 228 + extra, 112, 112);
  drawExpression(scene, ctx, 1, lan, 220, 228 + extra, 112, 112);
  const quoteY = 354 + extra;
  scene.text(ctx, roi >= 1.5 ? '老周：看走眼了' : roi >= 1 ? '老周：不错' : roi >= 0.5 ? '老周：还好没跟' : '老周：下次小心', 28, quoteY, 12);
  scene.text(ctx, zhou.label, 28, quoteY + 18, 12, palette.gold);
  scene.text(ctx, roi >= 1.5 ? '阿岚：不服！' : roi >= 1 ? '阿岚：哼' : '阿岚：哈哈！', 220, quoteY, 12);
  scene.text(ctx, lan.label, 220, quoteY + 18, 12, palette.gold);
  drawPlayerPaddle(ctx, 156, quoteY + 28, 52, 78, s.ornament);
  if (s.ornamentNotice) scene.text(ctx, s.ornamentNotice, 24, quoteY + 112, 12, palette.gold);
  scene.link(ctx, '查看每件物品，复盘线索', 24, scene.height - 118, 280, () => { scene.menu.view = 'ledger'; });
  scene.button(ctx, '设备', 24, scene.height - 68, 105, 48, () => { scene.menu.view = 'shop'; }, true);
  scene.button(ctx, '去看下一箱', 140, scene.height - 68, 211, 48, () => scene.game.prepareRound());
}

export function repayment(scene, ctx) {
  scene.text(ctx, '到了还款日', 24, 130, 26);
  scene.paragraph(ctx, scene.game.state.notice, 24, 205, 327, 18, 6);
  scene.text(ctx, `当前余额 ${scene.game.state.coins} 金币`, 24, 412, 21, palette.gold);
  scene.button(ctx, '继续经营', 24, scene.height - 68, 327, 48, () => scene.game.continueAfterRepayment());
}

