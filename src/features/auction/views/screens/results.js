import { dockArgs, splitDock } from '../../data/round7';
import { economy } from '../../data/economy';
import { judgeLine } from '../../data/lines';
import {
  reactionLine, reactionSlots, repayGlance, repayNarrative, repayTitle, repayView,
  repaymentLayout, settlementLayout, settlementModel,
} from '../../data/round10';
import { drawRepayCard, drawSettlement } from '../../fx/round10-present';
import { watchUnlockPose } from '../../fx/watch-unlock';
import { paymentDue } from '../../rules/debt';
import { auctionsRemaining } from '../../rules/debt-clock';
import { drawPlayerPaddle } from '../people/actors';
import { drawExpression, settlementExpression } from '../people/expressions';

export function settlement(scene, ctx) {
  const s = scene.game.state;
  const roi = s.spent > 0 ? (s.income / s.spent) : 0;
  const layout = settlementLayout(scene.height);
  const faces = ['老周', '阿岚'].map((name) => {
    const expr = settlementExpression(name, roi);
    return { name, label: expr.label, spoken: reactionLine(judgeLine(roi, name)), expr };
  });
  drawSettlement(scene, ctx, {
    layout,
    model: settlementModel(s),
    faces,
    notice: s.ornamentNotice || '',
  });
  const slots = reactionSlots(layout.reaction);
  faces.forEach((face, index) => {
    const slot = index ? slots.right : slots.left;
    drawExpression(scene, ctx, index, face.expr, slot.x, slot.y, slot.w, slot.h);
  });
  const unlock = scene.watchUnlock;
  const wristPose = watchUnlockPose(unlock ? Date.now() - unlock.at : Infinity);
  if (unlock) unlock.phase = wristPose.phase;
  drawPlayerPaddle(ctx, slots.paddle.x, slots.paddle.y, slots.paddle.w, slots.paddle.h, s.ornament, unlock && wristPose.phase !== 'done' ? { ...wristPose, image: scene.art && scene.art.get('watchUnlock') } : null);
  scene.link(ctx, '查看每件物品，复盘线索', layout.link.x, layout.link.y, layout.link.w, () => { scene.menu.view = 'ledger'; });
  const dock = splitDock(scene.height);
  scene.button(ctx, '设备', dock.secondary.x, dock.secondary.y, dock.secondary.w, dock.secondary.h, () => { scene.menu.view = 'shop'; }, true);
  scene.button(ctx, '去看下一箱', dock.primary.x, dock.primary.y, dock.primary.w, dock.primary.h, () => scene.game.prepareRound());
}

export function repayment(scene, ctx) {
  const s = scene.game.state;
  const layout = repaymentLayout(scene.height);
  const glance = repayGlance({
    phase: s.phase,
    due: paymentDue(s),
    remaining: auctionsRemaining(s),
    coins: s.coins,
    arrears: s.arrears,
    overdue: s.overdue,
    creditorKey: s.creditorKey,
    missesToSeize: economy.seizureOverdueCount,
  });
  drawRepayCard(scene, ctx, layout.card, repayView(glance, { title: repayTitle(s.phase, glance.remaining) }), layout.sketch);
  const story = repayNarrative(s.notice, s.creditorLine);
  if (story.who) scene.text(ctx, story.who, layout.copy.x, layout.copy.y, 13, '#B85C38');
  if (story.line) scene.paragraph(ctx, story.line, layout.copy.x, layout.copy.y + (story.who ? 24 : 0), layout.copy.w, 16, 3);
  if (story.detail) scene.paragraph(ctx, story.detail, layout.copy.x, layout.copy.y + 78, layout.copy.w, 14, 3);
  scene.text(ctx, `当前余额 ${s.coins} 金币`, layout.balance.x, layout.balance.y, 18, '#B85C38');
  scene.button(ctx, '继续经营', ...dockArgs(scene.height), () => scene.game.continueAfterRepayment());
}
