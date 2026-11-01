import { cover, palette, panel } from '../../render/ui';
import { economy, openingBid } from '../../data/economy';
import { paymentDue } from '../../rules/debt';
import { dockArgs } from '../../data/round7';

export function briefing(scene, ctx) {
  const s = scene.game.state; const lot = scene.game.nextLot;
  scene.text(ctx, `第 ${s.round + 1} 场拍卖`, 24, 103, 13, palette.muted);
  scene.text(ctx, lot.name, 23, 141, 25);
  cover(ctx, scene.art.get('harbor'), 24, 172, 327, 171);
  if (s.creditorLine) {
    panel(ctx, 24, 292, 327, 51, '#fff9ed', 10);
    scene.text(ctx, '债主', 36, 314, 12, palette.gold);
    scene.paragraph(ctx, s.creditorLine, 72, 314, 263, 13, 2);
  }
  scene.text(ctx, '这箱货的来历', 24, 379, 17, palette.gold);
  scene.paragraph(ctx, lot.story, 24, 411, 327, 15, 3);
  const cycle = economy.repaymentCycleRounds; const roundsLeft = cycle - s.round % cycle || cycle;
  scene.text(ctx, roundsLeft <= 2 ? `经营目标：准备 ${paymentDue(s)} 金币还款` : `经营目标：${!s.unlocked.includes('photo') ? '攒钱解锁摄影箱' : !s.unlocked.includes('repair') ? '攒钱解锁维修箱' : s.tier === 'starter' ? '攒钱进入进阶拍场' : '收集新物件，补全图鉴'}`, 24, 493, 14, palette.gold);
  scene.link(ctx, '设备与还款', 24, 519, 250, () => { scene.menu.view = 'shop'; });
  const minimum = openingBid(s.tier);
  const label = s.coins < economy.recoverBelowCoins ? `整理旧物 +${economy.recoverCoins} 金币（占1场）` : s.coins < minimum ? '资金不足，查看设备' : '打开集装箱，先看线索';
  scene.button(ctx, label, ...dockArgs(scene.height), () => {
    if (s.coins < economy.recoverBelowCoins) scene.game.recover(); else if (s.coins < minimum) scene.menu.view = 'shop'; else scene.game.startRound();
  });
}
