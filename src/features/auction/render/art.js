import { bandItemIds, round1Art } from '../data/round1-art';

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
  }
  get(key) { return this.images[key === 'container' ? 'harbor' : key]; }
}
