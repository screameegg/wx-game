import { bandItemIds, bandPieceKey, bandPiecePath, round1Art } from '../data/round1-art';
import { round3Art } from '../data/round3';
import { round5Art } from '../data/round5';
import { round8Slots } from '../data/round8-art';
import { round9Slots } from '../data/round9';

const root = 'assets/resources/art';
const files = { harbor: 'container', zhouSheet: 'rivals', lanSheet: 'rivals', itemSheet: 'cargo', resultSheet: 'cargo', extraSheet: 'photo-repair' };

export default class AuctionArt {
  constructor(redraw) {
    this.round1 = round1Art;
    this.bandItemIds = bandItemIds;
    this.images = {};
    [...new Set(Object.values(files))].forEach((file) => {
      const image = wx.createImage();
      image.onload = () => { Object.keys(files).filter((key) => files[key] === file).forEach((key) => { this.images[key] = image; }); redraw(); };
      image.onerror = () => { this.failed = true; redraw(); };
      image.src = file === 'container' ? `${root}/${file}.jpg` : `${root}/${file}.png`;
    });
    bandItemIds.forEach((id) => [false, true].forEach((silhouette) => {
      const image = wx.createImage();
      image.onload = () => { this.images[bandPieceKey(id, silhouette)] = image; redraw(); };
      image.onerror = () => redraw();
      image.src = bandPiecePath(id, silhouette);
    }));
    // 摄影 / 维修单件图。文件不存在就留空，画面回退到原剪影或文字。
    round8Slots.forEach((slot) => {
      const image = wx.createImage();
      image.onload = () => { this.images[slot.key] = image; redraw(); };
      image.onerror = () => redraw();
      image.src = slot.path;
    });
    // 收藏格底板、珍品角标和空态图。文件没到就留空，画面用矢量占位。
    round9Slots.forEach((slot) => {
      const image = wx.createImage();
      image.onload = () => { this.images[slot.key] = image; redraw(); };
      image.onerror = () => redraw();
      image.src = slot.path;
    });
    Object.entries(round3Art).forEach(([key, src]) => {
      if (!src || !/\.(png|jpg|jpeg|webp)$/i.test(src)) return;
      const image = wx.createImage();
      image.onload = () => { this.images[key] = image; redraw(); };
      image.onerror = () => redraw();
      image.src = src;
    });
    // 放弃摆手用切片。按钮、领先和落槌规格板只作参考，不整张贴进画面。
    const wave = wx.createImage();
    wave.onload = () => { this.images.passWave = wave; redraw(); };
    wave.onerror = () => redraw();
    wave.src = round5Art.passWave;
  }
  get(key) { return this.images[key === 'container' ? 'harbor' : key]; }
}
