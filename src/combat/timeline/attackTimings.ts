import type { ActorClass, ShakeStrength } from '../types';

/**
 * Attack pipeline, in seconds at timeScale 1 (see GSAP-Still-Actor-Animation.md §10).
 * Projectile attacks push IMPACT back to `PROJECTILE_START + PROJECTILE_FLIGHT` so the
 * sprite sheet starts on frame 0 when the projectile lands, not when the wind-up begins.
 */
export const T = {
  FOCUS: 0,
  WINDUP: 0.08,
  STEP_IN: 0.12,
  PROJECTILE_START: 0.2,
  PROJECTILE_FLIGHT: 0.18,
  /** Melee impact – the SpellFx starts here. */
  IMPACT: 0.26,
  /** Offsets from impact. */
  SHAKE_AFTER: 0.02,
  HIT_AFTER: 0.02,
  FLOATER_AFTER: 0.04,
  RETURN_AFTER: 0.24,
  RETURN: 0.2,
  UNDIM_AFTER: 0.05,
} as const;

export type AttackKind = 'dash' | 'stand' | 'teleport' | 'draw' | 'pulse';

export interface MotionPreset {
  kind: AttackKind;
  /** Step-in distance towards the enemy side, px. */
  stepX: number;
  scale: number;
  rotate: number;
  /** Knockback applied to the target, px away from the centre line. */
  knockback: number;
  projectile: boolean;
  /** Glow alpha at the peak of the wind-up. */
  glowPeak: number;
  /** Camera shake for a normal hit (crit bumps one level, ult goes to 'ult'). */
  shake: ShakeStrength;
  /** Optional px override for the camera's x amplitude. */
  shakeX?: number;
}

export const MOTION_PRESETS: Record<ActorClass, MotionPreset> = {
  warrior: {
    kind: 'dash',
    stepX: 32,
    scale: 1.08,
    rotate: 1.5,
    knockback: 14,
    projectile: false,
    glowPeak: 0.75,
    shake: 'light',
    shakeX: 6,
  },
  tank: {
    kind: 'dash',
    stepX: 12,
    scale: 1.06,
    rotate: 1,
    knockback: 20,
    projectile: false,
    glowPeak: 0.7,
    shake: 'light',
  },
  mage: {
    kind: 'stand',
    stepX: 8,
    scale: 1.05,
    rotate: 0.5,
    knockback: 10,
    projectile: true,
    glowPeak: 1,
    shake: 'light',
  },
  assassin: {
    kind: 'teleport',
    stepX: 0,
    scale: 1.06,
    rotate: 2,
    knockback: 12,
    projectile: false,
    glowPeak: 0.7,
    shake: 'light',
  },
  archer: {
    kind: 'draw',
    stepX: 6,
    scale: 1.04,
    rotate: 0,
    knockback: 10,
    projectile: true,
    glowPeak: 0.7,
    shake: 'light',
  },
  necro: {
    kind: 'pulse',
    stepX: 0,
    scale: 1.04,
    rotate: 0,
    knockback: 10,
    projectile: true,
    glowPeak: 0.9,
    shake: 'light',
  },
};

export const motionPreset = (c: ActorClass): MotionPreset => MOTION_PRESETS[c];
