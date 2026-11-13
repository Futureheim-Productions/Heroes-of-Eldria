import gsap from 'gsap';
import type { Point } from './stageSpellFx';

export interface FloaterOpts {
  value: number | string;
  crit?: boolean;
  heal?: boolean;
  /** Stack index – each concurrent floater on the same target shifts 12px. */
  stack?: number;
  timeScale?: number;
  critLabel?: string;
  /** Overrides the white / gold / green text colour (status texts, shields, misses...). */
  color?: string;
  /** Smaller text for words (status names) rather than numbers. */
  small?: boolean;
  onDone?: () => void;
}

/**
 * Damage number in the stage's floater layer (absolutely positioned → no layout shift).
 * Pop: scale 0.4 → 1.25 → 1, rise 48px, fade after 0.5s. Removes its node when done.
 */
export function spawnFloater(layer: HTMLElement, at: Point, o: FloaterOpts) {
  const el = document.createElement('div');
  el.className = `damage-floater${o.crit ? ' crit' : ''}${o.heal ? ' heal' : ''}`;
  if (o.color) el.style.color = o.color;
  if (o.crit) {
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = o.critLabel ?? 'CRITICAL';
    el.appendChild(label);
  }
  const value = document.createElement('span');
  value.className = 'value';
  if (o.small) value.style.fontSize = '13px';
  value.textContent = String(o.value);
  el.appendChild(value);
  layer.appendChild(el);

  const offsetX = (o.stack ?? 0) * 12;
  const tl = gsap.timeline({
    onComplete: () => {
      el.remove();
      o.onDone?.();
    },
  });
  // xPercent/yPercent centre the number on the point without measuring it.
  tl.set(el, {
    x: at.x + offsetX,
    y: at.y,
    xPercent: -50,
    yPercent: -50,
    scale: 0.4,
    autoAlpha: 1,
  });
  tl.to(el, { y: at.y - 48, duration: 0.9, ease: 'power2.out' }, 0);
  tl.to(el, { scale: o.crit ? 1.4 : 1.25, duration: 0.12, ease: 'power2.out' }, 0);
  tl.to(el, { scale: 1, duration: 0.14, ease: 'power1.inOut' }, 0.12);
  tl.to(el, { autoAlpha: 0, duration: 0.35 }, 0.5);
  if (o.timeScale) tl.timeScale(o.timeScale);
  return tl;
}
