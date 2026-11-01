// 第九轮收藏格和仓库列表。只放间距、角标和参考图路径。
// 件数、金币和债务仍以存档为准。这里不改数组，也不读本场成交价。
// 参考板可能带说明文字，useSheet 关掉，画面用下面的尺寸自己画。
// TODO: 无字切片到位后，把 useSheet 打开，只替换底板和角标。

import { layoutTokens } from './round7';

export const round9DropRoot = '/workspace/falcon-art-round9';

export const round9Files = {
  cellEmpty: 'cell_plate_empty.png',
  cellCollected: 'cell_plate_collected.png',
  rareBadge: 'rare_badge.png',
  warehouseRow: 'warehouse_row.png',
  emptyCollection: 'empty_collection.png',
  emptyWarehouse: 'empty_warehouse.png',
};

export function round9RepoPath(file) {
  return `assets/art/falcon-art-round9/${file}`;
}

export function round9DropPath(file) {
  return `${round9DropRoot}/${file}`;
}

export const round9Art = {
  cellEmpty: round9RepoPath(round9Files.cellEmpty),
  cellCollected: round9RepoPath(round9Files.cellCollected),
  rareBadge: round9RepoPath(round9Files.rareBadge),
  warehouseRow: round9RepoPath(round9Files.warehouseRow),
  emptyCollection: round9RepoPath(round9Files.emptyCollection),
  emptyWarehouse: round9RepoPath(round9Files.emptyWarehouse),
  useSheet: false,
};

export const round9Slots = Object.entries(round9Files).map(([key, file]) => ({
  key: `round9:${key}`,
  file,
  path: round9RepoPath(file),
  drop: round9DropPath(file),
}));

export const cellTokens = {
  margin: layoutTokens.margin,
  width: layoutTokens.designWidth - layoutTokens.margin * 2,
  height: 112,
  gap: 12,
  radius: 14,
  thumb: 72,
  thumbInset: 16,
  textGap: 16,
  badgeW: 52,
  badgeH: 22,
  badgeInset: 8,
  minHit: 44,
  pageSize: 2,
};

export const warehouseTokens = {
  margin: layoutTokens.margin,
  rowH: 72,
  gap: 8,
  thumb: 48,
  thumbInset: 12,
  radius: 12,
  minHit: 44,
  countSlot: 72,
};

export const collectionChrome = {
  titleY: 125,
  tabY: 142,
  tabH: 36,
  summaryY: 204,
  listTop: 220,
};

// 珍品角标停在右上角。不循环，也不闪。
export const rareBadgeSpec = {
  label: '珍品',
  corner: 'top-right',
  loop: false,
  flash: false,
  frames: 1,
  flashMs: 0,
};

export const plateFill = {
  collected: '#F5EDE0',
  empty: '#E6DDD0',
  line: '#C4A484',
  ink: '#2B2B2B',
  muted: '#8A8175',
  badge: '#E8A54B',
  badgeInk: '#2B2B2B',
  accent: '#2F5D50',
};

export const emptyCopy = {
  collection: '还没有收藏。拍下好货后可以选择收下。',
  warehouse: '仓库还是空的。收下的物件会列在这里，只能查看。',
};

// 展示用的珍品下限，对应图鉴里已经写好的好品售价。不写回货单，也不参与结算。
export const treasureFloor = 250;

const spoiled = /受潮|需修理|配件|杂物/;

export function collectTreasureNames(source, floor = treasureFloor) {
  const names = new Set();
  (source || []).forEach((lot) => {
    (lot.items || []).forEach((item, index) => {
      const good = item.good;
      if (item.collectible && good && !spoiled.test(good[0]) && good[2] >= floor) names.add(good[0]);
      (lot.presetResults || []).forEach((preset) => {
        const result = preset[index];
        if (!result) return;
        const eligible = (item.collectible && !spoiled.test(result[0])) || /唱片|海报/.test(result[0]);
        if (eligible && result[2] >= floor) names.add(result[0]);
      });
    });
    (lot.bonusPool || []).forEach((bonus) => {
      if (bonus.collectible && bonus.name && (bonus.jackpot || bonus.minVal >= floor)) names.add(bonus.name);
    });
  });
  return names;
}

export function cellStatusLine(status) {
  if (status.pledged) return `抵押中${status.count ? ` · 收藏 ${status.count} 件` : ''}`;
  if (status.count) return `已收藏 ${status.count} 件`;
  if (status.found) return '曾收藏';
  return '在拍卖中发现';
}

export function warehouseStatusLine(row) {
  if (row.pledged && row.count) return `在库 ${row.count} 件 · 抵押中`;
  if (row.pledged) return '抵押中';
  return `在库 ${row.count} 件`;
}

// 只读收藏数组。抵押中的一件如果已经从数组取出，单独标出，不塞回去。
export function warehouseStacks(state) {
  const counts = new Map();
  const order = [];
  (state.collection || []).forEach((name) => {
    if (!counts.has(name)) order.push(name);
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  const pledged = state.pledged && state.pledged.type === 'collection' ? state.pledged.name : '';
  if (pledged && !counts.has(pledged)) order.push(pledged);
  return order.map((name) => ({
    name,
    count: counts.get(name) || 0,
    pledged: pledged === name,
  }));
}

export function collectionCellBox(index, top = collectionChrome.listTop) {
  const t = cellTokens;
  return {
    x: t.margin,
    y: top + index * (t.height + t.gap),
    w: t.width,
    h: Math.max(t.height, t.minHit),
  };
}

export function badgeBox(cell) {
  const t = cellTokens;
  return {
    x: cell.x + cell.w - t.badgeInset - t.badgeW,
    y: cell.y + t.badgeInset,
    w: t.badgeW,
    h: t.badgeH,
  };
}

export function thumbBox(cell) {
  const t = cellTokens;
  return {
    x: cell.x + t.thumbInset,
    y: cell.y + (cell.h - t.thumb) / 2,
    w: t.thumb,
    h: t.thumb,
  };
}

export function cellTextColumn(cell) {
  const thumb = thumbBox(cell);
  const badge = badgeBox(cell);
  const x = thumb.x + thumb.w + cellTokens.textGap;
  return {
    x,
    nameY: cell.y + 48,
    statusY: cell.y + 74,
    w: Math.max(48, badge.x - 8 - x),
  };
}

export function warehouseRowBox(index, top = collectionChrome.listTop) {
  const t = warehouseTokens;
  return {
    x: t.margin,
    y: top + index * (t.rowH + t.gap),
    w: layoutTokens.designWidth - t.margin * 2,
    h: Math.max(t.rowH, t.minHit),
  };
}

export function warehouseThumbBox(row) {
  const t = warehouseTokens;
  return {
    x: row.x + t.thumbInset,
    y: row.y + (row.h - t.thumb) / 2,
    w: t.thumb,
    h: t.thumb,
  };
}

export function warehouseTextColumn(row) {
  const thumb = warehouseThumbBox(row);
  const x = thumb.x + thumb.w + 12;
  return {
    x,
    nameY: row.y + 30,
    statusY: row.y + 52,
    w: Math.max(48, row.x + row.w - warehouseTokens.countSlot - x),
  };
}

export function pagerY(height) {
  return height - layoutTokens.margin - layoutTokens.ctaHeight - 50;
}

export function warehousePageSize(height, top = collectionChrome.listTop) {
  const limit = pagerY(height) - 8;
  const stride = warehouseTokens.rowH + warehouseTokens.gap;
  const room = limit - top + warehouseTokens.gap;
  return Math.max(1, Math.min(5, Math.floor(room / stride)));
}

export function themeRowBox(index, top) {
  return {
    x: cellTokens.margin,
    y: top + index * 60,
    w: cellTokens.width,
    h: 52,
  };
}

export function emptyCardBox(height, top = collectionChrome.listTop) {
  const dockY = height - layoutTokens.margin - layoutTokens.ctaHeight;
  return {
    x: cellTokens.margin,
    y: top,
    w: cellTokens.width,
    h: Math.max(156, Math.min(188, dockY - top - 12)),
  };
}

// 空收藏时给一条横幅留插画位，主题按钮仍要落在底栏上面。
export function atlasHomeLayout(height, groupCount, showEmpty) {
  const dockY = height - layoutTokens.margin - layoutTokens.ctaHeight;
  const stride = 60;
  const block = Math.max(0, groupCount) * stride;
  const minTop = collectionChrome.listTop;
  if (!groupCount && showEmpty) {
    return { themeTop: dockY, emptyBox: emptyCardBox(height, minTop), dockY };
  }
  const banner = showEmpty ? 96 : 0;
  let themeTop = minTop + banner;
  if (themeTop + block > dockY - 4) themeTop = dockY - 4 - block;
  const emptyBox = showEmpty ? {
    x: cellTokens.margin,
    y: minTop,
    w: cellTokens.width,
    h: Math.max(72, themeTop - minTop - 12),
  } : null;
  return { themeTop, emptyBox, dockY };
}
