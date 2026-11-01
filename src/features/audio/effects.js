// 单独管理音效，播放失败不阻断拍卖流程。
export default class Effects {
  constructor() { this.instances = {}; }
  play(name, enabled) {
    if (!enabled || !wx.createInnerAudioContext) return;
    try {
      let audio = this.instances[name];
      if (!audio) {
        audio = wx.createInnerAudioContext();
        audio.src = `assets/audio/effects/${name}.wav`;
        this.instances[name] = audio;
      }
      audio.stop();
      audio.play();
    } catch (error) { /* 无音频能力时静默继续。 */ }
  }
}
