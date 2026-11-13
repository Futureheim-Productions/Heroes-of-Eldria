import gsap from 'gsap';
import { T } from '../timeline/attackTimings';
import type { Point } from './stageSpellFx';

/**
 * A glowing orb from caster centre to target centre (mage / archer / necro).
 * Uses a pooled node; hidden again on complete.
 */
export function projectileTween(el: HTMLDivElement, from: Point, to: Point, color: string) {
  const tl = gsap.timeline();
  tl.call(() => {
    el.style.background = `radial-gradient(circle, #fff 0%, ${color} 45%, transparent 72%)`;
    el.style.boxShadow = `0 0 14px 4px ${color}`;
  });
  tl.set(el, { x: from.x, y: from.y, scale: 0.6, autoAlpha: 1 });
  tl.to(el, { x: to.x, y: to.y, scale: 1.1, duration: T.PROJECTILE_FLIGHT, ease: 'power2.in' });
  tl.set(el, { autoAlpha: 0 });
  return tl;
}

/** Necro: green glow pulse on the ground under the target. */
export function groundPulseTween(el: HTMLDivElement, feet: Point, width: number, color: string) {
  const h = width * 0.3;
  const tl = gsap.timeline();
  tl.call(() => {
    el.style.width = `${width}px`;
    el.style.height = `${h}px`;
    el.style.background = `radial-gradient(ellipse at center, ${color} 0%, ${color}88 40%, transparent 70%)`;
  });
  tl.set(el, { x: feet.x - width / 2, y: feet.y - h / 2, scale: 0.4, autoAlpha: 0.95 });
  tl.to(el, { scale: 1.4, autoAlpha: 0, duration: 0.45, ease: 'power2.out' });
  return tl;
}
