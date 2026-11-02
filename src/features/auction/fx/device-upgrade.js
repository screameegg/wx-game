import { cargoLayout } from '../render/cargo';
import { deviceUpgradeBeat, infoCardBox } from '../data/round3';

function spanAlpha(t, span) {
  if (!span || t < span.start || t >= span.end) return 0;
  const u = (t - span.start) / Math.max(0.001, span.end - span.start);
  return Math.sin(Math.PI * (0.15 + 0.85 * Math.min(1, Math.max(0, u))));
}

// 总时长强制不超过 300ms。配置写得更长也不会播更久。
export function deviceUpgradePose(elapsedMs, config = deviceUpgradeBeat) {
  const total = Math.min(300, config.capMs || 300, config.durationMs || 300);
  if (!(elapsedMs >= 0) || elapsedMs >= total) {
    return { phase: 'done', t: 1, total, flash: 0, outline: 0, arrow: 0 };
  }
  const t = elapsedMs / total;
  const flash = spanAlpha(t, config.phases.flash);
  const outline = spanAlpha(t, config.phases.outline);
  const arrow = spanAlpha(t, config.phases.arrow);
  let phase = 'flash';
  if (t >= config.phases.outline.start) phase = 'outline';
  if (t >= config.phases.arrow.start) phase = 'arrow';
  return { phase, t, total, flash, outline, arrow };
}

export function drawDeviceUpgrade(scene, ctx, now = Date.now()) {
  const effect = scene.effect;
  if (!effect || effect.kind !== 'deviceUpgrade') return;
  const pose = deviceUpgradePose(now - effect.at);
  effect.phase = pose.phase;
  if (pose.phase === 'done') return;
  const image = scene.art && scene.art.get('deviceUpgrade');
  const card = infoCardBox;
  if (pose.flash > 0) drawFlash(ctx, image, pose.flash, effect.index);
  if (pose.outline > 0) drawOutline(ctx, image, card, pose.outline);
  if (pose.arrow > 0) drawArrow(ctx, image, card, pose.arrow);
}

function drawFlash(ctx, image, alpha, index) {
  const box = cargoLayout[index] || { x: 140, y: 240, w: 90, h: 80 };
  const crop = deviceUpgradeBeat.crops.flash;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (image && image.width > 0 && image.height > 0) {
    ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, box.x - 16, box.y - 28, box.w + 32, box.h + 24);
  } else {
    ctx.fillStyle = '#fff1c2';
    ctx.beginPath();
    ctx.arc(box.x + box.w / 2, box.y + box.h / 2, Math.max(box.w, box.h) * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawOutline(ctx, image, card, alpha) {
  const crop = deviceUpgradeBeat.crops.outline;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (image && image.width > 0 && image.height > 0) ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, card.x - 8, card.y - 8, card.w + 16, card.h + 16);
  ctx.strokeStyle = '#f0c14a';
  ctx.lineWidth = 3;
  roundStroke(ctx, card.x - 3, card.y - 3, card.w + 6, card.h + 6, 14);
  ctx.restore();
}

function drawArrow(ctx, image, card, alpha) {
  const crop = deviceUpgradeBeat.crops.arrow;
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = card.x + card.w - 54;
  const y = card.y - 18;
  if (image && image.width > 0 && image.height > 0) ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, x, y, 58, 58);
  else {
    ctx.strokeStyle = '#6f8a4e';
    ctx.fillStyle = '#6f8a4e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 40);
    ctx.quadraticCurveTo(x + 20, y + 18, x + 44, y + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 44, y + 12);
    ctx.lineTo(x + 30, y + 8);
    ctx.lineTo(x + 36, y + 22);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function roundStroke(ctx, x, y, w, h, r) {
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
  ctx.stroke();
}
