// 第六轮揭晓呈现。只放时长、热区和参考图路径。
// 售价、收藏和落槌仍由 game / round 决定，这里不读也不写价格。

export const round6Art = {
  revealFlip: 'assets/resources/art/reference/round6/reveal_flip_frames.png',
  sellCollect: 'assets/resources/art/reference/round6/sell_collect_layout.png',
  rareSparkle: 'assets/resources/art/reference/round6/rare_sparkle_frame.png',
};

// 规格板带标题，不能整张贴进画面。useSheet 关掉，crops 留给以后的无字切片。
// TODO: 若给到无字三帧、按钮和单颗星，把 useSheet 打开并只改 crops。
export const revealQueueBeat = {
  useSheet: false,
  enterMs: 400,
  minEnterMs: 300,
  maxEnterMs: 500,
  scale: 1.2,
  minScale: 1.15,
  maxScale: 1.25,
  recedeScale: 0.62,
  recedeAlpha: 0.42,
  flipMs: 780,
  crops: {
    enlarge: { x: 40, y: 70, w: 280, h: 420 },
    flip: { x: 400, y: 80, w: 340, h: 430 },
    front: { x: 820, y: 30, w: 430, h: 520 },
  },
};

// 卖掉 / 收下是两块固定热区。间距要宽，避免误点。按下只变样子，松手才结算。
export const settleBeat = {
  pressScale: 0.96,
  pressOffsetY: 3,
  confirmMs: 220,
  minConfirmMs: 160,
  maxConfirmMs: 320,
  nextMs: 400,
  minNextMs: 300,
  maxNextMs: 500,
  minHit: 44,
  gap: 40,
  height: 56,
  sell: {
    label: '卖掉', fill: '#e39b3a', pressed: '#c47d22', ink: '#fffaf0', lip: '#8d5a1e', icon: 'coin',
  },
  collect: {
    label: '收下', fill: '#fff9ed', pressed: '#e5f0e4', ink: '#2f6a3c', lip: '#6d8f62', line: '#3d6b45', icon: 'book',
  },
  disabled: { fill: '#d9d3c8', pressed: '#d9d3c8', ink: '#8d877c', lip: '#b7b0a4', line: '' },
};

// 稀有只闪一帧，不超过 300ms，不循环。普通物品没有这层。
export const rareSparkleBeat = {
  durationMs: 260,
  capMs: 300,
  frames: 1,
  loop: false,
  crop: { x: 620, y: 40, w: 180, h: 220 },
};

function clamp(ms, fallback, min, max) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function clampEnter(ms) {
  return clamp(ms, revealQueueBeat.enterMs, revealQueueBeat.minEnterMs, revealQueueBeat.maxEnterMs);
}

export function clampNext(ms) {
  return clamp(ms, settleBeat.nextMs, settleBeat.minNextMs, settleBeat.maxNextMs);
}

export function clampConfirm(ms) {
  return clamp(ms, settleBeat.confirmMs, settleBeat.minConfirmMs, settleBeat.maxConfirmMs);
}

export function clampScale(value) {
  const n = Number(value);
  const fallback = revealQueueBeat.scale;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(revealQueueBeat.maxScale, Math.max(revealQueueBeat.minScale, n));
}

// 稀有档只看开场已经写好的 isBigWin。不读 result 售价，避免呈现层改价。
export function rarityTier(item) {
  return item && item.isBigWin === true ? 'rare' : 'normal';
}
