import { economy } from '../data/economy';
import { debtTickBeat } from '../data/round3';
import { auctionsRemaining } from '../rules/debt-clock';

export function debtTickPose(elapsedMs, config = debtTickBeat) {
  const total = config.durationMs;
  if (!(elapsedMs >= 0) || elapsedMs >= total) return { phase: 'done', t: 1, frame: 0, shake: 0 };
  const t = elapsedMs / total;
  const frame = Math.min(config.frames - 1, Math.floor(t * config.frames));
  return { phase: frame === 0 ? 'shake' : 'sparkle', t, frame, shake: config.shakePx * (1 - t) };
}

// 顶栏细条：绿色是还剩的场数。叮一下时轻晃，并换三帧火花。
export function drawDebtCountdown(scene, ctx, x, y, w, h) {
  if (w < 24) return;
  const remaining = auctionsRemaining(scene.game.state);
  const cycle = economy.repaymentCycleRounds || 1;
  const tick = scene.debtTick;
  const pose = debtTickPose(tick ? Date.now() - tick.at : Infinity);
  if (tick) tick.phase = pose.phase;
  const ratio = Math.max(0, Math.min(1, remaining / cycle));
  ctx.save();
  ctx.translate(pose.shake, 0);
  roundFill(ctx, x, y, w, h, '#e2d3bc');
  if (ratio > 0) roundFill(ctx, x, y, Math.max(h, w * ratio), h, '#2f6a45');
  if (pose.phase !== 'done' && remaining < cycle) {
    const lost = Math.min(w - w * ratio, w / cycle);
    roundFill(ctx, x + w * ratio, y, Math.max(3, lost), h, '#9a4030');
    drawSparkle(scene, ctx, x + w * ratio - 6, y - 16, pose.frame);
  }
  ctx.restore();
}

function drawSparkle(scene, ctx, x, y, frame) {
  const image = scene.art && scene.art.get('debtTick');
  const crop = debtTickBeat.sparkle[frame] || debtTickBeat.sparkle[0];
  if (image && image.width > 0 && image.height > 0 && crop) {
    ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, x, y, 16, 22);
    return;
  }
  ctx.fillStyle = '#f2c84b';
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 10, y + 8);
  ctx.lineTo(x + 18, y + 10);
  ctx.lineTo(x + 10, y + 12);
  ctx.lineTo(x + 8, y + 20);
  ctx.lineTo(x + 6, y + 12);
  ctx.lineTo(x - 2, y + 10);
  ctx.lineTo(x + 6, y + 8);
  ctx.closePath();
  ctx.fill();
}

function roundFill(ctx, x, y, w, h, color) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
