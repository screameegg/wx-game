// 第八轮摄影工作室与旧维修铺单件图。只登记路径，不读价格。
// 正面已在 assets/art/lots/<theme>/<artId>.png。
// 剪影仍等 /workspace/falcon-art-round8/ 的 *_silhouette.png。缺文件时观察和揭晓回退到原来的剪影或文字。
// 稀有闪光仍只点一处。

export const round8DropRoot = '/workspace/falcon-art-round8';

// 与 lots.js 的 art 键、条目顺序对齐。轮廓和描边共用 _silhouette 这一槽。
export const round8Manifest = [
  { theme: 'photo', artKey: 'cameraBag', artId: 'camera_01' },
  { theme: 'photo', artKey: 'tripod', artId: 'tripod_01' },
  { theme: 'photo', artKey: 'album', artId: 'album_01' },
  { theme: 'photo', artKey: 'cloth', artId: 'softbox_01' },
  { theme: 'photo', artKey: 'crate', artId: 'backdrop_tube_01' },
  { theme: 'repair', artKey: 'repairCabinet', artId: 'cabinet_01' },
  { theme: 'repair', artKey: 'repairClock', artId: 'clock_01' },
  { theme: 'repair', artKey: 'repairRadio', artId: 'radio_01' },
  { theme: 'repair', artKey: 'repairParts', artId: 'parts_01' },
  { theme: 'repair', artKey: 'repairCrate', artId: 'crate_01' },
];

export const photoItemIds = round8Manifest.filter((row) => row.theme === 'photo').map((row) => row.artId);
export const repairItemIds = round8Manifest.filter((row) => row.theme === 'repair').map((row) => row.artId);

export function isRound8Theme(theme) {
  return theme === 'photo' || theme === 'repair';
}

function fileName(artId, silhouette) {
  return `${artId}${silhouette ? '_silhouette' : ''}.png`;
}

// 正面文件已入库。剪影路径照旧，文件未到就当不存在。
export function lotPiecePath(theme, artId, silhouette) {
  return `assets/art/lots/${theme}/${fileName(artId, silhouette)}`;
}

// 剪影仍待外部目录。这里只登记，不生成文件。
export function lotPieceDropPath(theme, artId, silhouette) {
  return `${round8DropRoot}/${theme}/${fileName(artId, silhouette)}`;
}

export function lotPieceKey(theme, artId, silhouette) {
  return `${theme}:${artId}:${silhouette ? 'silhouette' : 'normal'}`;
}

export const round8Slots = round8Manifest.flatMap((row) => [false, true].map((silhouette) => ({
  theme: row.theme,
  artKey: row.artKey,
  artId: row.artId,
  silhouette,
  key: lotPieceKey(row.theme, row.artId, silhouette),
  path: lotPiecePath(row.theme, row.artId, silhouette),
  drop: lotPieceDropPath(row.theme, row.artId, silhouette),
})));

// 稀有只沿用第六轮那一颗星，单件图上不再加第二处闪光。
export const round8Sparkle = { spots: 1, loop: false };

export function round8Listing() {
  return round8Manifest.map((row) => ({
    artId: row.artId,
    theme: row.theme,
    artKey: row.artKey,
    full: lotPiecePath(row.theme, row.artId, false),
    silhouette: lotPiecePath(row.theme, row.artId, true),
    dropFull: lotPieceDropPath(row.theme, row.artId, false),
    dropSilhouette: lotPieceDropPath(row.theme, row.artId, true),
  }));
}
