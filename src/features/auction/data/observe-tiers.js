// 观察三档的描边和热区。只服务画面和点击，不进入抽箱或对手估值。
// 参考图是规格，不是逐件贴图。TODO: 若以后换成描边素材，只改这里的路径并在绘制层换图。

export const observeArt = {
  visibilityTiers: 'assets/art/falcon-art-round4/observe_visibility_tiers.png',
  hotzoneRules: 'assets/art/falcon-art-round4/observe_hotzone_rules.png',
};

export const tierVisuals = {
  doorway: {
    id: 'doorway',
    label: '门口',
    stroke: '#2f8f4e',
    glow: 'rgba(47, 143, 78, 0.34)',
    ink: '#24683a',
    badge: '#e2eddc',
    lineWidth: 3.5,
    dash: [],
    spriteAlpha: 1,
    wash: 0,
    pad: 6,
  },
  silhouette: {
    id: 'silhouette',
    label: '轮廓',
    stroke: '#e0a04a',
    glow: 'rgba(224, 160, 74, 0.55)',
    ink: '#8a5a18',
    badge: '#f7ebd2',
    lineWidth: 3,
    dash: [7, 4],
    spriteAlpha: 1,
    wash: 0,
    pad: 0,
  },
  deep: {
    id: 'deep',
    label: '深处',
    stroke: '#d5d0c6',
    glow: 'rgba(213, 208, 198, 0.22)',
    ink: '#8d877c',
    badge: '#ece7dc',
    lineWidth: 2.25,
    dash: [4, 4],
    spriteAlpha: 0.46,
    wash: 0.4,
    pad: 0,
  },
};

export const hotspotRules = {
  minSize: 44,
  gap: 2,
  debug: false,
  bounds: { x: 12, y: 168, w: 350, h: 228 },
};

export function tierVisual(visibility) {
  if ((visibility || 0) >= 2) return tierVisuals.doorway;
  if (visibility === 1) return tierVisuals.silhouette;
  return tierVisuals.deep;
}
