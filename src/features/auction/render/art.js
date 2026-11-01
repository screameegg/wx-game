import { bandItemIds, bandPieceKey, bandPiecePath, round1Art } from '../data/round1-art';
import { round3Art } from '../data/round3';

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
    Object.entries(round3Art).forEach(([key, src]) => {
      if (!src || !/\.(png|jpg|jpeg|webp)$/i.test(src)) return;
      const image = wx.createImage();
      image.onload = () => { this.images[key] = image; redraw(); };
      image.onerror = () => redraw();
      image.src = src;
    });
  }
  get(key) { return this.images[key === 'container' ? 'harbor' : key]; }
}
