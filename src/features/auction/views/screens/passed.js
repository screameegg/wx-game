import { palette } from '../../render/ui';
import { sprite } from '../../render/sprites';

// 流拍和被对手拍下时不公开箱内内容。
export function passed(scene, ctx) {
  const s = scene.game.state;
  scene.text(ctx, s.winner ? '本场没有拍下' : '这箱流拍', 24, 220, 24);
  scene.paragraph(ctx, s.notice || '你没有扣款，继续下一箱。', 24, 268, 327, 16, 4);
  ['老周', '阿岚'].forEach((name, i) => {
    const x = i ? 205 : 35; const frame = s.winner === name ? 3 : 0;
    sprite(ctx, scene.art.get(i ? 'lanSheet' : 'zhouSheet'), i * 6 + frame, 6, 2, x, 330, 130, 130);
    scene.text(ctx, s.winner === name ? `${name}：这箱归我了` : `${name}：下一箱见`, x, 480, 12, palette.muted);
  });
  scene.button(ctx, '继续，看下一箱', 24, scene.height - 68, 327, 48, () => scene.game.prepareRound());
}
