import { lots } from './data/lots';
import { economy, openingBid } from './data/economy';
import { createRound } from './rules/round';
import { resolveRepayment, paymentDue } from './rules/debt';
const KEY = 'container_treasure_save_v1';
const fresh = () => ({ phase: 'home', coins: economy.startingCoins, round: 0, collection: [], discovered: [], unlocked: ['band'], tier: 'starter', tierPeriod: 0, tutorialDone: true, soundEnabled: true, equipment: [], debtPeriod: 0, arrears: 0, prepaid: 0, overdue: 0, pledged: null, profitTotal: 0, ornament: 0 });

export default class Game {
  constructor() {
    try { const saved = wx.getStorageSync(KEY); this.state = saved && typeof saved === 'object' ? saved : fresh(); } catch (e) { this.state = fresh(); }
    // 废除 announcement 阶段：旧存档中的 announcement 直接恢复为 reveal
    if (this.state.phase === 'announcement') {
      if (Array.isArray(this.state.items)) this.state.items.forEach((item) => { if (item && item.status === 'hidden') item.status = 'revealed'; });
      this.state.phase = 'reveal';
    }
    if (!['home', 'briefing', 'observe', 'auction', 'reveal', 'settlement', 'passed', 'repayment'].includes(this.state.phase) || !Array.isArray(this.state.collection) || !Number.isFinite(this.state.coins) || this.state.coins < 0 || !Number.isInteger(this.state.round) || this.state.round < 0) this.state = fresh();
    if (['observe', 'auction', 'reveal', 'settlement'].includes(this.state.phase) && (!lots[this.state.lotIndex] || !Array.isArray(this.state.items) || !this.state.items.length || !Array.isArray(this.state.rivals) || this.state.items.some((item) => !item || !Array.isArray(item.result) || !Number.isFinite(item.result[2])))) this.state.phase = 'briefing';
    if (typeof this.state.soundEnabled !== 'boolean') this.state.soundEnabled = true;
    if (!Number.isFinite(this.state.profitTotal)) this.state.profitTotal = 0;
    if (!Number.isInteger(this.state.ornament)) this.state.ornament = 0;
    if (!Array.isArray(this.state.equipment)) this.state.equipment = [];
    if (!Array.isArray(this.state.toolsUsed)) this.state.toolsUsed = [];
    ['debtPeriod', 'arrears', 'prepaid', 'overdue'].forEach((key) => { if (typeof this.state[key] !== 'number') this.state[key] = 0; });
    if (!Array.isArray(this.state.discovered)) this.state.discovered = [...this.state.collection];
    if (!Array.isArray(this.state.unlocked)) this.state.unlocked = ['band'];
    if (!this.state.tier) this.state.tier = 'starter';
    if (!Number.isInteger(this.state.tierPeriod) || this.state.tierPeriod < 0) this.state.tierPeriod = this.state.debtPeriod;
    if (!this.state.bidStep) this.state.bidStep = economy.starterBidStep;
    if (this.state.pending && !Number.isFinite(this.state.pendingAt)) this.state.pendingAt = Date.now();
    if (!Number.isInteger(this.state.rivalIndex)) this.state.rivalIndex = 0;
    this.unlockThemes();
    const lot = lots[this.state.lotIndex];
    if (lot && Array.isArray(this.state.items)) this.state.items.forEach((item, i) => {
      if (!item || !Array.isArray(item.result)) return;
      if (item.collectible === undefined && lot.items[i]) item.collectible = !!lot.items[i].collectible && item.result[0] === lot.items[i].good[0];
      if (item.visibility === undefined) item.visibility = 2;
    });
  }
  save() { try { wx.setStorageSync(KEY, this.state); } catch (e) { this.state.notice = '保存失败，请检查设备存储空间。'; } }
  reset() { const soundEnabled = this.state.soundEnabled; this.state = fresh(); this.state.soundEnabled = soundEnabled; this.prepareRound(); }
  toggleSound() { this.state.soundEnabled = !this.state.soundEnabled; this.save(); }
  unlockThemes() { const s = this.state; const unlock = economy.themeUnlock; if (s.coins >= unlock.photo && !s.unlocked.includes('photo')) s.unlocked.push('photo'); if (s.coins >= unlock.repair && !s.unlocked.includes('repair')) s.unlocked.push('repair'); }
  upgradeTier() { const s = this.state; if (!['home', 'briefing'].includes(s.phase) || s.tier === 'advanced' || s.coins < economy.advancedEntryCoins || s.arrears) return; s.tier = 'advanced'; s.tierPeriod = 0; s.ornament = Math.max(s.ornament, 3); s.notice = `已进入进阶档：起拍 ${economy.advancedBidStart}，加价 ${economy.advancedBidStep}，下期款额从 ${economy.advancedFirstPayment} 起。`; this.save(); }
  prepareRound() {
    const s = this.state;
    if (!['home', 'briefing', 'passed', 'settlement'].includes(s.phase)) return;
    this.unlockThemes();
    if (resolveRepayment(s)) s.phase = 'repayment';
    else { s.phase = 'briefing'; s.notice = ''; }
    this.save();
  }
  continueAfterRepayment() { if (this.state.phase !== 'repayment') return; this.state.phase = 'briefing'; this.save(); }
  repayEarly(amount) {
    const s = this.state;
    if (!['home', 'briefing', 'passed', 'settlement'].includes(s.phase)) { s.notice = '拍卖进行中不能处理还款。'; this.save(); return; }
    const due = paymentDue(s);
    if (due <= 0) { s.notice = '本期已经提前还清。'; this.save(); return; }
    if (s.coins <= 0) { s.notice = '没有可用于提前还款的金币。'; this.save(); return; }
    const paid = Math.min(Math.max(0, Math.floor(amount)), due, s.coins);
    if (!paid) return;
    s.coins -= paid; s.prepaid = (s.prepaid || 0) + paid;
    s.notice = paid >= due ? '本期款项已提前还清。' : `提前还款 ${paid} 金币；本期还差 ${paymentDue(s)} 金币。`;
    this.save();
  }
  get nextLot() { const available = lots.filter((lot) => this.state.unlocked.includes(lot.theme)); return available[this.state.round % available.length]; }
  startRound() {
    const s = this.state; if (s.phase !== 'briefing') return;
    if (s.coins < openingBid(s.tier)) { s.notice = '余额不足起拍价，请整理旧物或返回入门档。'; this.save(); return; }
    const lot = this.nextLot; s.round += 1; s.lotIndex = lots.indexOf(lot);
    Object.assign(s, createRound(lot, s.tier)); this.save();
  }
  beginBidding() { const s = this.state; if (s.phase !== 'observe') return; s.phase = 'auction'; s.selected = -1; s.notice = '觉得值得就出价；价格太高可以放弃，不会扣款。'; this.save(); }
  get lot() { return lots[this.state.lotIndex]; }
  clue(i) {
    const item = this.lot.items[i]; const entry = this.state.items[i];
    if (entry.visibility === 0) return '深处还有东西，无法辨认形状。';
    if (entry.visibility === 1) return `${item.shape}：只能看见形状，内容不明。${entry.categoryKnown || entry.upgraded ? `手电显示类别：${item.category}。` : ''}${entry.conditionKnown ? `表面线索：${item.hint}` : ''}`;
    if (this.lot.theme === 'band' && i === 0) return `${item.clue}：${entry.good ? '轮胎没气，车架完整。' : '轮胎没气，车架需要修理。'}`;
    return `${item.clue}：${item.hint}`;
  }
  inspect(i, reviewing = false) {
    if (this.state.phase !== 'observe' && !(this.state.phase === 'auction' && reviewing && !this.state.pending)) return;
    if (i === -1) { this.state.selected = -1; this.save(); return; }
    if (!this.state.items[i] || this.state.items[i].status !== 'hidden') return;
    this.state.selected = i; this.state.notice = this.clue(i); this.save();
  }
  buyTool(name) {
    const s = this.state;
    const allowedPhases = ['briefing', 'observe', 'settlement'];
    if (!allowedPhases.includes(s.phase)) { s.notice = '请在开场、观察或结算时购买设备。'; this.save(); return; }
    if (!['手电', '放大镜'].includes(name)) { s.notice = '没有这件设备。'; this.save(); return; }
    const cost = economy.toolCost[name];
    if (name === '放大镜' && !s.equipment.includes('手电')) s.notice = '请先购买手电。';
    else if (s.equipment.includes(name) || (s.pledged && s.pledged.name === name)) s.notice = `已拥有${name}或正在抵押。`;
    else if (s.coins < cost) s.notice = `金币不足，${name}需要 ${cost} 金币。`;
    else { s.coins -= cost; s.equipment.push(name); s.notice = `已购买${name}，现在可以使用。`; }
    this.save();
  }
  useTool(requested, reviewing = false) {
    const s = this.state;
    if (s.phase !== 'observe' && !(s.phase === 'auction' && reviewing && !s.pending)) return;
    const entry = s.items[s.selected];
    if (!entry) { s.notice = '先点选一件货物，再使用设备。'; this.save(); return; }
    if (entry.visibility !== 1) {
      s.notice = entry.visibility === 0 ? '这件货物太暗，首版设备看不清。' : '这件货物已经看清，不需要设备。';
      this.save(); return;
    }
    const name = requested || (entry.categoryKnown ? '放大镜' : '手电');
    if (!['手电', '放大镜'].includes(name)) { s.notice = '没有这件设备。'; this.save(); return; }
    if (name === '放大镜' && !entry.categoryKnown) { s.notice = '先对这件货物使用手电，看清类别后再用放大镜。'; this.save(); return; }
    if (name === '手电' && entry.categoryKnown) { s.notice = '这件货物的类别已看清，可以用放大镜检查表面。'; this.save(); return; }
    if (!s.equipment.includes(name)) { s.notice = `还没有${name}，请先到设备页购买。`; this.save(); return; }
    if (s.toolsUsed.includes(name)) { s.notice = `${name}本场已经用过了。`; this.save(); return; }
    if (name === '手电') entry.categoryKnown = true;
    else { entry.conditionKnown = true; entry.upgraded = true; }
    s.toolsUsed.push(name); s.notice = `${name}照亮了这件货物。${this.clue(s.selected)}`;
    this.save();
  }
  // 对手反应文本：只依赖可见信息与价格差距，不读取隐藏内容
  reaction(rival) {
    const s = this.state;
    if (rival.active === false) return '摆手，退出竞拍';
    if (s.price > rival.estimate) return '摇头，轻轻笑了一声';
    if (s.price + s.bidStep > rival.limit) return '摆手，退出竞拍';
    if (s.price > rival.limit * 0.8) return rival.situation === '急着用钱' ? '看表、擦汗，仍在硬撑' : '皱眉，迟迟没有举牌';
    if (rival.bluff) return '自信地笑了笑';
    if (s.pending) return '瞪眼，准备再跟一轮';
    return rival.preferred ? '眼睛发亮，身体前倾' : '靠着椅背，快速举牌';
  }
  // 对手情境提示（S04）：处境在开场前固定，作为线索透出
  situationHint(rival) {
    if (rival.situation === '急着用钱') return rival.name === '老周' ? '老周今天反复看表，好像有急事。' : '阿岚今天比平时沉默，出手也谨慎。';
    if (rival.situation === '库存积压') return rival.name === '老周' ? '老周最近进货多，今天手头偏紧。' : '阿岚刚进了批货，预算比平时少。';
    return '';
  }
  bid() {
    const s = this.state; if (s.phase !== 'auction' || s.pending) return; const next = s.leader === '拍卖员' ? s.price : s.price + s.bidStep;
    if (next > s.coins) { s.notice = '金币不足，无法加价；你可以放弃。'; this.save(); return; }
    if (s.ceiling && next > s.ceiling && s.warnedPrice !== next) { s.warnedPrice = next; s.notice = `已超过你设定的 ${s.ceiling} 金币心理价位。再点一次出价才会继续。`; this.save(); return; }
    s.price = next; s.leader = '你';
    s.pending = true; s.rivalIndex = 0; s.pendingAt = Date.now(); s.notice = '对手正在观察和犹豫…'; this.save();
  }
  win() {
    const s = this.state; if (s.phase !== 'auction') return;
    s.pending = false; s.coins -= s.price; s.spent = s.price; s.winner = '你';
    s.phase = 'reveal'; s.selected = -1; s.notice = '落槌！货柜拍下了，逐件打开看看里面有什么。';
    if (s.bonusItem) { s.items.push({ ...s.bonusItem, status: 'hidden' }); s.bonusItem = null; }
    this.save();
  }
  respond() {
    const s = this.state; if (s.phase !== 'auction' || !s.pending) return;
    const rival = s.rivals[s.rivalIndex++];
    if (rival && rival.active !== false) {
      if (rival.limit >= s.price + s.bidStep && Math.random() < 0.9) {
        s.price += s.bidStep; s.leader = rival.name; s.notice = `${rival.name}加价了。`;
      } else { rival.active = false; s.notice = `${rival.name}退出了竞拍。`; }
    }
    if (s.rivalIndex < s.rivals.length) { s.pendingAt = Date.now(); this.save(); return; }
    s.pending = false;
    if (s.leader === '你') { this.win(); return; }
    s.notice = `${s.leader}领先，再决定是否继续。`;
    this.save();
  }
  pass() {
    const s = this.state;
    if (s.phase !== 'auction' || s.pending) return;
    const winner = s.leader === '拍卖员' ? s.rivals.find((r) => r.active !== false && r.limit >= s.price) : { name: s.leader };
    s.phase = 'passed';
    s.winner = winner ? winner.name : '';
    s.notice = winner ? `你放弃了本场，${winner.name}以 ${s.price} 金币拍下。你没有扣款。` : '你放弃了本场，集装箱流拍。你没有扣款。';
    this.save();
  }
  reveal(i) {
    const s = this.state; if (s.phase !== 'reveal' || !s.items[i]) return;
    if (s.items[i].status === 'hidden') {
      s.items[i].status = 'revealed';
    }
    s.selected = i; this.save();
  }
  handle(action) {
    const s = this.state; const i = s.selected; const item = s.items && s.items[i];
    if (s.phase !== 'reveal' || !['sell', 'collect'].includes(action) || !item || item.status !== 'revealed') return;
    if (action === 'collect' && !item.collectible) return;
    item.status = action === 'sell' ? 'sold' : 'collected';
    if (action === 'sell') { s.income += item.result[2]; s.coins += item.result[2]; }
    else { s.collectedValue += item.result[2]; s.collection.push(item.result[0]); if (!s.discovered.includes(item.result[0])) s.discovered.push(item.result[0]); }
    s.notice = action === 'sell' ? `出售 ${item.result[0]}，获得 ${item.result[2]} 金币。` : `已收藏 ${item.result[0]}，本件没有出售收入。`;
    // S03 阿岚装腔被拆穿：若阿岚有 bluff 且玩家出价超过阿岚估值
    if (!s.bluffRevealed) {
      const lan = s.rivals && s.rivals.find((r) => r.name === '阿岚');
      if (lan && lan.bluff && s.spent > lan.estimate) { s.bluffRevealed = true; s.bluffNote = '拍卖员悄声说：阿岚刚才那个笑，只是装出来的。'; }
    }
    s.selected = -1;
    if (s.items.every((entry) => entry.status === 'sold' || entry.status === 'collected')) {
      s.phase = 'settlement'; s.profitTotal += Math.max(0, s.income - s.spent);
      const previous = s.ornament;
      if (s.profitTotal >= 5000) s.ornament = 4; else if (s.tier === 'advanced') s.ornament = Math.max(s.ornament, 3); else if (s.profitTotal >= 1500) s.ornament = Math.max(s.ornament, 2); else if (s.profitTotal >= 500) s.ornament = Math.max(s.ornament, 1);
      s.ornamentNotice = s.ornament > previous ? '拍卖员：哟，换新饰品了。' : '';
      this.unlockThemes();
    }
    this.save();
  }
  recover() { const s = this.state; const cycle = economy.repaymentCycleRounds; if (s.coins >= economy.recoverBelowCoins || !['briefing', 'passed', 'settlement'].includes(s.phase)) return; if (s.round > 0 && s.round % cycle === 0 && s.debtPeriod < s.round / cycle) { this.prepareRound(); return; } s.coins += economy.recoverCoins; s.round += 1; s.notice = `整理旧物获得 ${economy.recoverCoins} 金币，占用一场。`; this.prepareRound(); }
}
