// 第十轮只画铭牌、还款日卡和进阶提示。不读规则，不改金币和债务。
// 参考图没到，或图片没有尺寸时，角落留空手绘框。

import { plateType, reactionSlots, round10Art } from '../data/round10';

function hungImage(scene, key) {
  if (!round10Art.useSheet || !scene || !scene.art || typeof scene.art.get !== 'function') return null;
  const image = scene.art.get(key);
  if (!image || !image.width || !image.height) return null;
  return image;
}

function platePath(ctx, box, radius = 16) {
  const r = Math.min(radius, box.w / 2, box.h / 2);
  const { x, y, w, h } = box;
  ctx.beginPath();
  ctx.moveTo(x + r, y + 1);
  ctx.quadraticCurveTo(x + w * 0.4, y - 1, x + w * 0.7, y + 1);
  ctx.quadraticCurveTo(x + w - 4, y - 1, x + w - r, y + 1);
  ctx.quadraticCurveTo(x + w + 1, y + 4, x + w, y + r);
  ctx.lineTo(x + w - 1, y + h - r);
  ctx.quadraticCurveTo(x + w + 1, y + h, x + w - r, y + h - 1);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x - 1, y + h + 1, x + 1, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x - 1, y + 2, x + r, y + 1);
  ctx.closePath();
}

function handPlate(ctx, box, fill, ink) {
  ctx.save();
  ctx.fillStyle = fill;
  platePath(ctx, box, 18);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.6;
  platePath(ctx, box, 18);
  ctx.stroke();
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.15;
  platePath(ctx, { x: box.x + 2, y: box.y + 2, w: box.w, h: box.h }, 18);
  ctx.stroke();
  ctx.restore();
}

function toneBar(ctx, box, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(box.x + 8, box.y + 18, 4, Math.max(16, box.h - 36));
  ctx.restore();
}

function paintContain(ctx, image, box) {
  const scale = Math.min(box.w / image.width, box.h / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}

export function drawSketchWell(scene, ctx, key, box) {
  const image = hungImage(scene, key);
  ctx.save();
  ctx.strokeStyle = '#C4A484';
  ctx.lineWidth = 1.25;
  if (!image && ctx.setLineDash) ctx.setLineDash([3, 2]);
  platePath(ctx, box, 8);
  ctx.stroke();
  if (ctx.setLineDash) ctx.setLineDash([]);
  ctx.restore();
  if (image) paintContain(ctx, image, { x: box.x + 4, y: box.y + 4, w: box.w - 8, h: box.h - 8 });
}

function ink(scene, ctx, value, spot, color) {
  if (!value) return;
  scene.text(ctx, value, spot.x, spot.y, spot.size, color);
}

export function drawSettlement(scene, ctx, spec) {
  const { layout, model, faces, notice } = spec;
  const type = plateType(layout.plate);
  handPlate(ctx, layout.plate, model.tone.fill, model.tone.ink);
  toneBar(ctx, layout.plate, model.tone.ink);
  drawSketchWell(scene, ctx, 'round10:settlement', layout.sketch);
  ink(scene, ctx, '本场盈亏', type.eyebrow, '#8A8175');
  ink(scene, ctx, model.tone.band, type.band, model.tone.ink);
  ink(scene, ctx, model.tone.verb, type.verb, model.tone.ink);
  ink(scene, ctx, model.amount, type.amount, model.tone.ink);
  ink(scene, ctx, model.summary, type.summary, '#8A8175');
  handPlate(ctx, layout.reaction, '#F5EDE0', '#C4A484');
  scene.text(ctx, '对手反应', layout.reaction.x + 16, layout.reaction.y + 24, 13, '#8A8175');
  const slots = reactionSlots(layout.reaction);
  faces.forEach((face, index) => {
    const x = index ? slots.right.x : slots.left.x;
    scene.text(ctx, `${face.name}：${face.spoken}`, x, slots.quoteY, 12, '#2B2B2B');
    scene.text(ctx, face.label, x, slots.quoteY + 18, 12, '#B85C38');
  });
  if (notice) scene.text(ctx, notice, layout.reaction.x + 16, slots.noticeY, 12, '#B85C38');
}

export function drawRepayCard(scene, ctx, box, view, sketch) {
  handPlate(ctx, box, view.fill, view.ink);
  toneBar(ctx, box, view.bar);
  if (sketch) drawSketchWell(scene, ctx, 'round10:repayCard', sketch);
  const x = box.x + 18;
  scene.text(ctx, view.title, x, box.y + 24, 13, '#8A8175');
  scene.text(ctx, view.label, x, box.y + 46, 13, view.ink);
  scene.text(ctx, view.chip, x + 88, box.y + 46, 13, view.ink);
  scene.text(ctx, view.amount, x, box.y + 86, 34, view.ink);
  scene.text(ctx, view.rounds, x, box.y + 114, 18, '#2B2B2B');
  if (view.aside) scene.text(ctx, view.aside, x + 132, box.y + 114, 12, '#8A8175');
  scene.text(ctx, view.detail, x, box.y + box.h - 16, 12, view.ink);
}

function roundMeter(ctx, box) {
  const r = box.h / 2;
  ctx.beginPath();
  ctx.moveTo(box.x + r, box.y);
  ctx.lineTo(box.x + box.w - r, box.y);
  ctx.quadraticCurveTo(box.x + box.w, box.y, box.x + box.w, box.y + r);
  ctx.lineTo(box.x + box.w, box.y + box.h - r);
  ctx.quadraticCurveTo(box.x + box.w, box.y + box.h, box.x + box.w - r, box.y + box.h);
  ctx.lineTo(box.x + r, box.y + box.h);
  ctx.quadraticCurveTo(box.x, box.y + box.h, box.x, box.y + box.h - r);
  ctx.lineTo(box.x, box.y + r);
  ctx.quadraticCurveTo(box.x, box.y, box.x + r, box.y);
  ctx.closePath();
}

export function drawAdvancePlate(scene, ctx, spec) {
  const { plate, inner, model, status, count, tip, pose } = spec;
  const celebrate = pose.phase === 'frame' && model.unlocked;
  handPlate(ctx, plate, celebrate ? '#F8E7C8' : '#F5EDE0', '#C4A484');
  if (!celebrate) drawSketchWell(scene, ctx, 'round10:advanceTip', inner.sketch);
  scene.text(ctx, model.unlocked ? '进阶档' : '进阶进度', inner.title.x, inner.title.y, inner.title.size, '#2B2B2B');
  scene.text(ctx, count, inner.count.x, inner.count.y, inner.count.size, '#2B2B2B');
  drawMeter(ctx, inner.bar, model.ratio, model.tone === 'empty');
  scene.text(ctx, celebrate ? '进阶成功' : status, inner.status.x, inner.status.y, inner.status.size, celebrate ? '#B85C38' : '#2B2B2B');
  if (tip && (model.unlocked || model.ready)) scene.text(ctx, tip, inner.tip.x, inner.tip.y, inner.tip.size, '#8A4B16');
  if (spec.notice && inner.button.y - inner.note.y >= 18) {
    scene.paragraph(ctx, spec.notice, inner.note.x, inner.note.y, inner.note.w, inner.note.size, 1);
  }
  if (celebrate) drawSeal(ctx, inner.seal);
}

function drawMeter(ctx, box, ratio, empty) {
  ctx.save();
  ctx.fillStyle = '#E7D7C3';
  roundMeter(ctx, box);
  ctx.fill();
  if (empty || !(ratio > 0)) {
    ctx.strokeStyle = '#C4A484';
    ctx.lineWidth = 1.25;
    if (ctx.setLineDash) ctx.setLineDash([3, 3]);
    roundMeter(ctx, box);
    ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);
  } else {
    ctx.fillStyle = '#E8A54B';
    roundMeter(ctx, { ...box, w: Math.max(box.h, box.w * Math.min(1, ratio)) });
    ctx.fill();
  }
  ctx.restore();
}

function drawSeal(ctx, box) {
  const cx = box.x + box.w / 2;
  const cy = box.y + 24;
  ctx.save();
  ctx.strokeStyle = '#B85C38';
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
