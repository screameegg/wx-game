// 第三轮反馈节拍。时长、裁切、音效 id 和素材路径只放这里。
export const round3Art = {
  deviceUpgrade: 'assets/art/falcon-art-round3/device/device_upgrade_vfx.png',
  debtTick: 'assets/art/falcon-art-round3/debt/debt_tick_frames.png',
  watchUnlock: 'assets/art/falcon-art-round3/accessory/accessory_watch_unlock.png',
  debtTickSfx: 'assets/audio/effects/sfx_debt_tick.wav',
};

// 信息卡位置与观察页共用，升级描边对准同一块卡片。
export const infoCardBox = { x: 18, y: 404, w: 339, h: 101 };

// 状态机总长不得超过 capMs。画面按窗口叠出闪光、描边和箭头。
export const deviceUpgradeBeat = {
  durationMs: 300,
  capMs: 300,
  phases: {
    flash: { start: 0, end: 0.45 },
    outline: { start: 0.12, end: 0.92 },
    arrow: { start: 0.4, end: 1 },
  },
  crops: {
    flash: { x: 48, y: 70, w: 416, h: 420 },
    outline: { x: 510, y: 213, w: 368, h: 286 },
    arrow: { x: 958, y: 231, w: 250, h: 264 },
  },
};

// 倒计时每减 1 场播放一次。sfxId 对应文件名，音频可后补。
export const debtTickBeat = {
  durationMs: 420,
  sfxId: 'sfx_debt_tick',
  shakePx: 2.5,
  frames: 3,
  sparkle: [
    { x: 253, y: 328, w: 48, h: 70 },
    { x: 686, y: 329, w: 48, h: 69 },
    { x: 1096, y: 328, w: 48, h: 69 },
  ],
};

// 只在饰品阶段 0 到 1 时播一次，不改任何数值。
export const watchUnlockBeat = {
  durationMs: 680,
  fromStage: 0,
  toStage: 1,
  crop: { x: 220, y: 700, w: 280, h: 280 },
};
