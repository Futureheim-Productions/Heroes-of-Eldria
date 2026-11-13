import type { QuestDef } from '@/types';

export const QUESTS: QuestDef[] = [
  // ── Main story chain ──
  {
    id: 'main_1',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'norsheim_1' },
    reward: { currencies: { gold: 1500, gems: 50 }, xp: 100 },
  },
  {
    id: 'main_2',
    category: 'main',
    objective: { type: 'levelHero', level: 5 },
    reward: { currencies: { gold: 2000 }, items: [{ itemId: 'xp_potion_m', qty: 3 }] },
    requires: 'main_1',
  },
  {
    id: 'main_3',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'norsheim_3' },
    reward: { currencies: { gems: 100 }, items: [{ itemId: 'iron_sword', qty: 1 }] },
    requires: 'main_2',
  },
  {
    id: 'main_4',
    category: 'main',
    objective: { type: 'enhanceEquipment', count: 3 },
    reward: { currencies: { gold: 3000 }, items: [{ itemId: 'enhance_stone', qty: 5 }] },
    requires: 'main_3',
  },
  {
    id: 'main_5',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'norsheim_5' },
    reward: { currencies: { gems: 300, keys: 2 }, heroShards: [{ heroId: 'sylwen', qty: 10 }] },
    requires: 'main_4',
  },
  {
    id: 'main_6',
    category: 'main',
    objective: { type: 'ownHeroes', count: 5 },
    reward: { currencies: { gold: 5000, gems: 100 } },
    requires: 'main_5',
  },
  {
    id: 'main_7',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'eldria_5' },
    reward: { currencies: { gems: 400 }, items: [{ itemId: 'inferno_blade', qty: 1 }] },
    requires: 'main_6',
  },
  {
    id: 'main_8',
    category: 'main',
    objective: { type: 'reachPlayerLevel', level: 15 },
    reward: { currencies: { gold: 10000, gems: 200 } },
    requires: 'main_7',
  },
  {
    id: 'main_9',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'shadowmarsh_5' },
    reward: { currencies: { gems: 500 }, heroShards: [{ heroId: 'elarion', qty: 20 }] },
    requires: 'main_8',
  },
  {
    id: 'main_10',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'frostreach_5' },
    reward: { currencies: { gems: 600 }, items: [{ itemId: 'dragon_glaive', qty: 1 }] },
    requires: 'main_9',
  },
  {
    id: 'main_11',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'starfall_5' },
    reward: { currencies: { gems: 1500 }, heroShards: [{ heroId: 'kael', qty: 40 }] },
    requires: 'main_10',
  },
  {
    id: 'main_12',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'mistfen_5' },
    reward: { currencies: { gems: 800 }, heroShards: [{ heroId: 'nyxara', qty: 30 }] },
    requires: 'main_11',
  },
  {
    id: 'main_13',
    category: 'main',
    objective: { type: 'reachPlayerLevel', level: 60 },
    reward: { currencies: { gold: 50000, gems: 400 }, items: [{ itemId: 'xp_potion_xl', qty: 5 }] },
    requires: 'main_12',
  },
  {
    id: 'main_14',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'emberforge_5' },
    reward: { currencies: { gems: 900 }, items: [{ itemId: 'dragon_heart', qty: 1 }] },
    requires: 'main_13',
  },
  {
    id: 'main_15',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'stormpeaks_5' },
    reward: { currencies: { gems: 1000 }, heroShards: [{ heroId: 'kaida', qty: 30 }] },
    requires: 'main_14',
  },
  {
    id: 'main_16',
    category: 'main',
    objective: { type: 'levelHero', level: 90 },
    reward: { currencies: { gold: 100000 }, items: [{ itemId: 'awaken_crystal', qty: 10 }] },
    requires: 'main_15',
  },
  {
    id: 'main_17',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'drownedcoast_5' },
    reward: { currencies: { gems: 1200 }, items: [{ itemId: 'dragon_glaive', qty: 1 }] },
    requires: 'main_16',
  },
  {
    id: 'main_18',
    category: 'main',
    objective: { type: 'clearStage', stageId: 'cathedral_5' },
    reward: { currencies: { gems: 3000 }, heroShards: [{ heroId: 'elarion', qty: 60 }] },
    requires: 'main_17',
  },

  // ── Side ──
  {
    id: 'side_summon',
    category: 'side',
    objective: { type: 'summon', count: 1 },
    reward: { currencies: { gems: 100 } },
  },
  {
    id: 'side_arena',
    category: 'side',
    objective: { type: 'arenaBattles', count: 3 },
    reward: { currencies: { arenaCoins: 100, gold: 2000 } },
  },
  {
    id: 'side_guild',
    category: 'side',
    objective: { type: 'guildContribute', count: 1 },
    reward: { currencies: { guildCoins: 50 } },
  },
  {
    id: 'side_win10',
    category: 'side',
    objective: { type: 'winBattles', count: 10 },
    reward: { currencies: { gold: 4000 }, items: [{ itemId: 'skill_book', qty: 2 }] },
  },
  {
    id: 'side_hero20',
    category: 'side',
    objective: { type: 'levelHero', level: 20 },
    reward: { currencies: { gems: 150 }, items: [{ itemId: 'awaken_crystal', qty: 2 }] },
  },

  // ── Daily ──
  {
    id: 'daily_win3',
    category: 'daily',
    objective: { type: 'winBattles', count: 3 },
    reward: { currencies: { gold: 1500 } },
  },
  {
    id: 'daily_energy',
    category: 'daily',
    objective: { type: 'spendEnergy', amount: 30 },
    reward: { currencies: { gems: 30 } },
  },
  {
    id: 'daily_arena',
    category: 'daily',
    objective: { type: 'arenaBattles', count: 1 },
    reward: { currencies: { arenaCoins: 40 } },
  },
  {
    id: 'daily_enhance',
    category: 'daily',
    objective: { type: 'enhanceEquipment', count: 1 },
    reward: { items: [{ itemId: 'enhance_stone', qty: 2 }] },
  },

  // ── Weekly ──
  {
    id: 'weekly_win20',
    category: 'weekly',
    objective: { type: 'winBattles', count: 20 },
    reward: { currencies: { gems: 200 }, items: [{ itemId: 'xp_potion_l', qty: 2 }] },
  },
  {
    id: 'weekly_summon',
    category: 'weekly',
    objective: { type: 'summon', count: 5 },
    reward: { currencies: { gems: 150 } },
  },
  {
    id: 'weekly_arena',
    category: 'weekly',
    objective: { type: 'arenaBattles', count: 10 },
    reward: { currencies: { arenaCoins: 200 } },
  },
];

export const QUEST_MAP: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
