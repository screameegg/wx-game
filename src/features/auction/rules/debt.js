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
  state.pledged = null; state.arrears = 0; state.prepaid = 0; state.overdue = 0; state.coins = 300; state.tier = 'starter'; state.tierPeriod = 0; state.round = 0; state.debtPeriod = 0;
  state.notice = '连续逾期，铺子被查封；降至入门档，金币重置为 300，抵押物失去。图鉴与主题保留。';
}
export function scheduledPayment(state) {
  return Math.round((state.tier === 'advanced' ? 600 : 200) * Math.pow(1.1, state.tierPeriod || 0));
}
export function paymentDue(state) {
  return Math.max(0, scheduledPayment(state) + (state.arrears || 0) - (state.prepaid || 0));
}
export function resolveRepayment(state) {
  if (state.round === 0 || state.round % 6 !== 0 || state.debtPeriod >= state.round / 6) return false;
  const due = paymentDue(state);
  state.debtPeriod++; state.tierPeriod++;
  if (state.coins >= due) {
    state.coins -= due; state.arrears = 0; state.prepaid = 0; state.overdue = 0; redeem(state);
    state.notice = due ? `本期已还款 ${due} 金币。继续攒钱准备下一期。` : '本期已提前还清。抵押物已赎回，继续经营。';
  } else {
    state.arrears = Math.ceil((due - state.coins) * 1.2); state.prepaid = 0; state.coins = 0; state.overdue++;
    if (state.overdue >= 2) closeShop(state);
    else state.notice = `还款不足，欠款含罚息 ${state.arrears} 金币。${pledge(state)}`;
  }
  return true;
}
