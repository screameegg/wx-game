import { menuRoutes } from './views/screens/index';

export default class Menu {
  constructor(game) { this.game = game; this.view = 'home'; this.reviewIndex = 0; }
  render(scene, ctx) {
    (menuRoutes[this.view] || menuRoutes.home)(scene, ctx);
  }
}
