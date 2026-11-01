import { cover, palette, panel } from '../../render/ui';
import { catalogSprite } from '../../render/sprites';
import { economy } from '../../data/economy';
import { paymentDue } from '../../rules/debt';

export function home(scene, ctx) {
  const s = scene.game.state;
  scene.text(ctx, '看准一箱，赚一笔。', 23, 128, 26);
  cover(ctx, scene.art.get('harbor'), 24, 164, 327, 175);
  catalogSprite(scene, ctx, '旧自行车', { x: 43, y: 217, w: 96, h: 104 });
  catalogSprite(scene, ctx, '旧吉他', { x: 133, y: 181, w: 109, h: 143 });
  catalogSprite(scene, ctx, '旧唱片', { x: 244, y: 230, w: 81, h: 86 });
  ['看线索', '参加竞价', '公布结果'].forEach((label,i) => scene.text(ctx, label, 26 + i * 116, 379, 16, palette.gold));
  scene.paragraph(ctx, '用线索判断值不值得买。卖出的金币，减去拍下的价格，就是这箱赚的钱。', 24, 422, 327, 16, 3);
  const due = paymentDue(s); const photo = economy.themeUnlock.photo; const repair = economy.themeUnlock.repair; const entry = economy.advancedEntryCoins; const goal = !s.unlocked.includes('photo') ? `解锁摄影箱：${Math.min(s.coins, photo)} / ${photo} 金币` : !s.unlocked.includes('repair') ? `解锁维修箱：${Math.min(s.coins, repair)} / ${repair} 金币` : s.tier === 'starter' ? `进阶档：${Math.min(s.coins, entry)} / ${entry} 金币` : `本期还款：${due} 金币`;
  panel(ctx, 24, 476, 327, 48, '#eee4d1', 11);
  scene.text(ctx, '经营目标', 34, 496, 11, palette.muted);
  scene.text(ctx, goal, 118, 506, 14, palette.text);
  scene.buttons.push({ x: 24, y: 476, w: 327, h: 48, label: '经营目标与提前还款', action: () => { scene.menu.view = 'business'; } });
  scene.button(ctx, s.phase === 'home' ? '开始第一箱' : '继续游戏', 24, scene.height - 128, 327, 48, () => {
    if (s.phase === 'home') scene.game.reset(); scene.menu.view = '';
  });
  scene.link(ctx, '怎么玩', 24, scene.height - 63, 125, () => { scene.menu.view = 'help'; });
  scene.link(ctx, '收藏图鉴', 230, scene.height - 63, 125, () => { scene.menu.collectionTheme = ''; scene.menu.view = 'collection'; });
}
export function help(scene, ctx) {
  scene.text(ctx, '拍卖与经营，四步上手', 24, 125, 25);
  const rows = [
    ['1  看线索', '点击货物，看看外观和保存情况。暗处只能看见轮廓，不能确定里面是什么。'],
    ['2  读对手', '观察对手表情和预算。竞价时可以回看线索、使用设备，也可以及时放弃。'],
    ['3  开箱结算', '拍下后逐件打开。出售换金币，好品可收藏进图鉴；收藏不算收入。'],
    ['4  经营成长', '攒钱还款、提前还款、购买设备、解锁新主题和进阶拍场，逐步补全图鉴。'],
  ];
  rows.forEach(([title, text], i) => { scene.text(ctx, title, 24, 178 + i * 98, 18, palette.gold); scene.paragraph(ctx, text, 24, 207 + i * 98, 327, 13, 3); });
  scene.button(ctx, '明白了，去试一箱', 24, scene.height - 68, 327, 48, () => { if (scene.game.state.phase === 'home') scene.game.reset(); scene.menu.view = ''; });
}
