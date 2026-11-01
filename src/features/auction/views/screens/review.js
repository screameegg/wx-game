import { panel, palette } from '../../render/ui';

export function ledger(scene, ctx) {
  const s = scene.game.state;
  scene.text(ctx, '这箱都开出了什么', 24, 125, 24);
  s.items.forEach((entry, i) => {
    const y = 162 + i * 67; panel(ctx, 24, y, 327, 55, palette.panel, 12);
    scene.text(ctx, entry.result[0], 38, y + 24, 16);
    scene.text(ctx, `${entry.status === 'sold' ? '已售出' : '已收藏'} · ${entry.result[2]} 金币`, 38, y + 44, 12, palette.muted);
    scene.buttons.push({ x: 24, y, w: 327, h: 55, label: `复盘${i + 1}`, action: () => { scene.menu.reviewIndex = i; scene.menu.view = 'review'; } });
  });
  scene.button(ctx, '返回结算', 24, scene.height - 68, 327, 48, () => { scene.menu.view = ''; });
}
export function review(scene, ctx) {
  const i = scene.menu.reviewIndex || 0; const entry = scene.game.state.items[i];
  scene.text(ctx, '线索与结果', 24, 125, 25);
  scene.text(ctx, '拍下之前', 24, 183, 17, palette.gold);
  scene.paragraph(ctx, entry.isBonus ? '夹层藏在货柜深处，拍卖前无法看到。' : scene.game.clue(i), 24, 217, 327, 16, 4);
  scene.text(ctx, '打开之后', 24, 344, 17, palette.gold);
  scene.paragraph(ctx, `${entry.result[0]} · ${entry.result[2]} 金币。${entry.result[1]}`, 24, 378, 327, 16, 4);
  scene.button(ctx, '返回物品明细', 24, scene.height - 68, 327, 48, () => { scene.menu.view = 'ledger'; });
}
