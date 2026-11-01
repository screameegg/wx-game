import { tierVisual } from '../data/observe-tiers';

function roundRect(ctx, x, y, w, h, r) {
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

function dash(ctx, pattern) {
  if (ctx.setLineDash) ctx.setLineDash(pattern);
}

// 手绘粗描边：门口实线绿色，轮廓琥珀色虚线，深处浅灰虚线。
export function strokeTierBox(ctx, box, visibility) {
  const style = tierVisual(visibility);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  dash(ctx, style.dash);
  ctx.strokeStyle = style.glow;
  ctx.lineWidth = style.lineWidth + 2.2;
  roundRect(ctx, box.x - 4, box.y - 4, box.w + 8, box.h + 8, 12);
  ctx.stroke();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.lineWidth;
  roundRect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, 9);
  ctx.stroke();
  dash(ctx, []);
  ctx.restore();
}

export function drawHotspotDebug(ctx, rects, visibilities) {
  rects.forEach((rect, index) => {
    const style = tierVisual(visibilities[index]);
    ctx.save();
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 1.5;
    dash(ctx, style.dash.length ? style.dash : [3, 3]);
    if (ctx.strokeRect) ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    dash(ctx, []);
    ctx.restore();
  });
}
