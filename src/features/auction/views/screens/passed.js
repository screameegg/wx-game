import { palette } from '../../render/ui';
import { drawExpression, passedExpression } from '../people/expressions';
import { passLine } from '../../data/lines';

// 流拍和被对手拍下时不公开箱内内容。拍下者笑，另一位轻松。
export function passed(scene, ctx) {
  const s = scene.game.state;
  scene.text(ctx, s.winner ? '本场没有拍下' : '这箱流拍', 24, 200, 24);
  scene.paragraph(ctx, s.notice || '你没有扣款，继续下一箱。', 24, 248, 327, 16, 4);
  ['老周', '阿岚'].forEach((name, i) => {
    const x = i ? 205 : 35;
    const mood = passedExpression(name, s.winner);
    drawExpression(scene, ctx, i, mood, x, 330, 130, 130);
    scene.text(ctx, `${name}：${passLine(name, s.winner)}`, x, 474, 12, palette.muted);
    scene.text(ctx, mood.label, x, 494, 13, palette.gold);
  });
  scene.button(ctx, '继续，看下一箱', 24, scene.height - 68, 327, 48, () => scene.game.prepareRound());
}
