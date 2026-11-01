import { panel, palette } from './ui';
import { debtTickBeat, deviceUpgradeBeat, watchUnlockBeat } from '../data/round3';

export const durations = {
  open: 1300, bid: 650, hammer: 1200, reveal: 920, sell: 1100, collect: 1000, pnl: 1500, flashlight: 850, magnify: 700, inspect: 360,
  deviceUpgrade: Math.min(300, deviceUpgradeBeat.capMs, deviceUpgradeBeat.durationMs),
  debtTick: debtTickBeat.durationMs,
  watchUnlock: watchUnlockBeat.durationMs,
};
export function effectProgress(scene, kind, now = Date.now()) {
  const effect = scene.effect;
  if (!effect || effect.kind !== kind) return 1;
  return Math.min(1, Math.max(0, (now - effect.at) / (durations[kind] || 1000)));
}
export function easeOut(value) { return 1 - Math.pow(1 - value, 3); }
export function drawCoinBurst(scene, ctx) {
  const effect = scene.effect;
  if (!effect || (effect.kind !== 'sell' && effect.kind !== 'collect')) return;
  const t = effectProgress(scene, effect.kind);
  if (t >= 1) return;
  const start = scene.itemBounds && scene.itemBounds[effect.index];
  for (let i = 0; i < 5; i++) {
    const p = Math.min(1, Math.max(0, (t - i * 0.025) / 0.7));
    const x = (start ? start.x + start.w / 2 : 188) * (1 - p) + 269 * p + Math.sin(p * Math.PI) * (i - 2) * 6;
    const y = (start ? start.y : 300) * (1 - p) + 27 * p - Math.sin(p * Math.PI) * 55;
    panel(ctx, x, y, 5, 8, palette.gold, 3);
  }
  scene.text(ctx, effect.kind === 'sell' ? `+${effect.amount} 金币` : '收入图鉴', 133, 280 - t * 65, 23, palette.gold);
}
