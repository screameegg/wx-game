// 微信平台相关的画布初始化统一放在 platform 中。
export function createScreen() {
  const canvas = wx.createCanvas();
  const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  const width = info.windowWidth || info.screenWidth;
  const height = info.windowHeight || info.screenHeight;
  canvas.width = width;
  canvas.height = height;
  const safe = info.safeArea || {};
  let menu;
  try { menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect(); } catch (e) { menu = null; }
  const top = Math.max(safe.top || info.statusBarHeight || 0, menu && menu.bottom || 0) + 6;
  const bottom = Math.max(0, height - (safe.bottom || height));
  return { canvas, context: canvas.getContext('2d'), width, height, top, bottom };
}
