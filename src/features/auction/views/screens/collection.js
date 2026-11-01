import { palette } from '../../render/ui';
import { lots } from '../../data/lots';
import { catalogEntries, catalogStatus } from '../../data/catalog';
import { catalogSprite } from '../../render/sprites';
import {
  badgeBox, catalogStateCopy, cellContent, clampShelfScroll, emptyCopy, hitInView, placeContent,
  rareCatalogNames, resolveArt, rowContent, scrollBy, shelfLayout, warehouseEntries,
} from '../../data/round9';
import { paintCellPlate, paintEmptySlot, paintIdleMark, paintRareBadge, paintRowPlate } from '../../fx/round9-shelf';

const themeMeta = [
  ['band', '乐队巡演', '乐队'],
  ['photo', '摄影工作室', '摄影'],
  ['repair', '旧维修铺', '维修'],
  ['other', '旧收藏', '旧藏'],
];

function openShelf(menu) {
  menu.collectionTheme = '';
  menu.collectionTab = 'catalog';
  menu.shelfOffset = 0;
  menu.view = 'collection';
}

export function openCollection(menu) {
  openShelf(menu);
}

export function collection(scene, ctx) {
  const state = scene.game.state;
  const entries = catalogEntries(state);
  const menu = scene.menu;
  const tab = menu.collectionTab === 'warehouse' ? 'warehouse' : 'catalog';
  const found = entries.filter((entry) => catalogStatus(state, entry.name).found).length;
  const rareNames = rareCatalogNames(lots);
  const available = themeMeta.filter(([key]) => entries.some((entry) => entry.theme === key));
  const active = available.some(([key]) => key === menu.collectionTheme) ? menu.collectionTheme : (available[0] && available[0][0]);
  const themeTitle = (available.find(([key]) => key === active) || [null, '收藏', '收藏'])[1];
  const group = tab === 'catalog' ? entries.filter((entry) => entry.theme === active) : [];
  const held = warehouseEntries(state);
  const showEmpty = found === 0;
  const layout = shelfLayout(scene.height, {
    tab,
    themes: available.map(([id, , label]) => ({ id, label })),
    showEmpty,
    itemCount: tab === 'warehouse' ? held.length : group.length,
  });
  menu.shelfOffset = clampShelfScroll(menu.shelfOffset || 0, layout.max);
  const offset = menu.shelfOffset;

  scene.text(ctx, '收藏图鉴', layout.title.x, layout.title.y, layout.title.size);
  const heldPieces = held.reduce((sum, row) => sum + Math.max(row.count, row.pledged ? 1 : 0), 0);
  const subtitle = tab === 'warehouse'
    ? `在库 ${heldPieces} 件`
    : `${themeTitle} · 已收藏过 ${found} / ${entries.length} 种`;
  scene.text(ctx, subtitle, layout.subtitle.x, layout.subtitle.y, layout.subtitle.size, palette.muted);

  layout.tabs.forEach((chip) => {
    scene.button(ctx, chip.label, chip.x, chip.y, chip.w, chip.h, () => {
      menu.collectionTab = chip.id;
      menu.shelfOffset = 0;
    }, chip.id !== tab);
  });
  if (tab === 'catalog') {
    layout.chips.forEach((chip) => {
      scene.button(ctx, chip.label, chip.x, chip.y, chip.w, chip.h, () => {
        menu.collectionTheme = chip.id;
        menu.shelfOffset = 0;
      }, chip.id !== active);
    });
  }

  const view = layout.view;
  ctx.save();
  ctx.beginPath();
  ctx.rect(view.x, view.y, view.w, view.h);
  ctx.clip();
  if (layout.emptyBox) {
    const artId = tab === 'warehouse' ? 'emptyWarehouse' : 'emptyCollection';
    const emptyBox = placeContent(layout.emptyBox, view, offset);
    paintEmptySlot(ctx, emptyBox, tab === 'warehouse' ? 'warehouse' : 'collection', resolveArt(scene.art, artId));
    const line = placeContent(layout.emptyLine, view, offset);
    scene.text(ctx, tab === 'warehouse' ? emptyCopy.warehouse : emptyCopy.collection, line.x, line.y, 15, palette.muted);
  }
  if (tab === 'warehouse') {
    held.forEach((row, index) => paintWarehouseRow(scene, ctx, row, placeContent(layout.slots[index], view, offset), view));
  } else {
    group.forEach((entry, index) => {
      paintCatalogCell(scene, ctx, entry, catalogStatus(state, entry.name), placeContent(layout.slots[index], view, offset), view, rareNames);
    });
  }
  ctx.restore();

  if (layout.pager) {
    scene.button(ctx, '往上', layout.pager.up.x, layout.pager.up.y, layout.pager.up.w, layout.pager.up.h, () => {
      menu.shelfOffset = scrollBy(menu.shelfOffset, -layout.stride, layout.max);
    }, true, { disabled: offset <= 0 });
    scene.button(ctx, '往下', layout.pager.down.x, layout.pager.down.y, layout.pager.down.w, layout.pager.down.h, () => {
      menu.shelfOffset = scrollBy(menu.shelfOffset, layout.stride, layout.max);
    }, true, { disabled: offset >= layout.max });
  }
  scene.button(ctx, '返回首页', layout.dock.x, layout.dock.y, layout.dock.w, layout.dock.h, () => { menu.view = 'home'; });
  scene.shelf = { viewport: view, offset, max: layout.max, stride: layout.stride };
}

function paintCatalogCell(scene, ctx, entry, status, slot, view, rareNames) {
  const look = catalogStateCopy(status);
  const plateId = look.mode === 'found' ? 'cellPlate' : 'cellPlateIdle';
  paintCellPlate(ctx, slot, look.mode, resolveArt(scene.art, plateId));
  const inner = cellContent(slot);
  if (look.mode === 'found') catalogSprite(scene, ctx, entry.name, inner.thumb);
  else paintIdleMark(ctx, inner.thumb);
  if (look.mode === 'found') scene.paragraph(ctx, entry.name, inner.titleX, inner.titleY, inner.titleW, 14, 1);
  else scene.text(ctx, '未收集', inner.titleX, inner.titleY, 14, palette.muted);
  if (look.detail) scene.text(ctx, look.detail, inner.detailX, inner.detailY, 11, look.detail === '曾收藏' ? palette.muted : palette.gold);
  if (look.mode === 'found' && rareNames.includes(entry.name)) {
    paintRareBadge(ctx, badgeBox(slot), resolveArt(scene.art, 'rareBadge'));
  }
  const hit = look.mode === 'found' ? hitInView(slot, view) : null;
  if (!hit) return;
  scene.buttons.push({
    x: hit.x, y: hit.y, w: hit.w, h: hit.h, label: `图鉴：${entry.name}`, role: `cell:${entry.name}`, confirm: 'release',
    action: () => { scene.menu.collectionEntry = entry.name; scene.menu.view = 'collectionDetail'; },
  });
}

function paintWarehouseRow(scene, ctx, row, slot, view) {
  paintRowPlate(ctx, slot, resolveArt(scene.art, 'cellPlate'));
  const inner = rowContent(slot);
  catalogSprite(scene, ctx, row.name, inner.thumb);
  scene.text(ctx, row.name, inner.nameX, inner.nameY, 16, palette.text);
  scene.text(ctx, row.status, inner.statusX, inner.statusY, 12, palette.gold);
  const hit = hitInView(slot, view);
  if (!hit) return;
  scene.buttons.push({
    x: hit.x, y: hit.y, w: hit.w, h: hit.h, label: `仓库：${row.name}`, role: `row:${row.name}`, confirm: 'release',
    action: () => { scene.menu.collectionEntry = row.name; scene.menu.view = 'collectionDetail'; },
  });
}

export function collectionDetail(scene, ctx) {
  const state = scene.game.state;
  const entry = catalogEntries(state).find((item) => item.name === scene.menu.collectionEntry);
  if (!entry || !catalogStatus(state, entry.name).found) {
    scene.menu.view = 'collection';
    collection(scene, ctx);
    return;
  }
  const status = catalogStatus(state, entry.name);
  const look = catalogStateCopy(status);
  scene.text(ctx, entry.name, 24, 125, 25);
  scene.text(ctx, entry.title, 24, 154, 13, palette.muted);
  const portrait = { x: 82, y: 170, w: 210, h: 180 };
  catalogSprite(scene, ctx, entry.name, portrait);
  if (rareCatalogNames(lots).includes(entry.name)) paintRareBadge(ctx, badgeBox(portrait), resolveArt(scene.art, 'rareBadge'));
  scene.text(ctx, look.detail || '曾收藏', 24, 382, 16, palette.gold);
  scene.paragraph(ctx, entry.story, 24, 425, 327, 15, 3);
  if (status.pledged) scene.text(ctx, '补齐欠款后自动赎回', 24, 515, 13, palette.muted);
  const back = scene.menu.collectionTab === 'warehouse' ? '返回仓库' : '返回图鉴';
  scene.button(ctx, back, 16, scene.height - 16 - 48, 343, 48, () => { scene.menu.view = 'collection'; });
}
