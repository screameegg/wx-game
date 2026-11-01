import { steps } from '../shared/chrome';
import { drawPlayerPaddle } from '../people/actors';
import { auctionExpression, drawExpression } from '../people/expressions';
import { palette, progress, panel } from '../../render/ui';
import { drawAuctionBeat, drawLeadBadge, drawLeadGlow, drawRaiseButton, isLeader, liveExpression } from '../../fx/round5-beats';

// 竞价只显示对手、价格与决策，不注册货物热区。节拍只画在这一层。
export function bidding(scene, ctx, now = Date.now()) {
  const s = scene.game.state; steps(scene, ctx, 1);
  const beat = liveExpression(scene.expressionReel, now);
  scene.text(ctx, '看看对手，再决定要不要加价', 24, 125, 18);
  s.rivals.forEach((rival, i) => {
    const mood = auctionExpression(scene.game, rival); const x = i ? 196 : 20;
    const leading = isLeader(s.leader, rival.name);
    if (leading) drawLeadGlow(ctx, x - 8, 142, 176, 250);
    panel(ctx, x - 2, 150, 161, 235, palette.panel, 16);
    if (beat && beat.index === i) drawAuctionBeat(scene, ctx, beat, x, 150, 158, 158);
    else drawExpression(scene, ctx, i, mood, x, 150, 158, 158);
    scene.text(ctx, rival.name, x + 43, 331, 17, palette.text);
    scene.text(ctx, mood.label, x + 43, 352, 12, palette.muted);
    if (leading) drawLeadBadge(ctx, x + 108, 158);
    const hint = scene.game.situationHint(rival);
    if (hint) scene.text(ctx, hint.length > 12 ? `${hint.slice(0, 11)}…` : hint, x + 3, 375, 11, palette.muted);
  });
  scene.text(ctx, s.leader === '拍卖员' ? '起拍价' : '当前价', 24, 397, 14, palette.muted);
  scene.text(ctx, `${s.price} 金币`, 24, 443, 36, palette.gold);
  scene.text(ctx, s.leader === '拍卖员' ? '你先开价' : `领先：${s.leader}`, 24, 472, 14, palette.text);
  if (isLeader(s.leader, '你')) {
    drawLeadGlow(ctx, 12, 384, 236, 96);
    drawLeadGlow(ctx, 266, 348, 96, 128);
    drawLeadBadge(ctx, 24, 390);
  }
  drawPlayerPaddle(ctx, 282, 365, 64, 102, s.ornament);
  scene.paragraph(ctx, s.pending ? '对手正在考虑……' : (s.notice || '轮到你决定。'), 24, 506, 327, 13, 2);
  if (s.pending) progress(ctx, 24, 536, 327, Math.min(1, (Date.now() - s.pendingAt) / 1200));
  if (!s.pending) scene.link(ctx, '回看箱内线索', 24, 558, 150, () => { scene.reviewing = true; });
  scene.button(ctx, '放弃', 24, scene.height - 68, 105, 48, () => scene.game.pass(), true);
  const next = s.leader === '拍卖员' ? s.price : s.price + s.bidStep;
  const disabled = s.pending || next > s.coins;
  const label = s.pending ? '等待对手…' : `${s.leader === '拍卖员' ? '开价' : '加价'} ${next} 金币`;
  scene.button(ctx, label, 140, scene.height - 68, 211, 48, () => scene.game.bid(), false, {
    role: 'raise', disabled, confirm: 'release', paint: drawRaiseButton,
  });
}
