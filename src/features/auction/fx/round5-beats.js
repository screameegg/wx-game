import { panel } from '../render/ui';
import {
  clampHold, clampPause, expressionBeat, leaderHighlightBeat, preHammerBeat, raiseButtonBeat,
} from '../data/round5';
import { auctionExpression, drawExpression } from '../views/people/expressions';

// 这些函数只看已经公开的领先者和是否还在场。不读上限，不改价格。

export function raiseLook({ disabled = false, pressed = false } = {}) {
  const spec = raiseButtonBeat;
  if (disabled) {
    return { state: 'disabled', scale: 1, offsetY: 0, fill: spec.fills.disabled, ink: spec.ink.disabled, lip: spec.lip.disabled };
  }
  if (pressed) {
    return { state: 'pressed', scale: spec.pressScale, offsetY: spec.pressOffsetY, fill: spec.fills.pressed, ink: spec.ink.pressed, lip: spec.lip.pressed };
  }
  return { state: 'default', scale: 1, offsetY: 0, fill: spec.fills.default, ink: spec.ink.default, lip: spec.lip.default };
}

export function drawRaiseButton(ctx, box) {
  const look = raiseLook(box);
  const { x, y, w, h, label } = box;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2 + look.offsetY);
  ctx.scale(look.scale, look.scale);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.fillStyle = look.lip;
  ctx.fillRect(x, y + (look.state === 'pressed' ? 2 : 5), w, h);
  panel(ctx, x, y, w, h, look.fill, 12);
  ctx.textAlign = 'center';
  ctx.font = '600 16px sans-serif';
  ctx.fillStyle = look.ink;
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
  ctx.restore();
}

export function isLeader(leader, name) {
  return !!name && name !== '拍卖员' && leader === name;
}

export function drawLeadGlow(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = leaderHighlightBeat.glow;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, Math.max(w, h) * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawLeadBadge(ctx, x, y) {
  // 皇冠规格图默认不画。showCrown 仍为 false 时这里只有软标签。
  panel(ctx, x, y, 44, 18, '#fff6df', 8);
  ctx.save();
  ctx.fillStyle = leaderHighlightBeat.ink;
  ctx.font = '600 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(leaderHighlightBeat.label, x + 22, y + 13);
  ctx.restore();
}

export function publicSnap(state) {
  return {
    leader: state.leader,
    rivals: (state.rivals || []).map((rival) => ({
      name: rival && rival.name,
      active: !!(rival && rival.active !== false),
    })),
  };
}

// 同一帧里若又有人放弃，先播摆手。其余不排队。
export function auctionEvents(before, after) {
  if (!before || !after) return [];
  const rivals = after.rivals || [];
  const prev = before.rivals || [];
  const found = [];
  rivals.forEach((rival, index) => {
    const was = prev[index];
    if (was && was.active && rival && !rival.active) found.push({ type: 'abandon', index, rank: 0 });
  });
  if (before.leader !== after.leader) {
    const raised = rivals.findIndex((rival) => rival && rival.name === after.leader);
    if (raised >= 0) found.push({ type: 'raise', index: raised, rank: 1 });
    const lost = (prev || []).findIndex((rival) => rival && rival.name === before.leader);
    if (lost >= 0) found.push({ type: 'overtaken', index: lost, rank: 2 });
  }
  found.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return found.slice(0, expressionBeat.maxOnScreen);
}

export function waveFrame(elapsed, holdMs, frames = expressionBeat.waveFrames) {
  const count = Math.max(1, frames);
  const span = Math.max(1, holdMs) / count;
  if (!(elapsed >= 0)) return 0;
  return Math.min(count - 1, Math.floor(elapsed / span));
}

export function liveExpression(reel, now) {
  const beat = reel && reel.current;
  if (!beat || !Number.isFinite(now) || !(now >= beat.at) || now - beat.at >= beat.holdMs) return null;
  const elapsed = now - beat.at;
  const frame = beat.type === 'abandon' ? waveFrame(elapsed, beat.holdMs) : 0;
  const fade = elapsed > beat.holdMs * 0.82 ? Math.max(0, 1 - (elapsed - beat.holdMs * 0.82) / (beat.holdMs * 0.18)) : 1;
  return { ...beat, elapsed, frame, fade, visible: true };
}

export function offerExpression(reel, event, now, holdMs = expressionBeat.holdMs) {
  if (!reel || !event) return null;
  const current = liveExpression(reel, now);
  if (current && current.type === 'abandon') return current;
  if (current && event.type !== 'abandon') return current;
  reel.current = {
    type: event.type,
    index: event.index,
    expression: event.expression || null,
    at: now,
    holdMs: clampHold(holdMs),
  };
  return liveExpression(reel, now);
}

function remember(scene, state, event, now) {
  if (!scene.expressionReel) scene.expressionReel = { current: null };
  const rival = state.rivals && state.rivals[event.index];
  const mood = rival ? auctionExpression(scene.game, rival) : null;
  offerExpression(scene.expressionReel, {
    type: event.type,
    index: event.index,
    expression: mood ? { id: mood.id, label: mood.label, frame: mood.frame } : null,
  }, now);
}

// 每帧对比上一帧的公开快照。快照不进存档，也不写回对局。
export function syncAuctionBeat(scene, now = Date.now()) {
  if (!scene.expressionReel) scene.expressionReel = { current: null };
  const state = scene.game && scene.game.state;
  if (!state || !Array.isArray(state.rivals)) {
    scene._bidSnap = null;
    return null;
  }
  const snap = publicSnap(state);
  const prev = scene._bidSnap;
  if (state.phase !== 'auction') {
    scene._bidSnap = null;
    if (prev) {
      const [event] = auctionEvents(prev, snap);
      if (event) remember(scene, state, event, now);
    }
    return liveExpression(scene.expressionReel, now);
  }
  scene._bidSnap = snap;
  if (prev) {
    const [event] = auctionEvents(prev, snap);
    if (event) remember(scene, state, event, now);
  }
  return liveExpression(scene.expressionReel, now);
}

const captions = { raise: '跟了一手', overtaken: '被超了', abandon: '放弃' };

export function drawAuctionBeat(scene, ctx, beat, x, y, w, h) {
  if (!beat) return;
  ctx.save();
  ctx.globalAlpha = beat.fade == null ? 1 : beat.fade;
  if (beat.type === 'abandon') drawWave(scene, ctx, beat, x, y, w, h);
  else if (beat.expression) drawExpression(scene, ctx, beat.index, beat.expression, x, y, w, h);
  ctx.fillStyle = '#fff6df';
  ctx.fillRect(x + 8, y + 8, 72, 18);
  ctx.fillStyle = '#6a3b2c';
  ctx.font = '600 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(captions[beat.type] || '', x + 44, y + 21);
  ctx.restore();
}

function drawWave(scene, ctx, beat, x, y, w, h) {
  const image = scene.art && scene.art.get && scene.art.get('passWave');
  const crop = expressionBeat.waveCrops[beat.frame] || expressionBeat.waveCrops[0];
  if (image && crop) {
    ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, x, y, w, h);
    return;
  }
  ctx.fillStyle = '#efe2cc';
  ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
  ctx.strokeStyle = '#493b31';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
  const cx = x + w / 2;
  const cy = y + h * 0.42;
  ctx.fillStyle = '#38352f';
  ctx.beginPath();
  ctx.arc(cx - 16, cy - 8, 3, 0, Math.PI * 2);
  ctx.arc(cx + 16, cy - 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (beat.frame <= 0) {
    ctx.moveTo(cx - 28, cy + 36);
    ctx.lineTo(cx - 8, cy + 8);
  } else if (beat.frame === 1) {
    ctx.moveTo(cx + 10, cy + 28);
    ctx.lineTo(cx + 34, cy - 6);
  } else {
    ctx.moveTo(cx - 36, cy + 10);
    ctx.lineTo(cx - 20, cy - 28);
    ctx.moveTo(cx + 20, cy + 8);
    ctx.lineTo(cx + 38, cy - 30);
  }
  ctx.stroke();
}

export function preHammerPose(now, effect) {
  const pause = clampPause(effect && effect.pauseMs);
  const at = effect && Number.isFinite(effect.at) ? effect.at : null;
  if (at === null) return { holding: false, scale: 1, vignette: 0, lift: 0, u: 1 };
  const start = at - pause;
  const holding = now >= start && now < at;
  const u = holding ? (now - start) / pause : 1;
  return {
    holding,
    u,
    scale: holding ? preHammerBeat.scale : 1,
    vignette: holding ? preHammerBeat.vignette : 0,
    lift: holding ? 1 - u * 0.18 : 0,
  };
}

// 停在揭晓之前。只画公开的当前价和举起的槌，不读货物真值。
export function drawPreHammerHold(scene, ctx, now = Date.now()) {
  const pose = preHammerPose(now, scene.effect);
  const price = Number.isFinite(scene.effect && scene.effect.price) ? scene.effect.price : scene.game.state.price;
  const beat = liveExpression(scene.expressionReel, now);
  ctx.save();
  ctx.translate(188, 340);
  ctx.scale(pose.scale, pose.scale);
  ctx.translate(-188, -340);
  const rivals = scene.game.state.rivals || [];
  rivals.forEach((rival, index) => {
    const x = index ? 196 : 20;
    panel(ctx, x, 150, 158, 200, '#fff9ed', 16);
    if (beat && beat.index === index) drawAuctionBeat(scene, ctx, beat, x, 156, 150, 140);
    scene.text(ctx, rival.name || '', x + 48, 336, 16);
  });
  drawRaisedGavel(ctx, 188, 250 - pose.lift * 28);
  panel(ctx, 78, 430, 220, 72, '#fff9ed', 14);
  scene.text(ctx, '当前价', 98, 456, 13, '#777366');
  scene.text(ctx, `${price} 金币`, 98, 486, 28, '#bd6843');
  scene.text(ctx, '槌还举着', 146, 524, 13, '#777366');
  ctx.restore();
  const shade = `rgba(22, 18, 14, ${pose.vignette})`;
  ctx.fillStyle = shade;
  ctx.fillRect(0, 64, 375, 48);
  ctx.fillRect(0, scene.height - 72, 375, 72);
  ctx.fillRect(0, 64, 18, scene.height);
  ctx.fillRect(357, 64, 18, scene.height);
}

function drawRaisedGavel(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.9);
  ctx.fillStyle = '#e2c291';
  ctx.fillRect(-4, 0, 8, 54);
  ctx.fillStyle = '#8d5a34';
  ctx.fillRect(-22, -8, 44, 14);
  ctx.restore();
}
