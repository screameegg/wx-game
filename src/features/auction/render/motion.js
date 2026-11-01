import { panel, palette } from './ui';

export const durations = { open: 1300, bid: 650, hammer: 1000, reveal: 950, sell: 1100, collect: 1000, settlement: 1100, flashlight: 850, magnify: 700, inspect: 360 };
export function effectProgress(scene, kind, now = Date.now()) {
  const effect = scene.effect;
  if (!effect || effect.kind !== kind) return 1;
  return Math.min(1, Math.max(0, (now - effect.at) / (durations[kind] || 1000)));
}
export function easeOut(value) { return 1 - Math.pow(1 - value, 3); }
export function drawFeedback(scene, ctx) {
  const effect = scene.effect; if (!effect) return;
  const t = effectProgress(scene, effect.kind); if (t >= 1) return;
  if (effect.kind === 'sell' || effect.kind === 'collect') {
    const start = scene.itemBounds && scene.itemBounds[effect.index];
    for (let i = 0; i < 5; i++) {
      const p = Math.min(1, Math.max(0, (t - i * 0.025) / 0.7));
      const x = (start ? start.x + start.w / 2 : 188) * (1 - p) + 269 * p + Math.sin(p * Math.PI) * (i - 2) * 6;
      const y = (start ? start.y : 300) * (1 - p) + 27 * p - Math.sin(p * Math.PI) * 55;
      panel(ctx, x, y, 5, 8, palette.gold, 3);
    }
    scene.text(ctx, effect.kind === 'sell' ? `+${effect.amount} 金币` : '收入图鉴', 133, 280 - t * 65, 23, palette.gold);
  }
  if (effect.kind === 'hammer') {
    if (scene.game.state.phase === 'passed') {
      ctx.fillStyle = palette.gold; ctx.fillRect(24, 171, 327 * easeOut(t), 2); return;
    }
    const drop = Math.sin(Math.min(1, t * 3) * Math.PI) * 12;
    panel(ctx, 98, 202 - drop, 179, 74, '#b98b48', 8);
    scene.text(ctx, '成 交', 144, 240 - drop, 27, '#162327');
    scene.text(ctx, '货柜归你了', 150, 261 - drop, 12, '#243132');
  }
}
