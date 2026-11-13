import type { HeroDef } from '@/types';
import { basic, skill, ultimate, dmg, status, heal, shield, cleanse } from './skillHelpers';

export const HEROES: HeroDef[] = [
  {
    id: 'arthen',
    rarity: 'epic',
    role: 'tank',
    element: 'holy',
    baseStars: 3,
    glyph: '🛡️',
    baseStats: { hp: 1400, atk: 95, def: 110, spd: 92, crit: 5, critDmg: 150 },
    growth: { hp: 105, atk: 6.5, def: 8 },
    tags: ['holy', 'knight'],
    skills: [
      basic('arthen_holy_strike', 'holy', '⚔️', [dmg(1.0), shield(0.6, 1, 'self')], {
        fx: 'sword_slash',
      }),
      skill('arthen_protective_light', 'holy', 'allies', 3, '🌤️', [shield(1.0, 2, 'allies')]),
      skill('arthen_hammer', 'holy', 'enemy', 3, '🔨', [
        dmg(2.0, { bonusVsTags: { tags: ['undead', 'demon'], mult: 1.5 } }),
      ]),
      ultimate('arthen_holy_aura', 'holy', 'allies', 5, '✨', [
        heal(1.6, 'allies'),
        cleanse(1, 'allies'),
      ]),
    ],
  },
  {
    id: 'lyra',
    rarity: 'epic',
    role: 'mage',
    element: 'ice',
    baseStars: 3,
    glyph: '🔮',
    baseStats: { hp: 950, atk: 140, def: 65, spd: 105, crit: 12, critDmg: 160 },
    growth: { hp: 62, atk: 10, def: 4 },
    tags: ['mage'],
    skills: [
      basic('lyra_frostbolt', 'ice', '❄️', [dmg(1.0), status('spdDown', 2, 'target', 20)], {
        fx: 'frost_bolt',
      }),
      skill('lyra_chain_lightning', 'lightning', 'chain', 3, '⚡', [dmg(1.4)], { chainJumps: 2 }),
      skill('lyra_ice_prison', 'ice', 'enemy', 4, '🧊', [dmg(0.8), status('freeze', 1, 'target')]),
      ultimate('lyra_meteor', 'fire', 'enemies', 5, '☄️', [dmg(1.8)]),
    ],
  },
  {
    id: 'kael',
    rarity: 'legendary',
    role: 'bruiser',
    element: 'fire',
    baseStars: 4,
    glyph: '🐉',
    baseStats: { hp: 1250, atk: 150, def: 85, spd: 100, crit: 15, critDmg: 165 },
    growth: { hp: 88, atk: 11, def: 6 },
    tags: ['dragon'],
    skills: [
      basic('kael_dragon_fangs', 'fire', '🗡️', [dmg(1.1), status('bleed', 2, 'target', 0.3)], {
        fx: 'fire_slash',
      }),
      skill('kael_dragon_rage', 'fire', 'self', 4, '💢', [status('atkUp', 3, 'self', 50)]),
      skill(
        'kael_fire_breath',
        'fire',
        'randomEnemies',
        3,
        '🔥',
        [dmg(1.3), status('burn', 2, 'target', 0.25)],
        {
          count: 3,
        },
      ),
      ultimate('kael_dragon_form', 'fire', 'enemy', 6, '🐲', [
        status('dragonForm', 2, 'self', 80),
        status('ccImmune', 2, 'self'),
        dmg(2.4),
      ]),
    ],
  },
  {
    id: 'sylwen',
    rarity: 'epic',
    role: 'assassin',
    element: 'shadow',
    baseStars: 3,
    glyph: '🗡️',
    baseStats: { hp: 900, atk: 165, def: 60, spd: 125, crit: 25, critDmg: 190 },
    growth: { hp: 55, atk: 12, def: 3.5 },
    tags: ['shadow'],
    skills: [
      basic('sylwen_shadow_strike', 'shadow', '🌑', [dmg(1.2, { critIfDebuffed: true })], {
        fx: 'sword_slash',
      }),
      skill('sylwen_poison_blade', 'poison', 'enemy', 3, '🧪', [
        dmg(0.8),
        status('poison', 3, 'target', 0.5),
      ]),
      skill('sylwen_vanish', 'shadow', 'self', 4, '💨', [status('stealth', 1, 'self', 100)]),
      ultimate('sylwen_death_dance', 'shadow', 'enemies', 5, '💀', [dmg(1.5, { bonusCrit: 50 })]),
    ],
  },
  {
    id: 'thora',
    rarity: 'rare',
    role: 'offtank',
    element: 'earth',
    baseStars: 3,
    glyph: '🪓',
    baseStats: { hp: 1350, atk: 125, def: 90, spd: 88, crit: 10, critDmg: 160 },
    growth: { hp: 98, atk: 9, def: 6.5 },
    tags: ['berserker'],
    skills: [
      basic('thora_wild_strike', 'physical', '🪓', [dmg(1.1), status('rage', 3, 'self', 8)], {
        fx: 'sword_slash',
      }),
      skill('thora_bloodthirst', 'physical', 'enemy', 3, '🩸', [dmg(1.2, { missingHpBonus: 1.5 })]),
      skill('thora_earthquake', 'earth', 'enemies', 4, '🌋', [
        dmg(1.0),
        status('atkDown', 2, 'target', 25),
      ]),
      ultimate('thora_berserker_rage', 'earth', 'self', 6, '😤', [
        status('ccImmune', 3, 'self'),
        status('lifesteal', 3, 'self', 40),
        status('atkUp', 3, 'self', 30),
      ]),
    ],
  },
  {
    id: 'elarion',
    rarity: 'legendary',
    role: 'healer',
    element: 'astral',
    baseStars: 4,
    glyph: '🌟',
    baseStats: { hp: 1050, atk: 120, def: 75, spd: 98, crit: 8, critDmg: 150 },
    growth: { hp: 70, atk: 9, def: 5 },
    tags: ['astral', 'holy'],
    skills: [
      basic('elarion_starlight', 'astral', '🌠', [dmg(0.6), heal(1.0, 'ally')]),
      skill('elarion_cosmic_shield', 'astral', 'lowestAlly', 3, '🛡️', [
        status('debuffImmune', 2, 'target'),
        shield(0.8, 2, 'target'),
      ]),
      skill('elarion_soul_bond', 'astral', 'allies', 4, '🔗', [status('soulLink', 3, 'allies')]),
      ultimate('elarion_supernova', 'astral', 'allies', 5, '💫', [
        heal(2.0, 'allies'),
        status('magicUp', 2, 'allies', 30),
      ]),
    ],
  },
  {
    id: 'brann',
    rarity: 'rare',
    role: 'mage',
    element: 'fire',
    baseStars: 2,
    glyph: '🔥',
    baseStats: { hp: 900, atk: 135, def: 60, spd: 96, crit: 10, critDmg: 155 },
    growth: { hp: 58, atk: 9.5, def: 3.8 },
    tags: ['mage'],
    skills: [
      basic('brann_fireball', 'fire', '🔥', [dmg(1.0), status('burn', 2, 'target', 0.2)]),
      skill('brann_flame_wave', 'fire', 'enemies', 3, '🌊', [dmg(1.0)]),
      skill('brann_ignite', 'fire', 'enemy', 3, '💥', [dmg(1.6, { armorPen: 0.4 })]),
      ultimate('brann_inferno', 'fire', 'enemies', 5, '🌋', [
        dmg(1.5),
        status('burn', 3, 'target', 0.3),
      ]),
    ],
  },
  {
    id: 'ilva',
    rarity: 'rare',
    role: 'ranger',
    element: 'poison',
    baseStars: 2,
    glyph: '🏹',
    baseStats: { hp: 950, atk: 130, def: 65, spd: 115, crit: 18, critDmg: 165 },
    growth: { hp: 60, atk: 9.2, def: 4 },
    tags: ['ranger'],
    skills: [
      basic('ilva_arrow', 'physical', '🏹', [dmg(1.05)]),
      skill('ilva_volley', 'physical', 'randomEnemies', 3, '🎯', [dmg(0.9)], { count: 3 }),
      skill('ilva_mark', 'poison', 'enemy', 3, '🎯', [
        dmg(0.7),
        status('defDown', 3, 'target', 30),
      ]),
      ultimate('ilva_arrow_rain', 'poison', 'enemies', 5, '🌧️', [
        dmg(1.4),
        status('poison', 2, 'target', 0.3),
      ]),
    ],
  },
  {
    id: 'grimvald',
    rarity: 'epic',
    role: 'mage',
    element: 'shadow',
    baseStars: 3,
    glyph: '💀',
    baseStats: { hp: 1000, atk: 138, def: 70, spd: 94, crit: 8, critDmg: 150 },
    growth: { hp: 66, atk: 9.8, def: 4.5 },
    tags: ['shadow', 'necromancer'],
    skills: [
      basic('grimvald_soul_bolt', 'shadow', '💀', [dmg(1.0), { kind: 'drain', mult: 0.3 }]),
      skill('grimvald_curse', 'shadow', 'enemy', 3, '🕯️', [
        status('atkDown', 2, 'target', 25),
        status('defDown', 2, 'target', 25),
      ]),
      skill('grimvald_drain', 'shadow', 'enemy', 3, '🩸', [dmg(1.2), { kind: 'drain', mult: 0.6 }]),
      ultimate('grimvald_harvest', 'shadow', 'enemies', 5, '⚰️', [
        dmg(1.3),
        status('poison', 2, 'target', 0.3),
      ]),
    ],
  },
  {
    id: 'mira',
    rarity: 'uncommon',
    role: 'healer',
    element: 'holy',
    baseStars: 2,
    glyph: '🕊️',
    baseStats: { hp: 1000, atk: 100, def: 75, spd: 95, crit: 5, critDmg: 150 },
    growth: { hp: 64, atk: 7, def: 5 },
    tags: ['holy'],
    skills: [
      basic('mira_smite', 'holy', '✝️', [dmg(0.9)]),
      skill('mira_mend', 'holy', 'lowestAlly', 2, '💚', [heal(1.3, 'target')]),
      skill('mira_blessing', 'holy', 'allies', 4, '🙏', [status('defUp', 2, 'allies', 30)]),
      ultimate('mira_holy_light', 'holy', 'allies', 5, '🌞', [
        heal(1.4, 'allies'),
        cleanse(1, 'allies'),
      ]),
    ],
  },
  {
    id: 'vesna',
    rarity: 'epic',
    role: 'mage',
    element: 'shadow',
    baseStars: 3,
    glyph: '🌀',
    baseStats: { hp: 1050, atk: 145, def: 70, spd: 102, crit: 12, critDmg: 160 },
    growth: { hp: 68, atk: 10.2, def: 4.5 },
    tags: ['shadow', 'cultist', 'chaos'],
    skills: [
      basic('vesna_chaos_bolt', 'shadow', '🌀', [
        dmg(1.0),
        status('atkDown', 2, 'target', 15, 0.5),
      ]),
      skill('vesna_chaos_rite', 'shadow', 'allies', 4, '🩸', [
        { kind: 'selfDamage', percentMaxHp: 15 },
        status('atkUp', 2, 'allies', 25),
        status('magicUp', 2, 'allies', 25),
      ]),
      skill('vesna_entropy', 'shadow', 'enemies', 3, '🕳️', [
        status('defDown', 2, 'target', 25, 0.7),
        status('spdDown', 2, 'target', 20, 0.7),
      ]),
      ultimate('vesna_chaos_storm', 'shadow', 'enemies', 5, '🌪️', [
        dmg(1.5),
        status('burn', 2, 'target', 0.25, 0.5),
        status('poison', 2, 'target', 0.25, 0.5),
      ]),
    ],
  },
  {
    id: 'nera',
    rarity: 'epic',
    role: 'assassin',
    element: 'physical',
    baseStars: 3,
    glyph: '🩰',
    baseStats: { hp: 920, atk: 158, def: 62, spd: 130, crit: 22, critDmg: 180 },
    growth: { hp: 57, atk: 11.5, def: 3.6 },
    tags: ['dancer', 'assassin'],
    skills: [
      basic('nera_feather_dance', 'physical', '🪶', [dmg(0.6, { hits: 2 })], { fx: 'wind_slash' }),
      skill('nera_pirouette', 'physical', 'self', 4, '💃', [
        status('evasion', 2, 'self', 50),
        status('spdUp', 2, 'self', 20),
      ]),
      skill(
        'nera_knife_rain',
        'physical',
        'randomEnemies',
        3,
        '🔪',
        [dmg(0.7), status('bleed', 2, 'target', 0.2)],
        {
          count: 4,
        },
      ),
      ultimate('nera_death_waltz', 'physical', 'enemies', 5, '🎭', [
        dmg(1.4, { bonusCrit: 30 }),
        status('bleed', 2, 'target', 0.3),
      ]),
    ],
  },
  {
    id: 'yuki',
    rarity: 'rare',
    role: 'healer',
    element: 'ice',
    baseStars: 3,
    glyph: '❄️',
    baseStats: { hp: 1050, atk: 110, def: 78, spd: 97, crit: 6, critDmg: 150 },
    growth: { hp: 68, atk: 7.5, def: 5.2 },
    tags: ['ice', 'priest'],
    skills: [
      basic('yuki_frost_bell', 'ice', '🔔', [dmg(0.8), status('spdDown', 1, 'target', 15)]),
      skill('yuki_frost_veil', 'ice', 'allies', 3, '🌫️', [shield(0.7, 2, 'allies')]),
      skill('yuki_hoarfrost_prayer', 'ice', 'lowestAlly', 3, '🙏', [
        heal(1.2, 'target'),
        status('regen', 2, 'target', 5),
      ]),
      ultimate('yuki_winter_stillness', 'ice', 'enemies', 5, '🌨️', [
        dmg(0.9),
        status('freeze', 1, 'target', undefined, 0.5),
      ]),
    ],
  },
  {
    id: 'lumi',
    rarity: 'uncommon',
    role: 'healer',
    element: 'holy',
    baseStars: 2,
    glyph: '🎵',
    baseStats: { hp: 980, atk: 105, def: 70, spd: 108, crit: 8, critDmg: 150 },
    growth: { hp: 62, atk: 7.5, def: 4.5 },
    tags: ['bard'],
    skills: [
      basic('lumi_sharp_note', 'holy', '🎶', [dmg(0.9)]),
      skill('lumi_battle_hymn', 'holy', 'allies', 3, '🎺', [
        status('atkUp', 2, 'allies', 20),
        status('spdUp', 2, 'allies', 15),
      ]),
      skill('lumi_lullaby', 'holy', 'enemy', 4, '💤', [
        status('stun', 1, 'target', undefined, 0.6),
      ]),
      ultimate('lumi_encore', 'holy', 'allies', 5, '🌞', [
        heal(1.2, 'allies'),
        status('magicUp', 2, 'allies', 20),
      ]),
    ],
  },
  {
    id: 'saga',
    rarity: 'epic',
    role: 'assassin',
    element: 'shadow',
    baseStars: 3,
    glyph: '🌙',
    baseStats: { hp: 910, atk: 160, def: 60, spd: 128, crit: 24, critDmg: 185 },
    growth: { hp: 56, atk: 11.8, def: 3.5 },
    tags: ['shadow', 'thief'],
    skills: [
      basic('saga_moon_cut', 'shadow', '🌙', [dmg(1.1, { bonusCrit: 10 })], { fx: 'sword_slash' }),
      skill('saga_pickpocket', 'shadow', 'enemy', 3, '👜', [
        dmg(0.9),
        status('atkDown', 2, 'target', 20),
        status('atkUp', 2, 'self', 20),
      ]),
      skill('saga_smoke_bomb', 'shadow', 'self', 4, '💨', [
        status('evasion', 2, 'self', 40),
        status('spdUp', 2, 'self', 20),
      ]),
      ultimate('saga_moonlight_heist', 'shadow', 'enemy', 5, '🗝️', [
        dmg(2.2, { critIfDebuffed: true, armorPen: 0.3 }),
      ]),
    ],
  },
  {
    id: 'vilja',
    rarity: 'rare',
    role: 'healer',
    element: 'earth',
    baseStars: 2,
    glyph: '🌿',
    baseStats: { hp: 1020, atk: 105, def: 78, spd: 96, crit: 6, critDmg: 150 },
    growth: { hp: 66, atk: 7.2, def: 5.2 },
    tags: ['druid', 'nature'],
    skills: [
      basic('vilja_thorn_lash', 'earth', '🌵', [dmg(0.85), status('bleed', 2, 'target', 0.2)]),
      skill('vilja_bloom', 'earth', 'lowestAlly', 3, '🌸', [
        heal(1.1, 'target'),
        status('regen', 3, 'target', 6),
      ]),
      skill('vilja_entangle', 'earth', 'enemies', 4, '🕸️', [
        status('web', 1, 'target', undefined, 0.5),
        status('spdDown', 2, 'target', 20),
      ]),
      ultimate('vilja_heart_of_the_forest', 'earth', 'allies', 5, '🌳', [
        heal(1.5, 'allies'),
        status('defUp', 2, 'allies', 25),
      ]),
    ],
  },
  {
    id: 'freja',
    rarity: 'epic',
    role: 'tank',
    element: 'lightning',
    baseStars: 3,
    glyph: '⚡',
    baseStats: { hp: 1380, atk: 100, def: 105, spd: 94, crit: 6, critDmg: 150 },
    growth: { hp: 102, atk: 6.8, def: 7.8 },
    tags: ['knight', 'storm'],
    skills: [
      basic(
        'freja_shield_bash',
        'lightning',
        '🛡️',
        [dmg(1.0), status('stun', 1, 'target', undefined, 0.2)],
        { fx: 'lightning_explosion' },
      ),
      skill('freja_storm_wall', 'lightning', 'self', 3, '🧱', [
        status('taunt', 2, 'self'),
        status('defUp', 2, 'self', 30),
      ]),
      skill('freja_thunderclap', 'lightning', 'enemies', 4, '⚡', [
        dmg(0.9),
        status('spdDown', 2, 'target', 20),
      ]),
      ultimate('freja_bastion_of_storms', 'lightning', 'allies', 5, '🌩️', [
        shield(1.0, 2, 'allies'),
        status('reflect', 2, 'self', 25),
      ]),
    ],
  },
  {
    id: 'nova',
    rarity: 'rare',
    role: 'mage',
    element: 'astral',
    baseStars: 2,
    glyph: '⚗️',
    baseStats: { hp: 930, atk: 138, def: 62, spd: 100, crit: 10, critDmg: 158 },
    growth: { hp: 60, atk: 9.6, def: 4 },
    tags: ['mage', 'alchemist'],
    skills: [
      basic(
        'nova_volatile_flask',
        'astral',
        '🧪',
        [dmg(1.0), status('burn', 1, 'target', 0.15, 0.5)],
        { fx: 'nova_explosion' },
      ),
      skill('nova_catalyst', 'astral', 'allies', 4, '✨', [
        status('magicUp', 2, 'allies', 25),
        cleanse(1, 'allies'),
      ]),
      skill('nova_acid_splash', 'poison', 'enemies', 3, '🫧', [
        dmg(0.8),
        status('defDown', 2, 'target', 20),
      ]),
      ultimate('nova_starfall_reaction', 'astral', 'enemies', 5, '💥', [
        dmg(1.6),
        status('poison', 2, 'target', 0.25),
      ]),
    ],
  },
  {
    id: 'hilda',
    rarity: 'epic',
    role: 'bruiser',
    element: 'earth',
    baseStars: 3,
    glyph: '⚒️',
    baseStats: { hp: 1300, atk: 132, def: 98, spd: 88, crit: 8, critDmg: 155 },
    growth: { hp: 95, atk: 9.4, def: 7 },
    tags: ['dwarf', 'smith'],
    skills: [
      basic('hilda_rune_hammer', 'earth', '🔨', [
        dmg(1.05),
        status('defDown', 2, 'target', 15, 0.3),
      ]),
      skill('hilda_stone_rune', 'earth', 'self', 3, '🪨', [
        shield(0.8, 2, 'self'),
        status('atkUp', 2, 'self', 25),
      ]),
      skill('hilda_earthshaker', 'earth', 'enemies', 4, '🌋', [
        dmg(0.9),
        status('stun', 1, 'target', undefined, 0.25),
      ]),
      ultimate('hilda_forgefire_awakening', 'earth', 'enemy', 5, '🔥', [
        dmg(2.5, { armorPen: 0.4 }),
        status('defUp', 2, 'allies', 20),
      ]),
    ],
  },
  {
    id: 'tyra',
    rarity: 'rare',
    role: 'offtank',
    element: 'lightning',
    baseStars: 2,
    glyph: '👊',
    baseStats: { hp: 1240, atk: 128, def: 86, spd: 112, crit: 12, critDmg: 160 },
    growth: { hp: 90, atk: 9.2, def: 6.2 },
    tags: ['monk', 'storm'],
    skills: [
      basic(
        'tyra_thunder_palm',
        'lightning',
        '👊',
        [dmg(1.0), status('stun', 1, 'target', undefined, 0.15)],
        { fx: 'lightning_explosion' },
      ),
      skill('tyra_flowing_step', 'lightning', 'self', 3, '🌀', [
        status('taunt', 2, 'self'),
        status('evasion', 2, 'self', 35),
      ]),
      skill('tyra_hundred_strikes', 'lightning', 'randomEnemies', 3, '⚡', [dmg(0.55)], {
        count: 4,
      }),
      ultimate(
        'tyra_heaven_splitter',
        'lightning',
        'enemy',
        5,
        '🌩️',
        [
          dmg(2.3, { bonusCrit: 25 }),
          status('stun', 1, 'target', undefined, 0.5),
          status('spdUp', 2, 'self', 30),
        ],
        { fx: 'lightning_strike' },
      ),
    ],
  },
  {
    id: 'solveig',
    rarity: 'epic',
    role: 'ranger',
    element: 'lightning',
    baseStars: 3,
    glyph: '🏹',
    baseStats: { hp: 960, atk: 148, def: 64, spd: 116, crit: 16, critDmg: 170 },
    growth: { hp: 60, atk: 10.4, def: 4 },
    tags: ['ranger', 'storm'],
    skills: [
      basic(
        'solveig_spark_arrow',
        'lightning',
        '🏹',
        [dmg(1.0), status('spdDown', 1, 'target', 15, 0.3)],
        { fx: 'lightning_explosion' },
      ),
      skill('solveig_forked_arrow', 'lightning', 'chain', 3, '⚡', [dmg(1.2)], { chainJumps: 3 }),
      skill('solveig_storm_mark', 'lightning', 'weakestEnemy', 4, '🎯', [
        dmg(1.4, { armorPen: 0.3 }),
        status('defDown', 2, 'target', 20),
      ]),
      ultimate(
        'solveig_thunderstorm',
        'lightning',
        'randomEnemies',
        5,
        '🌩️',
        [dmg(0.7), status('stun', 1, 'target', undefined, 0.2)],
        { fx: 'lightning_strike', count: 6 },
      ),
    ],
  },
  {
    id: 'linnea',
    rarity: 'rare',
    role: 'bruiser',
    element: 'physical',
    baseStars: 2,
    glyph: '🤺',
    baseStats: { hp: 1100, atk: 140, def: 78, spd: 108, crit: 15, critDmg: 170 },
    growth: { hp: 76, atk: 10, def: 5.4 },
    tags: ['duelist', 'noble'],
    skills: [
      basic('linnea_lunge', 'physical', '🤺', [dmg(1.05, { bonusCrit: 10 })], {
        fx: 'sword_slash',
      }),
      skill('linnea_riposte', 'physical', 'self', 3, '⚔️', [
        status('reflect', 2, 'self', 30),
        status('evasion', 2, 'self', 25),
      ]),
      skill('linnea_disarm', 'physical', 'enemy', 3, '🗡️', [
        dmg(1.0),
        status('atkDown', 2, 'target', 30),
      ]),
      ultimate('linnea_final_flourish', 'physical', 'enemy', 5, '🌹', [
        dmg(2.6, { critIfDebuffed: true, armorPen: 0.25 }),
      ]),
    ],
  },
  {
    id: 'runa',
    rarity: 'rare',
    role: 'tank',
    element: 'physical',
    baseStars: 2,
    glyph: '🔱',
    baseStats: { hp: 1320, atk: 102, def: 100, spd: 96, crit: 8, critDmg: 150 },
    growth: { hp: 98, atk: 7, def: 7.4 },
    tags: ['guard', 'spear'],
    skills: [
      basic('runa_spear_thrust', 'physical', '🔱', [dmg(1.0, { armorPen: 0.15 })], {
        fx: 'sword_slash',
      }),
      skill('runa_hold_the_line', 'physical', 'self', 3, '🛡️', [
        status('taunt', 2, 'self'),
        status('defUp', 2, 'self', 35),
      ]),
      skill('runa_sweeping_spear', 'physical', 'enemies', 4, '🌀', [
        dmg(0.8),
        status('spdDown', 2, 'target', 20),
      ]),
      ultimate('runa_last_bulwark', 'physical', 'allies', 5, '🏰', [
        shield(0.9, 2, 'allies'),
        status('defUp', 2, 'allies', 20),
      ]),
    ],
  },
  {
    id: 'sable',
    rarity: 'epic',
    role: 'ranger',
    element: 'earth',
    baseStars: 3,
    glyph: '🐺',
    baseStats: { hp: 980, atk: 146, def: 66, spd: 114, crit: 16, critDmg: 168 },
    growth: { hp: 62, atk: 10.3, def: 4.2 },
    tags: ['ranger', 'beast', 'nature'],
    skills: [
      basic(
        'sable_hunting_spear',
        'physical',
        '🗡️',
        [dmg(1.0), status('bleed', 2, 'target', 0.15, 0.3)],
        {
          fx: 'sword_slash',
        },
      ),
      skill(
        'sable_wolf_pack',
        'earth',
        'randomEnemies',
        3,
        '🐺',
        [dmg(0.6), status('bleed', 2, 'target', 0.2)],
        { count: 4 },
      ),
      skill('sable_call_of_the_wild', 'earth', 'allies', 4, '🦅', [
        status('atkUp', 2, 'allies', 20),
        status('spdUp', 2, 'allies', 15),
      ]),
      ultimate('sable_alpha_hunt', 'earth', 'weakestEnemy', 5, '🐻', [
        dmg(2.4, { critIfDebuffed: true }),
        status('bleed', 3, 'target', 0.3),
      ]),
    ],
  },
  {
    id: 'kaida',
    rarity: 'legendary',
    role: 'bruiser',
    element: 'holy',
    baseStars: 4,
    glyph: '☀️',
    baseStats: { hp: 1200, atk: 152, def: 88, spd: 106, crit: 16, critDmg: 170 },
    growth: { hp: 86, atk: 11, def: 6.2 },
    tags: ['elf', 'spellblade', 'holy'],
    skills: [
      basic('kaida_runic_edge', 'holy', '⚔️', [dmg(1.1, { bonusCrit: 10 })], {
        fx: 'sword_slash',
      }),
      skill('kaida_sun_sigil', 'holy', 'self', 3, '🔆', [
        shield(0.7, 2, 'self'),
        status('magicUp', 2, 'self', 30),
      ]),
      skill('kaida_radiant_arc', 'holy', 'enemies', 4, '🌅', [
        dmg(1.0),
        status('defDown', 2, 'target', 20),
      ]),
      ultimate('kaida_solar_judgment', 'holy', 'enemy', 5, '🌞', [
        dmg(2.6, { armorPen: 0.35, bonusVsTags: { tags: ['undead', 'demon'], mult: 1.3 } }),
        heal(0.6, 'self'),
      ]),
    ],
  },
  {
    id: 'petra',
    rarity: 'rare',
    role: 'mage',
    element: 'earth',
    baseStars: 2,
    glyph: '🪨',
    baseStats: { hp: 980, atk: 132, def: 72, spd: 94, crit: 8, critDmg: 152 },
    growth: { hp: 64, atk: 9.3, def: 4.8 },
    tags: ['mage', 'geomancer'],
    skills: [
      basic('petra_stone_shard', 'earth', '🪨', [dmg(1.0)]),
      skill('petra_tremor', 'earth', 'enemies', 3, '〰️', [
        dmg(0.8),
        status('stun', 1, 'target', undefined, 0.2),
      ]),
      skill('petra_stoneskin', 'earth', 'allies', 4, '🗿', [status('defUp', 2, 'allies', 30)]),
      ultimate('petra_landslide', 'earth', 'enemies', 5, '⛰️', [
        dmg(1.6),
        status('spdDown', 2, 'target', 25),
      ]),
    ],
  },
  {
    id: 'nyxara',
    rarity: 'legendary',
    role: 'mage',
    element: 'shadow',
    baseStars: 4,
    glyph: '🩸',
    baseStats: { hp: 980, atk: 158, def: 62, spd: 104, crit: 14, critDmg: 170 },
    growth: { hp: 64, atk: 11.4, def: 4 },
    tags: ['elf', 'witch', 'blood'],
    skills: [
      basic('nyxara_blood_lance', 'shadow', '🩸', [dmg(1.0), { kind: 'drain', mult: 0.3 }]),
      skill('nyxara_bloodletting', 'shadow', 'self', 4, '🔪', [
        { kind: 'selfDamage', percentMaxHp: 10 },
        status('magicUp', 2, 'self', 40),
      ]),
      skill('nyxara_hemorrhage', 'shadow', 'enemies', 3, '🔴', [
        dmg(0.7),
        status('bleed', 3, 'target', 0.3),
      ]),
      ultimate('nyxara_crimson_rite', 'shadow', 'enemies', 5, '🌹', [
        dmg(1.3, { perDebuffBonus: 0.1 }),
        { kind: 'drain', mult: 0.4 },
      ]),
    ],
  },
  {
    id: 'berit',
    rarity: 'epic',
    role: 'tank',
    element: 'earth',
    baseStars: 3,
    glyph: '🐻',
    baseStats: { hp: 1460, atk: 98, def: 112, spd: 86, crit: 5, critDmg: 150 },
    growth: { hp: 108, atk: 6.6, def: 8.2 },
    tags: ['guard', 'bear'],
    skills: [
      basic(
        'berit_axe_chop',
        'physical',
        '🪓',
        [dmg(1.0), status('atkDown', 1, 'target', 15, 0.3)],
        { fx: 'sword_slash' },
      ),
      skill('berit_bear_roar', 'earth', 'self', 3, '🐻', [
        status('taunt', 2, 'self'),
        status('defUp', 2, 'self', 40),
      ]),
      skill('berit_shield_slam', 'earth', 'enemy', 3, '🛡️', [
        dmg(1.2),
        status('stun', 1, 'target', undefined, 0.35),
      ]),
      ultimate('berit_den_mother', 'earth', 'allies', 5, '🏔️', [
        shield(1.1, 2, 'allies'),
        status('regen', 2, 'allies', 5),
        status('taunt', 2, 'self'),
      ]),
    ],
  },
  {
    id: 'aelin',
    rarity: 'rare',
    role: 'assassin',
    element: 'physical',
    baseStars: 2,
    glyph: '🌬️',
    baseStats: { hp: 930, atk: 150, def: 60, spd: 126, crit: 20, critDmg: 175 },
    growth: { hp: 57, atk: 10.8, def: 3.6 },
    tags: ['lancer', 'wind'],
    skills: [
      basic('aelin_gale_thrust', 'physical', '🌬️', [dmg(1.0), status('spdUp', 1, 'self', 10)], {
        fx: 'wind_slash',
      }),
      skill('aelin_skyward_leap', 'physical', 'self', 4, '🪶', [
        status('evasion', 2, 'self', 40),
        status('haste', 1, 'self'),
      ]),
      skill(
        'aelin_piercing_dive',
        'physical',
        'weakestEnemy',
        3,
        '🎯',
        [dmg(1.5, { armorPen: 0.3 })],
        { fx: 'wind_slash' },
      ),
      ultimate(
        'aelin_tempest_charge',
        'physical',
        'enemies',
        5,
        '🌪️',
        [dmg(1.3), status('spdDown', 2, 'target', 20)],
        { fx: 'wind_slash' },
      ),
    ],
  },
  {
    id: 'morwen',
    rarity: 'epic',
    role: 'ranger',
    element: 'holy',
    baseStars: 3,
    glyph: '⚜️',
    baseStats: { hp: 970, atk: 150, def: 66, spd: 110, crit: 18, critDmg: 172 },
    growth: { hp: 61, atk: 10.5, def: 4.1 },
    tags: ['hunter', 'holy'],
    skills: [
      basic('morwen_silver_bolt', 'holy', '🏹', [
        dmg(1.0, { bonusVsTags: { tags: ['undead', 'demon'], mult: 1.3 } }),
      ]),
      skill('morwen_binding_seal', 'holy', 'enemy', 3, '📜', [
        dmg(0.8),
        status('atkDown', 2, 'target', 25),
        status('spdDown', 2, 'target', 20),
      ]),
      skill('morwen_hunters_mark', 'holy', 'weakestEnemy', 4, '🎯', [
        dmg(1.3, { critIfDebuffed: true }),
        status('defDown', 2, 'target', 25),
      ]),
      ultimate(
        'morwen_purging_volley',
        'holy',
        'randomEnemies',
        5,
        '✝️',
        [
          dmg(0.75, { bonusVsTags: { tags: ['undead', 'demon'], mult: 1.5 } }),
          status('burn', 2, 'target', 0.2, 0.3),
        ],
        { count: 5 },
      ),
    ],
  },
];

export const HERO_MAP: Record<string, HeroDef> = Object.fromEntries(HEROES.map((h) => [h.id, h]));

export function getHeroDef(id: string): HeroDef {
  const def = HERO_MAP[id];
  if (!def) throw new Error(`Unknown hero ${id}`);
  return def;
}

/** Heroes available in the starter roster */
export const STARTER_HEROES = ['arthen', 'lyra', 'thora'];
