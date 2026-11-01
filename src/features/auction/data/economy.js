// 债务、档位与经营门槛。只集中数值，还款与竞价流程仍在 rules / game。
// 四项偏离产品文档 V1.1，原因：平衡模拟冻结（2026 年 10/11 月）：
// 首期还款 350（原 200），进阶档门槛 1500（原 2000），
// 连续逾期 3 次后查封（原 2），罚息 10% / 1.10（原 20% / 1.20）。
// 进阶档首期仍是显式常量 600，不从入门档首期推导。

export const economy = {
  startingCoins: 600,

  repaymentCycleRounds: 6,
  starterFirstPayment: 350,
  advancedFirstPayment: 600,
  periodGrowth: 1.10,
  overduePenalty: 1.10,
  seizureOverdueCount: 3,
  seizureResetCoins: 300,

  advancedEntryCoins: 1500,
  starterBidStart: 100,
  starterBidStep: 20,
  advancedBidStart: 300,
  advancedBidStep: 60,
  starterValueMultiplier: 1,
  advancedValueMultiplier: 3,

  themeUnlock: {
    photo: 750,
    repair: 900,
  },

  recoverBelowCoins: 100,
  recoverCoins: 150,

  toolCost: {
    手电: 150,
    放大镜: 250,
  },
};

export function paymentBase(tier) {
  return tier === 'advanced' ? economy.advancedFirstPayment : economy.starterFirstPayment;
}

export function openingBid(tier) {
  return tier === 'advanced' ? economy.advancedBidStart : economy.starterBidStart;
}

export function bidIncrement(tier) {
  return tier === 'advanced' ? economy.advancedBidStep : economy.starterBidStep;
}

export function lotValueMultiplier(tier) {
  return tier === 'advanced' ? economy.advancedValueMultiplier : economy.starterValueMultiplier;
}
