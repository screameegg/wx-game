import { steps } from '../shared/chrome';
import { dockArgs } from '../../data/round7';
import { palette } from '../../render/ui';
import { rarityTier, settleBeat } from '../../data/round6';
import {
  currentIndex, drawRareStar, drawSettleButton, enterProgress, flipFrame, flipProgress,
  paintHero, pendingIndices, rareFlash, settleZones, skipRevealSequence, slotPose, sparkElapsed, syncRevealReel,
} from '../../fx/round6-beats';

// 开箱只改怎么看：当前件居中放大，其余退后。卖掉和收下仍走原来的 handle。
export function reveal(scene, ctx, now = Date.now()) {
  const s = scene.game.state;
  steps(scene, ctx, 2);
  const reel = syncRevealReel(scene, now);
  const index = currentIndex(s);
  if (index < 0) {
    scene.text(ctx, '这箱都处理完了', 24, scene.height - 96, 16, palette.gold);
    scene.button(ctx, '看看这箱赚亏多少', ...dockArgs(scene.height), () => scene.game.prepareRound());
    return;
  }

  const pending = pendingIndices(s.items);
  const order = pending.indexOf(index);
  const enter = enterProgress(reel, now);
  const item = s.items[index];
  const opened = item.status === 'revealed';
  const pose = opened ? flipFrame(flipProgress(reel, scene.effect, now)) : null;
  if (opened && scene.effect && scene.effect.kind === 'reveal') scene.effect.phase = pose.phase;

  pending.forEach((itemIndex, slot) => {
    if (itemIndex === index) return;
    paintHero(scene, ctx, itemIndex, s.items[itemIndex], slotPose(slot, order, pending.length, 1), null);
  });
  const spot = slotPose(order, order, pending.length, opened ? 1 : enter);
  if (pose) spot.scale = pose.scale;
  const hero = paintHero(scene, ctx, index, item, spot, pose);

  if (!reel.skip) {
    scene.link(ctx, '跳过动画', 24, 360, 110, () => {
      skipRevealSequence(reel);
      openCurrent(scene);
    });
  }

  if (!opened) {
    scene.buttons.push({ x: hero.x, y: hero.y, w: hero.w, h: hero.h, label: '翻开这件', action: () => scene.game.reveal(index) });
    scene.text(ctx, '点这一件', 148, 392, 16, palette.gold);
    return;
  }
  if (!pose.ready) {
    scene.text(ctx, pose.caption || '翻牌', 148, 400, 16, palette.gold);
    return;
  }

  if (rarityTier(item) === 'rare') {
    const flash = rareFlash(sparkElapsed(reel, index, now), 'rare');
    if (flash.on) drawRareStar(ctx, spot.x + 78, spot.y - 78, flash.alpha);
  }

  const hold = confirmHold(scene, now);
  scene.text(ctx, item.result[0], 24, 430, 20, rarityTier(item) === 'rare' ? palette.gold : palette.text);
  scene.text(ctx, `可卖 ${item.result[2]} 金币`, 24, 458, 16, palette.text);
  scene.text(ctx, item.good === false ? '品相：受损或有缺件' : '品相：外观较好', 24, 480, 12, palette.muted);
  if (hold) scene.text(ctx, hold, 24, 504, 14, palette.gold);

  const zones = settleZones(375, scene.height);
  scene.button(ctx, zones.sell.label, zones.sell.x, zones.sell.y, zones.sell.w, zones.sell.h, () => confirmSettle(scene, 'sell'), false, {
    role: 'sell', confirm: 'release', paint: (paint, box) => drawSettleButton(paint, { ...box, kind: 'sell' }),
  });
  scene.button(ctx, zones.collect.label, zones.collect.x, zones.collect.y, zones.collect.w, zones.collect.h, () => confirmSettle(scene, 'collect'), false, {
    role: 'collect', confirm: 'release', disabled: !item.collectible, paint: (paint, box) => drawSettleButton(paint, { ...box, kind: 'collect' }),
  });
}

function confirmHold(scene, now) {
  const effect = scene.effect;
  if (!effect || (effect.kind !== 'sell' && effect.kind !== 'collect')) return '';
  if (now - effect.at >= settleBeat.confirmMs) return '';
  return effect.kind === 'sell' ? '已卖掉' : '已收下';
}

function confirmSettle(scene, action) {
  scene.game.handle(action);
  if (scene.revealReel && scene.revealReel.skip) openCurrent(scene);
}

function openCurrent(scene) {
  const index = currentIndex(scene.game.state);
  if (index < 0) return;
  const item = scene.game.state.items[index];
  if (item && item.status === 'hidden') scene.game.reveal(index);
}
