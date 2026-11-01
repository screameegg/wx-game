// 信息程度只表示玩家看见多少，不改变货物本身。
// 0 看不见，1 轮廓，2 类别（手电），3 表面（放大镜，或门口本来就看得清），4 已揭晓。
export function infoLevel(entry) {
  if (!entry) return 0;
  if (entry.status && entry.status !== 'hidden') return 4;
  if ((entry.visibility || 0) <= 0) return 0;
  if (entry.visibility >= 2 || entry.conditionKnown) return 3;
  if (entry.categoryKnown || entry.upgraded) return 2;
  return 1;
}
