import { steps } from '../shared/chrome';
import { cargoSprite, catalogSprite } from '../../render/sprites';
import { effectProgress } from '../../render/motion';
import { flipPose, withFlip } from '../../fx/beats';
import { palette, divider, panel } from '../../render/ui';
import { cargoLayout } from '../../render/cargo';

// 开箱揭晓：在货柜场景内逐件点击揭晓，轮廓蜕变为真物；这是全场最爽的时刻。
// 策划文档第五节：成交后玩家进入货箱内部，按自己喜好的顺序点击物品。
export function reveal(scene, ctx) {
  const s = scene.game.state;
  steps(scene, ctx, 2);

  const item = s.items[s.selected]; const focused = item && item.status === 'revealed';

  if (!focused) {
    // ── 货柜内物品列表：等待玩家逐件点击揭晓
    drawRevealCargo(scene, ctx, s);
    // 底部状态条
    const done = s.items.filter((e) => ['sold', 'collected'].includes(e.status)).length;
    const remaining = s.items.length - done;
    panel(ctx, 12, scene.height - 112, 351, 104, palette.panel, 14);
    scene.text(ctx, remaining > 0 ? `还有 ${remaining} 件没打开——点编号查看` : '全部处理完了！', 24, scene.height - 90, 15, remaining > 0 ? palette.gold : palette.green);
    scene.text(ctx, `花费 ${s.spent} 金币 · 已售 ${s.income} 金币`, 24, scene.height - 68, 13, palette.muted);
    // S03 装腔揭穿提示（结算前透出，增加复盘趣味）
    if (s.bluffNote) { scene.text(ctx, s.bluffNote, 24, scene.height - 51, 10, palette.muted); }
    if (remaining === 0) scene.button(ctx, '看看这箱赚亏多少', 24, scene.height - 52, 327, 44, () => scene.game.prepareRound());
  } else {
    // ── 已揭晓：大图弹出 + 出售/收藏操作
    drawRevealFocused(scene, ctx, item, s);
  }
}

// 货柜内物品：已处理变暗，未处理保留编号热区
function drawRevealCargo(scene, ctx, s) {
  [4, 3, 0, 2, 1].forEach((index) => {
    if (!s.items[index]) return;
    const entry = s.items[index]; const box = cargoLayout[index];
    const processed = ['sold', 'collected'].includes(entry.status);

    if (processed) {
      // 已处理：暗色填充 + 文字
      ctx.fillStyle = '#0d161ae8'; ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = '#3a5050'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(entry.status === 'sold' ? '已售' : '已藏', box.x + box.w / 2, box.y + box.h / 2 + 5);
      ctx.textAlign = 'left';
      return;
    }

    // 未处理：显示当前状态（已揭晓用真实图，hidden 用轮廓/不可见）
    const alreadyRevealed = entry.status === 'revealed';
    if (entry.visibility === 0 && !alreadyRevealed) {
      ctx.fillStyle = '#101b1bc9'; ctx.fillRect(box.x + 10, box.y + 15, box.w - 20, box.h - 20);
    } else {
      if (entry.visibility === 1 && !alreadyRevealed) ctx.filter = 'brightness(0.58)';
      cargoSprite(scene, ctx, index, box, alreadyRevealed);
      ctx.filter = 'none';
    }

    // 帆布盖布大件（开箱揭晓时仍显示帆布效果，直到被点开）
    if (entry.coverCloth && !alreadyRevealed) {
      ctx.fillStyle = '#4a5e50c0'; ctx.fillRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
      ctx.fillStyle = '#8aaa90'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('掀开帆布', box.x + box.w / 2, box.y + box.h / 2 + 4);
      ctx.textAlign = 'left';
    }

    // 夹层惊喜标记（S01）
    if (entry.isBonus) { scene.text(ctx, '✦', box.x + box.w - 8, box.y + 14, 13, palette.gold); }

    // 编号徽章
    const isFocused = s.selected === index && alreadyRevealed;
    panel(ctx, box.x + box.w / 2 - 11, box.y + box.h - 12, 22, 22, isFocused ? palette.gold : '#1e3a40d9', 11);
    ctx.fillStyle = isFocused ? '#16272b' : '#e6dac2'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${index + 1}`, box.x + box.w / 2, box.y + box.h + 6); ctx.textAlign = 'left';

    // 点击热区
    scene.buttons.push({ x: box.x, y: box.y, w: box.w, h: box.h, label: `货物${index + 1}`, action: () => scene.game.reveal(index) });
  });
  // 夹层物品没有对应的五件货物图集，单独提供可点击的入口。
  s.items.forEach((entry, index) => {
    if (!entry.isBonus || ['sold', 'collected'].includes(entry.status)) return;
    scene.button(ctx, '✦ 打开夹层', 247, 365, 104, 30, () => scene.game.reveal(index));
  });
}

// 已揭晓物品：先翻开背面，再换成真物；翻完才给出售/收藏。
function drawRevealFocused(scene, ctx, item, s) {
  const pose = flipPose(effectProgress(scene, 'reveal'));
  if (scene.effect && scene.effect.kind === 'reveal') scene.effect.phase = pose.phase;
  const index = s.selected;
  const iw = 208; const ih = 188;

  if (item.isBigWin && pose.showFront && pose.scaleX > 0.72) {
    ctx.save(); ctx.globalAlpha = 0.28 + pose.scaleX * 0.22;
    ctx.fillStyle = '#f2cc50';
    ctx.beginPath(); ctx.arc(188, 265, 115, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  withFlip(ctx, 188, 265, pose, () => {
    const box = { x: -iw / 2, y: -ih / 2, w: iw, h: ih };
    if (!pose.showFront) drawRevealBack(scene, ctx, item, index, box);
    else if (item.isBonus) catalogSprite(scene, ctx, item.result[0], box);
    else cargoSprite(scene, ctx, index, box, true);
  });
  if (!(pose.showFront && pose.scaleX > 0.82)) {
    scene.text(ctx, '翻开…', 156, 390, 16, palette.gold);
    return;
  }

  // 信息面板
  divider(ctx, 24, 388, 327);

  // 夹层惊喜特殊提示（S01）
  if (item.isBonus) {
    panel(ctx, 24, 394, 327, 22, item.isBigWin ? '#f3ddb0' : '#e2eddc', 7);
    scene.text(ctx, item.isBigWin ? '✦ 稀有大奖！这件藏品价值不菲。' : '✦ 夹层惊喜！发现了一件额外物品。', 34, 409, 11, item.isBigWin ? palette.gold : palette.green);
  }

  const baseY = item.isBonus ? 422 : 405;
  scene.text(ctx, item.result[0], 24, baseY, 21, item.isBigWin ? palette.gold : palette.text);
  scene.paragraph(ctx, item.result[1], 24, baseY + 30, 327, 14, 3);
  scene.text(ctx, `可卖 ${item.result[2]} 金币`, 24, baseY + 96, 17, item.isBigWin ? palette.gold : palette.text);
  scene.text(ctx, `品相：${item.good === false ? '受损或有缺件' : '外观较好'}`, 24, baseY + 118, 12, palette.muted);

  // 出售 / 收藏
  if (item.collectible) {
    scene.text(ctx, '收藏会放弃这件物品的出售收入', 24, scene.height - 82, 11, palette.muted);
    scene.button(ctx, '收藏入图鉴', 24, scene.height - 68, 140, 48, () => scene.game.handle('collect'), true);
    scene.button(ctx, `出售 +${item.result[2]}`, 174, scene.height - 68, 177, 48, () => scene.game.handle('sell'));
  } else {
    scene.button(ctx, `出售，获得 ${item.result[2]} 金币`, 24, scene.height - 68, 327, 48, () => scene.game.handle('sell'));
  }
}

function drawRevealBack(scene, ctx, item, index, box) {
  ctx.fillStyle = '#243430';
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = '#d9c9ae';
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
  if (item.isBonus) {
    ctx.fillStyle = palette.gold;
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦', box.x + box.w / 2, box.y + box.h / 2 + 8);
    ctx.textAlign = 'left';
    return;
  }
  const entry = scene.game.state.items[index];
  if (!entry || entry.visibility === 0) return;
  if (entry.visibility === 1) ctx.filter = 'brightness(0.58)';
  cargoSprite(scene, ctx, index, box, false);
  ctx.filter = 'none';
  if (entry.coverCloth) {
    ctx.fillStyle = '#4a5e50c0';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
}
