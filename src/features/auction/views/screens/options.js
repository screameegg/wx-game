import { palette } from '../../render/ui';
import { dockArgs } from '../../data/round7';
import { openCollection } from './collection';

export function options(scene, ctx) {
  const s = scene.game.state;
  scene.text(ctx, '游戏菜单', 24, 125, 25);
  const rows = [
    [s.phase === 'home' ? '开始游戏' : '回到游戏', () => { if (s.phase === 'home') scene.game.reset(); scene.menu.view = ''; }],
    ['怎么玩', () => { scene.menu.view = 'help'; }],
    ['收藏图鉴', () => { openCollection(scene.menu); }],
    [`声音：${s.soundEnabled ? '开' : '关'}`, () => scene.game.toggleSound()],
    ['重新开始', () => { scene.menu.view = 'confirm'; }],
    ['返回首页', () => { scene.menu.view = 'home'; }],
  ];
  rows.forEach(([label, action], i) => scene.button(ctx, label, 24, 168 + i * 58, 327, 44, action, i > 0));
  if (s.phase === 'auction' && !s.pending) scene.link(ctx, '设置自己的出价提醒', 24, 520, 327, () => { scene.menu.view = 'ceiling'; });
  scene.link(ctx, `热区线框：${scene.hotspotDebug ? '开' : '关'}`, 24, 562, 327, () => { scene.hotspotDebug = !scene.hotspotDebug; });
}
export function confirmReset(scene, ctx) {
  scene.text(ctx, '重新开始一份生意？', 24, 140, 24);
  scene.paragraph(ctx, '当前金币、收藏和进度会清除。', 24, 191, 327, 16, 3);
  scene.button(ctx, '确定，重新开始', 24, 286, 327, 48, () => { scene.game.reset(); scene.reviewing = false; scene.menu.view = ''; });
  scene.button(ctx, '保留进度，返回', 24, 352, 327, 48, () => { scene.menu.view = 'home'; }, true);
}
export function ceiling(scene, ctx) {
  const s = scene.game.state;
  scene.text(ctx, '我最多愿意出多少？', 24, 130, 24);
  scene.paragraph(ctx, '超过这个价格时提醒一次，你仍然可以选择继续。', 24, 178, 327, 15, 3);
  [200,300,400].forEach((amount,i) => {
    const value = amount * (s.tier === 'advanced' ? 3 : 1);
    scene.button(ctx, `${value} 金币`, 24, 263 + i * 58, 327, 44, () => { s.ceiling = value; s.warnedPrice = 0; scene.game.save(); scene.menu.view = ''; }, s.ceiling !== value);
  });
  scene.link(ctx, '不设提醒', 24, 451, 327, () => { s.ceiling = 0; scene.game.save(); scene.menu.view = ''; });
  scene.button(ctx, '回到游戏', ...dockArgs(scene.height), () => { scene.menu.view = ''; });
}
