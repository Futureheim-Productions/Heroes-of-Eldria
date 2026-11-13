import type { RegionDef, StageDef, StageEnemy } from '@/types';

interface StageSpec {
  enemies: (string | [string, boolean])[];
  drops?: { itemId: string; chance: number; qty?: number }[];
}

function buildRegion(
  id: string,
  index: number,
  glyph: string,
  color: string,
  baseLevel: number,
  specs: StageSpec[],
  requiresRegion?: string,
): RegionDef {
  const stages: StageDef[] = specs.map((spec, i) => {
    const level = baseLevel + i * 2;
    const enemies: StageEnemy[] = spec.enemies.map((e) => {
      const [monsterId, boss] = Array.isArray(e) ? e : [e, false];
      return { monsterId, level: boss ? level + 2 : level, boss };
    });
    const stageNo = i + 1;
    const isBoss = enemies.some((e) => e.boss);
    const gold = Math.round((250 + level * 45) * (isBoss ? 1.8 : 1));
    const xp = Math.round((60 + level * 14) * (isBoss ? 1.6 : 1));
    return {
      id: `${id}_${stageNo}`,
      regionId: id,
      index: stageNo,
      energyCost: 6 + Math.floor(index * 1.5),
      recommendedPower: Math.round(900 + level * 260 + (isBoss ? 600 : 0)),
      enemies,
      rewards: { currencies: { gold }, xp },
      drops: [
        { itemId: 'xp_potion_s', chance: 0.6, qty: 2 },
        { itemId: 'enhance_stone', chance: 0.35 },
        ...(spec.drops ?? []),
      ],
      firstClearBonus: { currencies: { gems: isBoss ? 60 : 20, keys: isBoss ? 1 : 0 } },
    };
  });
  return { id, index, glyph, color, stages, requiresRegion };
}

export const REGIONS: RegionDef[] = [
  buildRegion('norsheim', 0, '🌲', '#3d8b5f', 1, [
    {
      enemies: ['shadow_wolf', 'shadow_wolf'],
      drops: [
        { itemId: 'rusty_sword', chance: 0.3 },
        { itemId: 'leather_vest', chance: 0.3 },
      ],
    },
    {
      enemies: ['shadow_wolf', 'poison_spider', 'shadow_wolf'],
      drops: [
        { itemId: 'leather_cap', chance: 0.3 },
        { itemId: 'worn_boots', chance: 0.25 },
      ],
    },
    {
      enemies: ['skeleton_warrior', 'skeleton_warrior', 'blood_bat'],
      drops: [
        { itemId: 'copper_ring', chance: 0.3 },
        { itemId: 'iron_sword', chance: 0.12 },
      ],
    },
    {
      enemies: ['mushroom_farmer', 'poison_spider', 'cherry_spirit'],
      drops: [
        { itemId: 'chain_mail', chance: 0.15 },
        { itemId: 'traveler_boots', chance: 0.15 },
      ],
    },
    {
      enemies: ['shadow_wolf', ['elder_giant', true], 'stone_knoll'],
      drops: [
        { itemId: 'wolf_fang_dagger', chance: 0.25 },
        { itemId: 'wolf_hide', chance: 0.2 },
        { itemId: 'skill_book', chance: 0.5 },
      ],
    },
  ]),
  buildRegion(
    'eldria',
    1,
    '🌋',
    '#c4482e',
    11,
    [
      {
        enemies: ['fire_salamander', 'ice_imp', 'ice_imp'],
        drops: [
          { itemId: 'iron_helm', chance: 0.25 },
          { itemId: 'silver_amulet', chance: 0.2 },
        ],
      },
      {
        enemies: ['drakkin_warrior', 'fire_salamander', 'blood_bat'],
        drops: [
          { itemId: 'iron_sword', chance: 0.25 },
          { itemId: 'xp_potion_m', chance: 0.5 },
        ],
      },
      {
        enemies: ['iron_golem', 'stone_knoll', 'stone_knoll'],
        drops: [
          { itemId: 'bulwark_plate', chance: 0.18 },
          { itemId: 'bulwark_helm', chance: 0.18 },
        ],
      },
      {
        enemies: ['drakkin_warrior', 'drakkin_warrior', 'blood_master'],
        drops: [
          { itemId: 'crit_charm', chance: 0.2 },
          { itemId: 'wolf_paws', chance: 0.2 },
        ],
      },
      {
        enemies: ['fire_salamander', ['black_drakeling', true], 'drakkin_warrior'],
        drops: [
          { itemId: 'inferno_blade', chance: 0.2 },
          { itemId: 'inferno_robe', chance: 0.15 },
          { itemId: 'skill_book', chance: 0.6 },
        ],
      },
    ],
    'norsheim',
  ),
  buildRegion(
    'shadowmarsh',
    2,
    '🌑',
    '#5a3d8f',
    21,
    [
      {
        enemies: ['necro_apprentice', 'skeleton_warrior', 'skeleton_warrior'],
        drops: [
          { itemId: 'xp_potion_m', chance: 0.6 },
          { itemId: 'frost_pendant', chance: 0.15 },
        ],
      },
      {
        enemies: ['shadow_assassin', 'banshee', 'blood_bat'],
        drops: [
          { itemId: 'wolf_fang_dagger', chance: 0.2 },
          { itemId: 'crit_charm', chance: 0.2 },
        ],
      },
      {
        enemies: ['black_knight', 'crystal_spider', 'poison_spider'],
        drops: [
          { itemId: 'holy_mace', chance: 0.15 },
          { itemId: 'inferno_greaves', chance: 0.15 },
        ],
      },
      {
        enemies: ['shadow_assassin', 'necro_apprentice', 'banshee'],
        drops: [
          { itemId: 'awaken_crystal', chance: 0.4 },
          { itemId: 'phoenix_feather', chance: 0.12 },
        ],
      },
      {
        enemies: ['skeleton_warrior', ['lich', true], 'necro_apprentice'],
        drops: [
          { itemId: 'astral_striders', chance: 0.2 },
          { itemId: 'awaken_crystal', chance: 0.7 },
          { itemId: 'skill_book', chance: 0.8 },
        ],
      },
    ],
    'eldria',
  ),
  buildRegion(
    'frostreach',
    3,
    '❄️',
    '#3f7fb5',
    31,
    [
      {
        enemies: ['ice_imp', 'ice_imp', 'storm_elemental'],
        drops: [
          { itemId: 'frost_staff', chance: 0.2 },
          { itemId: 'xp_potion_l', chance: 0.3 },
        ],
      },
      {
        enemies: ['storm_elemental', 'crystal_spider', 'iron_golem'],
        drops: [
          { itemId: 'frost_crown', chance: 0.2 },
          { itemId: 'frost_pendant', chance: 0.2 },
        ],
      },
      {
        enemies: ['vampire_lord', 'blood_bat', 'blood_bat'],
        drops: [
          { itemId: 'phoenix_feather', chance: 0.18 },
          { itemId: 'awaken_crystal', chance: 0.5 },
        ],
      },
      {
        enemies: ['war_golem', 'iron_golem', 'storm_elemental'],
        drops: [
          { itemId: 'dragon_scale_mail', chance: 0.08 },
          { itemId: 'xp_potion_l', chance: 0.6 },
        ],
      },
      {
        enemies: ['ice_imp', ['ice_queen', true], 'storm_elemental'],
        drops: [
          { itemId: 'dragon_glaive', chance: 0.1 },
          { itemId: 'dragon_horn_helm', chance: 0.1 },
          { itemId: 'awaken_crystal', chance: 1, qty: 2 },
        ],
      },
    ],
    'shadowmarsh',
  ),
  buildRegion(
    'starfall',
    4,
    '🌟',
    '#a05cc9',
    41,
    [
      {
        enemies: ['soul_eater', 'shadow_assassin', 'banshee'],
        drops: [
          { itemId: 'astral_striders', chance: 0.2 },
          { itemId: 'xp_potion_l', chance: 0.7 },
        ],
      },
      {
        enemies: ['corrupt_treelord', 'mushroom_farmer', 'cherry_spirit'],
        drops: [
          { itemId: 'dragon_heart', chance: 0.06 },
          { itemId: 'awaken_crystal', chance: 0.8 },
        ],
      },
      {
        enemies: ['mirror_warden', 'shadow_demon', 'soul_eater'],
        drops: [
          { itemId: 'dragon_scale_mail', chance: 0.1 },
          { itemId: 'skill_book', chance: 1 },
        ],
      },
      {
        enemies: ['time_twister', 'storm_elemental', 'shadow_assassin'],
        drops: [
          { itemId: 'dragon_horn_helm', chance: 0.12 },
          { itemId: 'dragon_glaive', chance: 0.1 },
        ],
      },
      {
        enemies: ['shadow_demon', ['fallen_star', true], 'soul_eater'],
        drops: [
          { itemId: 'dragon_heart', chance: 0.15 },
          { itemId: 'dragon_glaive', chance: 0.15 },
          { itemId: 'awaken_crystal', chance: 1, qty: 3 },
        ],
      },
    ],
    'frostreach',
  ),
  buildRegion(
    'mistfen',
    5,
    '🌫️',
    '#4f7a4a',
    51,
    [
      {
        enemies: ['bog_crawler', 'bog_crawler', 'peat_brute'],
        drops: [
          { itemId: 'xp_potion_l', chance: 0.7 },
          { itemId: 'wolf_paws', chance: 0.2 },
        ],
      },
      {
        enemies: ['mist_stalker', 'bog_crawler', 'plague_monk'],
        drops: [
          { itemId: 'crit_charm', chance: 0.25 },
          { itemId: 'xp_potion_xl', chance: 0.2 },
        ],
      },
      {
        enemies: ['silk_matron', 'hex_doll', 'bog_crawler'],
        drops: [
          { itemId: 'phoenix_feather', chance: 0.2 },
          { itemId: 'awaken_crystal', chance: 0.6 },
        ],
      },
      {
        enemies: ['mire_hag', 'plague_monk', 'peat_brute'],
        drops: [
          { itemId: 'astral_striders', chance: 0.2 },
          { itemId: 'skill_book', chance: 0.8 },
        ],
      },
      {
        enemies: ['plague_monk', ['plague_moth_queen', true], 'mist_stalker'],
        drops: [
          { itemId: 'dragon_heart', chance: 0.15 },
          { itemId: 'xp_potion_xl', chance: 0.8 },
          { itemId: 'awaken_crystal', chance: 1, qty: 3 },
        ],
      },
    ],
    'starfall',
  ),
  buildRegion(
    'emberforge',
    6,
    '⚒️',
    '#d8742a',
    61,
    [
      {
        enemies: ['ash_imp', 'ash_imp', 'ember_boar'],
        drops: [
          { itemId: 'inferno_greaves', chance: 0.25 },
          { itemId: 'xp_potion_xl', chance: 0.3 },
        ],
      },
      {
        enemies: ['rust_tick', 'clockwork_squire', 'ash_imp'],
        drops: [
          { itemId: 'bulwark_plate', chance: 0.3 },
          { itemId: 'bulwark_helm', chance: 0.3 },
        ],
      },
      {
        enemies: ['magma_behemoth', 'ember_boar', 'cinder_monk'],
        drops: [
          { itemId: 'inferno_blade', chance: 0.25 },
          { itemId: 'inferno_robe', chance: 0.25 },
        ],
      },
      {
        enemies: ['forge_tyrant', 'clockwork_squire', 'cinder_monk'],
        drops: [
          { itemId: 'dragon_scale_mail', chance: 0.15 },
          { itemId: 'skill_book', chance: 1 },
        ],
      },
      {
        enemies: ['cinder_monk', ['slag_king', true], 'clockwork_squire'],
        drops: [
          { itemId: 'dragon_glaive', chance: 0.2 },
          { itemId: 'xp_potion_xl', chance: 1 },
          { itemId: 'awaken_crystal', chance: 1, qty: 3 },
        ],
      },
    ],
    'mistfen',
  ),
  buildRegion(
    'stormpeaks',
    7,
    '🏔️',
    '#6fb3d6',
    71,
    [
      {
        enemies: ['frost_warg', 'frost_warg', 'snow_harpy'],
        drops: [
          { itemId: 'frost_staff', chance: 0.3 },
          { itemId: 'xp_potion_xl', chance: 0.4 },
        ],
      },
      {
        enemies: ['snow_harpy', 'thunder_ram', 'frost_warg'],
        drops: [
          { itemId: 'frost_crown', chance: 0.3 },
          { itemId: 'frost_pendant', chance: 0.3 },
        ],
      },
      {
        enemies: ['pale_stag', 'thunder_ram', 'snow_harpy'],
        drops: [
          { itemId: 'phoenix_feather', chance: 0.25 },
          { itemId: 'awaken_crystal', chance: 0.8 },
        ],
      },
      {
        enemies: ['frost_colossus', 'frost_warg', 'thunder_ram'],
        drops: [
          { itemId: 'dragon_horn_helm', chance: 0.15 },
          { itemId: 'skill_book', chance: 1 },
        ],
      },
      {
        enemies: ['snow_harpy', ['storm_jarl', true], 'thunder_ram'],
        drops: [
          { itemId: 'dragon_heart', chance: 0.2 },
          { itemId: 'xp_potion_xl', chance: 1, qty: 2 },
          { itemId: 'awaken_crystal', chance: 1, qty: 4 },
        ],
      },
    ],
    'emberforge',
  ),
  buildRegion(
    'drownedcoast',
    8,
    '⚓',
    '#2f8a8a',
    81,
    [
      {
        enemies: ['grave_hound', 'grave_hound', 'dune_serpent'],
        drops: [
          { itemId: 'wolf_fang_dagger', chance: 0.3 },
          { itemId: 'xp_potion_xl', chance: 0.5 },
        ],
      },
      {
        enemies: ['coral_knight', 'dune_serpent', 'grave_hound'],
        drops: [
          { itemId: 'holy_mace', chance: 0.3 },
          { itemId: 'crit_charm', chance: 0.3 },
        ],
      },
      {
        enemies: ['bone_chanter', 'coral_knight', 'grave_hound'],
        drops: [
          { itemId: 'astral_striders', chance: 0.25 },
          { itemId: 'awaken_crystal', chance: 1 },
        ],
      },
      {
        enemies: ['drowned_admiral', 'coral_knight', 'bone_chanter'],
        drops: [
          { itemId: 'dragon_scale_mail', chance: 0.2 },
          { itemId: 'skill_book', chance: 1, qty: 2 },
        ],
      },
      {
        enemies: ['coral_knight', ['kraken_matriarch', true], 'bone_chanter'],
        drops: [
          { itemId: 'dragon_glaive', chance: 0.25 },
          { itemId: 'xp_potion_xl', chance: 1, qty: 2 },
          { itemId: 'awaken_crystal', chance: 1, qty: 4 },
        ],
      },
    ],
    'stormpeaks',
  ),
  buildRegion(
    'cathedral',
    9,
    '🔔',
    '#c9b26b',
    91,
    [
      {
        enemies: ['rune_wisp', 'choir_shade', 'rune_wisp'],
        drops: [
          { itemId: 'xp_potion_xl', chance: 0.6 },
          { itemId: 'phoenix_feather', chance: 0.25 },
        ],
      },
      {
        enemies: ['nameless_bell', 'choir_shade', 'rune_wisp'],
        drops: [
          { itemId: 'dragon_horn_helm', chance: 0.15 },
          { itemId: 'awaken_crystal', chance: 1 },
        ],
      },
      {
        enemies: ['oathbreaker', 'glass_archer', 'choir_shade'],
        drops: [
          { itemId: 'dragon_heart', chance: 0.15 },
          { itemId: 'skill_book', chance: 1, qty: 2 },
        ],
      },
      {
        enemies: ['eclipse_wyrm', 'rune_wisp', 'glass_archer'],
        drops: [
          { itemId: 'dragon_glaive', chance: 0.2 },
          { itemId: 'dragon_scale_mail', chance: 0.2 },
        ],
      },
      {
        enemies: ['choir_shade', ['hollow_saint', true], 'glass_archer'],
        drops: [
          { itemId: 'dragon_heart', chance: 0.3 },
          { itemId: 'xp_potion_xl', chance: 1, qty: 3 },
          { itemId: 'awaken_crystal', chance: 1, qty: 5 },
        ],
      },
    ],
    'drownedcoast',
  ),
];

export const REGION_MAP: Record<string, RegionDef> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);

export const STAGE_MAP: Record<string, StageDef> = Object.fromEntries(
  REGIONS.flatMap((r) => r.stages.map((s) => [s.id, s])),
);

export function getStage(id: string): StageDef {
  const s = STAGE_MAP[id];
  if (!s) throw new Error(`Unknown stage ${id}`);
  return s;
}

export const HARD_MULT = { stats: 1.6, level: 6, rewards: 1.8 };
