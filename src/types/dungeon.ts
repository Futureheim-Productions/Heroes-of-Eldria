import type { Reward } from './common';

export interface StageEnemy {
  monsterId: string;
  level: number;
  boss?: boolean;
}

export interface StageDef {
  id: string;
  regionId: string;
  index: number;
  energyCost: number;
  recommendedPower: number;
  enemies: StageEnemy[];
  rewards: Reward;
  /** Random drop table: itemId -> chance (0..1) */
  drops: { itemId: string; chance: number; qty?: number }[];
  firstClearBonus?: Reward;
}

export interface RegionDef {
  id: string;
  index: number;
  glyph: string;
  color: string;
  stages: StageDef[];
  requiresRegion?: string;
}

export interface StageProgress {
  normalStars: number;
  hardStars: number;
  normalClears: number;
  hardClears: number;
}
