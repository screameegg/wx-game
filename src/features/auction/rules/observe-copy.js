// 观察文案只跟玩家已经解锁的信息走。不写售价、真名说明，也不读对手预算。

export function playerCopy(item, entry, lot, index) {
  if (!item || !entry) return '';
  if ((entry.visibility || 0) <= 0) return '深处还有东西，无法辨认形状。';
  if (entry.visibility === 1) {
    const shape = `${item.shape}：只能看见形状，内容不明。`;
    if (!(entry.categoryKnown || entry.upgraded)) return `${shape}需要手电。`;
    const category = `手电显示类别：${item.category}。`;
    const surface = entry.conditionKnown ? `表面线索：${item.hint}` : '';
    return `${shape}${category}${surface}`;
  }
  if (lot && lot.theme === 'band' && index === 0) {
    return `${item.clue}：${entry.good ? '轮胎没气，车架完整。' : '轮胎没气，车架需要修理。'}`;
  }
  return `${item.clue}：${item.hint}`;
}
