// 第九轮收藏格和仓库列表。只放间距、文案和贴图路径。
// 收藏判定、出价、结算和债务都不在这里读改。正式图未到时 useSheet 保持关闭，画面用矢量占位。

export const round9DropRoot = '/workspace/falcon-art-round9';

export const round9Art = {
  cellPlate: 'assets/art/falcon-art-round9/cell_plate.png',
  cellPlateIdle: 'assets/art/falcon-art-round9/cell_plate_idle.png',
  rareBadge: 'assets/art/falcon-art-round9/rare_badge.png',
  emptyCollection: 'assets/art/falcon-art-round9/empty_collection.png',
  emptyWarehouse: 'assets/art/falcon-art-round9/empty_warehouse.png',
  useSheet: false,
};

const round9Files = [
  { id: 'cellPlate', file: 'cell_plate.png' },
  { id: 'cellPlateIdle', file: 'cell_plate_idle.png' },
  { id: 'rareBadge', file: 'rare_badge.png' },
  { id: 'emptyCollection', file: 'empty_collection.png' },
  { id: 'emptyWarehouse', file: 'empty_warehouse.png' },
];

export function round9DropPath(file) {
  return `${round9DropRoot}/${file}`;
}

export const round9Slots = round9Files.map((row) => ({
  id: row.id,
  file: row.file,
  key: `round9:${row.id}`,
  path: round9Art[row.id],
  drop: round9DropPath(row.file),
}));

export function round9Listing() {
  return round9Slots.map((slot) => ({
    id: slot.id,
    key: slot.key,
    path: slot.path,
    drop: slot.drop,
  }));
}

export function resolveArt(art, id, useSheet = round9Art.useSheet) {
  if (!useSheet || !art || typeof art.get !== 'function') return null;
  const image = art.get(`round9:${id}`);
  if (!image || !(image.width > 0)) return null;
  return image;
}

export const plateFill = { found: '#fff6e4', idle: '#e6dfd2' };
export const plateLine = { found: '#c4924a', idle: '#a39888' };

export const shelfTokens = {
  margin: 16,
  designWidth: 375,
  gridColumns: 2,
  gridGap: 12,
  gridCellH: 132,
  listRowH: 76,
  listGap: 10,
  thumb: 52,
  minHit: 64,
  radius: 14,
  dragSlop: 8,
  emptyBlockH: 140,
  emptyArt: { w: 120, h: 84 },
  badge: { corner: 'tr', size: 22, inset: 6, count: 1, loop: false, blink: false },
};

export const emptyCopy = {
  collection: '还没有收藏。',
  warehouse: '仓库是空的。',
};

export function rareCatalogNames(lots) {
  const names = [];
  (lots || []).forEach((lot) => {
    (lot.bonusPool || []).forEach((item) => {
      if (item && item.jackpot === true && item.name && !names.includes(item.name)) names.push(item.name);
    });
  });
  return names;
}

export function catalogStateCopy(status) {
  if (!status || !status.found) return { mode: 'idle', detail: '' };
  if (status.pledged) return { mode: 'found', detail: '抵押中' };
  if (status.count > 1) return { mode: 'found', detail: `已收藏 ${status.count} 件` };
  if (status.count === 1) return { mode: 'found', detail: '已收藏' };
  return { mode: 'found', detail: '曾收藏' };
}

export function warehouseEntries(state) {
  const counts = new Map();
  const order = [];
  ((state && state.collection) || []).forEach((name) => {
    if (!counts.has(name)) order.push(name);
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  const pledged = state && state.pledged && state.pledged.type === 'collection' ? state.pledged.name : '';
  if (pledged && !counts.has(pledged)) order.push(pledged);
  return order.map((name) => {
    const count = counts.get(name) || 0;
    const isPledged = pledged === name;
    let status = '在库';
    if (isPledged) status = '抵押中';
    else if (count > 1) status = `在库 ${count} 件`;
    return { name, count, pledged: isPledged, status };
  });
}

export function gridMetrics(width = shelfTokens.designWidth) {
  const gap = shelfTokens.gridGap;
  const cols = shelfTokens.gridColumns;
  const inner = width - shelfTokens.margin * 2;
  const cellW = Math.floor((inner - gap * (cols - 1)) / cols);
  const used = cols * cellW + (cols - 1) * gap;
  const x0 = shelfTokens.margin + Math.floor((inner - used) / 2);
  return {
    cols, gap, cellW, cellH: shelfTokens.gridCellH, x0, strideX: cellW + gap, strideY: shelfTokens.gridCellH + gap,
  };
}

export function catalogBlocks(count, showEmpty, width = shelfTokens.designWidth) {
  const metrics = gridMetrics(width);
  const head = showEmpty ? shelfTokens.emptyBlockH : 0;
  const slots = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % metrics.cols;
    const row = Math.floor(i / metrics.cols);
    slots.push({
      x: metrics.x0 + col * metrics.strideX,
      y: head + row * metrics.strideY,
      w: metrics.cellW,
      h: metrics.cellH,
    });
  }
  const contentH = slots.length ? slots[slots.length - 1].y + slots[slots.length - 1].h : head;
  return { metrics, head, slots, contentH };
}

export function listBlocks(count, width = shelfTokens.designWidth) {
  const gap = shelfTokens.listGap;
  const h = shelfTokens.listRowH;
  const slots = [];
  for (let i = 0; i < count; i += 1) {
    slots.push({
      x: shelfTokens.margin,
      y: i * (h + gap),
      w: width - shelfTokens.margin * 2,
      h,
    });
  }
  const contentH = count > 0 ? count * h + (count - 1) * gap : shelfTokens.emptyBlockH;
  return { slots, contentH, stride: h + gap };
}

export function badgeBox(cell) {
  const badge = shelfTokens.badge;
  return {
    x: cell.x + cell.w - badge.size - badge.inset,
    y: cell.y + badge.inset,
    w: badge.size,
    h: badge.size,
  };
}

export function cellContent(cell) {
  const pad = 8;
  return {
    thumb: { x: cell.x + pad, y: cell.y + pad, w: cell.w - pad * 2, h: 74 },
    titleX: cell.x + pad,
    titleY: cell.y + cell.h - 28,
    titleW: cell.w - pad * 2,
    detailX: cell.x + pad,
    detailY: cell.y + cell.h - 12,
  };
}

export function rowContent(row) {
  const pad = 12;
  const thumb = shelfTokens.thumb;
  const box = {
    x: row.x + pad,
    y: row.y + (row.h - thumb) / 2,
    w: thumb,
    h: thumb,
  };
  return {
    thumb: box,
    nameX: box.x + box.w + 12,
    nameY: row.y + 30,
    statusX: box.x + box.w + 12,
    statusY: row.y + 54,
  };
}

export function emptyContentBox(width = shelfTokens.designWidth) {
  const art = shelfTokens.emptyArt;
  const inner = width - shelfTokens.margin * 2;
  return {
    x: shelfTokens.margin + (inner - art.w) / 2,
    y: 6,
    w: art.w,
    h: art.h,
  };
}

export function clampShelfScroll(offset, max) {
  const value = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cap = Math.max(0, Number(max) || 0);
  return Math.min(cap, Math.max(0, value));
}

export function scrollBy(offset, delta, max) {
  return clampShelfScroll((Number(offset) || 0) + delta, max);
}

export function snapShelfScroll(offset, stride, max) {
  const step = stride > 0 ? stride : 1;
  const snapped = Math.round(clampShelfScroll(offset, max) / step) * step;
  return clampShelfScroll(snapped, max);
}

export function maxScroll(contentH, viewH) {
  return Math.max(0, contentH - viewH);
}

export function placeContent(box, view, offset) {
  return { ...box, y: view.y + box.y - offset };
}

export function hitInView(slot, view) {
  if (!slot || !view) return null;
  if (slot.y >= view.y && slot.y + slot.h <= view.y + view.h) {
    return { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
  }
  const top = Math.max(slot.y, view.y);
  const bottom = Math.min(slot.y + slot.h, view.y + view.h);
  const h = bottom - top;
  if (h < shelfTokens.minHit) return null;
  return { x: slot.x, y: top, w: slot.w, h };
}

export function shelfLayout(height, {
  tab = 'catalog',
  themes = [],
  showEmpty = false,
  itemCount = 0,
  width = shelfTokens.designWidth,
} = {}) {
  const m = shelfTokens.margin;
  const title = { x: 24, y: 120, size: 24 };
  const subtitle = { x: 24, y: 146, size: 13 };
  const tabsY = 164;
  const tabGap = 8;
  const tabW = Math.floor((width - m * 2 - tabGap) / 2);
  const tabs = [
    { id: 'catalog', label: '图鉴', x: m, y: tabsY, w: tabW, h: 44 },
    { id: 'warehouse', label: '仓库', x: m + tabW + tabGap, y: tabsY, w: width - m - (m + tabW + tabGap), h: 44 },
  ];
  let cursor = tabsY + 44;
  let chips = [];
  if (tab === 'catalog' && themes.length) {
    const chipsY = cursor + 8;
    const gap = 8;
    const inner = width - m * 2;
    const cw = Math.floor((inner - gap * (themes.length - 1)) / themes.length);
    chips = themes.map((theme, index) => ({
      id: theme.id,
      label: theme.label,
      x: m + index * (cw + gap),
      y: chipsY,
      w: cw,
      h: 44,
    }));
    cursor = chipsY + 44;
  }
  const top = cursor + 10;
  const dock = { x: m, y: height - m - 48, w: width - m * 2, h: 48 };
  const blocks = tab === 'warehouse' ? listBlocks(itemCount, width) : catalogBlocks(itemCount, showEmpty, width);
  const contentH = blocks.contentH;
  const stride = tab === 'warehouse' ? listBlocks(1, width).stride : blocks.metrics.strideY;
  const scrollable = contentH > dock.y - 8 - top + 0.5;
  const pagerH = scrollable ? 44 : 0;
  const pagerGap = scrollable ? 8 : 0;
  const view = {
    x: m,
    y: top,
    w: width - m * 2,
    h: Math.max(0, dock.y - 8 - pagerGap - pagerH - top),
  };
  const pager = scrollable ? {
    up: { x: m, y: view.y + view.h + 8, w: tabW, h: 44 },
    down: { x: m + tabW + tabGap, y: view.y + view.h + 8, w: width - m - (m + tabW + tabGap), h: 44 },
  } : null;
  const wantsEmpty = tab === 'warehouse' ? itemCount === 0 : showEmpty;
  return {
    title,
    subtitle,
    tabs,
    chips,
    view,
    dock,
    pager,
    max: maxScroll(contentH, view.h),
    stride,
    contentH,
    slots: blocks.slots,
    emptyBox: wantsEmpty ? emptyContentBox(width) : null,
    emptyLine: wantsEmpty ? { x: m, y: shelfTokens.emptyBlockH - 22 } : null,
    scrollable,
  };
}
