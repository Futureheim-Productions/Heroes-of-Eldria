import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import type { ActorEls, ActorSide, ActorState, ActorClass } from '../types';
import { motionPreset, T } from '../timeline/attackTimings';
import {
  deathTween,
  focusTween,
  FOCUS_AMP,
  hitTween,
  IDLE_AMP,
  resetActor,
  returnTween,
  startIdle,
  stepInTween,
} from './actorMotion';

interface Options {
  els: RefObject<ActorEls | null>;
  state: ActorState;
  side: ActorSide;
  classId: ActorClass;
  slotIndex: number;
}

/**
 * Drives the persistent state of one actor from its `state` prop: idle breathing, focus,
 * death – plus one-shot attack/hit for the sandbox. Nothing animates during render; a state
 * change triggers the effect. Attack timelines against a real target belong to CombatAnimator.
 */
export function useActorMotion({ els, state, side, classId, slotIndex }: Options) {
  const stopIdle = useRef<(() => void) | null>(null);
  const oneShot = useRef<gsap.core.Timeline | null>(null);
  const prevState = useRef<ActorState | null>(null);

  const setIdleAmp = useCallback(
    (amp: number) => {
      const e = els.current;
      if (!e) return;
      stopIdle.current?.();
      stopIdle.current = startIdle(e, slotIndex, side, amp);
    },
    [els, slotIndex, side],
  );

  // Idle runs for the actor's whole life; states only change its amplitude.
  useLayoutEffect(() => {
    setIdleAmp(IDLE_AMP);
    return () => {
      stopIdle.current?.();
      stopIdle.current = null;
    };
  }, [setIdleAmp]);

  useEffect(() => {
    const e = els.current;
    if (!e) return;
    const prev = prevState.current;
    prevState.current = state;
    // The layout effect above already started idle on mount.
    if (prev === state || (prev === null && state === 'idle')) return;

    oneShot.current?.kill();
    oneShot.current = null;
    if (prev === 'death') resetActor(e);

    switch (state) {
      case 'idle':
        setIdleAmp(IDLE_AMP);
        if (prev && prev !== 'death') oneShot.current = focusTween(e, false);
        break;
      case 'focus':
        setIdleAmp(FOCUS_AMP);
        oneShot.current = focusTween(e, true);
        break;
      case 'attack': {
        const p = motionPreset(classId);
        oneShot.current = gsap
          .timeline()
          .add(stepInTween(e, side, p))
          .add(returnTween(e, prev === 'focus'), `+=${T.RETURN_AFTER - T.STEP_IN}`);
        break;
      }
      case 'hit':
        oneShot.current = hitTween(e, { side });
        break;
      case 'death':
        stopIdle.current?.();
        stopIdle.current = null;
        oneShot.current = deathTween(e, side);
        break;
    }
  }, [els, state, side, classId, setIdleAmp]);

  useEffect(
    () => () => {
      oneShot.current?.kill();
      const e = els.current;
      if (e) gsap.killTweensOf([e.root, e.body, e.glow, e.img, e.shadow, e.overlay]);
    },
    [els],
  );

  return { setIdleAmp };
}
