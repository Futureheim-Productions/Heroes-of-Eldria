import type { Effect, EffectTarget, Element, SkillDef, StatusId, TargetType } from '@/types';

type SkillOpts = Partial<Pick<SkillDef, 'chainJumps' | 'count' | 'fx'>>;

export function basic(
  id: string,
  element: Element,
  glyph: string,
  effects: Effect[],
  opts: SkillOpts = {},
): SkillDef {
  return { id, kind: 'basic', element, target: 'enemy', cooldown: 0, effects, glyph, ...opts };
}

export function skill(
  id: string,
  element: Element,
  target: TargetType,
  cooldown: number,
  glyph: string,
  effects: Effect[],
  opts: SkillOpts = {},
): SkillDef {
  return { id, kind: 'skill', element, target, cooldown, effects, glyph, ...opts };
}

export function ultimate(
  id: string,
  element: Element,
  target: TargetType,
  cooldown: number,
  glyph: string,
  effects: Effect[],
  opts: SkillOpts = {},
): SkillDef {
  return { id, kind: 'ultimate', element, target, cooldown, effects, glyph, ...opts };
}

export const dmg = (
  mult: number,
  extra: Partial<Extract<Effect, { kind: 'damage' }>> = {},
): Effect => ({
  kind: 'damage',
  mult,
  ...extra,
});

export const status = (
  s: StatusId,
  turns: number,
  target: EffectTarget = 'target',
  value?: number,
  chance?: number,
): Effect => ({ kind: 'status', status: s, turns, target, value, chance });

export const heal = (
  mult: number,
  target: 'target' | 'self' | 'allies' | 'ally' = 'target',
): Effect => ({
  kind: 'heal',
  mult,
  target,
});

export const shield = (
  mult: number,
  turns: number,
  target: 'target' | 'self' | 'allies' | 'ally' = 'self',
): Effect => ({
  kind: 'shield',
  mult,
  turns,
  target,
});

export const cleanse = (
  count: number,
  target: 'target' | 'self' | 'allies' | 'ally' = 'allies',
): Effect => ({
  kind: 'cleanse',
  count,
  target,
});
