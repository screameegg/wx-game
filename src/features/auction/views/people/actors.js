import { drawWristWatch } from '../../fx/watch-unlock';

// The buyer stays off-screen; the raised paddle and sleeve are the player's only portrait.
export function drawPlayerPaddle(ctx, x, y, width, height, ornament = 0, wrist = null) {
  ctx.save(); ctx.translate(x, y); ctx.scale(width / 100, height / 160);
  const outline = '#493b31';
  // sleeve and cuff
  ctx.fillStyle = '#49675f'; ctx.strokeStyle = outline; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(26, 161); ctx.lineTo(33, 116); ctx.quadraticCurveTo(42, 105, 57, 110); ctx.lineTo(76, 161); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = ornament >= 3 ? '#d39a45' : '#d5d0bd'; ctx.fillRect(32, 119, 27, 8);
  // handle and auction paddle
  ctx.strokeStyle = outline; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(51, 44); ctx.lineTo(53, 102); ctx.stroke();
  ctx.fillStyle = '#f5dfad'; ctx.strokeStyle = outline; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(50, 31, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b85f3b'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('7', 50, 39);
  // palm around the paddle handle
  ctx.fillStyle = '#d9966b'; ctx.strokeStyle = outline; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(40, 91); ctx.lineTo(39, 78); ctx.quadraticCurveTo(40, 72, 45, 74); ctx.lineTo(48, 82); ctx.lineTo(48, 68); ctx.quadraticCurveTo(49, 62, 54, 64); ctx.lineTo(57, 81); ctx.lineTo(60, 70); ctx.quadraticCurveTo(64, 67, 66, 73); ctx.lineTo(64, 91); ctx.quadraticCurveTo(61, 103, 51, 106); ctx.quadraticCurveTo(41, 104, 40, 91); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (ornament >= 2) { ctx.fillStyle = ornament >= 4 ? '#edc961' : '#c7c9bb'; ctx.beginPath(); ctx.arc(62, 88, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  drawWristWatch(ctx, ornament, wrist);
  ctx.restore();
}

