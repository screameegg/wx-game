// 第九轮收藏和仓库的绘制。不读成交价，不改收藏数组。
// 珍品角标只画一枚，不循环、不闪。参考图没到，或 useSheet 关闭时，用矢量占位。

import {
  emptyCopy, plateFill, rareBadgeSpec, round9Art,
} from '../data/round9';

function sheetImage(scene, key) {
  if (!round9Art.useSheet || !scene || !scene.art || typeof scene.art.get !== 'function') return null;
  return scene.art.get(key) || null;
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

function paintImage(ctx, image, box) {
  if (!image || !image.width || !image.height) return false;
  const scale = Math.min(box.w / image.width, box.h / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
  return true;
}

export function drawCellPlate(scene, ctx, box, found) {
  const key = found ? 'round9:cellCollected' : 'round9:cellEmpty';
  const image = sheetImage(scene, key);
  if (image && paintImage(ctx, image, box)) return;
  ctx.save();
  ctx.fillStyle = found ? plateFill.collected : plateFill.empty;
  roundPath(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fill();
  ctx.strokeStyle = plateFill.line;
  ctx.lineWidth = found ? 2 : 1.5;
  if (!found && ctx.setLineDash) ctx.setLineDash([5, 4]);
  roundPath(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.stroke();
  if (ctx.setLineDash) ctx.setLineDash([]);
  if (found) {
    ctx.fillStyle = plateFill.accent;
    ctx.fillRect(box.x + 8, box.y + 14, 4, box.h - 28);
  }
  ctx.restore();
}

export function drawThumbWell(ctx, box, found) {
  ctx.save();
  ctx.fillStyle = found ? '#FFF9ED' : '#EFE6D8';
  roundPath(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.fill();
  ctx.strokeStyle = plateFill.line;
  ctx.lineWidth = 1.25;
  if (!found && ctx.setLineDash) ctx.setLineDash([4, 3]);
  roundPath(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.stroke();
  if (ctx.setLineDash) ctx.setLineDash([]);
  ctx.restore();
}

// 固定右上角的一枚角标。没有时间参数，也不会改透明度。
export function drawRareBadge(scene, ctx, box) {
  const image = sheetImage(scene, 'round9:rareBadge');
  if (image && paintImage(ctx, image, box)) return;
  ctx.save();
  ctx.fillStyle = plateFill.badge;
  roundPath(ctx, box.x, box.y, box.w, box.h, box.h / 2);
  ctx.fill();
  ctx.fillStyle = plateFill.badgeInk;
  ctx.font = '700 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rareBadgeSpec.label, box.x + box.w / 2, box.y + box.h / 2 + 0.5);
  ctx.restore();
}

export function drawWarehouseRow(scene, ctx, box) {
  const image = sheetImage(scene, 'round9:warehouseRow');
  if (image && paintImage(ctx, image, box)) return;
  ctx.save();
  ctx.fillStyle = plateFill.collected;
  roundPath(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.strokeStyle = plateFill.line;
  ctx.lineWidth = 1.5;
  roundPath(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.stroke();
  ctx.restore();
}

export function drawPaneTab(ctx, box, active) {
  ctx.save();
  ctx.fillStyle = active ? plateFill.badge : plateFill.collected;
  roundPath(ctx, box.x, box.y, box.w, box.h, box.h / 2);
  ctx.fill();
  ctx.strokeStyle = active ? plateFill.accent : plateFill.line;
  ctx.lineWidth = 1.5;
  roundPath(ctx, box.x, box.y, box.w, box.h, box.h / 2);
  ctx.stroke();
  ctx.fillStyle = active ? plateFill.badgeInk : plateFill.ink;
  ctx.font = '700 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(box.label, box.x + box.w / 2, box.y + box.h / 2 + 0.5);
  ctx.restore();
}

function drawLightSlot(ctx, box, kind) {
  ctx.save();
  ctx.fillStyle = '#F7F1E6';
  roundPath(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.strokeStyle = plateFill.line;
  ctx.lineWidth = 1.5;
  roundPath(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.stroke();
  ctx.strokeStyle = plateFill.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (kind === 'warehouse') {
    const y1 = box.y + box.h * 0.38;
    const y2 = box.y + box.h * 0.68;
    ctx.moveTo(box.x + 16, y1);
    ctx.lineTo(box.x + box.w - 16, y1);
    ctx.moveTo(box.x + 16, y2);
    ctx.lineTo(box.x + box.w - 16, y2);
  } else {
    const inset = 18;
    ctx.rect(box.x + inset, box.y + 12, box.w - inset * 2, box.h - 24);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawEmptyState(scene, ctx, kind, box) {
  const key = kind === 'warehouse' ? 'round9:emptyWarehouse' : 'round9:emptyCollection';
  ctx.save();
  ctx.fillStyle = plateFill.empty;
  roundPath(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fill();
  ctx.strokeStyle = plateFill.line;
  ctx.lineWidth = 1.5;
  if (ctx.setLineDash) ctx.setLineDash([5, 4]);
  roundPath(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.stroke();
  if (ctx.setLineDash) ctx.setLineDash([]);
  ctx.restore();
  const copy = emptyCopy[kind] || emptyCopy.collection;
  const image = sheetImage(scene, key);
  const compact = box.h <= 110;
  const slot = compact
    ? { x: box.x + 12, y: box.y + Math.max(8, (box.h - 56) / 2), w: 72, h: Math.min(56, box.h - 16) }
    : { x: box.x + (box.w - Math.min(128, box.w - 36)) / 2, y: box.y + 14, w: Math.min(128, box.w - 36), h: box.h < 150 ? 48 : 72 };
  if (!(image && paintImage(ctx, image, slot))) drawLightSlot(ctx, slot, kind);
  const textX = compact ? slot.x + slot.w + 12 : box.x + 18;
  const textY = compact ? box.y + 34 : slot.y + slot.h + 26;
  const textW = compact ? box.x + box.w - 16 - textX : box.w - 36;
  if (scene && typeof scene.paragraph === 'function') scene.paragraph(ctx, copy, textX, textY, textW, 14, compact ? 2 : 3);
  else if (scene && typeof scene.text === 'function') scene.text(ctx, copy, textX, textY, 14, plateFill.ink);
}
