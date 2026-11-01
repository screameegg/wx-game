import { panel, palette } from './ui';

// 只处理 Canvas 基础绘制、屏幕适配和触摸，不了解拍卖规则。
export default class CanvasView {
  constructor(screen) {
    this.screen = screen; this.buttons = []; this.offsetY = screen.top || 0;
    const usable = screen.height - this.offsetY - (screen.bottom || 0);
    this.scale = Math.min(screen.width / 375, usable / 640);
    this.offsetX = (screen.width - 375 * this.scale) / 2; this.height = usable / this.scale;
  }
  text(ctx, value, x, y, size = 16, color = palette.text) {
    ctx.fillStyle = color; ctx.font = `600 ${size}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(value, x, y);
  }
  paragraph(ctx, value, x, y, width, size = 15, maxLines = 4) {
    ctx.font = `500 ${size}px sans-serif`; let line = ''; let row = 0;
    for (const ch of value || '') {
      if ('，。！？；：、）》'.includes(ch) && line) { line += ch; continue; }
      if (ch === '\n' || ctx.measureText(line + ch).width > width) {
        if (row === maxLines - 1) { this.text(ctx, line.slice(0, -1) + '…', x, y + row * 22, size); return; }
        this.text(ctx, line, x, y + row++ * 22, size); line = '';
      }
      if (ch !== '\n') line += ch;
    }
    if (line) this.text(ctx, line, x, y + row * 22, size);
  }
  button(ctx, label, x, y, w, h, action, muted = false) {
    panel(ctx, x, y, w, h, muted ? '#54736b' : palette.gold, 12);
    ctx.textAlign = 'center'; ctx.font = `600 ${h < 40 ? 13 : 16}px sans-serif`; ctx.fillStyle = '#fffaf0';
    ctx.fillText(label, x + w / 2, y + h / 2 + 6);
    this.buttons.push({ x, y, w, h, action, label });
  }
  link(ctx, label, x, y, w, action) {
    this.text(ctx, label, x, y + 23, 13, palette.muted);
    this.buttons.push({ x, y, w, h: 36, action, label });
  }
  touch(x, y) {
    x = (x - this.offsetX) / this.scale; y = (y - this.offsetY) / this.scale;
    const hit = this.buttons.slice().reverse().find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (hit) hit.action();
  }
  prepare(ctx) {
    this.buttons = []; ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, this.screen.width, this.screen.height);
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }
}
