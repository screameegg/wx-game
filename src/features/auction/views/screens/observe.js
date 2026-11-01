import { steps, heading } from '../shared/chrome';
import { drawCargo } from '../../render/cargo';
import { palette, panel } from '../../render/ui';
import { economy } from '../../data/economy';
import { infoCardBox } from '../../data/round3';
export function observe(scene, ctx) {
  const reviewing = scene.reviewing; steps(scene, ctx, 0);

  // 标题区：箱子来历（硬信息）
  const lot = scene.game.lot;
  if (!reviewing) {
    scene.text(ctx, lot ? lot.name : '', 24, 103, 13, palette.muted);
    scene.text(ctx, `起拍 ${scene.game.state.price} 金币`, 210, 103, 13, palette.gold);
    scene.text(ctx, '先看线索，再决定值不值得拍', 24, 125, 19);
  } else {
    heading(scene, ctx, '再看看线索', '竞价中可随时回来对照。');
  }

  // 货柜场景（含物品热区）
  drawCargo(scene, ctx);

  // 对手预览区：在货柜右侧用小图标显示哪个对手对哪个方向感兴趣

  // 线索信息区
  drawDetails(scene, ctx, reviewing);
  const s = scene.game.state;
  drawToolCard(scene, ctx, '手电', 24, 153);
  drawToolCard(scene, ctx, '放大镜', 198, 153);

  // 底部按钮
  scene.button(ctx, reviewing ? '返回竞价' : '结束观察，开始竞价', 24, scene.height - 68, 327, 48, () => {
    if (reviewing) scene.reviewing = false; else scene.game.beginBidding();
  });
}

function drawToolCard(scene, ctx, name, x, width) {
  const y = scene.height - 132; const s = scene.game.state; const owned = s.equipment.includes(name); const entry = s.items[s.selected];
  panel(ctx, x, y, width, 43, '#fffaf0', 10);
  // Small hand-drawn icons make the two actions read as equipment, not plain text links.
  ctx.save(); ctx.strokeStyle = palette.gold; ctx.fillStyle = '#e2a66d'; ctx.lineWidth = 2.5;
  if (name === '手电') {
    ctx.beginPath(); ctx.moveTo(x + 13, y + 16); ctx.lineTo(x + 27, y + 12); ctx.lineTo(x + 31, y + 25); ctx.lineTo(x + 17, y + 29); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 31, y + 15); ctx.lineTo(x + 36, y + 13); ctx.moveTo(x + 33, y + 20); ctx.lineTo(x + 39, y + 20); ctx.moveTo(x + 32, y + 25); ctx.lineTo(x + 37, y + 28); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(x + 23, y + 20, 8, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 29, y + 26); ctx.lineTo(x + 36, y + 33); ctx.stroke();
  }
  ctx.restore();
  scene.text(ctx, name, x + 42, y + 18, 12, palette.text);
  const price = economy.toolCost[name];
  let note = !owned ? `购买 · ${price} 金币` : s.toolsUsed.includes(name) ? '本场已用完' : '先选货物';
  if (owned && !s.toolsUsed.includes(name) && entry) {
    if (entry.coverCloth) note = '帆布遮挡';
    else if (entry.visibility === 0) note = '位置太暗';
    else if (entry.visibility !== 1) note = '无需设备';
    else if (name === '手电') note = entry.categoryKnown ? '类别已看清' : '照亮，看类别';
    else if (!entry.categoryKnown) note = '先用手电';
    else note = entry.conditionKnown ? '表面已检查' : '检查表面';
  }
  scene.text(ctx, note, x + 42, y + 34, 10, palette.muted);
  scene.buttons.push({ x, y, w: width, h: 43, label: `${name}设备`, action: () => {
    if (owned) scene.game.useTool(name, reviewing); else if (!reviewing) scene.menu.view = 'shop';
  } });
}

function drawDetails(scene, ctx, reviewing) {
  const s = scene.game.state; const index = s.selected;
  panel(ctx, infoCardBox.x, infoCardBox.y, infoCardBox.w, infoCardBox.h, palette.panel, 12);

  if (index < 0) {
    scene.text(ctx, '拍卖员 · 箱子来历', 24, 426, 12, palette.gold);
    scene.paragraph(ctx, s.auctioneerLine || scene.game.lot.story, 24, 449, 327, 13, 2);
    scene.text(ctx, '点货物看线索；轮廓先照后查', 24, 493, 11, palette.muted);
    return;
  }

  const entry = s.items[index]; const item = scene.game.lot.items[index];
  if (!entry || !item) return;

  // 物品标题
  const visLabel = entry.visibility === 2 ? '看得清' : entry.visibility === 1 ? '只见轮廓' : '不可见';
  const visColor = entry.visibility === 2 ? palette.green : entry.visibility === 1 ? palette.gold : palette.muted;
  scene.text(ctx, `${index + 1} · ${entry.visibility === 2 ? item.clue : entry.visibility === 1 ? item.shape : '深处未知'}`, 24, 437, 17, palette.text);
  panel(ctx, 270, 421, 60, 20, entry.visibility === 2 ? '#e2eddc' : entry.visibility === 1 ? '#f7ebd2' : '#ece7dc', 7);
  scene.text(ctx, visLabel, 278, 435, 10, visColor);

  // 线索描述（帆布盖布大件特殊说明）
  const clue = scene.game.clue(index);
  const description = clue.startsWith(item.clue + '：') ? clue.slice(item.clue.length + 1) : clue.startsWith(item.shape + '：') ? clue.slice(item.shape.length + 1) : clue;
  scene.paragraph(ctx, description, 24, 462, 327, 13, 2);

  // 帆布盖布提示（只有帆布形态的第4件才有）
  if (entry.coverCloth) {
    scene.text(ctx, '帆布覆盖的大件，打开后才知道具体内容', 24, 497, 10, palette.muted);
  }

}
