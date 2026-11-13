import gsap from 'gsap';
import type { ShakeStrength } from '../types';

const SHAKES: Record<ShakeStrength, { x: number; y: number; repeats: number; zoom: number }> = {
  light: { x: 4, y: 0, repeats: 2, zoom: 1 },
  medium: { x: 7, y: 3, repeats: 4, zoom: 1 },
  ult: { x: 7, y: 3, repeats: 4, zoom: 1.03 },
};

export const heavier = (s: ShakeStrength): ShakeStrength => (s === 'light' ? 'medium' : 'ult');

/**
 * Camera shake on the whole stage (never on an actor that is also stepping in – double
 * motion looks drunk). Always ends at x/y 0, scale 1.
 */
export function shakeTween(stage: HTMLElement, strength: ShakeStrength, xOverride?: number) {
  const s = SHAKES[strength];
  const ax = xOverride ?? s.x;
  const tl = gsap.timeline();
  if (s.zoom !== 1) tl.to(stage, { scale: s.zoom, duration: 0.08, ease: 'power2.out' }, 0);
  for (let i = 0; i < s.repeats; i++) {
    const sign = i % 2 === 0 ? 1 : -1;
    const decay = 1 - i / (s.repeats + 1);
    tl.to(stage, {
      x: sign * ax * decay,
      y: -sign * s.y * decay,
      duration: 0.035,
      ease: 'sine.inOut',
    });
  }
  tl.to(stage, { x: 0, y: 0, scale: 1, duration: 0.08, ease: 'power2.out', overwrite: 'auto' });
  return tl;
}
