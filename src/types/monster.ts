import type { Element, Rarity, Stats } from './common';
import type { SkillDef, StatusId } from './combat';

export type MonsterType =
  'undead' | 'beast' | 'elemental' | 'construct' | 'humanoid' | 'demon' | 'unique';

export type MonsterTier = 'common' | 'mid' | 'elite' | 'unique';

export interface MonsterDef {
  id: string;
  type: MonsterType;
  tier: MonsterTier;
  element: Element;
  rarity: Rarity;
  glyph: string;
  baseStats: Stats;
  skills: SkillDef[];
  tags: string[];
  /** Passive statuses applied at battle start */
  passives?: { status: StatusId; value?: number }[];
  isBoss?: boolean;
}
