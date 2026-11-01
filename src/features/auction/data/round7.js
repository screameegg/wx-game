// 第七轮顶栏和主按钮。只放边距、颜色和文案格式。
// 应还金额、剩余场数、出价和还款都在 rules / game 里算，这里不读存档也不改数字。
// 参考板带说明文字，不能整张贴进画面。

export const round7Art = {
  topbar: 'assets/art/falcon-art-round7/topbar_polish.png',
  ctaStates: 'assets/art/falcon-art-round7/cta_primary_states.png',
  layoutMargin: 'assets/art/falcon-art-round7/layout_margin_16.png',
  useSheet: false,
};

// 只给顶栏和主按钮用。画面其余颜色仍走原来的 palette。
export const chromePalette = {
  green: '#2F5D50',
  amber: '#E8A54B',
  kraft: '#C4A484',
  cream: '#F5EDE0',
  ink: '#2B2B2B',
  rust: '#B85C38',
};

export const layoutTokens = {
  margin: 16,
  designWidth: 375,
  goldSize: 20,
  debtSize: 12,
  goldHeight: 40,
  debtHeight: 28,
  ctaHeight: 48,
  ctaGap: 12,
  secondaryWidth: 105,
  pressScale: 0.96,
  pressOffsetY: 3,
};

// 按下比默认琥珀更暗。禁用是牛皮纸色，没有高光。
export const ctaTokens = {
  confirm: 'release',
  default: { fill: '#E8A54B', ink: '#F5EDE0', lip: '#B85C38' },
  pressed: { fill: '#C17A2A', ink: '#F5EDE0', lip: '#8C4524' },
  disabled: { fill: '#C4A484', ink: '#2B2B2B', lip: '#C4A484' },
  secondary: { fill: '#F5EDE0', ink: '#2B2B2B', lip: '#C4A484', line: '#C4A484' },
};

// 债务条：应还金额 + 还剩几场拍卖。不写成日期，也不用期数简称代替场次。
export function debtStripLabel(due, remaining) {
  return `应还 ${due} · 剩 ${remaining} 场`;
}

export function ctaLook({ disabled = false, pressed = false, secondary = false } = {}) {
  const motion = layoutTokens;
  if (secondary) return { state: 'secondary', scale: 1, offsetY: 0, ...ctaTokens.secondary };
  if (disabled) return { state: 'disabled', scale: 1, offsetY: 0, ...ctaTokens.disabled };
  if (pressed) {
    return {
      state: 'pressed', scale: motion.pressScale, offsetY: motion.pressOffsetY, ...ctaTokens.pressed,
    };
  }
  return { state: 'default', scale: 1, offsetY: 0, ...ctaTokens.default };
}

// 安全区由 platform/screen.js 先让出。这里的 16 画在安全区里面。
export function placeTopBar(width, goldTextWidth, debtTextWidth) {
  const m = layoutTokens.margin;
  const gap = 8;
  const wantedGold = Math.ceil(Number(goldTextWidth) + 40 + 48);
  const minGold = Math.max(108, Math.min(wantedGold, Math.floor(width * 0.56)));
  const naturalDebt = Math.ceil(Number(debtTextWidth) + 16);
  const maxDebt = width - m * 2 - gap - minGold;
  const debtW = Math.min(Math.max(naturalDebt, 48), Math.max(48, maxDebt));
  const debtX = width - m - debtW;
  const goldH = layoutTokens.goldHeight;
  const debtH = layoutTokens.debtHeight;
  return {
    gold: { x: m, y: m, w: debtX - gap - m, h: goldH },
    debt: { x: debtX, y: m + (goldH - debtH) / 2, w: debtW, h: debtH },
  };
}

export function menuSpot(boxes) {
  const w = 40;
  const h = 36;
  const gold = boxes.gold;
  return { x: gold.x + gold.w - w - 4, y: gold.y + (gold.h - h) / 2, w, h };
}

export function dockBox(height, width = layoutTokens.designWidth) {
  const m = layoutTokens.margin;
  const h = layoutTokens.ctaHeight;
  return { x: m, y: height - m - h, w: width - m * 2, h };
}

export function dockArgs(height, width = layoutTokens.designWidth) {
  const box = dockBox(height, width);
  return [box.x, box.y, box.w, box.h];
}

export function splitDock(height, width = layoutTokens.designWidth) {
  const m = layoutTokens.margin;
  const h = layoutTokens.ctaHeight;
  const gap = layoutTokens.ctaGap;
  const secondary = layoutTokens.secondaryWidth;
  const y = height - m - h;
  const primaryX = m + secondary + gap;
  return {
    secondary: { x: m, y, w: secondary, h },
    primary: { x: primaryX, y, w: width - m - primaryX, h },
  };
}
