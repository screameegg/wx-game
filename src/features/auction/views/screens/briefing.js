import { cover, palette } from '../../render/ui';
import { paymentDue } from '../../rules/debt';

export function briefing(scene, ctx) {
  const s = scene.game.state; const lot = scene.game.nextLot;
  scene.text(ctx, `第 ${s.round + 1} 场拍卖`, 24, 103, 13, palette.muted);
  scene.text(ctx, lot.name, 23, 141, 25);
  cover(ctx, scene.art.get('harbor'), 24, 172, 327, 171);
  scene.text(ctx, '这箱货的来历', 24, 379, 17, palette.gold);
  scene.paragraph(ctx, lot.story, 24, 411, 327, 15, 3);
  const roundsLeft = 6 - s.round % 6 || 6;
  scene.text(ctx, roundsLeft <= 2 ? `经营目标：准备 ${paymentDue(s)} 金币还款` : `经营目标：${!s.unlocked.includes('photo') ? '攒钱解锁摄影箱' : !s.unlocked.includes('repair') ? '攒钱解锁维修箱' : s.tier === 'starter' ? '攒钱进入进阶拍场' : '收集新物件，补全图鉴'}`, 24, 493, 14, palette.gold);
  scene.link(ctx, '设备与还款', 24, 519, 250, () => { scene.menu.view = 'shop'; });
  const minimum = s.tier === 'advanced' ? 300 : 100;
  const label = s.coins < 100 ? '整理旧物 +150 金币（占1场）' : s.coins < minimum ? '资金不足，查看设备' : '打开集装箱，先看线索';
  scene.button(ctx, label, 24, scene.height - 68, 327, 48, () => {
    if (s.coins < 100) scene.game.recover(); else if (s.coins < minimum) scene.menu.view = 'shop'; else scene.game.startRound();
  });
}
