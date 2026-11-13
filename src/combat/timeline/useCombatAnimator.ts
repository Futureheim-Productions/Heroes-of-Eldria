import { useEffect, useState } from 'react';
import { CombatAnimator } from './CombatAnimator';

/** One animator per combat screen; pass it to <CombatStage animator={…}>. */
export function useCombatAnimator(timeScale = 1) {
  const [animator] = useState(() => new CombatAnimator());
  useEffect(() => animator.setTimeScale(timeScale), [animator, timeScale]);
  useEffect(() => () => animator.kill(), [animator]);
  return animator;
}
