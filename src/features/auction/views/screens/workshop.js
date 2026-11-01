import { panel, palette } from '../../render/ui';
import { catalogEntries, catalogStatus } from '../../data/catalog';
import { economy, openingBid } from '../../data/economy';
import { paymentDue } from '../../rules/debt';

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
  scene.button(ctx, '返回', 24, scene.height - 68, 327, 48, () => { scene.menu.view = ''; });
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
  const s = scene.game.state; const due = paymentDue(s);
  const cycle = economy.repaymentCycleRounds;
  const dueNow = s.round > 0 && s.round % cycle === 0 && s.debtPeriod < s.round / cycle;
  const roundsLeft = dueNow ? 0 : (cycle - s.round % cycle || cycle);
  scene.text(ctx, '还款与拍卖档位', 24, 125, 25);
  scene.text(ctx, dueNow ? '本期还款日已到' : `还剩 ${roundsLeft} 场到还款日`, 24, 166, 14, palette.muted);
  scene.text(ctx, `本期还差 ${due} 金币`, 24, 203, 25, palette.gold);
  scene.text(ctx, `已提前还 ${s.prepaid || 0} · 账户 ${s.coins}`, 24, 228, 12, palette.muted);
  const repayDisabled = due <= 0 || s.coins <= 0 || !['home', 'briefing', 'passed', 'settlement'].includes(s.phase);
  const allLabel = s.coins >= due ? '本期全还' : '先还可用';
  [['还 50',50,s.coins < 50],['还 100',100,s.coins < 100],[allLabel,due,false]].forEach(([label, amount, short], i) => {
    scene.button(ctx, label, 24 + i * 111, 244, 103, 42, () => scene.game.repayEarly(amount), repayDisabled || short);
  });
  scene.text(ctx, '提前还款抵扣最近一期，不占拍卖场次。', 24, 305, 11, palette.muted);
  scene.text(ctx, '经营目标', 24, 337, 17, palette.text);
  const photo = s.unlocked.includes('photo'); const repair = s.unlocked.includes('repair');
  const photoCost = economy.themeUnlock.photo; const repairCost = economy.themeUnlock.repair; const advancedEntry = economy.advancedEntryCoins;
  scene.text(ctx, `摄影箱 ${photo ? '已解锁' : `${Math.min(s.coins, photoCost)} / ${photoCost} 金币`}`, 24, 364, 12, photo ? palette.green : palette.muted);
  scene.text(ctx, `维修箱 ${repair ? '已解锁' : `${Math.min(s.coins, repairCost)} / ${repairCost} 金币`}`, 190, 364, 12, repair ? palette.green : palette.muted);
  const catalog = catalogEntries(s); const found = catalog.filter((entry) => catalogStatus(s, entry.name).found).length;
  scene.text(ctx, `图鉴收藏 ${found} / ${catalog.length} 种`, 24, 389, 12, palette.muted);
  scene.button(ctx, s.tier === 'advanced' ? '已进入进阶档' : `进阶档 · ${Math.min(s.coins, advancedEntry)} / ${advancedEntry} 金币`, 24, 411, 327, 44, () => {
    scene.game.upgradeTier();
    if (s.tier !== 'advanced') { s.notice = s.arrears ? '先结清逾期欠款，才能升入进阶档。' : `金币达到 ${advancedEntry} 后可进入进阶档。`; scene.game.save(); }
  }, s.tier === 'advanced' || s.coins < advancedEntry || s.arrears > 0);
  if (s.tier === 'advanced' && s.coins < openingBid('advanced')) scene.link(ctx, '资金不足，返回入门档', 24, 463, 327, () => { s.tier = 'starter'; scene.game.save(); });
  scene.paragraph(ctx, s.notice || '还款有压力时，可以留钱、提前还款，或继续拍卖攒够资金。', 24, 489, 327, 13, 3);
  scene.button(ctx, '返回', 24, scene.height - 68, 327, 48, () => { scene.menu.view = s.phase === 'home' ? 'home' : 'shop'; });
}
