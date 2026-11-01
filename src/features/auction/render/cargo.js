import { cover, panel, palette } from './ui';
import { cargoSprite, dedicatedPiece } from './sprites';
import { effectProgress, easeOut } from './motion';
import { tierVisual } from '../data/observe-tiers';
import { hotspotOrder, resolveHotspots } from './hotspots';
import { drawHotspotDebug, strokeTierBox } from './tier-stroke';

export const cargoLayout = [
  { x: 34, y: 264, w: 109, h: 99 }, { x: 133, y: 281, w: 119, h: 78 },
  { x: 252, y: 255, w: 86, h: 103 }, { x: 148, y: 207, w: 100, h: 87 }, { x: 61, y: 202, w: 70, h: 74 },
];

export function stage(scene, ctx) {
  cover(ctx, scene.art.get('harbor'), 0, 0, 375, 640);
  ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, 375, 165); ctx.fillRect(0, 397, 375, scene.height - 397);
}

function item(scene, ctx, index) {
  const s = scene.game.state; const entry = s.items[index]; const box = cargoLayout[index];
  if (entry.status === 'sold' || entry.status === 'collected') return;
  const visual = tierVisual(entry.visibility);
  ctx.save();
  if (entry.categoryKnown) drawLight(scene, ctx, index, box);
  ctx.save();
  ctx.globalAlpha = visual.spriteAlpha;
  let drew = false;
  if ((entry.visibility || 0) <= 0) drew = !!cargoSprite(scene, ctx, index, box);
  else {
    const ownArt = !!dedicatedPiece(scene, index);
    if (entry.visibility === 1 && !entry.categoryKnown && !ownArt) ctx.filter = 'brightness(0.48)';
    drew = !!cargoSprite(scene, ctx, index, box); ctx.filter = 'none';
  }
  ctx.restore();
  if ((entry.visibility || 0) <= 0) {
    if (!drew) { ctx.fillStyle = '#101b1bc9'; ctx.fillRect(box.x + 10, box.y + 15, box.w - 20, box.h - 20); }
    else if (visual.wash) { ctx.fillStyle = `rgba(8, 14, 16, ${visual.wash})`; ctx.fillRect(box.x, box.y, box.w, box.h); }
  }

  // 帆布盖布大件：叠加帆布纹理色块（S02，盖布形态的第3件物品）
  if (entry.coverCloth && entry.status === 'hidden') {
    ctx.fillStyle = '#4a5e50c8'; ctx.fillRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
    // 帆布纹理线条
    ctx.strokeStyle = '#5a7060'; ctx.lineWidth = 1.5;
    for (let dy = 0; dy < box.h + 8; dy += 10) {
      ctx.beginPath(); ctx.moveTo(box.x - 4, box.y - 4 + dy); ctx.lineTo(box.x + box.w + 4, box.y - 4 + dy); ctx.stroke();
    }
    ctx.fillStyle = '#6a8070'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('帆布', box.x + box.w / 2, box.y + box.h / 2 + 4); ctx.textAlign = 'left';
  }

  ctx.restore();
  if (entry.status === 'hidden') strokeTierBox(ctx, box, entry.visibility);

  if (entry.categoryKnown && entry.visibility === 1) {
    const lotItem = scene.game.lot.items[index];
    const label = lotItem.category || '类别已辨认'; const badgeWidth = Math.min(box.w, Math.max(48, label.length * 10 + 12));
    panel(ctx, box.x + (box.w - badgeWidth) / 2, box.y - 14, badgeWidth, 18, '#fff3d4', 8);
    ctx.fillStyle = '#71543b'; ctx.font = '600 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, box.x + box.w / 2, box.y - 2); ctx.textAlign = 'left';
  }
  if (entry.conditionKnown) {
    drawLens(ctx, box.x + box.w - 8, box.y + 8, 10);
    drawMagnifyPulse(scene, ctx, index, box);
  }
  // 编号徽章
  panel(ctx, box.x + box.w / 2 - 10, box.y + box.h - 10, 22, 22, s.selected === index ? palette.gold : '#182b2ed9', 11);
  scene.text(ctx, `${index + 1}`, box.x + box.w / 2 - 3, box.y + box.h + 6, 12, s.selected === index ? '#16272b' : '#e6dac2');
}

function drawLight(scene, ctx, index, box) {
  const active = scene.effect && scene.effect.kind === 'flashlight' && scene.effect.index === index;
  const progress = active ? effectProgress(scene, 'flashlight') : 1;
  const alpha = active ? 0.42 * (1 - progress * 0.55) : 0.20;
  const cx = box.x + box.w / 2; const cy = box.y + box.h / 2; const radius = Math.max(box.w, box.h) * 0.82;
  if (ctx.createRadialGradient) {
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    glow.addColorStop(0, `rgba(255, 224, 154, ${alpha})`); glow.addColorStop(1, 'rgba(255, 224, 154, 0)'); ctx.fillStyle = glow;
  } else ctx.fillStyle = `rgba(255, 224, 154, ${alpha * 0.32})`;
  ctx.beginPath(); ctx.ellipse(cx, cy, radius, radius * 0.68, 0, 0, Math.PI * 2); ctx.fill();
  if (active) {
    ctx.save(); ctx.globalAlpha = 1 - progress; ctx.strokeStyle = '#fff0bd'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, box.w * (0.55 + progress * 0.42), box.h * (0.55 + progress * 0.42), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

function drawMagnifyPulse(scene, ctx, index, box) {
  if (!scene.effect || scene.effect.kind !== 'magnify' || scene.effect.index !== index) return;
  const t = effectProgress(scene, 'magnify'); const cx = box.x + box.w / 2; const cy = box.y + box.h / 2;
  ctx.save(); ctx.globalAlpha = 1 - t; ctx.strokeStyle = '#fff0bd'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy, box.w * (0.48 + t * 0.5), box.h * (0.48 + t * 0.5), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

function drawLens(ctx, x, y, radius) {
  ctx.save(); ctx.fillStyle = 'rgba(255, 247, 218, 0.84)'; ctx.strokeStyle = '#bd6843'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + radius * 0.7, y + radius * 0.7); ctx.lineTo(x + radius * 1.65, y + radius * 1.65); ctx.stroke();
  ctx.restore();
}

function doors(scene, ctx) {
  if (scene.game.state.phase !== 'observe') return;
  const t = easeOut(effectProgress(scene, 'open'));
  const opening = scene.game.state.opening;
  // 各形态开门程度：门缝极小缝，半开一半，全开/帆布盖布完全打开
  const rest = opening === '门缝' ? 23 : opening === '半开' ? 9 : 0;
  const width = 160 * (1 - t) + rest;
  if (width < 1) return;
  [26, 349 - width].forEach((x) => {
    ctx.fillStyle = '#28464b'; ctx.fillRect(x, 174, width, 190);
    for (let dx = 8; dx < width - 4; dx += 15) { ctx.fillStyle = '#426068'; ctx.fillRect(x + dx, 180, 3, 178); }
  });
  if (t < 0.85) scene.buttons = scene.buttons.filter((button) => button.y < 165);
}

export function drawCargo(scene, ctx) {
  const items = scene.game.state.items || [];
  scene.itemBounds = cargoLayout;
  [4, 3, 0, 2, 1].forEach((index) => { if (items[index]) item(scene, ctx, index); });
  const vis = cargoLayout.map((_, index) => (items[index] ? items[index].visibility : 0));
  const rects = resolveHotspots(cargoLayout, vis);
  scene.itemHotspots = rects;
  if (scene.hotspotDebug) drawHotspotDebug(ctx, rects, vis);
  hotspotOrder(vis).forEach((index) => {
    const entry = items[index];
    if (!entry || entry.status === 'sold' || entry.status === 'collected') return;
    const box = rects[index];
    scene.buttons.push({
      x: box.x, y: box.y, w: box.w, h: box.h, label: `货物${index + 1}`,
      action: () => scene.game.state.phase === 'reveal' ? scene.game.reveal(index) : scene.game.inspect(index, scene.reviewing),
    });
  });
  doors(scene, ctx);
  if (scene.game.state.phase === 'observe' && scene.game.state.selected >= 0) drawInspection(scene, ctx, scene.game.state.selected);
}

// 观察时把所选货物单独提到前景放大；这里只复用玩家当前可见的外观，绝不读取真实结果。
function drawInspection(scene, ctx, index) {
  const entry = scene.game.state.items[index]; const lotItem = scene.game.lot.items[index];
  if (!entry || !lotItem || entry.status !== 'hidden') return;
  const x = 25; const y = 183; const w = 325; const h = 204;
  ctx.save(); ctx.fillStyle = 'rgba(18, 30, 31, 0.66)'; ctx.fillRect(18, 168, 339, 229); ctx.restore();
  panel(ctx, x, y, w, h, '#f5edda', 15);
  panel(ctx, x + 9, y + 9, 122, 151, '#dfd0b3', 12);
  const preview = { x: x + 18, y: y + 24, w: 104, h: 118 };
  const visual = tierVisual(entry.visibility);
  if ((entry.visibility || 0) <= 0) {
    ctx.save(); ctx.globalAlpha = visual.spriteAlpha;
    const drew = !!cargoSprite(scene, ctx, index, preview);
    ctx.restore();
    if (!drew) {
      ctx.save(); ctx.fillStyle = '#263436'; ctx.fillRect(x + 24, y + 34, 92, 93);
      ctx.fillStyle = '#d9c8a7'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('深处看不清', x + 70, y + 84); ctx.restore();
    } else if (visual.wash) { ctx.fillStyle = `rgba(8, 14, 16, ${visual.wash})`; ctx.fillRect(preview.x, preview.y, preview.w, preview.h); }
    strokeTierBox(ctx, preview, entry.visibility);
  } else {
    ctx.save(); if (entry.visibility === 1 && !entry.categoryKnown && !dedicatedPiece(scene, index)) ctx.filter = 'brightness(0.48)';
    const origin = cargoLayout[index]; const active = scene.effect && scene.effect.kind === 'inspect' && scene.effect.index === index;
    const p = active ? easeOut(effectProgress(scene, 'inspect')) : 1;
    const box = { x: origin.x + (preview.x - origin.x) * p, y: origin.y + (preview.y - origin.y) * p, w: origin.w + (preview.w - origin.w) * p, h: origin.h + (preview.h - origin.h) * p };
    cargoSprite(scene, ctx, index, box); ctx.restore();
    strokeTierBox(ctx, box, entry.visibility);
  }
  ctx.save(); ctx.fillStyle = '#a17b4e'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('单件检视', x + 16, y + 178); ctx.restore();
  const visibleName = (entry.visibility || 0) <= 0 ? '深处物件' : entry.visibility === 1 ? (entry.categoryKnown ? lotItem.category : lotItem.shape) : lotItem.clue;
  scene.text(ctx, `${index + 1}号 · ${visibleName}`, x + 145, y + 35, 16, '#40372c');
  const clue = scene.game.clue(index);
  scene.paragraph(ctx, clue, x + 145, y + 62, 164, 13, 4);
  if (entry.visibility === 1 && entry.conditionKnown) scene.text(ctx, '表面状态已检查', x + 145, y + 132, 11, '#55736c');
  else if (entry.visibility === 1 && entry.categoryKnown) scene.text(ctx, '可用放大镜检查表面', x + 145, y + 132, 11, '#8a6740');
  scene.button(ctx, '收回', x + 232, y + 158, 78, 34, () => scene.game.inspect(-1));
}
