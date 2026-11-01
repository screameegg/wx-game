import { bidIncrement, lotValueMultiplier, openingBid } from '../data/economy';
import { auctioneerLineFor } from '../data/lines';

function pickPreset(lot) {
  let roll = Math.random() * 100; let index = 0;
  while (index < lot.weights.length - 1 && roll >= lot.weights[index]) { roll -= lot.weights[index]; index++; }
  return index;
}
function createRival(name, index, lot, fairValue, opening, multiplier) {
  const preferred = index === 0 ? lot.theme === 'repair' : lot.theme !== 'repair';
  // 偏好主题时估值系数1.1~1.2；不熟悉时0.9
  const prefMulti = preferred ? (1.1 + Math.random() * 0.1) : 0.9;
  const estimate = Math.round(fairValue * prefMulti);
  // 处境在开场前固定，透过动作线索露出，不动态改变预算
  const situation = Math.random() < 0.2 ? (index === 0 ? '急着用钱' : '库存积压') : '正常';
  const budgetBase = situation === '急着用钱' ? 240 : situation === '库存积压' ? 240 : 270 + Math.random() * 80;
  const budget = Math.round(budgetBase * multiplier);
  // 门缝信息少，对手更谨慎，折扣系数低
  const openDiscount = opening === '门缝' ? 0.78 + Math.random() * 0.1 : opening === '全开' ? 0.9 + Math.random() * 0.1 : 0.83 + Math.random() * 0.1;
  const rivalDiscount = index === 0 ? openDiscount * 0.95 : openDiscount; // 老周更谨慎
  // 阿岚约10%会虚张声势（bluff标记不读取真实内容，只影响表情展示）
  const bluff = index === 1 && Math.random() < 0.1;
  return { name, estimate, preferred, budget, situation, bluff, active: true, limit: Math.floor(Math.min(budget, estimate * rivalDiscount)) };
}
// 夹层惊喜：约10%的箱子在开拍前就已抽定夹层物品（S01），不因竞价改变
function pickBonus(lot, multiplier) {
  if (Math.random() > 0.1) return null;
  const pool = lot.bonusPool || [];
  if (!pool.length) return null;
  const jackpot = pool.filter((item) => item.jackpot);
  const regular = pool.filter((item) => !item.jackpot);
  const item = jackpot.length && Math.random() < 0.05 ? jackpot[Math.floor(Math.random() * jackpot.length)] : regular[Math.floor(Math.random() * regular.length)];
  const value = Math.round((item.minVal + Math.random() * (item.maxVal - item.minVal)) * multiplier);
  // 用 result 数组格式，与普通物品完全兼容，handle/reveal 逻辑无需特殊处理
  return { result: [item.name, item.description, value], status: 'hidden', isBonus: true, collectible: !!item.collectible, good: true, isBigWin: !!item.jackpot || value >= 500 * multiplier, visibility: 2, upgraded: false };
}
// 内容与对手只在开场生成，估值不读取抽到的真实结果。
export function createRound(lot, tier) {
  const preset = pickPreset(lot); const multiplier = lotValueMultiplier(tier);
  const auctioneerLines = lot.auctioneerLines || [lot.story];
  // 仍消耗一次随机，避免后面的开门和对手预算跟着台词改动。
  const rolled = auctioneerLines[Math.floor(Math.random() * auctioneerLines.length)];
  const auctioneerLine = auctioneerLineFor(lot) || rolled;
  // 首版只有门缝、半开和全开。
  const openingRoll = Math.random();
  const opening = openingRoll < 0.2 ? '门缝' : openingRoll < 0.7 ? '半开' : '全开';
  // 各形态对应的可见层级 [visibility per item]：2=看得清 1=轮廓 0=不可见
  const levelMap = {
    '门缝':    [2, 1, 0, 1, 0],  // 10/40/50
    '半开':    [2, 1, 2, 1, 0],  // 30/50/20
    '全开':    [2, 2, 2, 1, 0],  // 60/30/10
    '帆布盖布': [2, 1, 2, 0, 1], // 按半开，第4件为帆布大件(0->盖布特殊处理)
  };
  const levels = levelMap[opening] || levelMap['半开'];
  const items = lot.items.slice(0, 5).map((item, i) => {
    const exact = lot.presetResults && lot.presetResults[preset][i];
    const good = exact ? !/受潮|需修理|配件|杂物/.test(exact[0]) : !!lot.presets[preset][i];
    const result = [...(exact || (good ? item.good : item.bad))]; result[2] *= multiplier;
    // 大奖标记：单件价值超过500（入门档）触发特殊音效
    const isBigWin = result[2] >= 500 * multiplier;
    return { result, good, collectible: (!!item.collectible && good) || /唱片|海报/.test(result[0]), status: 'hidden', visibility: levels[i], upgraded: false, isBigWin };
  });
  // 帆布盖布：第4件物品（index=3）用盖布遮挡，visibility标记为-1（大件盖布）
  if (opening === '帆布盖布') items[3].coverCloth = true;
  // 夹层惊喜：开拍前抽定，可能为null
  const bonusItem = pickBonus(lot, multiplier);
  let fairValue = Math.round(lot.items.reduce((sum, item) => sum + item.expected, 0) * multiplier);
  // 自行车位于门口，外观是否需要修理是公开线索；其余实际内容仍不可被对手读取。
  if (lot.theme === 'band' && lot.presetResults && items[0].visibility === 2) {
    const visibleDamage = /需修理/.test(items[0].result[0]);
    const candidates = lot.presetResults.map((results, i) => ({ results, weight: lot.weights[i] })).filter((entry) => /需修理/.test(entry.results[0][0]) === visibleDamage);
    const weight = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    fairValue = Math.round(candidates.reduce((sum, entry) => sum + entry.weight * entry.results.reduce((value, result) => value + result[2], 0), 0) / weight * multiplier);
  }
  const rivals = ['老周', '阿岚'].map((name, i) => createRival(name, i, lot, fairValue, opening, multiplier));
  return {
    preset, opening, items, bonusItem, fairValue, rivals, toolsUsed: [], auctioneerLine,
    bidStep: bidIncrement(tier), pending: false, rivalIndex: 0, ceiling: 0, warnedPrice: 0,
    price: openingBid(tier), leader: '拍卖员', spent: 0, income: 0,
    collectedValue: 0, selected: -1, notice: '', phase: 'observe',
    // 特殊剧情标记（开拍前固定）
    bluffRevealed: false, // S03 阿岚装腔是否被拆穿过
  };
}
