import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { frameCount, frameToPosition, type SpriteSheetConfig } from '@/utils/spriteSheet';

export interface SpellSpriteControls {
  elRef: React.RefObject<HTMLDivElement | null>;
  play: (opts?: { onHit?: () => void; onComplete?: () => void; timeScale?: number }) => void;
  stop: () => void;
}

/** Steps a sheet's frames on `elRef` with GSAP. The element starts hidden and hides again when done. */
export function useSpellSprite(config: SpriteSheetConfig): SpellSpriteControls {
  const elRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const play = useCallback<SpellSpriteControls['play']>(
    ({ onHit, onComplete, timeScale = 1 } = {}) => {
      const el = elRef.current;
      if (!el) return;
      tweenRef.current?.kill();

      const last = frameCount(config) - 1;
      const hitFrame = Math.round(last * config.hitAt);
      const state = { frame: 0 };
      let hitFired = false;

      const apply = () => {
        const { x, y } = frameToPosition(state.frame, config);
        el.style.backgroundPosition = `${x} ${y}`;
      };
      apply();
      gsap.set(el, { autoAlpha: 1 });

      tweenRef.current = gsap
        .to(state, {
          frame: last,
          duration: config.duration,
          ease: 'none', // linear = even frame stepping
          snap: { frame: 1 }, // whole frames only, never "half" frames
          overwrite: true,
          onUpdate: () => {
            apply();
            if (!hitFired && state.frame >= hitFrame) {
              hitFired = true;
              onHit?.();
            }
          },
          onComplete: () => {
            gsap.set(el, { autoAlpha: 0 });
            onComplete?.();
          },
        })
        .timeScale(timeScale);
    },
    [config],
  );

  const stop = useCallback(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    if (elRef.current) gsap.set(elRef.current, { autoAlpha: 0 });
  }, []);

  useEffect(
    () => () => {
      tweenRef.current?.kill();
    },
    [],
  );

  return { elRef, play, stop };
}
