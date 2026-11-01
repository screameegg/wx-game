import { infoLevel } from './info-level';

// 手电、放大镜每次只让当前可见档 +1，封顶 3。用尽后再点不会改档。
export function deviceExhausted(entry, name, roundUses) {
  const usedOnItem = !!(entry && Array.isArray(entry.deviceUses) && entry.deviceUses.includes(name));
  return usedOnItem || (roundUses || []).includes(name);
}

export function tryDeviceStep(entry, name, options = {}) {
  const roundUses = options.roundUses || [];
  if (!entry) return { ok: false, notice: '先点选一件货物，再使用设备。' };
  if (entry.visibility !== 1) {
    const notice = entry.visibility === 0 ? '这件货物太暗，首版设备看不清。' : '这件货物已经看清，不需要设备。';
    return { ok: false, notice };
  }
  if (name !== '手电' && name !== '放大镜') return { ok: false, notice: '没有这件设备。' };
  if (name === '放大镜' && !entry.categoryKnown) return { ok: false, notice: '先对这件货物使用手电，看清类别后再用放大镜。' };
  if (name === '手电' && entry.categoryKnown) return { ok: false, notice: '这件货物的类别已看清，可以用放大镜检查表面。' };
  if (!options.owned) return { ok: false, notice: `还没有${name}，请先到设备页购买。` };
  if (deviceExhausted(entry, name, roundUses)) return { ok: false, notice: `${name}本场已经用过了。` };
  const from = infoLevel(entry);
  if (from >= 3 || (name === '手电' && from !== 1) || (name === '放大镜' && from !== 2)) {
    return { ok: false, notice: '这件货物已经看清，不需要设备。' };
  }
  const prev = {
    categoryKnown: entry.categoryKnown,
    conditionKnown: entry.conditionKnown,
    upgraded: entry.upgraded,
  };
  if (name === '手电') entry.categoryKnown = true;
  else { entry.conditionKnown = true; entry.upgraded = true; }
  const to = infoLevel(entry);
  if (to !== from + 1 || to > 3) {
    entry.categoryKnown = prev.categoryKnown;
    entry.conditionKnown = prev.conditionKnown;
    entry.upgraded = prev.upgraded;
    return { ok: false, notice: '这件货物已经看清，不需要设备。' };
  }
  entry.deviceUses = [...(entry.deviceUses || []), name];
  return { ok: true, from, to };
}
