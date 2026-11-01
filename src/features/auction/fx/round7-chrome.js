import { drawDebtCountdown } from './debt-tick';
import {
  chromePalette, ctaLook, debtStripLabel, layoutTokens, menuSpot, placeTopBar,
} from '../data/round7';

// 只画顶栏和按钮。不调用出价、还款或查封。

export function drawTopBar(scene, ctx, { coins, due, remaining, width = layoutTokens.designWidth, menuOpen = false } = {}) {
  const goldLabel = `${coins} 金币`;
  const debtLabel = debtStripLabel(due, remaining);
  ctx.save();
  ctx.font = `600 ${layoutTokens.debtSize}px sans-serif`;
  const debtText = ctx.measureText(debtLabel).width;
  ctx.font = `600 ${layoutTokens.goldSize}px sans-serif`;
  const goldText = ctx.measureText(goldLabel).width;
  ctx.restore();
  const boxes = placeTopBar(width, goldText, debtText);
  const menu = menuSpot(boxes);
  paintPill(ctx, boxes.gold, chromePalette.cream, chromePalette.kraft);
  paintPill(ctx, boxes.debt, chromePalette.cream, chromePalette.kraft);
  drawCoin(ctx, boxes.gold.x + 20, boxes.gold.y + boxes.gold.h / 2);
  scene.text(ctx, goldLabel, boxes.gold.x + 40, boxes.gold.y + 27, layoutTokens.goldSize, chromePalette.ink);
  const iconRoom = boxes.debt.w - debtText > 22;
  const textX = boxes.debt.x + (iconRoom ? 22 : 8);
  if (iconRoom) drawHourglass(ctx, boxes.debt.x + 12, boxes.debt.y + boxes.debt.h / 2 - 1);
  scene.text(ctx, debtLabel, textX, boxes.debt.y + 18, layoutTokens.debtSize, chromePalette.ink);
  const barW = boxes.debt.w - 16;
  if (barW >= 24) drawDebtCountdown(scene, ctx, boxes.debt.x + 8, boxes.debt.y + boxes.debt.h - 5, barW, 3);
  if (menuOpen) drawMenuWord(ctx, menu);
  else drawPlus(ctx, menu.x + menu.w / 2, menu.y + menu.h / 2);
  return { boxes, menu, goldLabel, debtLabel };
}

export function drawPrimaryCta(ctx, box) {
  paintCta(ctx, box, ctaLook({ disabled: box.disabled, pressed: box.pressed && !box.disabled }));
}

export function drawSecondaryCta(ctx, box) {
  paintCta(ctx, box, ctaLook({ secondary: true }));
}

function paintCta(ctx, box, look) {
  const scale = look.scale || 1;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2 + (look.offsetY || 0);
  const w = box.w * scale;
  const h = box.h * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const radius = Math.min(h / 2, 24);
  if (look.state !== 'disabled') {
    ctx.fillStyle = look.lip;
    roundPath(ctx, x, y + (look.state === 'pressed' ? 1 : 4), w, h, radius);
    ctx.fill();
  }
  ctx.fillStyle = look.fill;
  roundPath(ctx, x, y, w, h, radius);
  ctx.fill();
  if (look.line) {
    ctx.strokeStyle = look.line;
    ctx.lineWidth = 2;
    roundPath(ctx, x + 1.5, y + 1.5, w - 3, h - 3, radius);
    ctx.stroke();
  }
  ctx.fillStyle = look.ink;
  ctx.font = `700 ${h < 40 ? 13 : 16}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(look.label || box.label, cx, cy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function paintPill(ctx, box, fill, line) {
  const radius = box.h / 2;
  ctx.fillStyle = fill;
  roundPath(ctx, box.x, box.y, box.w, box.h, radius);
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  roundPath(ctx, box.x, box.y, box.w, box.h, radius);
  ctx.stroke();
}

function drawCoin(ctx, x, y) {
  ctx.fillStyle = chromePalette.rust;
  ctx.beginPath();
  ctx.arc(x, y + 1, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = chromePalette.amber;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = chromePalette.ink;
  ctx.font = '700 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¥', x, y + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawHourglass(ctx, x, y) {
  ctx.fillStyle = chromePalette.green;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 6);
  ctx.lineTo(x + 5, y - 6);
  ctx.lineTo(x + 1, y);
  ctx.lineTo(x + 5, y + 6);
  ctx.lineTo(x - 5, y + 6);
  ctx.lineTo(x - 1, y);
  ctx.closePath();
  ctx.fill();
}

function drawPlus(ctx, x, y) {
  ctx.fillStyle = chromePalette.green;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = chromePalette.cream;
  ctx.fillRect(x - 5, y - 1.4, 10, 2.8);
  ctx.fillRect(x - 1.4, y - 5, 2.8, 10);
}

function drawMenuWord(ctx, menu) {
  ctx.fillStyle = chromePalette.ink;
  ctx.font = '600 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('首页', menu.x + menu.w / 2, menu.y + menu.h / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function roundPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
