import { panel, palette } from '../../render/ui';
import { dockArgs } from '../../data/round7';
import { catalogEntries, catalogStatus } from '../../data/catalog';
import { economy, openingBid } from '../../data/economy';
import { paymentDue } from '../../rules/debt';
import { auctionsRemaining } from '../../rules/debt-clock';
import {
  advanceButtonLabel, advanceCount, advanceInner, advanceModel, advancePose, advanceStatus, advanceTipLine,
  businessLayout, repayButtonBox, repayControl, repayGlance, repayTitle, repayView,
} from '../../data/round10';
import { drawAdvancePlate, drawRepayCard } from '../../fx/round10-present';

// 设备商店直接展示购买项，避免从入口再点一层菜单。
export function workshop(scene, ctx) {
  const s = scene.game.state;
  scene.text(ctx, '设备与还款', 24, 125, 25);
  scene.text(ctx, `当前资金  ${s.coins} 金币`, 24, 158, 15, palette.gold);
  scene.paragraph(ctx, '选中轮廓货物后，先用手电看类别，再用放大镜看表面。', 24, 181, 327, 12, 2);
  [['手电', economy.toolCost['手电'], '照亮一件轮廓货物，查看类别'], ['放大镜', economy.toolCost['放大镜'], '检查已看清物品的表面状态']].forEach(([name, cost, description], i) => {
    const x = 24; const y = 218 + i * 112; const w = 327; const owned = s.equipment.includes(name); const pledged = s.pledged && s.pledged.name === name;
    panel(ctx, x, y, w, 96, palette.panel, 14);
    drawToolIcon(ctx, name, x + 18, y + 19);
    scene.text(ctx, name, x + 65, y + 28, 19, palette.text);
    scene.text(ctx, description, x + 65, y + 52, 12, palette.muted);
    scene.text(ctx, `每场 1 次  ·  ${cost} 金币`, x + 65, y + 76, 11, palette.gold);
    const label = pledged ? '抵押中' : owned ? '已拥有' : s.coins < cost ? '金币不足' : '购买';
    scene.button(ctx, label, x + 231, y + 14, 82, 35, () => scene.game.buyTool(name), owned || pledged || s.coins < cost);
  });
  scene.button(ctx, '查看还款与拍卖档位', 24, 441, 327, 46, () => { scene.menu.view = 'business'; }, true);
  scene.paragraph(ctx, s.notice || '观察时选中货物，再使用已购买设备。', 24, 516, 327, 12, 3);
  scene.button(ctx, '返回', ...dockArgs(scene.height), () => { scene.menu.view = ''; });
}

function drawToolIcon(ctx, name, x, y) {
  ctx.save(); ctx.strokeStyle = '#604c3c'; ctx.fillStyle = name === '手电' ? '#d18a55' : '#91aaa0'; ctx.lineWidth = 2.5;
  if (name === '手电') {
    ctx.beginPath(); ctx.moveTo(x + 2, y + 12); ctx.lineTo(x + 23, y + 5); ctx.lineTo(x + 30, y + 26); ctx.lineTo(x + 9, y + 33); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 29, y + 9); ctx.lineTo(x + 38, y + 5); ctx.moveTo(x + 32, y + 17); ctx.lineTo(x + 42, y + 17); ctx.moveTo(x + 30, y + 24); ctx.lineTo(x + 38, y + 29); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(x + 17, y + 16, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 26, y + 25); ctx.lineTo(x + 39, y + 37); ctx.stroke();
  }
  ctx.restore();
}

export function business(scene, ctx) {
  const s = scene.game.state;
  const due = paymentDue(s);
  const remaining = auctionsRemaining(s);
  const withLink = s.tier === 'advanced' && s.coins < openingBid('advanced');
  const layout = businessLayout(scene.height);
  const glance = repayGlance({
    phase: s.phase,
    due,
    remaining,
    coins: s.coins,
    arrears: s.arrears,
    overdue: s.overdue,
    creditorKey: s.creditorKey,
    missesToSeize: economy.seizureOverdueCount,
  });
  const model = advanceModel({ coins: s.coins, tier: s.tier, arrears: s.arrears, goal: economy.advancedEntryCoins });
  const pose = advancePose(Number.isFinite(scene.advanceCueAt) ? Date.now() - scene.advanceCueAt : Infinity);
  scene.text(ctx, '还款与拍卖档位', layout.card.x, layout.titleY, 20, palette.text);
  drawRepayCard(scene, ctx, layout.card, repayView(glance, {
    title: repayTitle(s.phase, remaining),
    prepaid: s.prepaid || 0,
  }), layout.sketch);
  const commands = [
    ['还 50', 50, s.coins < 50],
    ['还 100', 100, s.coins < 100],
    [s.coins >= due ? '本期全还' : '先还可用', due, false],
  ];
  let repayOpen = false;
  commands.forEach(([label, amount, short], index) => {
    const box = repayButtonBox(index, layout);
    const control = repayControl({ due, coins: s.coins, phase: s.phase, short });
    if (!control.disabled) repayOpen = true;
    scene.button(ctx, label, box.x, box.y, box.w, box.h, () => scene.game.repayEarly(amount), false, {
      disabled: control.disabled,
      role: `repay:${index}`,
    });
  });
  const photo = s.unlocked.includes('photo');
  const repair = s.unlocked.includes('repair');
  const photoCost = economy.themeUnlock.photo;
  const repairCost = economy.themeUnlock.repair;
  scene.text(ctx, `摄影箱 ${photo ? '已解锁' : `${Math.min(s.coins, photoCost)} / ${photoCost}`}`, layout.card.x, layout.goalsY, 12, photo ? palette.green : palette.muted);
  scene.text(ctx, `维修箱 ${repair ? '已解锁' : `${Math.min(s.coins, repairCost)} / ${repairCost}`}`, layout.card.x + 168, layout.goalsY, 12, repair ? palette.green : palette.muted);
  const catalog = catalogEntries(s);
  const found = catalog.filter((entry) => catalogStatus(s, entry.name).found).length;
  scene.text(ctx, `图鉴收藏 ${found} / ${catalog.length} 种`, layout.card.x, layout.goalsY + 16, 12, palette.muted);
  const inner = advanceInner(layout.advance, withLink);
  const tip = advanceTipLine({
    bidStart: economy.advancedBidStart,
    bidStep: economy.advancedBidStep,
    nextDue: economy.advancedFirstPayment,
  });
  drawAdvancePlate(scene, ctx, {
    plate: layout.advance,
    inner,
    model,
    status: advanceStatus(model),
    count: advanceCount(model),
    tip,
    pose,
    notice: withLink ? '' : (s.notice || '还款有压力时，可以留钱、提前还款，或继续拍卖攒够资金。'),
  });
  scene.button(ctx, advanceButtonLabel(model), inner.button.x, inner.button.y, inner.button.w, inner.button.h, () => {
    const before = s.tier;
    scene.game.upgradeTier();
    if (before !== 'advanced' && s.tier === 'advanced') scene.advanceCueAt = Date.now();
  }, false, { disabled: !model.ready, role: 'advance' });
  if (withLink) scene.link(ctx, '资金不足，返回入门档', inner.link.x, inner.link.y, inner.link.w, () => { s.tier = 'starter'; scene.advanceCueAt = null; scene.game.save(); });
  scene.button(ctx, '返回', ...dockArgs(scene.height), () => { scene.menu.view = s.phase === 'home' ? 'home' : 'shop'; }, repayOpen || model.ready);
}
