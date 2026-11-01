import { panel, palette } from '../../render/ui';
import { catalogEntries, catalogStatus } from '../../data/catalog';
import { catalogSprite } from '../../render/sprites';

const themes = [['band', '乐队巡演'], ['photo', '摄影工作室'], ['repair', '旧维修铺'], ['other', '旧收藏']];

export function collection(scene, ctx) {
  const s = scene.game.state; const entries = catalogEntries(s); const menu = scene.menu;
  scene.text(ctx, '收藏图鉴', 24, 125, 25);
  if (!menu.collectionTheme) {
    const groups = themes.filter(([key]) => entries.some((entry) => entry.theme === key));
    const found = entries.filter((entry) => catalogStatus(s, entry.name).found).length;
    scene.text(ctx, `已收藏过 ${found} / ${entries.length} 种`, 24, 156, 14, palette.muted);
    groups.forEach(([key, title], i) => {
      const group = entries.filter((entry) => entry.theme === key);
      const count = group.filter((entry) => catalogStatus(s, entry.name).found).length;
      scene.button(ctx, `${title}  ${count} / ${group.length}`, 24, 180 + i * 66, 327, 52, () => { menu.collectionTheme = key; menu.collectionPage = 0; }, true);
    });
    scene.button(ctx, '返回首页', 24, scene.height - 68, 327, 48, () => { menu.view = 'home'; });
    return;
  }
  const group = entries.filter((entry) => entry.theme === menu.collectionTheme);
  const pages = Math.max(1, Math.ceil(group.length / 2));
  menu.collectionPage = Math.max(0, Math.min(menu.collectionPage || 0, pages - 1));
  const current = group.slice(menu.collectionPage * 2, menu.collectionPage * 2 + 2);
  const title = (themes.find(([key]) => key === menu.collectionTheme) || [null, '收藏'])[1];
  scene.text(ctx, `${title} · ${menu.collectionPage + 1}/${pages}`, 24, 158, 14, palette.muted);
  current.forEach((entry, i) => {
    const y = 178 + i * 128; const status = catalogStatus(s, entry.name);
    panel(ctx, 24, y, 327, 108, palette.panel, 14);
    if (status.found) catalogSprite(scene, ctx, entry.name, { x: 35, y: y + 10, w: 80, h: 80 });
    scene.text(ctx, status.found ? entry.name : '尚未收藏', 125, y + 39, 17, status.found ? palette.text : palette.muted);
    scene.text(ctx, status.pledged ? `抵押中${status.count ? ` · 收藏 ${status.count} 件` : ''}` : status.count ? `已收藏 ${status.count} 件` : status.found ? '曾收藏' : '在拍卖中发现', 125, y + 67, 12, palette.muted);
    if (status.found) scene.buttons.push({ x: 24, y, w: 327, h: 108, label: `图鉴：${entry.name}`, action: () => { menu.collectionEntry = entry.name; menu.view = 'collectionDetail'; } });
  });
  if (menu.collectionPage > 0) scene.button(ctx, '上一页', 24, 454, 145, 42, () => { menu.collectionPage--; }, true);
  if (menu.collectionPage + 1 < pages) scene.button(ctx, '下一页', 206, 454, 145, 42, () => { menu.collectionPage++; }, true);
  scene.button(ctx, '返回分类', 24, scene.height - 68, 327, 48, () => { menu.collectionTheme = ''; });
}

export function collectionDetail(scene, ctx) {
  const s = scene.game.state; const entry = catalogEntries(s).find((item) => item.name === scene.menu.collectionEntry);
  if (!entry || !catalogStatus(s, entry.name).found) { scene.menu.view = 'collection'; collection(scene, ctx); return; }
  const status = catalogStatus(s, entry.name);
  scene.text(ctx, entry.name, 24, 125, 25);
  scene.text(ctx, entry.title, 24, 154, 13, palette.muted);
  catalogSprite(scene, ctx, entry.name, { x: 82, y: 170, w: 210, h: 180 });
  scene.text(ctx, status.pledged ? '抵押中' : status.count ? `已收藏 ${status.count} 件` : '曾收藏', 24, 382, 16, palette.gold);
  scene.paragraph(ctx, entry.story, 24, 425, 327, 15, 3);
  if (status.pledged) scene.text(ctx, '补齐欠款后自动赎回', 24, 515, 13, palette.muted);
  scene.button(ctx, '返回图鉴', 24, scene.height - 68, 327, 48, () => { scene.menu.view = 'collection'; });
}
