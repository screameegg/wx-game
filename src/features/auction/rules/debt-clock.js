import { economy } from '../data/economy';

// 距下次还款还剩几场。进行中的这一场要等离开观察/竞价/揭晓才算完成。
export function auctionsRemaining(state) {
  const completed = ['observe', 'auction', 'reveal'].includes(state.phase) ? Math.max(0, state.round - 1) : state.round;
  const cycle = economy.repaymentCycleRounds;
  if (completed > 0 && completed % cycle === 0 && state.debtPeriod < completed / cycle) return 0;
  return cycle - (completed % cycle);
}
