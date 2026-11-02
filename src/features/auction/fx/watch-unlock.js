import { watchUnlockBeat } from '../data/round3';

export function watchUnlockPose(elapsedMs, config = watchUnlockBeat) {
  const total = config.durationMs;
  if (!(elapsedMs >= 0) || elapsedMs >= total) return { phase: 'done', t: 1, alpha: 0 };
  const t = elapsedMs / total;
  return { phase: t < 0.35 ? 'flash' : 'settle', t, alpha: Math.sin(Math.PI * (0.12 + 0.88 * t)) };
}

// 旧表画在袖口和手掌之间。阶段 3 以后换成更亮的表盘，仍然只是外观。
export function drawWristWatch(ctx, ornament, flash) {
  if (ornament >= 1) {
    const gold = ornament >= 3 ? '#e2b34a' : '#a67c45';
    const face = ornament >= 3 ? '#f6f1e4' : '#e6d3a4';
    ctx.fillStyle = '#5c4030';
    ctx.fillRect(16, 108, 7, 18);
    ctx.strokeStyle = '#493b31';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 108, 7, 18);
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(19, 114, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.arc(19, 114, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#493b31';
    ctx.beginPath();
    ctx.moveTo(19, 114);
    ctx.lineTo(19, 111);
    ctx.moveTo(19, 114);
    ctx.lineTo(22, 115);
    ctx.stroke();
  }
  if (!flash || flash.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = flash.alpha;
  const image = flash.image;
  const crop = watchUnlockBeat.crop;
  if (image && image.width > 0 && image.height > 0) ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, -2, 86, 46, 46);
  ctx.fillStyle = '#fff6cf';
  spark(ctx, 34, 100, 8 + flash.t * 6);
  spark(ctx, 8, 118, 5);
  ctx.restore();
}

function spark(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
}
