import { debtTickBeat, round3Art, watchUnlockBeat } from '../data/round3';
import { auctionsRemaining } from '../rules/debt-clock';
import { infoLevel } from '../rules/info-level';

// 把一次操作或对手响应收成一个反馈节拍。画面和音效都从这里出发，不再散落在流程里。

function cue(kind, sound, detail) {
  const beat = { kind, detail: detail || {} };
  if (sound) beat.sound = sound;
  return beat;
}

// 手电或放大镜让信息程度真正升高时，才给一次不超过 300ms 的升级闪光。
function deviceUpgradeCue(before, state, inspecting) {
  if (!inspecting) return null;
  const index = state.selected;
  const picked = index >= 0 ? (state.items || [])[index] : null;
  const seen = (before.evidence || [])[index];
  if (!picked || !seen) return null;
  const prior = {
    visibility: picked.visibility,
    status: 'hidden',
    categoryKnown: !!seen[0],
    conditionKnown: !!seen[1],
    upgraded: !!seen[1],
  };
  const from = infoLevel(prior);
  const to = infoLevel(picked);
  const usedLight = !seen[0] && !!picked.categoryKnown;
  const usedGlass = !seen[1] && !!picked.conditionKnown;
  if (!(usedLight || usedGlass) || to <= from) return null;
  return cue('deviceUpgrade', null, { index, from, to, tool: usedGlass ? '放大镜' : '手电', beat: '设备升级' });
}

// 玩家点击之后：成交落槌、逐件翻牌、结算大字，以及原来的观察/出价/出售反馈。
export function cueFromTouch(before, state, options = {}) {
  const items = state.items || [];
  const picked = state.selected >= 0 ? items[state.selected] : null;
  const reviewing = !!options.reviewing;
  const inspecting = state.phase === 'observe' || (state.phase === 'auction' && reviewing && !state.pending);
  const upgraded = deviceUpgradeCue(before, state, inspecting);
  if (upgraded) return upgraded;
  if (inspecting && state.selected >= 0 && before.selected !== state.selected) return cue('inspect');
  if (before.phase === 'briefing' && state.phase === 'observe') return cue('open', 'open');
  if (before.phase !== 'settlement' && state.phase === 'settlement') {
    const net = state.income - state.spent;
    return cue('pnl', 'settlement', { net, win: net >= 0, beat: '盈亏大字' });
  }
  if (before.phase === 'auction' && state.phase === 'reveal') return cue('hammer', 'hammer', hammerDetail(state));
  if (state.income > before.income) {
    return cue('sell', 'sell', { index: before.selected, amount: state.income - before.income });
  }
  if ((state.collection || []).length > before.collected) return cue('collect', 'reveal', { index: before.selected });
  if (state.pending && !before.pending) return cue('bid', 'bid');
  const justOpened = state.phase === 'reveal' && picked && picked.status === 'revealed' && before.selected !== state.selected;
  if (justOpened) return cue('reveal', 'reveal', { index: state.selected, beat: '揭晓翻牌' });
  return null;
}

// 对手想完之后：你领先并成交就落槌，否则只是一轮出价。
export function cueFromResponse(state) {
  if (state.phase === 'reveal') return cue('hammer', 'hammer', hammerDetail(state));
  return cue('bid', 'bid');
}

function hammerDetail(state) {
  const price = Number.isFinite(state.spent) ? state.spent : state.price;
  return { price, beat: '落槌' };
}

// 和主节拍同时发生、但不能互相盖掉的反馈：还款倒计时减 1，以及旧表解锁。
export function extraCues(before, state) {
  const cues = [];
  if (typeof before.remaining === 'number') {
    const next = auctionsRemaining(state);
    if (before.remaining - next === 1) {
      cues.push(cue('debtTick', debtTickBeat.sfxId, {
        from: before.remaining,
        to: next,
        sfxId: debtTickBeat.sfxId,
        sfxFile: round3Art.debtTickSfx,
      }));
    }
  }
  if (before.ornament === watchUnlockBeat.fromStage && state.ornament === watchUnlockBeat.toStage && state.phase === 'settlement') {
    cues.push(cue('watchUnlock', null, { from: watchUnlockBeat.fromStage, to: watchUnlockBeat.toStage, beat: '旧表' }));
  }
  return cues;
}

// 暂停、切到后台或玩家关掉声音时，节拍动画照常，声音不出。
export function audible(beat, gate) {
  return !!(beat && beat.sound && gate && gate.soundEnabled && !gate.paused && !gate.hidden);
}
