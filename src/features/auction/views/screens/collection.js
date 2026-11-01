import { palette } from '../../render/ui';
import { dockArgs } from '../../data/round7';
import { lots } from '../../data/lots';
import { catalogEntries, catalogStatus } from '../../data/catalog';
import { catalogSprite } from '../../render/sprites';
import {
  atlasHomeLayout, badgeBox, cellStatusLine, cellTextColumn, cellTokens, collectionCellBox,
  collectionChrome, collectTreasureNames, emptyCardBox, pagerY, themeRowBox, warehousePageSize,
  warehouseRowBox, warehouseStacks, warehouseStatusLine, warehouseTextColumn, warehouseThumbBox,
  thumbBox,
} from '../../data/round9';
import {
  drawCellPlate, drawEmptyState, drawPaneTab, drawRareBadge, drawThumbWell, drawWarehouseRow,
} from '../../fx/round9-present';

const themes = [['band', '乐队巡演'], ['photo', '摄影工作室'], ['repair', '旧维修铺'], ['other', '旧收藏']];
const treasures = collectTreasureNames(lots);

function paneOf(menu) {
  return menu.collectionPane === 'warehouse' ? 'warehouse' : 'atlas';
}

function paintTabs(scene, ctx) {
  const pane = paneOf(scene.menu);
  const y = collectionChrome.tabY;
  const h = collectionChrome.tabH;
  const gap = 8;
  const w = (cellTokens.width - gap) / 2;
  const x = cellTokens.margin;
  scene.button(ctx, '图鉴', x, y, w, h, () => { scene.menu.collectionPane = 'atlas'; }, true, {
    paint: (c, box) => drawPaneTab(c, box, pane === 'atlas'),
  });
  scene.button(ctx, '仓库', x + w + gap, y, w, h, () => {
    scene.menu.collectionPane = 'warehouse';
    scene.menu.warehousePage = 0;
  }, true, {
    paint: (c, box) => drawPaneTab(c, box, pane === 'warehouse'),
  });
}

function paintPager(scene, ctx, page, pages, prev, next) {
  const y = pagerY(scene.height);
  const w = (cellTokens.width - 8) / 2;
  if (page > 0) scene.button(ctx, '上一页', cellTokens.margin, y, w, 42, prev, true);
  if (page + 1 < pages) scene.button(ctx, '下一页', cellTokens.margin + w + 8, y, w, 42, next, true);
}

function paintCount(ctx, label, right, y) {
  ctx.save();
  ctx.font = '600 13px sans-serif';
  const width = ctx.measureText ? ctx.measureText(label).width : label.length * 13;
  ctx.restore();
  ctx.fillStyle = palette.gold;
  ctx.font = '600 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, right - width, y);
}

export function collection(scene, ctx) {
  if (paneOf(scene.menu) === 'warehouse') { paintWarehouse(scene, ctx); return; }
  paintAtlas(scene, ctx);
}

function paintAtlas(scene, ctx) {
  const entries = catalogEntries(scene.game.state);
  scene.text(ctx, '收藏图鉴', cellTokens.margin, collectionChrome.titleY, 25);
  paintTabs(scene, ctx);
  if (!scene.menu.collectionTheme) { paintAtlasHome(scene, ctx, entries); return; }
  paintAtlasTheme(scene, ctx, entries);
}

function paintAtlasHome(scene, ctx, entries) {
  const s = scene.game.state;
  const menu = scene.menu;
  const groups = themes.filter(([key]) => entries.some((entry) => entry.theme === key));
  const found = entries.filter((entry) => catalogStatus(s, entry.name).found).length;
  scene.text(ctx, `已收藏过 ${found} / ${entries.length} 种`, cellTokens.margin, collectionChrome.summaryY, 14, palette.muted);
  const layout = atlasHomeLayout(scene.height, groups.length, found === 0);
  if (layout.emptyBox) drawEmptyState(scene, ctx, 'collection', layout.emptyBox);
  groups.forEach(([key, title], i) => {
    const group = entries.filter((entry) => entry.theme === key);
    const count = group.filter((entry) => catalogStatus(s, entry.name).found).length;
    const box = themeRowBox(i, layout.themeTop);
    scene.button(ctx, `${title}  ${count} / ${group.length}`, box.x, box.y, box.w, box.h, () => {
      menu.collectionTheme = key;
      menu.collectionPage = 0;
    }, true);
  });
  scene.button(ctx, '返回首页', ...dockArgs(scene.height), () => { menu.view = 'home'; });
}

function paintAtlasTheme(scene, ctx, entries) {
  const s = scene.game.state;
  const menu = scene.menu;
  const group = entries.filter((entry) => entry.theme === menu.collectionTheme);
  const pages = Math.max(1, Math.ceil(group.length / cellTokens.pageSize));
  menu.collectionPage = Math.max(0, Math.min(menu.collectionPage || 0, pages - 1));
  const current = group.slice(menu.collectionPage * cellTokens.pageSize, menu.collectionPage * cellTokens.pageSize + cellTokens.pageSize);
  const title = (themes.find(([key]) => key === menu.collectionTheme) || [null, '收藏'])[1];
  scene.text(ctx, `${title} · ${menu.collectionPage + 1}/${pages}`, cellTokens.margin, collectionChrome.summaryY, 14, palette.muted);
  current.forEach((entry, i) => paintCell(scene, ctx, entry, i));
  paintPager(scene, ctx, menu.collectionPage, pages, () => { menu.collectionPage -= 1; }, () => { menu.collectionPage += 1; });
  scene.button(ctx, '返回分类', ...dockArgs(scene.height), () => { menu.collectionTheme = ''; });
}

function paintCell(scene, ctx, entry, index) {
  const s = scene.game.state;
  const status = catalogStatus(s, entry.name);
  const box = collectionCellBox(index);
  const text = cellTextColumn(box);
  const well = thumbBox(box);
  drawCellPlate(scene, ctx, box, status.found);
  drawThumbWell(ctx, well, status.found);
  if (status.found) catalogSprite(scene, ctx, entry.name, well);
  scene.paragraph(ctx, status.found ? entry.name : '尚未收藏', text.x, text.nameY, text.w, 16, 1);
  scene.text(ctx, cellStatusLine(status), text.x, text.statusY, 12, palette.muted);
  if (status.found && treasures.has(entry.name)) drawRareBadge(scene, ctx, badgeBox(box));
  if (!status.found) return;
  scene.buttons.push({
    x: box.x, y: box.y, w: box.w, h: box.h, label: `图鉴：${entry.name}`,
    action: () => { scene.menu.collectionEntry = entry.name; scene.menu.view = 'collectionDetail'; },
  });
}

export function collectionDetail(scene, ctx) {
  const s = scene.game.state;
  const entry = catalogEntries(s).find((item) => item.name === scene.menu.collectionEntry);
  if (!entry || !catalogStatus(s, entry.name).found) { scene.menu.view = 'collection'; collection(scene, ctx); return; }
  const status = catalogStatus(s, entry.name);
  scene.text(ctx, entry.name, cellTokens.margin, collectionChrome.titleY, 25);
  if (treasures.has(entry.name)) drawRareBadge(scene, ctx, { x: 307, y: 108, w: 52, h: 22 });
  scene.text(ctx, entry.title, cellTokens.margin, 154, 13, palette.muted);
  catalogSprite(scene, ctx, entry.name, { x: 82, y: 176, w: 210, h: 168 });
  scene.text(ctx, status.pledged ? '抵押中' : status.count ? `已收藏 ${status.count} 件` : '曾收藏', cellTokens.margin, 372, 16, palette.gold);
  scene.paragraph(ctx, entry.story, cellTokens.margin, 408, cellTokens.width, 15, 3);
  if (status.pledged) scene.text(ctx, '补齐欠款后自动赎回', cellTokens.margin, 492, 13, palette.muted);
  const back = paneOf(scene.menu) === 'warehouse' ? '返回仓库' : '返回图鉴';
  scene.button(ctx, back, ...dockArgs(scene.height), () => { scene.menu.view = 'collection'; });
}

function paintWarehouse(scene, ctx) {
  const s = scene.game.state;
  const menu = scene.menu;
  const entries = catalogEntries(s);
  const stacks = warehouseStacks(s);
  const pledged = !!(s.pledged && s.pledged.type === 'collection');
  scene.text(ctx, '我的仓库', cellTokens.margin, collectionChrome.titleY, 25);
  paintTabs(scene, ctx);
  const summary = pledged ? `在库 ${(s.collection || []).length} 件 · 另有抵押` : `在库 ${(s.collection || []).length} 件`;
  scene.text(ctx, summary, cellTokens.margin, collectionChrome.summaryY, 14, palette.muted);
  if (!stacks.length) {
    drawEmptyState(scene, ctx, 'warehouse', emptyCardBox(scene.height));
    scene.button(ctx, '返回图鉴', ...dockArgs(scene.height), () => { menu.collectionPane = 'atlas'; menu.collectionTheme = ''; });
    return;
  }
  const size = warehousePageSize(scene.height);
  const pages = Math.max(1, Math.ceil(stacks.length / size));
  menu.warehousePage = Math.max(0, Math.min(menu.warehousePage || 0, pages - 1));
  stacks.slice(menu.warehousePage * size, menu.warehousePage * size + size).forEach((row, i) => {
    paintWarehouseRow(scene, ctx, entries, row, i);
  });
  paintPager(scene, ctx, menu.warehousePage, pages, () => { menu.warehousePage -= 1; }, () => { menu.warehousePage += 1; });
  scene.button(ctx, '返回图鉴', ...dockArgs(scene.height), () => { menu.collectionPane = 'atlas'; menu.collectionTheme = ''; });
}

function paintWarehouseRow(scene, ctx, entries, row, index) {
  const box = warehouseRowBox(index);
  const well = warehouseThumbBox(box);
  const text = warehouseTextColumn(box);
  drawWarehouseRow(scene, ctx, box);
  drawThumbWell(ctx, well, true);
  catalogSprite(scene, ctx, row.name, well);
  if (treasures.has(row.name)) {
    drawRareBadge(scene, ctx, { x: well.x + well.w - 28, y: well.y - 4, w: 36, h: 16 });
  }
  scene.paragraph(ctx, row.name, text.x, text.nameY, text.w, 16, 1);
  scene.text(ctx, warehouseStatusLine(row), text.x, text.statusY, 12, palette.muted);
  const countLabel = row.count ? `${row.count} 件` : '抵押';
  paintCount(ctx, countLabel, box.x + box.w - 14, box.y + 42);
  const known = entries.some((entry) => entry.name === row.name);
  scene.buttons.push({
    x: box.x, y: box.y, w: box.w, h: box.h, label: `仓库：${row.name}`,
    action: () => {
      if (!known) return;
      scene.menu.collectionEntry = row.name;
      scene.menu.view = 'collectionDetail';
    },
  });
}
