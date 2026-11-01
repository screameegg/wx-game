// 第一轮参考图和乐队箱单件图。轮廓用于看不清，正面用于看清和揭晓。
export const round1Art = {
  topbarCta: 'assets/art/ui/topbar-cta-spec.jpg',
  styleboard: 'assets/art/style/styleboard-v2.jpg',
  bandSheet: 'assets/art/items/band/batch1-sheet.jpg',
};

export const bandItemIds = ['bike_01', 'case_guitar_01', 'box_scores_01', 'crate_cloth_01', 'speaker_01'];

export function bandPiecePath(id, silhouette) {
  return `assets/art/items/band/${id}${silhouette ? '_silhouette' : ''}.png`;
}

export function bandPieceKey(id, silhouette) {
  return `${id}:${silhouette ? 'silhouette' : 'normal'}`;
}

// 可见度 0/1 用剪影；看得清或已经揭晓用正面。
export function bandUsesSilhouette(entry, revealed) {
  return !revealed && (!entry || entry.visibility < 2);
}
