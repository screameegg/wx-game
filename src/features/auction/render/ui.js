export const palette = { bg: '#f4ead7', panel: '#fff9ed', line: '#d9c9ae', gold: '#bd6843', text: '#38352f', muted: '#777366', green: '#557d5d', red: '#bd5848' };
export function progress(ctx, x, y, width, ratio, color = palette.gold) {
  panel(ctx, x, y, width, 5, '#e2d7c3', 3);
  if (ratio > 0) panel(ctx, x, y, Math.max(5, width * Math.min(1, ratio)), 5, color, 3);
}
export function panel(ctx, x, y, w, h, color = palette.panel, radius = 12) {
  const r = Math.min(radius, h / 2, w / 2);
  ctx.save(); ctx.shadowColor = 'rgba(75, 57, 37, 0.16)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#bda98a'; ctx.lineWidth = 1.25; ctx.stroke(); ctx.restore();
}
export function divider(ctx, x, y, width) { ctx.fillStyle = palette.line; ctx.fillRect(x, y, width, 1); }
export function cover(ctx, image, x, y, width, height) {
  if (!image || !(image.width > 0) || !(image.height > 0)) return;
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale; const sh = height / scale;
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, width, height);
}
