import { bandWeights, bandResults } from '../rules/band-presets';
// 试玩数值；每场开始时固定结果。
export const lots = [
  { name: '乐队巡演箱', theme: 'band', story: '巡演结束后，部分器材无人认领。运输途中曾淋雨，物品可能受潮。', auctioneerLines: [
    '运输途中遇过雨，纸质物品要留意受潮。听说这批货跟着乐队跑过几座城市。',
    '货物刚从后台仓库清出，纸箱外层能看到水渍，里面保存如何还不知道。',
    '这箱是巡演结束后留下的，打包时没有逐件检查，旧器材状态得看运气。',
  ], items: [
    { clue: '旧自行车', hint: '轮胎没气，车架看起来完整。', art: 'bike', good: ['旧自行车', '车架完好，只需修理轮胎。', 80], bad: ['旧自行车', '链条和轮胎都需要修理。', 50] },
    { clue: '木质乐器盒', hint: '边缘磨损，扣锁完好；盒内情况不明。', art: 'instrumentCase', good: ['旧吉他', '琴身保存不错，仍可演奏。', 360], bad: ['旧琴弦和配件', '盒内只有一些配件。', 30], collectible: true },
    { clue: '乐谱纸箱', hint: '外层有水渍，内层是否受潮尚不清楚。', art: 'sheetBox', good: ['旧乐谱', '内层保存完好。', 110], bad: ['受潮乐谱', '大部分纸张受潮。', 20] },
    { clue: '布遮箱子', hint: '只能看到轮廓，里面的东西未知。', art: 'cloth', good: ['舞台支架', '普通但完整的舞台用品。', 90], bad: ['舞台支架', '有磨损，仍能使用。', 70] },
    { clue: '线材袋', hint: '拉链半开，能看到线材；接头状态未知。', art: 'cable', good: ['演出线材', '线材接头完好。', 100], bad: ['旧线材', '接头氧化，需要维修。', 25] },
  ],
  // 夹层惊喜物品池（约10%概率，开拍前已抽定，价值≤整箱约15%）
  bonusPool: [
    { name: '旧演出照片集', description: '信封里的黑白演出照，记录了几十年前的巡演。', minVal: 30, maxVal: 55, collectible: true },
    { name: '未拆封的拨片组', description: '品牌拨片，一盒二十个，未拆封。', minVal: 15, maxVal: 25 },
    { name: '旧节目单', description: '几张泛黄的演出节目单，有歌迷的签名痕迹。', minVal: 20, maxVal: 45, collectible: true },
    { name: '旧巡演票根', description: '几张褪色的巡演票根，背面记着演出日期。', minVal: 25, maxVal: 50, collectible: true },
    { name: '乐队纪念徽章', description: '一枚磨损的巡演纪念徽章，背扣仍然完整。', minVal: 35, maxVal: 75, collectible: true },
    { name: '旧磁带', description: '一盘手写标签的排练录音带，是否还能播放未知。', minVal: 20, maxVal: 45, collectible: true },
    { name: '未发行的巡演母带', description: '一卷从未公开发行的现场母带，标签上有乐队成员签名。', minVal: 900, maxVal: 1100, collectible: true, jackpot: true },
  ] },
  { name: '摄影工作室箱', theme: 'photo', story: '摄影工作室搬迁，留下部分设备。器材外观尚可，内部状态未知。', auctioneerLines: [
    '摄影工作室搬迁时装箱很急，器材只看过外观，功能都没有逐件测试。',
    '这些器材在室内工作室用过，包和支架都有磨损，镜头情况未知。',
    '箱主说相册和布景都还在，至于摄影器材能不能正常工作，没人打包票。',
  ], items: [
    { clue: '相机包', hint: '包身磨损，拉链完好，看不见内部。', art: 'cameraBag', good: ['旧相机', '相机工作正常。', 300], bad: ['相机配件', '只有旧电池和线材。', 35], collectible: true },
    { clue: '三脚架', hint: '外观完整，锁扣是否牢固未知。', art: 'tripod', good: ['三脚架', '锁扣牢固。', 100], bad: ['三脚架', '一个锁扣损坏。', 35] },
    { clue: '相册', hint: '封面有划痕，内页未检查。', art: 'album', good: ['旧相册', '内页保存整齐。', 80], bad: ['旧相册', '内页受潮。', 20] },
    { clue: '遮布箱', hint: '箱子轮廓可见，内容未知。', art: 'cloth', good: ['摄影灯', '灯具完整。', 150], bad: ['旧布景', '普通布景，有使用痕迹。', 45] },
    { clue: '长筒形盒', hint: '长筒包装，封口有磨损，内部未经检查。', art: 'crate', good: ['布景支撑杆', '零件齐全，可继续使用。', 65], bad: ['旧背景纸', '纸面有折痕，只能裁切利用。', 15] },
  ],
  bonusPool: [
    { name: '旧底片盒', description: '几卷没冲洗的黑白底片，年代久远，有收藏价值。', minVal: 20, maxVal: 40, collectible: true },
    { name: '快门线', description: '快门线一根，接口通用，保存完好。', minVal: 12, maxVal: 22 },
    { name: '滤镜套装', description: '一套老式滤镜，品相不错，口径通用。', minVal: 25, maxVal: 50 },
    { name: '幻灯片盒', description: '一盒旧旅行幻灯片，标签写着拍摄年份。', minVal: 30, maxVal: 65, collectible: true },
    { name: '老式测光表', description: '一只旧测光表，指针会动，读数是否准确未知。', minVal: 45, maxVal: 95, collectible: true },
    { name: '闪光灯泡', description: '几只老式闪光灯泡，包装有压痕，尚未试用。', minVal: 18, maxVal: 38 },
    { name: '大师签名底片', description: '一卷标注着大师姓名的原始底片，保存状态极好。', minVal: 900, maxVal: 1100, collectible: true, jackpot: true },
  ] },
  { name: '旧维修铺箱', theme: 'repair', story: '维修铺搬迁，清出了工具和寄修物品。外壳旧了，功能尚未测试。', auctioneerLines: [
    '维修铺搬迁时没有时间清点抽屉，工具和零件混在几个旧箱子里。',
    '老师傅留下了钟表和收音机，但没有记录哪些修好、哪些还要返工。',
    '这批东西外壳都旧了，开机、走时和零件数量都得自己判断。',
  ], items: [
    { clue: '工具柜', hint: '柜门能关上，内部工具数量未知。', art: 'repairCabinet', good: ['扳手套装', '工具齐全。', 210], bad: ['旧工具', '部分工具缺失。', 65] },
    { clue: '挂钟', hint: '表盘完整，走时情况未知。', art: 'repairClock', good: ['机械挂钟', '走时正常。', 190], bad: ['坏挂钟', '机芯需要维修。', 35], collectible: true },
    { clue: '收音机', hint: '外壳有划痕，能否工作未知。', art: 'repairRadio', good: ['老收音机', '可以正常收听。', 160], bad: ['坏收音机', '无法开机。', 30] },
    { clue: '零件抽屉', hint: '抽屉里有东西，具体数量未知。', art: 'repairParts', good: ['维修零件', '常用零件保存完好。', 100], bad: ['旧零件', '多数零件已生锈。', 40] },
    { clue: '封钉木箱', hint: '木箱封钉完好，里面装着什么尚不清楚。', art: 'repairCrate', good: ['箱装工具', '工具完整，仍可使用。', 140], bad: ['旧杂物', '箱内只有一些旧杂物。', 25] },
  ],
  bonusPool: [
    { name: '旧徽章', description: '一枚铜质工匠协会徽章，年代不详，有收藏价值。', minVal: 18, maxVal: 35, collectible: true },
    { name: '未开封的钟油', description: '一小瓶老式钟表油，仍在保质期内。', minVal: 8, maxVal: 18 },
    { name: '旧工具书', description: '几册泛黄的机械维修手册，内容详实。', minVal: 15, maxVal: 30 },
    { name: '黄铜怀表', description: '一只黄铜怀表，表壳有划痕，走时情况未知。', minVal: 50, maxVal: 110, collectible: true },
    { name: '木柄刨子', description: '一把老木工刨子，刀口尚在，木柄有磨损。', minVal: 35, maxVal: 80 },
    { name: '旧齿轮组', description: '几枚不同尺寸的金属齿轮，齿面保存不一。', minVal: 20, maxVal: 60, collectible: true },
    { name: '师傅签名怀表', description: '一只由老钟表师傅亲手修复并签名的怀表，藏家一直在找。', minVal: 900, maxVal: 1100, collectible: true, jackpot: true },
  ] },
];

// 每个主题的十组箱内组合；开拍前抽定并锁定，主题与内容均有多种变化。
const combinations = {
  band: [[1,1,0,0,1], [0,0,0,0,0], [1,1,1,1,0], [0,0,1,0,1], [1,1,0,0,0], [0,0,0,1,1], [1,1,0,0,1], [1,1,0,1,1], [1,0,1,1,0], [1,1,1,1,1]],
  photo: [[1,1,0,0,1], [0,0,0,0,0], [1,0,1,1,0], [0,1,1,0,1], [1,1,0,1,0], [0,0,0,1,0], [1,0,1,0,1], [0,1,0,1,0], [1,1,1,0,0], [0,0,1,1,1]],
  repair: [[1,0,1,0,1], [0,0,0,0,0], [1,1,0,1,0], [0,1,0,0,0], [1,0,0,1,1], [1,0,1,0,0], [0,1,0,1,0], [1,0,0,1,0], [0,1,1,0,1], [1,1,0,0,0]],
};
const silhouettes = {
  band: ['自行车形框架', '长方形硬壳盒', '方纸箱', '帆布覆盖的中型件', '软布包'],
  photo: ['带提手的软包', '细长折叠架', '扁平册子', '帆布覆盖的方箱', '长筒形盒'],
  repair: ['多层金属柜', '圆形表盘', '带旋钮的方盒', '帆布覆盖的重型件', '封钉木箱'],
};
const categories = {
  band: ['交通旧物', '乐器或配件', '纸质资料', '舞台用品', '线材用品'],
  photo: ['摄影器材或配件', '支撑器材', '纸质资料', '灯具或布景', '布景用品'],
  repair: ['手工具', '钟表', '电子设备', '金属零件', '工具或杂物'],
};
// 品相较好的现有物品均可选择收藏；坏品仍只能出售。
const collectibleSlots = { band: [0, 1, 2, 3, 4], photo: [0, 1, 2, 3, 4], repair: [0, 1, 2, 3, 4] };
lots.forEach((lot) => {
  const prices = { band: [[60,35],[260,30],[100,15],[100,60],[55,20]], photo: [[250,30],[80,30],[80,20],[120,40],[65,15]], repair: [[140,50],[150,35],[120,30],[80,30],[90,25]] };
  lot.items.forEach((item, i) => { item.good[2] = prices[lot.theme][i][0]; item.bad[2] = prices[lot.theme][i][1]; });
  lot.weights = lot.theme === 'band' ? bandWeights : [15, 15, 10, 10, 10, 10, 10, 10, 5, 5];
  lot.presets = combinations[lot.theme];
  if (lot.theme === 'band') { lot.weights = bandWeights; lot.presetResults = bandResults; }
  lot.items.forEach((item, i) => {
    item.collectible = collectibleSlots[lot.theme].includes(i);
    item.shape = silhouettes[lot.theme][i]; item.category = categories[lot.theme][i];
    item.expected = lot.presets.reduce((sum, preset, j) => sum + (lot.presetResults ? lot.presetResults[j][i][2] : preset[i] ? item.good[2] : item.bad[2]) * lot.weights[j] / 100, 0);
  });
});
