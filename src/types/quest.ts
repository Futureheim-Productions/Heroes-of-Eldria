import type { Reward } from './common';

export type QuestCategory = 'main' | 'side' | 'daily' | 'weekly';

export type QuestObjective =
  | { type: 'winBattles'; count: number }
  | { type: 'clearStage'; stageId: string }
  | { type: 'levelHero'; level: number }
  | { type: 'summon'; count: number }
  | { type: 'enhanceEquipment'; count: number }
  | { type: 'spendEnergy'; amount: number }
  | { type: 'reachPlayerLevel'; level: number }
  | { type: 'ownHeroes'; count: number }
  | { type: 'arenaBattles'; count: number }
  | { type: 'guildContribute'; count: number }
  | { type: 'claimDaily'; count: number };

export interface QuestDef {
  id: string;
  category: QuestCategory;
  objective: QuestObjective;
  reward: Reward;
  requires?: string;
}

export interface QuestProgress {
  progress: number;
  completed: boolean;
  claimed: boolean;
}
