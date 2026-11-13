import type { Element, Rarity, Stats } from './common';

export type TargetType =
  | 'enemy'
  | 'enemies'
  | 'ally'
  | 'allies'
  | 'self'
  | 'lowestAlly'
  | 'chain'
  | 'randomEnemies'
  | 'weakestEnemy'
  | 'deadAlly';

export type StatusId =
  | 'shield'
  | 'poison'
  | 'bleed'
  | 'burn'
  | 'atkUp'
  | 'atkDown'
  | 'defUp'
  | 'defDown'
  | 'spdDown'
  | 'spdUp'
  | 'stun'
  | 'freeze'
  | 'stealth'
  | 'ccImmune'
  | 'debuffImmune'
  | 'lifesteal'
  | 'taunt'
  | 'charm'
  | 'magicUp'
  | 'soulLink'
  | 'regen'
  | 'dragonForm'
  | 'evasion'
  | 'reflect'
  | 'reviveOnce'
  | 'web'
  | 'rage'
  | 'defensiveForm'
  | 'haste';

export const DEBUFFS: StatusId[] = [
  'poison',
  'bleed',
  'burn',
  'atkDown',
  'defDown',
  'spdDown',
  'stun',
  'freeze',
  'charm',
  'web',
];

export const CC_STATUSES: StatusId[] = ['stun', 'freeze', 'charm'];

export type EffectTarget = 'target' | 'self' | 'allies' | 'enemies' | 'ally';

export type Effect =
  | {
      kind: 'damage';
      /** Multiplier of caster ATK */
      mult: number;
      hits?: number;
      bonusVsTags?: { tags: string[]; mult: number };
      critIfDebuffed?: boolean;
      /** Extra mult scaled by missing HP percent of caster */
      missingHpBonus?: number;
      /** Scales with number of debuffs on heroes */
      perDebuffBonus?: number;
      /** Ignores a fraction of DEF */
      armorPen?: number;
      bonusCrit?: number;
    }
  | { kind: 'shield'; mult: number; turns: number; target: EffectTarget }
  | { kind: 'heal'; mult: number; target: EffectTarget }
  | {
      kind: 'status';
      status: StatusId;
      turns: number;
      /** For value based statuses: percent or ATK multiplier */
      value?: number;
      chance?: number;
      target: EffectTarget;
    }
  | { kind: 'cleanse'; count: number; target: EffectTarget }
  | { kind: 'summon'; monsterId: string; count: number; maxAlive?: number }
  | { kind: 'selfDamage'; percentMaxHp: number }
  | { kind: 'revive'; hpPercent: number }
  | { kind: 'drain'; mult: number };

export interface SkillDef {
  id: string;
  kind: 'basic' | 'skill' | 'ultimate';
  element: Element;
  target: TargetType;
  cooldown: number;
  /** Chain skills: how many extra jumps */
  chainJumps?: number;
  /** Random enemies: how many */
  count?: number;
  effects: Effect[];
  glyph: string;
  /** Sprite-sheet effect id from `data/spellFx.ts`; overrides the element default. */
  fx?: string;
}

export type Side = 'hero' | 'enemy';

export interface StatusInstance {
  id: StatusId;
  turns: number;
  value: number;
  sourceId?: string;
  linkedTo?: string;
}

export interface Combatant {
  uid: string;
  defId: string;
  side: Side;
  name: string;
  glyph: string;
  element: Element;
  rarity: Rarity;
  level: number;
  tags: string[];
  base: Stats;
  hp: number;
  maxHp: number;
  skills: SkillDef[];
  cooldowns: Record<string, number>;
  statuses: StatusInstance[];
  alive: boolean;
  /** Turn gauge for speed-based turn order */
  gauge: number;
  isBoss?: boolean;
  skillLevels: Record<string, number>;
  /** Hero skin index (see OwnedHero.skin) */
  skin?: number;
  /** Spawned mid-battle by a summon skill – drawn smaller and never shrinks the original units. */
  summoned?: boolean;
}

export type BattleEventType =
  | 'damage'
  | 'heal'
  | 'shield'
  | 'status'
  | 'miss'
  | 'death'
  | 'revive'
  | 'summon'
  | 'skill'
  | 'turn'
  | 'info';

export interface BattleEvent {
  type: BattleEventType;
  actorId?: string;
  targetId?: string;
  value?: number;
  text?: string;
  status?: StatusId;
  skillId?: string;
  crit?: boolean;
}

export interface BattleState {
  id: string;
  round: number;
  combatants: Combatant[];
  activeId: string | null;
  log: BattleEvent[];
  result: 'ongoing' | 'victory' | 'defeat';
  turnCount: number;
  seed: number;
}

export interface BattleConfig {
  mode: 'dungeon' | 'arena';
  stageId?: string;
  difficulty?: 'normal' | 'hard';
  opponentId?: string;
}
