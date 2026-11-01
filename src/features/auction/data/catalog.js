import { lots } from './lots';

// 图鉴只收录现有玩法中可以收藏的物品，不生成新物品或改变价格。
export function catalogEntries(state) {
  const entries = [];
  const add = (theme, title, name, story) => {
    if (name && !entries.some((entry) => entry.name === name)) entries.push({ theme, title, name, story });
  };
  lots.forEach((lot) => {
    const title = lot.name;
    if (lot.presetResults) lot.presetResults.forEach((preset) => preset.forEach((result, index) => {
      const good = !/受潮|需修理|配件|杂物/.test(result[0]);
      if ((lot.items[index].collectible && good) || /唱片|海报/.test(result[0])) add(lot.theme, title, result[0], result[1]);
    }));
    else lot.items.forEach((item) => { if (item.collectible) add(lot.theme, title, item.good[0], item.good[1]); });
    (lot.bonusPool || []).forEach((item) => { if (item.collectible) add(lot.theme, title, item.name, item.description); });
  });
  const saved = [...state.discovered, ...state.collection];
  if (state.pledged && state.pledged.type === 'collection') saved.push(state.pledged.name);
  saved.forEach((name) => add('other', '旧收藏', name, '此前留下的收藏品。'));
  return entries;
}

export function catalogStatus(state, name) {
  const pledged = !!state.pledged && state.pledged.type === 'collection' && state.pledged.name === name;
  const count = state.collection.filter((entry) => entry === name).length;
  return { count, pledged, found: count > 0 || pledged || state.discovered.includes(name) };
}
