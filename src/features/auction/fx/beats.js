import { drawCoinBurst, easeOut, effectProgress } from '../render/motion';

// 落槌：抬起、敲下、定格成交价。时间轴由渲染循环按 effect.at 推进。
export function hammerPose(t) {
  if (t < 0.34) return { phase: 'lift', drop: 0, angle: -1.05 * (t / 0.34) };
  if (t < 0.48) {
    const p = (t - 0.34) / 0.14;
    return { phase: 'strike', drop: p, angle: -1.05 + 1.35 * p };
  }
  const wobble = Math.sin(Math.min(1, (t - 0.48) / 0.16) * Math.PI) * 0.06;
  return { phase: 'seal', drop: 1, angle: 0.18 + wobble };
}

// 翻牌：前半张是背面，过中线换成正面，横向压扁再展开。
export function flipPose(t) {
  if (t >= 1) return { phase: 'front', scaleX: 1, showFront: true };
  const mid = 0.46;
  if (t < mid) {
    const p = t / mid;
    return { phase: 'back', scaleX: Math.max(0.06, Math.cos((p * Math.PI) / 2)), showFront: false };
  }
  const p = (t - mid) / (1 - mid);
  return { phase: 'front', scaleX: Math.max(0.06, Math.sin((p * Math.PI) / 2)), showFront: true };
}

// 盈亏大字：冲入、停住、淡出，底下的结算面板接着显示。
export function pnlPose(t) {
  if (t < 0.2) return { phase: 'in', scale: 0.4 + 0.85 * easeOut(t / 0.2), alpha: 1 };
  if (t < 0.72) return { phase: 'hold', scale: 1.12 - 0.12 * ((t - 0.2) / 0.52), alpha: 1 };
  const p = (t - 0.72) / 0.28;
  return { phase: 'out', scale: 1 - 0.2 * p, alpha: Math.max(0, 1 - p) };
}

export function withFlip(ctx, x, y, pose, draw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pose.scaleX, 1);
  draw();
  ctx.restore();
  if (!pose.showFront && pose.scaleX < 0.2) {
    ctx.fillStyle = '#e6d3a8';
    ctx.fillRect(x - 3, y - 94, 6, 188);
  }
}

export function drawFeedback(scene, ctx) {
  const effect = scene.effect;
  if (!effect) return;
  const t = effectProgress(scene, effect.kind);
  if (t >= 1) { effect.phase = 'done'; return; }
  if (effect.kind === 'sell' || effect.kind === 'collect') drawCoinBurst(scene, ctx);
  if (effect.kind === 'hammer') drawHammer(scene, ctx, t);
  if (effect.kind === 'pnl') drawPnl(scene, ctx, t);
}

function drawHammer(scene, ctx, t) {
  const pose = hammerPose(t);
  scene.effect.phase = pose.phase;
  const price = Number.isFinite(scene.effect.price) ? scene.effect.price : scene.game.state.price;
  ctx.save();
  ctx.fillStyle = 'rgba(22, 28, 27, 0.58)';
  ctx.fillRect(0, 64, 375, scene.height - 64);
  ctx.fillStyle = '#6e4b32';
  ctx.fillRect(118, 318, 140, 18);
  ctx.fillStyle = '#c9a36a';
  ctx.fillRect(118, 318, 140, 6);
  const gy = 248 - (1 - pose.drop) * 86;
  drawGavel(ctx, 188, gy, pose.angle);
  if (pose.phase !== 'lift' && pose.drop > 0.72) {
    ctx.strokeStyle = '#f2cc50';
    ctx.globalAlpha = 1 - Math.max(0, pose.drop - 0.72) / 0.5;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(188, 318, 16 + pose.drop * 28, Math.PI, 0);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (pose.phase === 'seal') {
    ctx.globalAlpha = easeOut(Math.min(1, (t - 0.48) / 0.24));
    center(ctx, '落槌', 188, 168, 46, '#f6e2b0');
    center(ctx, `成交 ${price} 金币`, 188, 210, 22, '#fff9ed', 600);
  }
  ctx.restore();
}

function drawGavel(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#e2c291';
  ctx.strokeStyle = '#3e2c22';
  ctx.lineWidth = 3;
  ctx.fillRect(-6, 0, 12, 84);
  ctx.strokeRect(-6, 0, 12, 84);
  ctx.fillStyle = '#8d5a34';
  ctx.beginPath();
  ctx.moveTo(-38, -8);
  ctx.lineTo(38, -8);
  ctx.quadraticCurveTo(44, 8, 36, 16);
  ctx.lineTo(-36, 16);
  ctx.quadraticCurveTo(-44, 8, -38, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPnl(scene, ctx, t) {
  const pose = pnlPose(t);
  scene.effect.phase = pose.phase;
  const net = Number.isFinite(scene.effect.net) ? scene.effect.net : 0;
  const win = net >= 0;
  ctx.save();
  ctx.globalAlpha = 0.78 * pose.alpha;
  ctx.fillStyle = win ? '#1e3a2c' : '#3d221c';
  roundBox(ctx, 28, 168, 319, 236, 18);
  ctx.fill();
  ctx.globalAlpha = pose.alpha;
  ctx.translate(188, 286);
  ctx.scale(pose.scale, pose.scale);
  center(ctx, win ? '赚了' : '亏了', 0, -16, 60, win ? '#d7f0c8' : '#ffd0c4');
  center(ctx, `${net > 0 ? '+' : ''}${net}`, 0, 54, 52, '#fff9ed');
  center(ctx, '本场盈亏 · 金币', 0, 92, 16, '#f0e2c8', 600);
  ctx.restore();
}

function center(ctx, text, x, y, size, color, weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function roundBox(ctx, x, y, w, h, r) {
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
}
