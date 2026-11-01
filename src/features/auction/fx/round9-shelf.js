import {
  clampShelfScroll, plateFill, plateLine, shelfTokens, snapShelfScroll,
} from '../data/round9';

// 收藏格、仓库行和空态插图。不读价格，也不按时间闪。

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

function paintImageCover(ctx, image, box, radius) {
  ctx.save();
  roundPath(ctx, box.x, box.y, box.w, box.h, radius);
  ctx.clip();
  const scale = Math.max(box.w / image.width, box.h / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
  ctx.restore();
}

export function paintCellPlate(ctx, box, mode, image) {
  if (image) {
    paintImageCover(ctx, image, box, shelfTokens.radius);
    return;
  }
  const found = mode === 'found';
  ctx.save();
  roundPath(ctx, box.x, box.y, box.w, box.h, shelfTokens.radius);
  ctx.fillStyle = found ? plateFill.found : plateFill.idle;
  ctx.fill();
  roundPath(ctx, box.x, box.y, box.w, box.h, shelfTokens.radius);
  ctx.strokeStyle = found ? plateLine.found : plateLine.idle;
  ctx.lineWidth = found ? 2 : 1.5;
  ctx.setLineDash(found ? [] : [5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function paintRowPlate(ctx, box, image) {
  paintCellPlate(ctx, box, 'found', image);
}

export function paintIdleMark(ctx, box) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  ctx.save();
  ctx.strokeStyle = plateLine.idle;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(cx - 16, cy - 12, 32, 24);
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy);
  ctx.lineTo(cx + 8, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export function paintRareBadge(ctx, spot, image) {
  const spec = shelfTokens.badge;
  if (spec.count !== 1 || spec.loop || spec.blink || spec.corner !== 'tr') return;
  if (image) {
    ctx.drawImage(image, spot.x, spot.y, spot.w, spot.h);
    return;
  }
  const cx = spot.x + spot.w / 2;
  const cy = spot.y + spot.h / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, spot.w / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#e2b143';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#8a5a1e';
  ctx.stroke();
  ctx.fillStyle = '#fff8e8';
  ctx.font = `700 ${Math.max(10, Math.floor(spot.w * 0.5))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('珍', cx, cy + 0.5);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawBook(ctx, box) {
  const x = box.x + 28;
  const y = box.y + 22;
  ctx.save();
  ctx.strokeStyle = '#6d5338';
  ctx.fillStyle = '#fff9ed';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 32, y + 8);
  ctx.quadraticCurveTo(x + 16, y + 4, x + 4, y + 16);
  ctx.lineTo(x + 4, y + 48);
  ctx.quadraticCurveTo(x + 16, y + 36, x + 32, y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 32, y + 8);
  ctx.quadraticCurveTo(x + 48, y + 4, x + 60, y + 16);
  ctx.lineTo(x + 60, y + 48);
  ctx.quadraticCurveTo(x + 48, y + 36, x + 32, y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCrate(ctx, box) {
  const x = box.x + 30;
  const y = box.y + 24;
  ctx.save();
  ctx.strokeStyle = '#6d5338';
  ctx.fillStyle = '#e7c89a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 16);
  ctx.lineTo(x + 32, y + 6);
  ctx.lineTo(x + 56, y + 16);
  ctx.lineTo(x + 32, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4e2c4';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 16);
  ctx.lineTo(x + 8, y + 40);
  ctx.lineTo(x + 32, y + 50);
  ctx.lineTo(x + 32, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 56, y + 16);
  ctx.lineTo(x + 56, y + 40);
  ctx.lineTo(x + 32, y + 50);
  ctx.lineTo(x + 32, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function paintEmptySlot(ctx, box, kind, image) {
  ctx.save();
  roundPath(ctx, box.x, box.y, box.w, box.h, 16);
  ctx.fillStyle = '#f3e6cf';
  ctx.fill();
  roundPath(ctx, box.x, box.y, box.w, box.h, 16);
  ctx.strokeStyle = '#d7c4a4';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (image) {
    roundPath(ctx, box.x, box.y, box.w, box.h, 16);
    ctx.clip();
    ctx.drawImage(image, box.x + 6, box.y + 6, box.w - 12, box.h - 12);
  } else if (kind === 'warehouse') drawCrate(ctx, box);
  else drawBook(ctx, box);
  ctx.restore();
}

export function beginShelfDrag(scene, x, y) {
  const shelf = scene.shelf;
  scene.shelfDrag = null;
  if (!shelf || !(shelf.max > 0) || !shelf.viewport) return;
  const p = scene.localPoint(x, y);
  const view = shelf.viewport;
  if (p.x < view.x || p.x > view.x + view.w || p.y < view.y || p.y > view.y + view.h) return;
  scene.shelfDrag = { y: p.y, offset: shelf.offset || 0, moved: false };
}

export function dragShelf(scene, x, y) {
  const drag = scene.shelfDrag;
  const shelf = scene.shelf;
  if (!drag || !shelf) return false;
  const p = scene.localPoint(x, y);
  const dy = p.y - drag.y;
  if (!drag.moved && Math.abs(dy) < shelfTokens.dragSlop) return false;
  drag.moved = true;
  const next = clampShelfScroll(drag.offset - dy, shelf.max);
  shelf.offset = next;
  if (scene.menu) scene.menu.shelfOffset = next;
  return true;
}

export function endShelfDrag(scene) {
  const drag = scene.shelfDrag;
  scene.shelfDrag = null;
  if (!drag || !drag.moved) return false;
  const shelf = scene.shelf;
  if (shelf && scene.menu) {
    const next = snapShelfScroll(scene.menu.shelfOffset || 0, shelf.stride, shelf.max);
    scene.menu.shelfOffset = next;
    shelf.offset = next;
  }
  scene.pointer = null;
  return true;
}
