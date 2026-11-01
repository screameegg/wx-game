// 第十轮结算、还款日和进阶提示。只放分区、文案和参考图路径。
// 成交价、盈亏、库存和债务都由规则算好后传进来。这里不写回，也不另存一套门槛。
// 对照板带示例数字和标题，不能整张贴进画面。useSheet 关掉，缺图时用手绘铭牌。
// TODO: 若以后给到无字切片，再把 useSheet 打开。

import { dockBox, layoutTokens, splitDock } from './round7';

export const round10DropRoot = '/workspace/falcon-art-round10';

export const round10Files = {
  settlement: 'settle_screen_hierarchy.png',
  repayCard: 'repay_day_cards.png',
  advanceTip: 'advance_touch_frame.png',
  repayButton: 'repay_button_states.png',
};

export function round10RepoPath(file) {
  return `assets/art/falcon-art-round10/${file}`;
}

export function round10DropPath(file) {
  return `${round10DropRoot}/${file}`;
}

export const round10Art = {
  settlement: round10RepoPath(round10Files.settlement),
  repayCard: round10RepoPath(round10Files.repayCard),
  advanceTip: round10RepoPath(round10Files.advanceTip),
  repayButton: round10RepoPath(round10Files.repayButton),
  useSheet: false,
};

export const round10Slots = Object.entries(round10Files).map(([key, file]) => ({
  key: `round10:${key}`,
  file,
  path: round10RepoPath(file),
  drop: round10DropPath(file),
}));

// 色阶按已经算好的盈亏来，不改收入和成交。净额为 0 单独做持平。
export const pnlTones = {
  big_win: { band: '大赚', verb: '赚了', fill: '#E4F0EA', ink: '#2F5D50' },
  small_win: { band: '小赚', verb: '赚了', fill: '#F3F6DE', ink: '#5C8F7A' },
  flat: { band: '持平', verb: '打平', fill: '#F5EDE0', ink: '#2B2B2B' },
  small_loss: { band: '小亏', verb: '亏了', fill: '#F8E7C8', ink: '#B85C38' },
  big_loss: { band: '大亏', verb: '亏了', fill: '#F6D5CE', ink: '#8C3E2A' },
};

export const repayTones = {
  can: { fill: '#E4F0EA', ink: '#2F5D50', bar: '#2F5D50' },
  cannot: { fill: '#F8E7C8', ink: '#8C3E2A', bar: '#B85C38' },
  clear: { fill: '#F5EDE0', ink: '#2B2B2B', bar: '#C4A484' },
  warning: { fill: '#F8E7C8', ink: '#8C3E2A', bar: '#B85C38' },
  success: { fill: '#E4F0EA', ink: '#2F5D50', bar: '#2F5D50' },
  overdue: { fill: '#F6D5CE', ink: '#8C3E2A', bar: '#B85C38' },
  seized: { fill: '#F5EDE0', ink: '#2B2B2B', bar: '#B85C38' },
};

export const repayCopy = {
  can: { chip: '还得起', line: '余额够还这一期。' },
  cannot: { chip: '还不起', line: '余额不够，可以先还一部分。' },
  clear: { chip: '本期已结', line: '这一期不用再还。' },
  warning: { chip: '临近收场', line: '再逾期一次就收场。收场后重新开张。' },
  success: { chip: '已还上', line: '这笔结了。下一期接着备。' },
  overdue: { chip: '没还上', line: '缺口已记下。先顾下一期。' },
  seized: { chip: '重新开张', line: '将重来，不是结束。' },
};

// 进阶成功只画一帧，不循环、不闪。之后留下门槛说明。
export const advanceCelebrate = {
  frames: 1,
  loop: false,
  flash: false,
  holdMs: 640,
};

const repayPhases = ['home', 'briefing', 'passed', 'settlement'];

export function pnlBand(income, spent) {
  const net = income - spent;
  if (net === 0) return 'flat';
  if (!(spent > 0)) return net > 0 ? 'big_win' : 'big_loss';
  const roi = income / spent;
  if (roi >= 1.5) return 'big_win';
  if (roi >= 1) return 'small_win';
  if (roi >= 0.5) return 'small_loss';
  return 'big_loss';
}

export function settlementModel({ income = 0, spent = 0, collectedValue = 0 } = {}) {
  const net = income - spent;
  const band = pnlBand(income, spent);
  const tone = pnlTones[band];
  const amount = `${net > 0 ? '+' : ''}${net}`;
  const summary = collectedValue
    ? `出售 ${income} − 成交 ${spent} · 收藏 ${collectedValue} 不计收入`
    : `出售 ${income} − 成交 ${spent}`;
  return { net, income, spent, collectedValue, band, tone, amount, summary };
}

export function settlementLayout(height) {
  const m = layoutTokens.margin;
  const w = layoutTokens.designWidth - m * 2;
  const dock = splitDock(height);
  const plate = { x: m, y: 72, w, h: 176 };
  const reactionTop = plate.y + plate.h + 12;
  const link = { x: m, y: dock.primary.y - 40, w };
  const reaction = {
    x: m,
    y: reactionTop,
    w,
    h: Math.max(188, Math.min(240, link.y - 10 - reactionTop)),
  };
  const sketch = { x: plate.x + plate.w - 72, y: plate.y + 14, w: 56, h: 56 };
  return { plate, reaction, link, sketch, dock };
}

export function plateType(plate) {
  return {
    eyebrow: { x: plate.x + 18, y: plate.y + 28, size: 13 },
    band: { x: plate.x + 18, y: plate.y + 50, size: 15 },
    verb: { x: plate.x + 18, y: plate.y + 88, size: 30 },
    amount: { x: plate.x + 18, y: plate.y + 132, size: 44 },
    summary: { x: plate.x + 18, y: plate.y + 162, size: 13 },
  };
}

export function reactionSlots(box) {
  const portrait = Math.min(104, Math.max(72, box.h - 108));
  return {
    left: { x: box.x + 16, y: box.y + 36, w: portrait, h: portrait },
    right: { x: box.x + box.w - 16 - portrait, y: box.y + 36, w: portrait, h: portrait },
    quoteY: box.y + 36 + portrait + 18,
    paddle: { x: box.x + (box.w - 46) / 2, y: box.y + 8, w: 46, h: 68 },
    noticeY: box.y + box.h - 16,
  };
}

export function reactionLine(line) {
  return line ? line : '没多说';
}

export function repayTitle(phase, remaining) {
  if (phase === 'repayment') return '到了还款日';
  if (remaining === 0) return '还款日到了';
  return '还款日';
}

export function repayGlance({
  phase, due, remaining, coins, arrears = 0, overdue = 0, creditorKey = '', missesToSeize = 3,
}) {
  const seized = creditorKey === 'seize';
  const onDay = phase === 'repayment';
  const nearSeize = !seized && overdue >= missesToSeize - 1 && overdue < missesToSeize && arrears > 0;
  let tone = 'cannot';
  if (seized) tone = 'seized';
  else if (onDay && arrears > 0) tone = 'overdue';
  else if (onDay) tone = 'success';
  else if (nearSeize) tone = 'warning';
  else if (!(due > 0)) tone = 'clear';
  else if (coins >= due) tone = 'can';
  const amountLabel = tone === 'success' ? '下期应还' : tone === 'seized' ? '开张应还' : tone === 'overdue' ? '还差' : '本期应还';
  return {
    tone, due, remaining, coins, amountLabel, ...repayTones[tone], ...repayCopy[tone],
  };
}

export function repayView(glance, { title, prepaid = 0 } = {}) {
  return {
    title,
    label: glance.amountLabel,
    amount: String(glance.due),
    rounds: `剩 ${glance.remaining} 场`,
    chip: glance.chip,
    detail: glance.line,
    aside: prepaid > 0 ? `已提前还 ${prepaid}` : '',
    fill: glance.fill,
    ink: glance.ink,
    bar: glance.bar,
  };
}

export function repayNarrative(notice, creditorLine) {
  if (creditorLine) return { who: '债主', line: creditorLine, detail: notice || '' };
  if (notice) return { who: '', line: notice, detail: '' };
  return { who: '', line: '', detail: '' };
}

export function repayControl({ due, coins, phase, short = false }) {
  const disabled = !(due > 0) || !(coins > 0) || short || !repayPhases.includes(phase);
  return { disabled };
}

export function businessLayout(height) {
  const m = layoutTokens.margin;
  const w = layoutTokens.designWidth - m * 2;
  const dock = dockBox(height);
  const card = { x: m, y: 96, w, h: 158 };
  const buttonH = 42;
  const buttonsY = card.y + card.h + 8;
  const goalsY = buttonsY + buttonH + 16;
  const advanceY = goalsY + 36;
  const advance = { x: m, y: advanceY, w, h: Math.max(212, dock.y - 8 - advanceY) };
  const sketch = { x: card.x + card.w - 64, y: card.y + 12, w: 48, h: 48 };
  return { card, buttonsY, buttonH, goalsY, advance, dock, sketch, titleY: 80 };
}

export function repayButtonBox(index, layout) {
  const gap = 8;
  const w = Math.floor((layout.card.w - gap * 2) / 3);
  return { x: layout.card.x + index * (w + gap), y: layout.buttonsY, w, h: layout.buttonH };
}

export function repaymentLayout(height) {
  const m = layoutTokens.margin;
  const w = layoutTokens.designWidth - m * 2;
  const dock = dockBox(height);
  const card = { x: m, y: 76, w, h: 168 };
  return {
    card,
    copy: { x: m, y: card.y + card.h + 28, w },
    balance: { x: m, y: dock.y - 36 },
    dock,
    sketch: { x: card.x + card.w - 72, y: card.y + 14, w: 56, h: 56 },
  };
}

export function advanceModel({ coins = 0, tier, arrears = 0, goal = 0 } = {}) {
  const unlocked = tier === 'advanced';
  const blocked = arrears > 0;
  const ready = !unlocked && !blocked && goal > 0 && coins >= goal;
  const ratio = goal > 0 ? Math.max(0, Math.min(1, coins / goal)) : 0;
  const short = Math.max(0, goal - Math.min(coins, goal));
  let tone = 'progress';
  if (unlocked) tone = 'unlocked';
  else if (blocked) tone = 'blocked';
  else if (ready) tone = 'ready';
  else if (!(coins > 0)) tone = 'empty';
  return { unlocked, blocked, ready, ratio, short, goal, coins, tone };
}

export function advanceStatus(model) {
  if (model.unlocked) return '进阶档已打开';
  if (model.blocked) return '先结清逾期，才能进阶';
  if (model.ready) return '金币已够，可以进阶';
  if (model.tone === 'empty') return '还没开始攒进阶档';
  return `还差 ${model.short} 金币`;
}

export function advanceButtonLabel(model) {
  if (model.unlocked) return '已进入进阶档';
  if (model.blocked) return '先结清逾期';
  if (model.ready) return '进入进阶档';
  return '金币未够';
}

export function advanceCount(model) {
  const shown = Math.min(model.coins, model.goal);
  return `${shown} / ${model.goal}`;
}

export function advanceTipLine({ bidStart, bidStep, nextDue }) {
  return `起拍 ${bidStart} · 加价 ${bidStep} · 下期从 ${nextDue} 起`;
}

export function advancePose(elapsedMs, spec = advanceCelebrate) {
  if (!(elapsedMs >= 0) || elapsedMs >= spec.holdMs) return { phase: 'tip', frame: 0 };
  return { phase: 'frame', frame: 0 };
}

export function advanceInner(plate, withLink = false) {
  const buttonH = 44;
  const button = {
    x: plate.x + 16,
    y: plate.y + plate.h - (withLink ? 78 : 56),
    w: plate.w - 32,
    h: buttonH,
  };
  const tipY = withLink ? plate.y + 100 : Math.min(plate.y + 116, button.y - 40);
  return {
    title: { x: plate.x + 16, y: plate.y + 26, size: 16 },
    count: { x: plate.x + 16, y: withLink ? plate.y + 48 : plate.y + 58, size: withLink ? 22 : 26 },
    bar: { x: plate.x + 16, y: withLink ? plate.y + 54 : plate.y + 70, w: plate.w - 104, h: 8 },
    status: { x: plate.x + 16, y: withLink ? plate.y + 78 : plate.y + 92, size: 13 },
    tip: { x: plate.x + 16, y: tipY, size: 13 },
    note: { x: plate.x + 16, y: button.y - 20, w: plate.w - 32, size: 12 },
    seal: { x: plate.x + plate.w - 78, y: plate.y + 14, w: 62, h: 62 },
    sketch: { x: plate.x + plate.w - 78, y: plate.y + 14, w: 62, h: 62 },
    button,
    link: { x: plate.x + 16, y: button.y + buttonH + 2, w: plate.w - 32 },
  };
}
