import { useCallback, useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import type { ShakeStrength } from '../types';
import { shakeTween } from './cameraShake';

/**
 * Stand-alone camera shake for things outside an attack timeline (boss roar, round start).
 * Attacks shake through CombatAnimator so the shake follows x2 / skip.
 */
export function useCombatCamera(stageRef: RefObject<HTMLElement | null>, timeScale = 1) {
  const current = useRef<gsap.core.Timeline | null>(null);

  const shake = useCallback(
    (strength: ShakeStrength = 'light', xOverride?: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      current.current?.kill();
      current.current = shakeTween(stage, strength, xOverride).timeScale(timeScale);
    },
    [stageRef, timeScale],
  );

  useEffect(
    () => () => {
      current.current?.kill();
      if (stageRef.current) gsap.set(stageRef.current, { x: 0, y: 0, scale: 1 });
    },
    [stageRef],
  );

  return { shake };
}
