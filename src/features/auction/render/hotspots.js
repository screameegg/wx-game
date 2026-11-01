import { hotspotRules, tierVisual } from '../data/observe-tiers';

export function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

export function tierRank(visibility) {
  const id = tierVisual(visibility).id;
  return id === 'doorway' ? 2 : id === 'silhouette' ? 1 : 0;
}

function separated(a, b, gap) {
  const xGap = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w));
  const yGap = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h));
  return xGap >= gap || yGap >= gap;
}

function containsCenter(rect, base) {
  const cx = base.x + base.w / 2;
  const cy = base.y + base.h / 2;
  return cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
}

function fits(rect, base, min) {
  return rect.w >= min && rect.h >= min && containsCenter(rect, base);
}

function clone(rect) {
  return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
}

function shaveSide(rect, other) {
  const left = Math.max(rect.x, other.x);
  const right = Math.min(rect.x + rect.w, other.x + other.w);
  const top = Math.max(rect.y, other.y);
  const bottom = Math.min(rect.y + rect.h, other.y + other.h);
  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return '';
  if (width <= height) return (left + right) / 2 >= rect.x + rect.w / 2 ? 'right' : 'left';
  return (top + bottom) / 2 >= rect.y + rect.h / 2 ? 'bottom' : 'top';
}

function applyShave(rect, side) {
  if (side === 'left') { rect.x += 1; rect.w -= 1; }
  else if (side === 'right') rect.w -= 1;
  else if (side === 'top') { rect.y += 1; rect.h -= 1; }
  else rect.h -= 1;
}

function tryShave(rect, other, base, min) {
  const side = shaveSide(rect, other);
  if (!side) return false;
  const next = clone(rect);
  applyShave(next, side);
  if (!fits(next, base, min)) return false;
  rect.x = next.x; rect.y = next.y; rect.w = next.w; rect.h = next.h;
  return true;
}

function pullApart(a, b, baseA, baseB, rankA, rankB, gap, min) {
  let guard = 0;
  while (!separated(a, b, gap) && guard < 400) {
    guard += 1;
    let moved = false;
    if (rankA > rankB) moved = tryShave(b, a, baseB, min) || tryShave(a, b, baseA, min);
    else if (rankB > rankA) moved = tryShave(a, b, baseA, min) || tryShave(b, a, baseB, min);
    else moved = tryShave(b, a, baseB, min) || tryShave(a, b, baseA, min);
    if (!moved) break;
  }
}

function ensureMin(rect, min) {
  if (rect.w < min) { rect.x -= (min - rect.w) / 2; rect.w = min; }
  if (rect.h < min) { rect.y -= (min - rect.h) / 2; rect.h = min; }
}

function grow(rect, base, pad, others, index, bounds, min) {
  ['left', 'right', 'top', 'bottom'].forEach((side) => {
    for (let step = 0; step < pad; step += 1) {
      const next = clone(rect);
      if (side === 'left') { next.x -= 1; next.w += 1; }
      else if (side === 'right') next.w += 1;
      else if (side === 'top') { next.y -= 1; next.h += 1; }
      else next.h += 1;
      if (next.x < bounds.x || next.y < bounds.y) break;
      if (next.x + next.w > bounds.x + bounds.w || next.y + next.h > bounds.y + bounds.h) break;
      if (!fits(next, base, min)) break;
      if (others.some((other, otherIndex) => otherIndex !== index && overlapArea(next, other) > 0)) break;
      rect.x = next.x; rect.y = next.y; rect.w = next.w; rect.h = next.h;
    }
  });
}

export function resolveHotspots(layout, visibilities, rules = hotspotRules) {
  const rects = layout.map((box) => ({ x: box.x, y: box.y, w: box.w, h: box.h }));
  rects.forEach((rect) => ensureMin(rect, rules.minSize));
  const ranks = visibilities.map((visibility) => tierRank(visibility));
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      pullApart(rects[i], rects[j], layout[i], layout[j], ranks[i], ranks[j], rules.gap, rules.minSize);
    }
  }
  rects.forEach((rect, index) => {
    const pad = tierVisual(visibilities[index]).pad || 0;
    if (pad > 0) grow(rect, layout[index], pad, rects, index, rules.bounds, rules.minSize);
  });
  return rects;
}

export function hotspotOrder(visibilities) {
  return visibilities.map((_, index) => index).sort((a, b) => tierRank(visibilities[a]) - tierRank(visibilities[b]) || a - b);
}

export function topHotspot(x, y, rects, visibilities) {
  const order = hotspotOrder(visibilities).slice().reverse();
  return order.find((index) => {
    const rect = rects[index];
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  });
}
