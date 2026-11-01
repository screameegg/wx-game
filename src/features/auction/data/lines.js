// 台词只负责显示。空字符串或 TODO 开头的句子不出现，调用处照常继续。
// 出价、还款金额、罚息和查封金币都不在这里计算。

function ready(value) {
  return typeof value === 'string' && value && !value.startsWith('TODO') ? value : '';
}

function rivalKey(name) {
  if (name === '老周') return 'laozhou';
  if (name === '阿岚') return 'alan';
  return '';
}

export const lines = {
  debtor: {
    opener: '六场之内把第一笔还上。拍得聪明点。',
    countdown1: 'TODO(debtor.countdown1)',
    onTime: '这笔结了。下一期别掉以轻心。',
    shortfall: '先扣你能给的。缺口加息，收藏先押一件。',
    overdue: '再拖一期，场子就不留你了。',
    collateral: 'TODO(debtor.collateral)',
    seize: '场子收了。金币清到 300，图鉴和主题还在——再站起来。',
    seizeEntry: 'TODO(debtor.seizeEntry)',
    pressure: 'TODO(debtor.pressure)',
    redeem: 'TODO(debtor.redeem)',
  },
  auctioneer: {
    band: {
      hard: '巡演收摊的货，路上淋过雨——纸和琴，自己看。',
      openers: [
        '巡演收摊的货，路上淋过雨——纸和琴，自己看。',
        '运输途中遇过雨，纸质物品要留意受潮。听说这批货跟着乐队跑过几座城市。',
        '这箱是巡演结束后留下的，打包时没有逐件检查，旧器材状态得看运气。',
      ],
    },
    photo: {
      openers: [
        'TODO(auctioneer.photo.openers.0)',
        'TODO(auctioneer.photo.openers.1)',
        'TODO(auctioneer.photo.openers.2)',
      ],
    },
    repair: {
      openers: [
        'TODO(auctioneer.repair.openers.0)',
        'TODO(auctioneer.repair.openers.1)',
        'TODO(auctioneer.repair.openers.2)',
      ],
    },
  },
  judge: {
    big_win: { laozhou: '看走眼了。', alan: '……哼。' },
    small_win: { laozhou: '还行。', alan: '切。' },
    small_loss: { laozhou: '幸亏没跟。', alan: '哈哈。' },
    big_loss: { laozhou: '啧……', alan: '笑死。' },
    // 流拍或没拍下的人说 other。拍下者的两句是占位，策划可直接改字符串。
    pass: {
      winner: { laozhou: '这箱归我。', alan: '我拿走了。' },
      other: '随便。',
    },
  },
};

export function debtorLine(key) {
  return ready(lines.debtor[key]);
}

export function applyCreditor(state, key) {
  state.creditorKey = key || '';
  state.creditorLine = debtorLine(key);
}

// 开局优先。查封后的下一屏、还款倒计时剩 1 场、已有欠款依次让位。
export function briefingCreditorKey({ fromHome, afterSeize, roundsLeft, arrears }) {
  if (fromHome) return 'opener';
  if (afterSeize) return 'seizeEntry';
  if (roundsLeft === 1) return 'countdown1';
  if ((arrears || 0) > 0) return 'pressure';
  return '';
}

// 钱够走 onTime；赎回句填上之后才改走 redeem。不够时，再拖一期就查封走 overdue，否则 shortfall。
// collateral 填上后，只替换还没到逾期警告的那一次抵押。
export function repaymentCreditorKey({ paid, nearSeize, pledged, redeemed }) {
  if (!paid) {
    if (nearSeize) return 'overdue';
    if (pledged && debtorLine('collateral')) return 'collateral';
    return 'shortfall';
  }
  if (redeemed && debtorLine('redeem')) return 'redeem';
  return 'onTime';
}

// 乐队有硬信息时观察页固定用这一句。其他主题只用已写好的开场；TODO 交给原来的 lot 文案。
export function auctioneerLineFor(lot) {
  const pack = lines.auctioneer[lot && lot.theme];
  if (!pack) return '';
  if (ready(pack.hard)) return pack.hard;
  return (pack.openers || []).map(ready).find(Boolean) || '';
}

// 大赚 ≥150%，小赚 100–150%，小亏 50–100%，大亏 <50%。
export function roiBand(roi) {
  if (roi >= 1.5) return 'big_win';
  if (roi >= 1) return 'small_win';
  if (roi >= 0.5) return 'small_loss';
  return 'big_loss';
}

export function judgeLine(roi, name) {
  const who = rivalKey(name);
  if (!who) return '';
  return ready(lines.judge[roiBand(roi)][who]);
}

export function passLine(name, winner) {
  if (winner && winner === name) {
    const who = rivalKey(name);
    return who ? ready(lines.judge.pass.winner[who]) : '';
  }
  return ready(lines.judge.pass.other);
}
