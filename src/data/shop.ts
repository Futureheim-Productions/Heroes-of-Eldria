import type { ShopOffer } from '@/types';

export const SHOP_OFFERS: ShopOffer[] = [
  // Featured
  {
    id: 'starter_pack',
    category: 'featured',
    cost: { real: 1.99 },
    reward: {
      currencies: { gems: 500, gold: 20000, energy: 50 },
      items: [{ itemId: 'enhance_stone', qty: 10 }],
      heroShards: [{ heroId: 'kael', qty: 10 }],
    },
    glyph: '🎁',
    limit: 1,
    badge: 'value',
  },
  {
    id: 'dragon_bundle',
    category: 'featured',
    cost: { gems: 800 },
    reward: {
      items: [
        { itemId: 'dragon_glaive', qty: 1 },
        { itemId: 'awaken_crystal', qty: 5 },
      ],
    },
    glyph: '🐉',
    limit: 1,
    badge: 'hot',
  },
  {
    id: 'skill_bundle',
    category: 'featured',
    cost: { gems: 300 },
    reward: { items: [{ itemId: 'skill_book', qty: 5 }] },
    glyph: '📚',
    badge: 'new',
  },

  // Daily (gold/energy deals)
  {
    id: 'daily_gold_s',
    category: 'daily',
    cost: { gems: 50 },
    reward: { currencies: { gold: 5000 } },
    glyph: '💰',
    limit: 3,
  },
  {
    id: 'daily_gold_l',
    category: 'daily',
    cost: { gems: 200 },
    reward: { currencies: { gold: 25000 } },
    glyph: '💰',
    limit: 1,
  },
  {
    id: 'daily_energy',
    category: 'daily',
    cost: { gems: 40 },
    reward: { currencies: { energy: 50 } },
    glyph: '⚡',
    limit: 3,
  },
  {
    id: 'daily_xp',
    category: 'daily',
    cost: { gold: 3000 },
    reward: { items: [{ itemId: 'xp_potion_m', qty: 3 }] },
    glyph: '⚗️',
    limit: 2,
  },
  {
    id: 'daily_stone',
    category: 'daily',
    cost: { gold: 2500 },
    reward: { items: [{ itemId: 'enhance_stone', qty: 3 }] },
    glyph: '💎',
    limit: 2,
  },
  {
    id: 'daily_keys',
    category: 'daily',
    cost: { gems: 60 },
    reward: { currencies: { keys: 2 } },
    glyph: '🔑',
    limit: 1,
  },

  // Currency (fake IAP)
  {
    id: 'gems_100',
    category: 'currency',
    cost: { real: 0.99 },
    reward: { currencies: { gems: 100 } },
    glyph: '💎',
  },
  {
    id: 'gems_550',
    category: 'currency',
    cost: { real: 4.99 },
    reward: { currencies: { gems: 550 } },
    glyph: '💎',
    badge: 'value',
  },
  {
    id: 'gems_1200',
    category: 'currency',
    cost: { real: 9.99 },
    reward: { currencies: { gems: 1200 } },
    glyph: '💎',
  },
  {
    id: 'gems_3200',
    category: 'currency',
    cost: { real: 24.99 },
    reward: { currencies: { gems: 3200 } },
    glyph: '💎',
    badge: 'hot',
  },
];

export const ARENA_SHOP: ShopOffer[] = [
  {
    id: 'arena_shards_sylwen',
    category: 'featured',
    cost: { arenaCoins: 120 },
    reward: { heroShards: [{ heroId: 'sylwen', qty: 5 }] },
    glyph: '🗡️',
  },
  {
    id: 'arena_shards_ilva',
    category: 'featured',
    cost: { arenaCoins: 80 },
    reward: { heroShards: [{ heroId: 'ilva', qty: 5 }] },
    glyph: '🏹',
  },
  {
    id: 'arena_crit_charm',
    category: 'featured',
    cost: { arenaCoins: 200 },
    reward: { items: [{ itemId: 'crit_charm', qty: 1 }] },
    glyph: '🍀',
  },
  {
    id: 'arena_stones',
    category: 'featured',
    cost: { arenaCoins: 60 },
    reward: { items: [{ itemId: 'enhance_stone', qty: 5 }] },
    glyph: '💎',
  },
];

export const GUILD_SHOP: ShopOffer[] = [
  {
    id: 'guild_shards_mira',
    category: 'featured',
    cost: { guildCoins: 60 },
    reward: { heroShards: [{ heroId: 'mira', qty: 5 }] },
    glyph: '🕊️',
  },
  {
    id: 'guild_shards_brann',
    category: 'featured',
    cost: { guildCoins: 90 },
    reward: { heroShards: [{ heroId: 'brann', qty: 5 }] },
    glyph: '🔥',
  },
  {
    id: 'guild_awaken',
    category: 'featured',
    cost: { guildCoins: 150 },
    reward: { items: [{ itemId: 'awaken_crystal', qty: 2 }] },
    glyph: '🔮',
  },
  {
    id: 'guild_xp',
    category: 'featured',
    cost: { guildCoins: 40 },
    reward: { items: [{ itemId: 'xp_potion_l', qty: 1 }] },
    glyph: '🏺',
  },
];

/** Summon rates by rarity */
export const SUMMON_RATES: {
  rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;
}[] = [
  { rarity: 'uncommon', weight: 45 },
  { rarity: 'rare', weight: 35 },
  { rarity: 'epic', weight: 16 },
  { rarity: 'legendary', weight: 4 },
];
