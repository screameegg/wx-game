import { catalogSprite, cargoSprite } from '../render/sprites';
import {
  clampConfirm, clampNext, clampScale, rareSparkleBeat, rarityTier, revealQueueBeat, settleBeat,
} from '../data/round6';

// 队列、翻牌和稀有闪光都只看已经公开的状态。不调用结算，不改售价。

export function pendingIndices(items) {
  const list = [];
  (items || []).forEach((item, index) => {
    if (item && item.status !== 'sold' && item.status !== 'collected') list.push(index);
  });
  return list;
}

export function currentIndex(state) {
  const pending = pendingIndices(state && state.items);
  if (!pending.length) return -1;
  if (pending.includes(state.selected)) return state.selected;
  return pending[0];
}

export function skipRevealSequence(reel) {
  const book = reel || { skip: false, sparked: {} };
  book.skip = true;
  return book;
}

export function syncRevealReel(scene, now = Date.now()) {
  if (!scene.revealReel) scene.revealReel = { skip: false, sparked: {}, armed: false, enterAt: 0, stamp: 0 };
  const reel = scene.revealReel;
  const phase = scene.game && scene.game.state && scene.game.state.phase;
  if (phase !== 'reveal') {
    if (reel.armed) {
      reel.armed = false;
      reel.sparked = {};
      reel.stamp = 0;
    }
    return reel;
  }
  if (!reel.armed) {
    reel.armed = true;
    reel.enterAt = now;
  }
  const effect = scene.effect;
  if (effect && (effect.kind === 'sell' || effect.kind === 'collect') && effect.at !== reel.stamp) {
    reel.stamp = effect.at;
    reel.enterAt = effect.at + (reel.skip ? 0 : clampConfirm(settleBeat.confirmMs));
  }
  return reel;
}

export function enterProgress(reel, now) {
  if (!reel || reel.skip) return 1;
  if (!Number.isFinite(reel.enterAt) || reel.enterAt <= 0) return 1;
  if (now < reel.enterAt) return 0;
  const dur = clampNext(settleBeat.nextMs);
  return Math.min(1, (now - reel.enterAt) / dur);
}

export function flipProgress(reel, effect, now) {
  if (reel && reel.skip) return 1;
  if (!effect || effect.kind !== 'reveal' || !Number.isFinite(effect.at)) return 1;
  return Math.min(1, Math.max(0, (now - effect.at) / revealQueueBeat.flipMs));
}

export function flipFrame(t) {
  const u = t >= 1 ? 1 : Math.max(0, Number(t) || 0);
  const scale = clampScale(revealQueueBeat.scale);
  const minScale = revealQueueBeat.minScale;
  if (u >= 1) return { phase: 'front', showFront: true, scale, scaleX: 1, angle: 0, caption: '', lines: false, ready: true };
  if (u < 0.38) {
    const p = u / 0.38;
    return { phase: 'back', showFront: false, scale: minScale + (scale - minScale) * p, scaleX: 1, angle: -0.08 * (1 - p), caption: '点击放大', lines: false, ready: false };
  }
  if (u < 0.72) {
    const p = (u - 0.38) / 0.34;
    const showFront = p >= 0.5;
    const scaleX = Math.max(0.08, showFront ? Math.sin((p - 0.5) * Math.PI) : Math.cos(p * Math.PI));
    return { phase: showFront ? 'front' : 'back', showFront, scale, scaleX, angle: (0.5 - p) * 0.55, caption: '翻牌', lines: true, ready: false };
  }
  const p = (u - 0.72) / 0.28;
  return { phase: 'front', showFront: true, scale, scaleX: Math.max(0.08, Math.sin((p * Math.PI) / 2)), angle: 0, caption: '', lines: false, ready: p >= 0.82 };
}

export function slotPose(order, current, count, enter) {
  const spec = revealQueueBeat;
  const u = Math.min(1, Math.max(0, Number(enter) || 0));
  if (order === current) {
    const target = clampScale(spec.scale);
    return { x: 188, y: 248, scale: spec.recedeScale + (target - spec.recedeScale) * u, alpha: 0.7 + 0.3 * u, current: true };
  }
  const delta = order - current;
  const span = Math.max(1, count - 1);
  const step = Math.min(150, 46 * span) / span;
  const x = Math.min(340, Math.max(36, 188 + delta * step));
  return { x, y: 156, scale: spec.recedeScale, alpha: spec.recedeAlpha, current: false };
}

export function heroBox(spot) {
  const w = 148 * spot.scale;
  const h = 132 * spot.scale;
  return { x: spot.x - w / 2, y: spot.y - h / 2, w, h };
}

export function settleZones(width, bottom) {
  const gap = settleBeat.gap;
  const h = Math.max(settleBeat.minHit, settleBeat.height);
  const y = bottom - h - 22;
  const w = Math.max(settleBeat.minHit, Math.floor((width - gap - 32) / 2));
  const x0 = Math.floor((width - (w * 2 + gap)) / 2);
  const sell = { x: x0, y, w, h, action: 'sell', label: settleBeat.sell.label };
  const collect = { x: x0 + w + gap, y, w, h, action: 'collect', label: settleBeat.collect.label };
  return { sell, collect, gap };
}

export function zoneAt(zones, x, y) {
  return [zones.sell, zones.collect].find((box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) || null;
}

export function settleLook(kind, { pressed = false, disabled = false } = {}) {
  const tone = kind === 'collect' ? settleBeat.collect : settleBeat.sell;
  if (disabled) {
    return { ...settleBeat.disabled, label: tone.label, icon: tone.icon, scale: 1, offsetY: 0, state: 'disabled' };
  }
  if (pressed) {
    return { ...tone, fill: tone.pressed, scale: settleBeat.pressScale, offsetY: settleBeat.pressOffsetY, state: 'pressed' };
  }
  return { ...tone, scale: 1, offsetY: 0, state: 'idle' };
}

export function rareFlash(elapsedMs, tier) {
  const off = { on: false, alpha: 0, frame: 0 };
  if (tier !== 'rare' || rareSparkleBeat.loop || rareSparkleBeat.frames !== 1) return off;
  const dur = Math.min(rareSparkleBeat.durationMs, rareSparkleBeat.capMs);
  if (!(elapsedMs >= 0) || elapsedMs >= dur) return off;
  return { on: true, alpha: Math.sin((elapsedMs / dur) * Math.PI), frame: 0 };
}

export function sparkElapsed(reel, index, now) {
  if (!reel.sparked) reel.sparked = {};
  if (reel.sparked[index] == null) reel.sparked[index] = now;
  return now - reel.sparked[index];
}

export function revealNeedsFrame(scene, now = Date.now()) {
  if (!scene || !scene.game || scene.game.state.phase !== 'reveal') return false;
  const reel = scene.revealReel;
  if (!reel) return false;
  if (!reel.skip && enterProgress(reel, now) < 1) return true;
  const effect = scene.effect;
  if (effect && effect.kind === 'reveal' && !reel.skip && now - effect.at < revealQueueBeat.flipMs) return true;
  if (effect && (effect.kind === 'sell' || effect.kind === 'collect') && now - effect.at < clampConfirm(settleBeat.confirmMs)) return true;
  const items = scene.game.state.items || [];
  const dur = Math.min(rareSparkleBeat.durationMs, rareSparkleBeat.capMs);
  return items.some((item, index) => rarityTier(item) === 'rare' && reel.sparked && reel.sparked[index] != null && now - reel.sparked[index] < dur);
}

export function paintHero(scene, ctx, index, item, spot, pose) {
  const box = heroBox(spot);
  ctx.save();
  ctx.globalAlpha = spot.alpha == null ? 1 : spot.alpha;
  ctx.translate(spot.x, spot.y);
  ctx.rotate((pose && pose.angle) || 0);
  ctx.scale((pose && pose.scaleX) || 1, 1);
  ctx.translate(-spot.x, -spot.y);
  if (!pose || !pose.showFront) paintCard(ctx, box);
  else paintFront(scene, ctx, index, item, box);
  ctx.restore();
  if (pose && pose.lines) paintLines(ctx, spot.x, spot.y);
  return box;
}

export function drawSettleButton(ctx, box) {
  const look = settleLook(box.kind, box);
  const { x, y, w, h } = box;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2 + look.offsetY);
  ctx.scale(look.scale, look.scale);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.fillStyle = look.lip;
  roundPath(ctx, x, y + (look.state === 'pressed' ? 2 : 5), w, h, 16);
  ctx.fill();
  ctx.fillStyle = look.fill;
  roundPath(ctx, x, y, w, h, 16);
  ctx.fill();
  if (look.line) {
    ctx.strokeStyle = look.line;
    ctx.lineWidth = 3;
    roundPath(ctx, x + 2, y + 2, w - 4, h - 4, 14);
    ctx.stroke();
  }
  if (look.icon === 'coin') drawCoin(ctx, x + 30, y + h / 2, look.state === 'disabled');
  else drawBook(ctx, x + 30, y + h / 2, look.state === 'disabled');
  ctx.fillStyle = look.ink;
  ctx.font = '700 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(look.label, x + w / 2 + 18, y + h / 2 + 8);
  ctx.restore();
}

export function drawRareStar(ctx, x, y, alpha) {
  if (!(alpha > 0)) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = '#f2c14a';
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const radius = i % 2 ? 5 : 14;
    const angle = -Math.PI / 2 + (i * Math.PI) / 4;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paintCard(ctx, box) {
  ctx.fillStyle = '#f4ecdc';
  roundPath(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c3b396';
  ctx.lineWidth = 3;
  ctx.stroke();
  const pad = Math.min(box.w, box.h) * 0.2;
  ctx.fillStyle = '#2c2926';
  roundPath(ctx, box.x + pad, box.y + pad * 0.8, box.w - pad * 2, box.h - pad * 1.8, 8);
  ctx.fill();
}

function paintFront(scene, ctx, index, item, box) {
  if (item && item.isBonus) {
    catalogSprite(scene, ctx, item.result[0], box);
    return;
  }
  if (cargoSprite(scene, ctx, index, box, true)) return;
  ctx.fillStyle = '#5e6b52';
  roundPath(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#3e3428';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#2b241c';
  ctx.beginPath();
  ctx.arc(box.x + box.w * 0.48, box.y + box.h * 0.58, Math.min(box.w, box.h) * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e6c27a';
  ctx.beginPath();
  ctx.arc(box.x + box.w * 0.48, box.y + box.h * 0.58, Math.min(box.w, box.h) * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function paintLines(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = '#8a7b68';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  [[-78, -20, -40], [-84, 8, -18], [78, -16, 36], [84, 12, 16]].forEach(([dx, dy, lean]) => {
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(x + dx + lean, y + dy - 16);
    ctx.stroke();
  });
  ctx.restore();
}

function drawCoin(ctx, x, y, muted) {
  ctx.fillStyle = muted ? '#b7b0a4' : '#f0c14a';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = muted ? '#8d877c' : '#a56a28';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeRect(x - 4, y - 4, 8, 8);
}

function drawBook(ctx, x, y, muted) {
  ctx.fillStyle = muted ? '#b7b0a4' : '#3d6b45';
  roundPath(ctx, x - 12, y - 16, 24, 32, 3);
  ctx.fill();
  ctx.fillStyle = muted ? '#e6e0d6' : '#f4ecdc';
  ctx.fillRect(x - 6, y - 10, 12, 16);
  ctx.strokeStyle = muted ? '#8d877c' : '#d7e6c8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x, y + 2);
  ctx.moveTo(x - 3, y - 1);
  ctx.lineTo(x, y + 2);
  ctx.lineTo(x + 3, y - 1);
  ctx.stroke();
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
