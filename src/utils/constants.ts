import type { Rarity, Element } from '@/types';

export const MAX_FORMATION = 5;
/** Hardest stage is Det Tysta Katedralens boss on Hard (level 101 + 6) – keep the cap just above. */
export const MAX_HERO_LEVEL = 110;
export const MAX_STARS = 6;
export const MAX_SKILL_LEVEL = 5;
export const MAX_ENHANCE = 15;
export const MAX_PLAYER_LEVEL = 100;

export const ENERGY_MAX_BASE = 100;
/** Milliseconds per 1 energy */
export const ENERGY_REGEN_MS = 3 * 60 * 1000;

export const SUMMON_COST_SINGLE = 100;
export const SUMMON_COST_TEN = 900;
export const PITY_THRESHOLD = 50;

export const ARENA_ENERGY_COST = 0;
export const ARENA_MAX_DAILY = 5;

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9aa3ad',
  uncommon: '#5fbf6a',
  rare: '#4a9eff',
  epic: '#b05cff',
  legendary: '#f2b134',
};

export const RARITY_STAT_MULT: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.1,
  rare: 1.25,
  epic: 1.45,
  legendary: 1.7,
};

export const ELEMENT_COLORS: Record<Element, string> = {
  physical: '#c9c2b8',
  holy: '#ffe9a8',
  ice: '#8fd8ff',
  lightning: '#ffe86b',
  fire: '#ff7a45',
  shadow: '#8d6cff',
  poison: '#7fe06b',
  earth: '#c48a4c',
  astral: '#e0a8ff',
};

export const ELEMENT_GLYPH: Record<Element, string> = {
  physical: '⚔️',
  holy: '✨',
  ice: '❄️',
  lightning: '⚡',
  fire: '🔥',
  shadow: '🌑',
  poison: '☠️',
  earth: '🪨',
  astral: '🌟',
};

/** Elemental advantage: attacker -> weak defender element */
export const ELEMENT_ADVANTAGE: Partial<Record<Element, Element[]>> = {
  fire: ['ice', 'earth'],
  ice: ['lightning', 'poison'],
  lightning: ['astral', 'ice'],
  holy: ['shadow'],
  shadow: ['holy', 'astral'],
  poison: ['earth'],
  earth: ['lightning', 'fire'],
  astral: ['shadow', 'poison'],
};

export const ELEMENT_ADV_MULT = 1.25;
export const ELEMENT_DISADV_MULT = 0.85;

/** XP needed to reach next hero level */
export function heroXpForLevel(level: number): number {
  return Math.floor(60 * Math.pow(level, 1.55));
}

export function heroLevelCost(level: number): number {
  return Math.floor(120 * Math.pow(level, 1.35));
}

export function playerXpForLevel(level: number): number {
  return Math.floor(120 * Math.pow(level, 1.5));
}

export function starUpShardCost(stars: number): number {
  return [0, 10, 20, 40, 80, 150, 300][stars] ?? 300;
}

export function skillUpgradeCost(level: number): { gold: number; books: number } {
  return { gold: 500 * level * level, books: level };
}

export function enhanceCost(level: number): { gold: number; stones: number } {
  return { gold: Math.floor(200 + level * level * 60), stones: 1 + Math.floor(level / 5) };
}

export const DAILY_LOGIN_REWARDS = [
  { gold: 2000 },
  { gems: 50 },
  { gold: 3000 },
  { gems: 80 },
  { keys: 3 },
  { gold: 5000 },
  { gems: 200 },
];
