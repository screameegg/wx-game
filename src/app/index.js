import { createScreen } from '../platform/screen';
import Game from '../features/auction/game';
import GameScene from '../features/auction/scene';
import Effects from '../features/audio/effects';
import { audible, cueFromResponse, cueFromTouch, extraCues } from '../features/auction/fx/cues';
import { auctionsRemaining } from '../features/auction/rules/debt-clock';

// 帧循环负责真实动画，游戏规则仍由 Game 独立管理。
export default class App {
  constructor() {
    this.screen = createScreen(); this.game = new Game(); this.effects = new Effects();
    this.animationId = null; this.reactionTimer = null; this.hidden = false; this.lastFrame = 0;
    this.scene = new GameScene(this.screen, this.game, () => this.render());
    wx.onTouchStart((event) => this.onPointer('down', event));
    if (typeof wx.onTouchMove === 'function') wx.onTouchMove((event) => this.onPointer('move', event));
    if (typeof wx.onTouchEnd === 'function') wx.onTouchEnd((event) => this.onPointer('up', event));
    if (typeof wx.onTouchCancel === 'function') wx.onTouchCancel(() => this.onPointer('cancel', {}));
    if (wx.onHide) wx.onHide(() => { this.hidden = true; this.game.save(); this.render(); });
    if (wx.onShow) wx.onShow(() => { this.hidden = false; this.render(); });
    this.render();
  }
  onPointer(kind, event) {
    const pool = kind === 'down' ? event.touches : (event.changedTouches || event.touches);
    const touch = pool && pool[0];
    if (kind === 'move') {
      const moving = event.touches && event.touches[0];
      if (this.hidden || !moving || typeof this.scene.pointerMove !== 'function') return;
      if (this.scene.pointerMove(moving.clientX, moving.clientY)) this.render();
      return;
    }
    if (this.hidden || (kind !== 'cancel' && !touch)) return;
    const s = this.game.state;
    const before = { phase: s.phase, selected: s.selected, income: s.income, pending: s.pending, collected: s.collection.length, ornament: s.ornament, remaining: auctionsRemaining(s), evidence: (s.items || []).map((item) => [item.categoryKnown, item.conditionKnown]), statuses: (s.items || []).map((item) => item.status) };
    if (kind === 'down') this.scene.pointerDown(touch.clientX, touch.clientY);
    else if (kind === 'cancel') this.scene.pointer = null;
    else this.scene.pointerUp(touch.clientX, touch.clientY);
    const state = this.game.state;
    this.playCue(cueFromTouch(before, state, { reviewing: this.scene.reviewing }));
    extraCues(before, state).forEach((beat) => this.playCue(beat));
    this.render();
  }
  playCue(beat) {
    if (!beat) return;
    this.scene.playEffect(beat.kind, beat.detail || {});
    const gate = () => ({ soundEnabled: this.game.state.soundEnabled, paused: !!this.scene.menu.view, hidden: this.hidden });
    if (!audible(beat, gate())) return;
    const wait = beat.kind === 'hammer' && this.scene.effect ? Math.max(0, this.scene.effect.at - Date.now()) : 0;
    const play = () => { if (audible(beat, gate())) this.effects.play(beat.sound, true, beat.detail && beat.detail.sfxFile); };
    if (wait > 0) setTimeout(play, wait);
    else play();
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
      this.playCue(cueFromResponse(this.game.state));
      this.render();
    }, Math.max(0, 1200 - (Date.now() - s.pendingAt)));
  }
  render() {
    if (!this.scene) return;
    this.syncReaction();
    if (!this.hidden) this.scene.render(this.screen.context);
    if (this.needsFrames()) this.animate();
  }
}
