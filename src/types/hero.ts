import type { Element, Rarity, Stats } from './common';
import type { SkillDef } from './combat';

export type HeroRole = 'tank' | 'mage' | 'bruiser' | 'assassin' | 'offtank' | 'healer' | 'ranger';

export interface HeroDef {
  id: string;
  rarity: Rarity;
  role: HeroRole;
  element: Element;
  baseStars: number;
  baseStats: Stats;
  /** Per-level growth for hp/atk/def */
  growth: { hp: number; atk: number; def: number };
  skills: SkillDef[];
  /** Emoji/glyph used for the procedural portrait */
  glyph: string;
  /** Tags used for damage bonuses (e.g. undead) */
  tags?: string[];
}

export type EquipSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory';

export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];

export interface OwnedHero {
  defId: string;
  level: number;
  xp: number;
  stars: number;
  /** skillId -> level (1..5) */
  skillLevels: Record<string, number>;
  /** slot -> owned item instance id */
  equipment: Partial<Record<EquipSlot, string>>;
  /** Selected skin: 0 = default art, n = `HERO_SKINS[id][n - 1]` */
  skin?: number;
}
