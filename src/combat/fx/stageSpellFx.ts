import gsap from 'gsap';
import {
  frameCount,
  frameToPosition,
  sheetBackgroundSize,
  type SpriteSheetConfig,
} from '@/utils/spriteSheet';

export interface Point {
  x: number;
  y: number;
}

/**
 * Plays a 9-slice sprite sheet (same configs as components/fx/SpellFx) at `at`,
 * as a timeline the CombatAnimator can nest – so x2 speed and skip apply to the FX too.
 * The sheet lives in the stage's FX layer, never inside an actor.
 */
export function sheetTween(
  el: HTMLDivElement,
  sheet: SpriteSheetConfig,
  at: Point,
  scale = 1,
  /**
   * `feet` (default): `at` is the target's feet – the sheet stands on the ground and sinks
   * 15% below it, exactly like BattleUnit places its bursts. `ground`: bottom edge exactly on
   * `at` (a sheet that replaces a standing actor). `center`: centred on `at`.
   */
  anchor: 'feet' | 'ground' | 'center' = 'feet',
  /** Mirror horizontally – e.g. a transformation played by a unit on the enemy side. */
  flip = false,
  /** Frame range to play (inclusive) – e.g. only the hit frames of a projectile sheet. */
  frames: [number, number] = [0, frameCount(sheet) - 1],
): gsap.core.Timeline {
  const px = sheet.size * scale;
  const top =
    anchor === 'feet' ? at.y - px * 0.85 : anchor === 'ground' ? at.y - px : at.y - px / 2;
  const [first, last] = frames;
  const state = { frame: first };
  const apply = () => {
    const { x, y } = frameToPosition(state.frame, sheet);
    el.style.backgroundPosition = `${x} ${y}`;
  };
  const tl = gsap.timeline();
  tl.call(() => {
    el.style.width = `${px}px`;
    el.style.height = `${px}px`;
    el.style.backgroundImage = `url(${sheet.src})`;
    el.style.backgroundSize = sheetBackgroundSize(sheet);
    el.style.mixBlendMode = sheet.blend === 'screen' ? 'screen' : '';
    state.frame = first;
    apply();
  });
  tl.set(el, { x: at.x - px / 2, y: top, scaleX: flip ? -1 : 1, autoAlpha: 1 });
  tl.to(state, {
    frame: last,
    duration: sheet.duration,
    ease: 'none',
    snap: { frame: 1 },
    onUpdate: apply,
  });
  tl.set(el, { autoAlpha: 0 });
  return tl;
}

/**
 * The in-flight part of a projectile sheet (frames 0…`sheet.flight - 1`): the cell travels from
 * `from` to `to` (both centres) while its frames step, rotated to follow the path. Sheets are
 * drawn flying to the right; a shot to the left is mirrored instead of turned upside down.
 */
export function flightTween(
  el: HTMLDivElement,
  sheet: SpriteSheetConfig,
  from: Point,
  to: Point,
  time: number,
  scale = 1,
): gsap.core.Timeline {
  const px = sheet.size * scale;
  const last = (sheet.flight ?? 1) - 1;
  const state = { frame: 0 };
  const apply = () => {
    const { x, y } = frameToPosition(state.frame, sheet);
    el.style.backgroundPosition = `${x} ${y}`;
  };
  const dx = to.x - from.x;
  const angle = (Math.atan2(to.y - from.y, dx) * 180) / Math.PI;
  const left = dx < 0;
  const tl = gsap.timeline();
  tl.call(() => {
    el.style.width = `${px}px`;
    el.style.height = `${px}px`;
    el.style.backgroundImage = `url(${sheet.src})`;
    el.style.backgroundSize = sheetBackgroundSize(sheet);
    el.style.mixBlendMode = sheet.blend === 'screen' ? 'screen' : '';
    state.frame = 0;
    apply();
  });
  tl.set(el, {
    x: from.x - px / 2,
    y: from.y - px / 2,
    scaleX: left ? -1 : 1,
    rotation: left ? angle - 180 : angle,
    autoAlpha: 1,
  });
  tl.to(el, { x: to.x - px / 2, y: to.y - px / 2, duration: time, ease: 'power1.in' }, '<');
  tl.to(
    state,
    { frame: last, duration: time, ease: 'none', snap: { frame: 1 }, onUpdate: apply },
    '<',
  );
  tl.set(el, { autoAlpha: 0, rotation: 0 });
  return tl;
}
