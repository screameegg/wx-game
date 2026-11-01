import { bandPieceKey, bandUsesSilhouette } from '../data/round1-art';

// 图集坐标与图片比例仅由这个模块管理，业务层不接触像素裁切。
export function sprite(ctx, image, index, columns, rows, x, y, w, h) {
  if (!image) return;
  const cellW = image.width / columns; const cellH = image.height / rows; const padX = Math.min(3, cellW * 0.015); const padY = Math.min(3, cellH * 0.015);
  const sw = cellW - padX * 2; const sh = cellH - padY * 2; const scale = Math.min(w / sw, h / sh);
  ctx.drawImage(image, index % columns * cellW + padX, Math.floor(index / columns) * cellH + padY, sw, sh, x + (w - sw * scale) / 2, y + (h - sh * scale) / 2, sw * scale, sh * scale);
}
function resultCell(name) {
  return name.includes('自行车') ? 0 : name.includes('贝斯') ? 7 : name.includes('吉他') ? 5 : /配件|拨片/.test(name) ? 6 : /乐谱|节目单|票根/.test(name) ? 8 : name.includes('支架') ? 9 : name.includes('线材') ? 10 : name.includes('演出服') ? 11 : /唱片|磁带|母带/.test(name) ? 13 : name.includes('海报') ? 14 : 12;
}
function extraCell(name) {
  if (/相机配件|相机包/.test(name)) return 0;
  if (/相机|底片|滤镜|测光表/.test(name)) return 1;
  if (/三脚架/.test(name)) return 2;
  if (/相册|照片集|幻灯片/.test(name)) return 3;
  if (/摄影灯|闪光灯/.test(name)) return 4;
  if (/布景|背景纸/.test(name)) return 5;
  if (/工具柜/.test(name)) return 6;
  if (/挂钟|怀表/.test(name)) return 7;
  if (/收音机/.test(name)) return 8;
  if (/零件|齿轮/.test(name)) return 9;
  if (/木箱/.test(name)) return 10;
  if (/工具|扳手|刨子/.test(name)) return 11;
  return -1;
}
function drawExtra(ctx, image, cell, box) {
  sprite(ctx, image, cell, 4, 3, box.x, box.y, box.w, box.h);
}
function bandCell(ctx, image, cell, box) {
  if (!image || cell === undefined) return;
  const xs = [0, 307, 612, 916, 1223], ys = [0, 307, 624, 931, 1245]; const col = cell % 4; const row = Math.floor(cell / 4);
  const sx = (xs[col] + 2) * image.width / 1223, sy = (ys[row] + 2) * image.height / 1286;
  const sw = (xs[col + 1] - xs[col] - 4) * image.width / 1223, sh = (ys[row + 1] - ys[row] - 4) * image.height / 1286;
  const scale = Math.min(box.w / sw, box.h / sh);
  ctx.drawImage(image, sx, sy, sw, sh, box.x + (box.w - sw * scale) / 2, box.y + (box.h - sh * scale) / 2, sw * scale, sh * scale);
}
export function catalogSprite(scene, ctx, name, box) {
  if (drawBonusIllustration(ctx, name, box)) return;
  const extra = extraCell(name);
  if (extra >= 0) { drawExtra(ctx, scene.art.get('extraSheet'), extra, box); return; }
  bandCell(ctx, scene.art.get('resultSheet'), resultCell(name), box);
}

// Small, item-specific hand-drawn bonus illustrations fill gaps in the first art atlas.
function drawBonusIllustration(ctx, name, box) {
  const kind = /票根/.test(name) ? 'ticket' : /徽章/.test(name) ? 'badge' : /磁带|母带/.test(name) ? 'tape' : /幻灯片/.test(name) ? 'slide' : /测光表/.test(name) ? 'meter' : /闪光灯泡/.test(name) ? 'bulb' : /怀表/.test(name) ? 'watch' : /刨子/.test(name) ? 'plane' : /齿轮/.test(name) ? 'gears' : '';
  if (!kind) return false;
  ctx.save(); ctx.translate(box.x, box.y); ctx.scale(box.w / 100, box.h / 100);
  const ink = '#493b31'; const paper = '#f0dba9'; const rust = '#bb6845'; const teal = '#55736c';
  ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'ticket') {
    ctx.save(); ctx.translate(50, 50); ctx.rotate(-0.09); ctx.translate(-50, -50);
    ctx.fillStyle = paper; ctx.beginPath(); ctx.moveTo(15, 27); ctx.lineTo(85, 27); ctx.lineTo(85, 72); ctx.lineTo(15, 72); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff7e5'; ctx.fillRect(25, 36, 50, 27); ctx.strokeRect(25, 36, 50, 27);
    [32, 40, 49, 57, 66].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 39); ctx.lineTo(x, 60); ctx.stroke(); });
    ctx.fillStyle = rust; ctx.beginPath(); ctx.arc(15, 50, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(85, 50, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  } else if (kind === 'badge') {
    ctx.fillStyle = rust; ctx.beginPath(); ctx.moveTo(36, 61); ctx.lineTo(31, 88); ctx.lineTo(49, 77); ctx.lineTo(57, 91); ctx.lineTo(64, 61); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = paper; ctx.beginPath(); ctx.arc(50, 42, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c18a43'; ctx.beginPath(); ctx.arc(50, 42, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff1bd'; ctx.font = 'bold 19px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', 50, 49);
  } else if (kind === 'tape') {
    ctx.fillStyle = '#4c5550'; ctx.beginPath(); ctx.moveTo(18, 26); ctx.quadraticCurveTo(18, 19, 26, 19); ctx.lineTo(74, 19); ctx.quadraticCurveTo(82, 19, 82, 26); ctx.lineTo(82, 74); ctx.quadraticCurveTo(82, 81, 74, 81); ctx.lineTo(26, 81); ctx.quadraticCurveTo(18, 81, 18, 74); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = paper; ctx.fillRect(27, 25, 46, 11); ctx.strokeRect(27, 25, 46, 11);
    ctx.fillStyle = '#c6b38b'; [38, 62].forEach((x) => { ctx.beginPath(); ctx.arc(x, 51, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#63594a'; ctx.beginPath(); ctx.arc(x, 51, 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = '#d7c69e'; ctx.beginPath(); ctx.moveTo(28, 68); ctx.lineTo(72, 68); ctx.moveTo(34, 74); ctx.lineTo(66, 74); ctx.stroke();
  } else if (kind === 'slide') {
    ctx.fillStyle = paper; ctx.fillRect(18, 17, 64, 66); ctx.strokeRect(18, 17, 64, 66);
    ctx.fillStyle = '#4d615a'; ctx.fillRect(27, 26, 46, 47); ctx.strokeRect(27, 26, 46, 47);
    ctx.fillStyle = '#e9b66f'; ctx.beginPath(); ctx.arc(58, 39, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#688277'; ctx.beginPath(); ctx.moveTo(29, 68); ctx.lineTo(44, 47); ctx.lineTo(53, 59); ctx.lineTo(61, 50); ctx.lineTo(72, 68); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'meter') {
    ctx.fillStyle = teal; ctx.beginPath(); ctx.moveTo(26, 18); ctx.lineTo(72, 24); ctx.lineTo(77, 79); ctx.lineTo(22, 79); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = paper; ctx.beginPath(); ctx.arc(50, 43, 18, Math.PI, 0); ctx.lineTo(68, 48); ctx.lineTo(32, 48); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = rust; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(50, 45); ctx.lineTo(61, 34); ctx.stroke();
    ctx.fillStyle = paper; ctx.fillRect(34, 58, 32, 10); ctx.strokeRect(34, 58, 32, 10);
  } else if (kind === 'bulb') {
    ctx.fillStyle = '#f3d98d'; ctx.beginPath(); ctx.moveTo(50, 17); ctx.bezierCurveTo(22, 17, 21, 51, 40, 61); ctx.lineTo(42, 70); ctx.lineTo(58, 70); ctx.lineTo(60, 61); ctx.bezierCurveTo(79, 49, 78, 17, 50, 17); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#67746a'; ctx.fillRect(41, 71, 18, 12); ctx.strokeRect(41, 71, 18, 12);
    ctx.beginPath(); ctx.moveTo(43, 75); ctx.lineTo(57, 75); ctx.moveTo(44, 80); ctx.lineTo(56, 80); ctx.stroke();
    ctx.strokeStyle = rust; ctx.beginPath(); ctx.moveTo(50, 28); ctx.lineTo(50, 51); ctx.moveTo(40, 35); ctx.lineTo(50, 45); ctx.lineTo(60, 35); ctx.stroke();
  } else if (kind === 'watch') {
    ctx.fillStyle = '#c18a43'; ctx.beginPath(); ctx.arc(50, 54, 31, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = paper; ctx.beginPath(); ctx.arc(50, 54, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(50, 54, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(50, 54); ctx.lineTo(50, 37); ctx.moveTo(50, 54); ctx.lineTo(64, 58); ctx.stroke();
    ctx.fillStyle = rust; ctx.fillRect(44, 13, 12, 8); ctx.strokeRect(44, 13, 12, 8); ctx.beginPath(); ctx.arc(50, 10, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (kind === 'plane') {
    ctx.fillStyle = '#a9774d'; ctx.beginPath(); ctx.moveTo(15, 60); ctx.lineTo(85, 60); ctx.lineTo(78, 76); ctx.lineTo(23, 76); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c69761'; ctx.beginPath(); ctx.moveTo(33, 58); ctx.quadraticCurveTo(36, 34, 50, 34); ctx.quadraticCurveTo(64, 34, 67, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#777a70'; ctx.fillRect(23, 77, 55, 7); ctx.strokeRect(23, 77, 55, 7);
  } else if (kind === 'gears') {
    [[39, 43, 22], [66, 62, 16]].forEach(([cx, cy, r]) => {
      ctx.fillStyle = '#b68b55'; ctx.beginPath();
      for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; const rr = i % 3 === 0 ? r : r * 0.82; const px = cx + Math.cos(a) * rr; const py = cy + Math.sin(a) * rr; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f0dba9'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  }
  ctx.restore(); return true;
}
function drawFitted(ctx, image, box) {
  const scale = Math.min(box.w / image.width, box.h / image.height);
  const w = image.width * scale; const h = image.height * scale;
  ctx.drawImage(image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}
export function cargoSprite(scene, ctx, index, box, revealed = false) {
  const entry = scene.game.state.items[index];
  if (!entry) return false;
  const lotItem = scene.game.lot && scene.game.lot.items[index];
  const piece = lotItem && lotItem.artId && scene.art.get(bandPieceKey(lotItem.artId, bandUsesSilhouette(entry, revealed)));
  if (piece) { drawFitted(ctx, piece, box); return true; }
  if (!revealed && entry.visibility === 0 && lotItem && lotItem.artId) return false;
  const image = scene.art.get(revealed ? 'resultSheet' : 'itemSheet');
  if (!image) return false;
  const name = entry.result && entry.result[0] || '';
  const theme = scene.game.lot && scene.game.lot.theme;
  const extra = revealed ? extraCell(name) : theme === 'photo' ? [0, 2, 3, -1, 5][index] : theme === 'repair' ? [6, 7, 8, 9, 10][index] : -1;
  if (extra >= 0) { drawExtra(ctx, scene.art.get('extraSheet'), extra, box); return true; }
  const cell = !revealed ? [0, 1, 15, 3, 4][index] : resultCell(name);
  bandCell(ctx, image, cell, box);
  return true;
}
