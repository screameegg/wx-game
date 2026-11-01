import { divider, palette } from '../../render/ui';
import { sprite } from '../../render/sprites';
import { drawPlayerPaddle } from '../people/actors';

export function settlement(scene, ctx) {
  const s = scene.game.state; const net = s.income - s.spent;
  const roi = s.spent > 0 ? (s.income / s.spent) : 0;

  scene.text(ctx, net >= 0 ? '这箱买卖，赚到了' : '这箱买卖，亏了一些', 24, 118, 22);
  scene.text(ctx, `${net >= 0 ? '+' : ''}${net} 金币`, 24, 172, 39, net >= 0 ? palette.green : palette.red);
  scene.text(ctx, `出售 ${s.income} − 成交 ${s.spent}`, 24, 203, 15, palette.muted);
  if (s.collectedValue) scene.text(ctx, `收藏参考价值 ${s.collectedValue}，不计收入`, 24, 225, 12, palette.muted);
  divider(ctx, 24, 239, 327);
  const zhou = roi >= 1.5 || roi < 0.5 ? 2 : 0;
  const lan = roi >= 1.5 ? 5 : roi >= 1 ? 2 : 3;
  sprite(ctx, scene.art.get('zhouSheet'), zhou, 6, 2, 36, 249, 124, 124);
  sprite(ctx, scene.art.get('lanSheet'), 6 + lan, 6, 2, 214, 249, 124, 124);
  scene.text(ctx, roi >= 1.5 ? '老周：看走眼了' : roi >= 1 ? '老周：不错' : roi >= 0.5 ? '老周：还好没跟' : '老周：下次小心', 30, 393, 12);
  scene.text(ctx, roi >= 1.5 ? '阿岚：不服！' : roi >= 1 ? '阿岚：哼' : '阿岚：哈哈！', 209, 393, 12);
  drawPlayerPaddle(ctx, 157, 397, 58, 94, s.ornament);
  if (s.ornamentNotice) scene.text(ctx, s.ornamentNotice, 24, 478, 12, palette.gold);
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

