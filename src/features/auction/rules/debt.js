import { economy, paymentBase } from '../data/economy';
import { applyCreditor, repaymentCreditorKey } from '../data/lines';

function redeem(state) {
  if (!state.pledged) return;
  if (state.pledged.type === 'collection') state.collection.push(state.pledged.name);
  else state.equipment.push(state.pledged.name);
  state.pledged = null;
}
function pledge(state) {
  const name = state.collection.pop(); const equipment = name ? null : state.equipment.pop();
  state.pledged = name ? { type: 'collection', name } : equipment ? { type: 'equipment', name: equipment } : null;
  return state.pledged ? `已抵押${state.pledged.name}。` : '暂无可抵押物。';
}
function closeShop(state) {
  state.pledged = null; state.arrears = 0; state.prepaid = 0; state.overdue = 0; state.coins = economy.seizureResetCoins; state.tier = 'starter'; state.tierPeriod = 0; state.round = 0; state.debtPeriod = 0;
  state.notice = `连续逾期，铺子被查封；降至入门档，金币重置为 ${economy.seizureResetCoins}，抵押物失去。图鉴与主题保留。`;
  applyCreditor(state, 'seize');
}
export function scheduledPayment(state) {
  return Math.round(paymentBase(state.tier) * Math.pow(economy.periodGrowth, state.tierPeriod || 0));
}
export function paymentDue(state) {
  return Math.max(0, scheduledPayment(state) + (state.arrears || 0) - (state.prepaid || 0));
}
export function resolveRepayment(state) {
  const cycle = economy.repaymentCycleRounds;
  if (state.round === 0 || state.round % cycle !== 0 || state.debtPeriod >= state.round / cycle) return false;
  const due = paymentDue(state);
  state.debtPeriod++; state.tierPeriod++;
  if (state.coins >= due) {
    const redeemed = !!state.pledged;
    state.coins -= due; state.arrears = 0; state.prepaid = 0; state.overdue = 0; redeem(state);
    state.notice = due ? `本期已还款 ${due} 金币。继续攒钱准备下一期。` : '本期已提前还清。抵押物已赎回，继续经营。';
    applyCreditor(state, repaymentCreditorKey({ paid: true, redeemed }));
  } else {
    state.arrears = Math.ceil((due - state.coins) * economy.overduePenalty); state.prepaid = 0; state.coins = 0; state.overdue++;
    if (state.overdue >= economy.seizureOverdueCount) closeShop(state);
    else {
      const pledgedNote = pledge(state);
      state.notice = `还款不足，欠款含罚息 ${state.arrears} 金币。${pledgedNote}`;
      const nearSeize = economy.seizureOverdueCount - state.overdue <= 1;
      applyCreditor(state, repaymentCreditorKey({ paid: false, nearSeize, pledged: !!state.pledged }));
    }
  }
  return true;
}
