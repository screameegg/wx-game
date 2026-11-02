import { sprite } from '../../render/sprites';

// 图集从左到右：轻松、思考、皱眉、笑、放弃、不服。老周在第一行，阿岚在第二行。
export const EXPRESSIONS = {
  relaxed: { id: 'relaxed', label: '轻松', frame: 0 },
  thinking: { id: 'thinking', label: '思考', frame: 1 },
  frown: { id: 'frown', label: '皱眉', frame: 2 },
  smile: { id: 'smile', label: '笑', frame: 3 },
  giveup: { id: 'giveup', label: '放弃', frame: 4 },
  defiant: { id: 'defiant', label: '不服', frame: 5 },
};

// 竞价表情只读现有 reaction()。不改 limit / active / estimate，不消耗随机数。
// 阿岚约 10% 的 bluff 只把表情换成「笑」，出价仍走原来的上限。
export function auctionExpression(game, rival) {
  const text = game.reaction(rival);
  if (text.includes('笑')) return EXPRESSIONS.smile;
  if (rival.active === false || text.includes('退出')) return EXPRESSIONS.giveup;
  if (text.includes('皱眉') || text.includes('擦汗')) return EXPRESSIONS.frown;
  if (game.state.leader === rival.name) return EXPRESSIONS.thinking;
  if (text.includes('瞪眼') || text.includes('不服')) return EXPRESSIONS.defiant;
  if (game.state.pending) return EXPRESSIONS.thinking;
  return EXPRESSIONS.relaxed;
}

// 结算沿用原来的回报率分档，只是改走这六个名字。
export function settlementExpression(name, roi) {
  if (name === '老周') return roi >= 1.5 || roi < 0.5 ? EXPRESSIONS.frown : EXPRESSIONS.relaxed;
  if (roi >= 1.5) return EXPRESSIONS.defiant;
  if (roi >= 1) return EXPRESSIONS.frown;
  return EXPRESSIONS.smile;
}

// 放弃或被抢走：拍下的人笑，另一位轻松；流拍则两人都轻松。
export function passedExpression(name, winner) {
  return winner === name ? EXPRESSIONS.smile : EXPRESSIONS.relaxed;
}

export function drawExpression(scene, ctx, rivalIndex, state, x, y, w, h) {
  const image = scene.art && scene.art.get(rivalIndex ? 'lanSheet' : 'zhouSheet');
  if (image && image.width > 0 && image.height > 0) {
    sprite(ctx, image, rivalIndex * 6 + state.frame, 6, 2, x, y, w, h);
    return;
  }
  drawPlaceholder(ctx, state, x, y, w, h);
}

function drawPlaceholder(ctx, state, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#efe2cc';
  ctx.strokeStyle = '#493b31';
  ctx.lineWidth = 3;
  ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
  const scale = Math.min(w, h) / 140;
  ctx.translate(x + w / 2, y + h * 0.42);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#38352f';
  ctx.beginPath();
  ctx.arc(-18, -6, 4, 0, Math.PI * 2);
  ctx.arc(18, -6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38352f';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (state.id === 'frown' || state.id === 'defiant') {
    ctx.beginPath();
    ctx.moveTo(-28, -18);
    ctx.lineTo(-8, -12);
    ctx.moveTo(28, -18);
    ctx.lineTo(8, -12);
    ctx.stroke();
  }
  drawMouth(ctx, state.id);
  ctx.restore();
}

function drawMouth(ctx, id) {
  ctx.beginPath();
  if (id === 'smile') ctx.arc(0, 4, 14, 0.15, Math.PI - 0.15);
  else if (id === 'relaxed') ctx.arc(0, 8, 10, 0.2, Math.PI - 0.2);
  else if (id === 'frown') ctx.arc(0, 24, 12, Math.PI + 0.35, -0.35);
  else if (id === 'defiant') { ctx.moveTo(-12, 10); ctx.lineTo(12, 18); }
  else if (id === 'giveup') { ctx.moveTo(-12, 14); ctx.lineTo(12, 14); }
  else { ctx.moveTo(-8, 14); ctx.lineTo(10, 12); }
  ctx.stroke();
}
