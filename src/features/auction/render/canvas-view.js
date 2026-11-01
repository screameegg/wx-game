import { palette } from './ui';
import { drawPrimaryCta, drawSecondaryCta } from '../fx/round7-chrome';

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
  button(ctx, label, x, y, w, h, action, muted = false, extra) {
    const opt = extra || {};
    const disabled = !!opt.disabled;
    const primary = !muted;
    const role = opt.role || (primary ? `cta:${x}:${y}:${label}` : '');
    // 主按钮按下只变样子，松手才执行。禁用键吃掉点击。
    const confirm = opt.confirm || (primary ? 'release' : 'press');
    const pressed = !!(role && this.pointer && this.pointer.down && !this.pointer.swallowed && this.pointer.role === role);
    const box = { x, y, w, h, label, disabled, pressed, muted };
    if (typeof opt.paint === 'function') opt.paint(ctx, box);
    else if (primary) drawPrimaryCta(ctx, box);
    else drawSecondaryCta(ctx, box);
    this.buttons.push({ x, y, w, h, action, label, role, disabled, confirm });
  }
  link(ctx, label, x, y, w, action) {
    this.text(ctx, label, x, y + 23, 13, palette.muted);
    this.buttons.push({ x, y, w, h: 36, action, label });
  }
  localPoint(x, y) {
    return { x: (x - this.offsetX) / this.scale, y: (y - this.offsetY) / this.scale };
  }
  pick(x, y) {
    const p = this.localPoint(x, y);
    return this.buttons.slice().reverse().find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) || null;
  }
  // 加价键按下只记状态，松手才执行。禁用键吃掉点击，不再往下传。
  pointerDown(x, y) {
    const hit = this.pick(x, y);
    if (!hit) { this.pointer = null; return false; }
    if (hit.disabled) { this.pointer = { down: true, swallowed: true, role: hit.role || '' }; return false; }
    if (hit.confirm === 'release') { this.pointer = { down: true, swallowed: false, role: hit.role || '' }; return false; }
    this.pointer = null;
    hit.action();
    return true;
  }
  pointerUp(x, y) {
    const pointer = this.pointer;
    this.pointer = null;
    if (!pointer || pointer.swallowed || !pointer.role) return false;
    const hit = this.pick(x, y);
    if (!hit || hit.disabled || hit.confirm !== 'release' || hit.role !== pointer.role) return false;
    hit.action();
    return true;
  }
  touch(x, y) { return this.pointerDown(x, y); }
  prepare(ctx) {
    this.buttons = []; ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, this.screen.width, this.screen.height);
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }
}
