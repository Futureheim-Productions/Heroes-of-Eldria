import type { HeroDef, MonsterDef, OwnedHero, OwnedItem, Stats } from '@/types';
import { getItemDef, SET_BONUSES } from '@/data/items';
import { RARITY_STAT_MULT } from './constants';

export const EMPTY_STATS: Stats = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, critDmg: 0 };

export function addStats(a: Stats, b: Partial<Stats>): Stats {
  return {
    hp: a.hp + (b.hp ?? 0),
    atk: a.atk + (b.atk ?? 0),
    def: a.def + (b.def ?? 0),
    spd: a.spd + (b.spd ?? 0),
    crit: a.crit + (b.crit ?? 0),
    critDmg: a.critDmg + (b.critDmg ?? 0),
  };
}

/** Star multiplier: each star above 1 adds 12% */
export function starMult(stars: number): number {
  return 1 + (stars - 1) * 0.12;
}

/** Stats from the hero definition, level and stars only (no equipment) */
export function heroBaseStats(def: HeroDef, level: number, stars: number): Stats {
  const m = starMult(stars);
  const lv = level - 1;
  return {
    hp: Math.round((def.baseStats.hp + def.growth.hp * lv) * m),
    atk: Math.round((def.baseStats.atk + def.growth.atk * lv) * m),
    def: Math.round((def.baseStats.def + def.growth.def * lv) * m),
    spd: def.baseStats.spd + Math.floor(lv / 10),
    crit: def.baseStats.crit,
    critDmg: def.baseStats.critDmg,
  };
}

/** Enhance scaling: +8% of base per enhance level */
export function equipmentStats(item: OwnedItem): Partial<Stats> {
  const def = getItemDef(item.defId);
  if (!def.baseStats) return {};
  const mult = 1 + (item.enhance ?? 0) * 0.08;
  const out: Partial<Stats> = {};
  for (const [k, v] of Object.entries(def.baseStats) as [keyof Stats, number][]) {
    out[k] = Math.round(v * mult);
  }
  return out;
}

export function setBonusesFor(
  items: OwnedItem[],
): { setId: string; pieces: number; bonus: Partial<Stats>; active: boolean }[] {
  const counts: Record<string, number> = {};
  for (const it of items) {
    const def = getItemDef(it.defId);
    if (def.setId) counts[def.setId] = (counts[def.setId] ?? 0) + 1;
  }
  return SET_BONUSES.filter((s) => counts[s.id]).map((s) => ({
    setId: s.id,
    pieces: counts[s.id],
    bonus: s.bonus,
    active: counts[s.id] >= s.pieces,
  }));
}

export function heroFullStats(def: HeroDef, owned: OwnedHero, equipped: OwnedItem[]): Stats {
  let s = heroBaseStats(def, owned.level, owned.stars);
  for (const it of equipped) s = addStats(s, equipmentStats(it));
  for (const sb of setBonusesFor(equipped)) if (sb.active) s = addStats(s, sb.bonus);
  return s;
}

export function powerRating(s: Stats): number {
  return Math.round(
    s.hp * 0.25 + s.atk * 4 + s.def * 2.5 + s.spd * 3 + s.crit * 6 + (s.critDmg - 150) * 2,
  );
}

export function monsterStats(def: MonsterDef, level: number, mult = 1): Stats {
  const lv = level - 1;
  const rm = RARITY_STAT_MULT[def.rarity] * 0.85;
  return {
    hp: Math.round((def.baseStats.hp + def.baseStats.hp * 0.075 * lv) * rm * mult),
    atk: Math.round((def.baseStats.atk + def.baseStats.atk * 0.065 * lv) * rm * mult),
    def: Math.round((def.baseStats.def + def.baseStats.def * 0.06 * lv) * rm * mult),
    spd: def.baseStats.spd + Math.floor(lv / 8),
    crit: def.baseStats.crit,
    critDmg: def.baseStats.critDmg,
  };
}

export function skillLevelMult(level: number): number {
  return 1 + (level - 1) * 0.1;
}
