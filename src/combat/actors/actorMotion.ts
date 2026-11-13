import gsap from 'gsap';
import type { ActorEls, ActorSide } from '../types';
import { T, type MotionPreset } from '../timeline/attackTimings';

/**
 * Building blocks for the five actor states. Each function returns a tween/timeline so the
 * CombatAnimator can place it on its master timeline (and x2 / skip apply to it); the
 * StillActor hook plays the same blocks standalone for the sandbox.
 */

/** +1 = towards the enemy side (heroes step right), -1 = enemies step left. */
export const facing = (side: ActorSide) => (side === 'hero' ? 1 : -1);

export const IDLE_AMP = 5;
export const FOCUS_AMP = 3;
export const FOCUS_SCALE = 1.06;

const started = new WeakSet<HTMLElement>();

/** Breathing loop on body + shadow. Returns a kill function. */
export function startIdle(els: ActorEls, slotIndex: number, side: ActorSide, amp: number) {
  const duration = 1.3 + slotIndex * 0.11;
  let bob: gsap.core.Tween | null = null;
  let breathe: gsap.core.Tween | null = null;
  // Ease back to the rest pose first so an amplitude change never jumps, then start the loop.
  gsap.killTweensOf(els.body, 'y');
  gsap.killTweensOf(els.shadow, 'scaleX');
  const settle = gsap.to([els.body, els.shadow], {
    y: 0,
    scaleX: 1,
    duration: 0.2,
    ease: 'sine.out',
    onComplete: () => {
      if (amp <= 0) return;
      const common = { duration, yoyo: true, repeat: -1, ease: 'sine.inOut' } as const;
      bob = gsap.fromTo(els.body, { y: 0 }, { ...common, y: -amp });
      breathe = gsap.fromTo(els.shadow, { scaleX: 1 }, { ...common, scaleX: 0.9 });
      // Phase offset per slot and side so the party never breathes in sync. Seeking into
      // the loop (instead of a delay) avoids a dead pause – but only on the very first start,
      // otherwise the loop would jump away from the settled rest pose.
      if (!started.has(els.body)) {
        started.add(els.body);
        const phase = (slotIndex * 0.37 + (side === 'enemy' ? 0.21 : 0)) % 1;
        bob.totalTime(phase * duration * 2);
        breathe.totalTime(phase * duration * 2);
      }
    },
  });
  return () => {
    settle.kill();
    bob?.kill();
    breathe?.kill();
  };
}

export function focusTween(els: ActorEls, on: boolean, glowAlpha = 0.65) {
  const tl = gsap.timeline();
  tl.to(els.root, { scale: on ? FOCUS_SCALE : 1, duration: 0.14, ease: 'power2.out' }, 0);
  tl.to(els.glow, { autoAlpha: on ? glowAlpha : 0, duration: 0.14 }, 0);
  if (on) tl.to(els.img, { filter: 'brightness(1.15)', duration: 0.14 }, 0);
  else
    tl.to(els.img, { filter: 'brightness(1)', duration: 0.14 }, 0).set(
      els.img,
      { clearProps: 'filter' },
      '>',
    );
  return tl;
}

/** Wind-up + step-in towards the enemy side. `extraX` lets the animator add a dash distance. */
export function stepInTween(els: ActorEls, side: ActorSide, p: MotionPreset, extraX = 0) {
  const dir = facing(side);
  const tl = gsap.timeline();
  tl.set(els.root, { willChange: 'transform' });
  tl.to(els.glow, { autoAlpha: p.glowPeak, duration: T.STEP_IN }, 0);
  if (p.kind === 'draw') {
    // Archer: pull the bow – squash for 80ms before letting go.
    tl.to(els.root, { scaleX: 0.96, duration: 0.08, ease: 'power1.out' }, 0);
    tl.to(els.root, { scaleX: p.scale, scaleY: p.scale, x: dir * p.stepX, duration: 0.06 }, 0.08);
  } else {
    tl.to(
      els.root,
      {
        x: dir * (p.stepX + extraX),
        scale: p.scale,
        rotate: dir * p.rotate,
        duration: T.STEP_IN,
        ease: 'power2.out',
      },
      0,
    );
  }
  return tl;
}

/** Back to the slot. `focused` keeps the focus scale because the turn is not over yet. */
export function returnTween(els: ActorEls, focused: boolean) {
  const tl = gsap.timeline();
  tl.to(els.root, {
    x: 0,
    y: 0,
    rotate: 0,
    scale: focused ? FOCUS_SCALE : 1,
    duration: T.RETURN,
    ease: 'back.out(2)',
  });
  tl.to(els.glow, { autoAlpha: focused ? 0.65 : 0, duration: T.RETURN }, 0);
  tl.set(els.root, { willChange: 'auto' });
  return tl;
}

export interface HitOpts {
  side: ActorSide;
  knockback?: number;
  crit?: boolean;
}

export function hitTween(els: ActorEls, { side, knockback = 12, crit }: HitOpts) {
  // Away from the centre line: heroes get pushed left, enemies right.
  const away = -facing(side);
  const kb = Math.min(20, knockback) * (crit ? 1.25 : 1);
  const tl = gsap.timeline();
  tl.set(els.overlay, { backgroundColor: crit ? '#ff5a4a' : '#ffffff' }, 0);
  // immediateRender off: this is built into a timeline long before impact.
  tl.fromTo(
    els.overlay,
    { autoAlpha: 0.85 },
    { autoAlpha: 0, duration: 0.12, ease: 'power1.in', immediateRender: false },
    0,
  );
  tl.to(
    els.root,
    {
      x: `+=${away * kb}`,
      // Keep it under 4 degrees – a still image clips ugly beyond that.
      rotate: away * (crit ? 3 : 2),
      duration: 0.08,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    },
    0,
  );
  // Filters are expensive – only on for ~120ms.
  tl.fromTo(
    els.img,
    { filter: 'brightness(2.2)' },
    { filter: 'brightness(1)', duration: 0.12, immediateRender: false },
    0,
  );
  tl.set(els.img, { clearProps: 'filter' }, 0.13);
  return tl;
}

export function deathTween(els: ActorEls, side: ActorSide) {
  const tl = gsap.timeline();
  tl.to(els.shadow, { autoAlpha: 0, duration: 0.15 }, 0);
  tl.to(els.glow, { autoAlpha: 0, duration: 0.15 }, 0);
  tl.to(
    els.root,
    {
      y: 22,
      x: 0,
      rotate: -facing(side) * 7,
      autoAlpha: 0,
      duration: 0.45,
      ease: 'power2.in',
    },
    0.1,
  );
  tl.to(els.img, { filter: 'grayscale(1) brightness(0.55)', duration: 0.3 }, 0.1);
  tl.call(() => {
    els.root.setAttribute('aria-hidden', 'true');
    els.root.tabIndex = -1;
    els.root.style.pointerEvents = 'none';
  });
  return tl;
}

/** Undo death / leftovers from an interrupted timeline. */
export function resetActor(els: ActorEls) {
  gsap.killTweensOf([els.root, els.glow, els.img, els.shadow, els.overlay]);
  gsap.set(els.root, { clearProps: 'transform,opacity,visibility,willChange,pointerEvents' });
  gsap.set(els.img, { clearProps: 'filter' });
  gsap.set([els.glow, els.overlay], { autoAlpha: 0 });
  gsap.set(els.shadow, { autoAlpha: 1, scaleX: 1 });
  els.root.removeAttribute('aria-hidden');
}
