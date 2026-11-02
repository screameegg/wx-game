// 第五轮拍卖节拍。只放时长、颜色和参考图路径。
// 不进入出价、估值或跟价。对手跟价仍是 app 里原来的 1200ms。

export const round5Art = {
  bidButtonStates: 'assets/resources/art/reference/round5/bid_button_states.png',
  leaderHighlight: 'assets/resources/art/reference/round5/leader_highlight.png',
  passWave: 'assets/resources/art/fx/auction/pass_wave_frames.png',
  gavelPause: 'assets/resources/art/reference/round5/gavel_pause_compare.png',
};

// 加价按钮三态。规格板带标题和说明，不能整张贴上按钮。
// TODO: 若以后给到无字的三态切片，把 useSheet 打开并只改 crops。
export const raiseButtonBeat = {
  confirm: 'release',
  pressScale: 0.96,
  pressOffsetY: 3,
  useSheet: false,
  fills: { default: '#bd6843', pressed: '#8d4330', disabled: '#d5cec3' },
  ink: { default: '#fffaf0', pressed: '#fffaf0', disabled: '#8d877c' },
  lip: { default: '#8a4634', pressed: '#6a3b2c', disabled: '#b7b0a4' },
  crops: {
    default: { x: 80, y: 280, w: 300, h: 210 },
    pressed: { x: 470, y: 280, w: 320, h: 210 },
    disabled: { x: 880, y: 280, w: 300, h: 210 },
  },
};

// 领先者：软光加「领先」。皇冠默认关，规格图只作参考。
export const leaderHighlightBeat = {
  showCrown: false,
  label: '领先',
  glow: 'rgba(242, 196, 90, 0.30)',
  ink: '#8a5a18',
};

// 对手表情节拍。同一时刻只留一个，播完收回，不排队。
export const expressionBeat = {
  holdMs: 1500,
  minHoldMs: 1000,
  maxHoldMs: 2000,
  maxOnScreen: 1,
  waveFrames: 3,
  waveCrops: [
    { x: 48, y: 148, w: 360, h: 520 },
    { x: 448, y: 148, w: 380, h: 520 },
    { x: 860, y: 140, w: 380, h: 530 },
  ],
};

// 落槌前的半拍。只挡住揭晓画面，不改成交价。
export const preHammerBeat = {
  pauseMs: 500,
  minPauseMs: 400,
  maxPauseMs: 600,
  scale: 1.03,
  vignette: 0.34,
};

export function clampHold(ms) {
  const n = Number(ms);
  const fallback = expressionBeat.holdMs;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(expressionBeat.maxHoldMs, Math.max(expressionBeat.minHoldMs, n));
}

export function clampPause(ms) {
  const n = Number(ms);
  const fallback = preHammerBeat.pauseMs;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(preHammerBeat.maxPauseMs, Math.max(preHammerBeat.minPauseMs, n));
}
