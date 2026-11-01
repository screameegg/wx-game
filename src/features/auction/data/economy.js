// V1.1 债务、档位与经营门槛。只集中数值，还款与竞价流程仍在 rules / game。

export const economy = {
  startingCoins: 600,

  repaymentCycleRounds: 6,
  starterFirstPayment: 200,
  advancedFirstPayment: 600,
  periodGrowth: 1.1,
  overduePenalty: 1.2,
  seizureOverdueCount: 2,
  seizureResetCoins: 300,

  advancedEntryCoins: 2000,
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
