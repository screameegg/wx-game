import { createScreen } from '../platform/screen';
import Game from '../features/auction/game';
import GameScene from '../features/auction/scene';
import Effects from '../features/audio/effects';

// 帧循环负责真实动画，游戏规则仍由 Game 独立管理。
export default class App {
  constructor() {
    this.screen = createScreen(); this.game = new Game(); this.effects = new Effects();
    this.animationId = null; this.reactionTimer = null; this.hidden = false; this.lastFrame = 0;
    this.scene = new GameScene(this.screen, this.game, () => this.render());
    wx.onTouchStart((event) => this.onTouch(event));
    if (wx.onHide) wx.onHide(() => { this.hidden = true; this.game.save(); this.render(); });
    if (wx.onShow) wx.onShow(() => { this.hidden = false; this.render(); });
    this.render();
  }
  onTouch(event) {
    const touch = event.touches && event.touches[0]; if (!touch || this.hidden) return;
    const s = this.game.state;
    const before = { phase: s.phase, selected: s.selected, income: s.income, pending: s.pending, collected: s.collection.length, evidence: (s.items || []).map((item) => [item.categoryKnown, item.conditionKnown]), statuses: (s.items || []).map((item) => item.status) };
    this.scene.touch(touch.clientX, touch.clientY);
    this.feedback(before); this.render();
  }
  feedback(before) {
    const s = this.game.state; let kind; let sound;
    const inspected = s.selected >= 0 && s.items[s.selected];
    const inspecting = s.phase === 'observe' || (s.phase === 'auction' && this.scene.reviewing && !s.pending);
    if (inspecting && inspected && !before.evidence[s.selected][0] && inspected.categoryKnown) kind = 'flashlight';
    else if (inspecting && inspected && !before.evidence[s.selected][1] && inspected.conditionKnown) kind = 'magnify';
    else if (inspecting && s.selected >= 0 && before.selected !== s.selected) kind = 'inspect';
    else if (before.phase === 'briefing' && s.phase === 'observe') { kind = 'open'; sound = 'open'; }
    else if (before.phase === 'auction' && s.phase === 'reveal') { kind = 'hammer'; sound = 'hammer'; }
    else if (s.income > before.income) { kind = 'sell'; sound = 'sell'; }
    else if (s.collection.length > before.collected) { kind = 'collect'; sound = 'reveal'; }
    else if (s.pending && !before.pending) { kind = 'bid'; sound = 'bid'; }
    else if (s.phase === 'reveal' && s.selected >= 0 && before.selected !== s.selected && s.items[s.selected].status === 'revealed') { kind = 'reveal'; sound = 'reveal'; }
    if (kind) {
      const index = kind === 'sell' || kind === 'collect' ? before.selected : s.selected;
      this.scene.playEffect(kind, { index, amount: s.income - before.income });
      if (sound) this.effects.play(sound, s.soundEnabled);
    }
  }
  animate() {
    if (this.animationId !== null || this.hidden) return;
    this.animationId = requestAnimationFrame(() => {
      this.animationId = null;
      if (Date.now() - this.lastFrame >= 32) { this.lastFrame = Date.now(); this.render(); }
      else if (this.needsFrames()) this.animate();
    });
  }
  needsFrames() {
    return !this.hidden && !this.scene.menu.view && ((this.game.state.phase === 'auction' && !this.scene.reviewing) || this.scene.motionActive);
  }
  syncReaction() {
    const s = this.game.state; const paused = this.hidden || !!this.scene.menu.view;
    if (paused && s.pending && !this.reactionPausedAt) this.reactionPausedAt = Date.now();
    if (!paused && this.reactionPausedAt) { if (s.pending) s.pendingAt += Date.now() - this.reactionPausedAt; this.reactionPausedAt = null; }
    if (this.reactionTimer && (paused || !s.pending)) { clearTimeout(this.reactionTimer); this.reactionTimer = null; }
    if (!s.pending || paused || this.reactionTimer) return;
    this.reactionTimer = setTimeout(() => {
      this.reactionTimer = null;
      if (this.hidden || this.scene.menu.view) return;
      this.game.respond();
      // 成交后 phase 直接变 reveal（废除 announcement）；passed 也视为落槌结束
      const won = this.game.state.phase === 'reveal' || this.game.state.phase === 'passed';
      this.scene.playEffect(won ? 'hammer' : 'bid');
      this.effects.play(won ? 'hammer' : 'bid', this.game.state.soundEnabled); this.render();
    }, Math.max(0, 1200 - (Date.now() - s.pendingAt)));
  }
  render() {
    if (!this.scene) return;
    this.syncReaction();
    if (!this.hidden) this.scene.render(this.screen.context);
    if (this.needsFrames()) this.animate();
  }
}
