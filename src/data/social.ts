import type { GuildDef, GuildMember } from '@/types';

export const AI_GUILDS: GuildDef[] = [
  {
    id: 'g_iron_wolves',
    name: 'Järnvargarna',
    glyph: '🐺',
    level: 7,
    members: 24,
    maxMembers: 30,
    description: 'Aktiv guild som jagar drakar varje helg.',
    ai: true,
  },
  {
    id: 'g_star_council',
    name: 'Stjärnrådet',
    glyph: '🌟',
    level: 12,
    members: 29,
    maxMembers: 30,
    description: 'Endast för hjältar med 40+ i nivå.',
    ai: true,
  },
  {
    id: 'g_ember_kin',
    name: 'Glödsläktet',
    glyph: '🔥',
    level: 4,
    members: 12,
    maxMembers: 30,
    description: 'Nybörjarvänlig guild. Alla är välkomna!',
    ai: true,
  },
  {
    id: 'g_frost_watch',
    name: 'Frostvakten',
    glyph: '❄️',
    level: 9,
    members: 20,
    maxMembers: 30,
    description: 'Vi vaktar norr. Bidra dagligen.',
    ai: true,
  },
];

const NAMES = [
  'Ragnar',
  'Sigrid',
  'Eirik',
  'Astrid',
  'Bjorn',
  'Freya',
  'Leif',
  'Ingrid',
  'Torvald',
  'Ylva',
  'Gunnar',
  'Solveig',
];

export function generateGuildMembers(guildId: string, count: number, seed: number): GuildMember[] {
  const out: GuildMember[] = [];
  for (let i = 0; i < count; i++) {
    const n = (seed * 31 + i * 17) % NAMES.length;
    out.push({
      id: `${guildId}_m${i}`,
      name: `${NAMES[n]}${(seed + i) % 97}`,
      level: 5 + ((seed + i * 7) % 40),
      contribution: 200 + ((seed * 13 + i * 101) % 5000),
      role: i === 0 ? 'leader' : i < 3 ? 'officer' : 'member',
    });
  }
  return out.sort((a, b) => b.contribution - a.contribution);
}

export interface ArenaOpponent {
  id: string;
  name: string;
  rank: number;
  power: number;
  heroIds: string[];
  level: number;
}

const OPP_NAMES = [
  'ShadowKing',
  'Valkyria',
  'NightOwl',
  'IronFist',
  'MoonSong',
  'DragonBane',
  'FrostByte',
  'StormRider',
  'Ashen',
  'Glimmer',
];

export function generateArenaOpponents(
  playerRank: number,
  playerPower: number,
  seed: number,
): ArenaOpponent[] {
  const pool = [
    'arthen',
    'lyra',
    'kael',
    'sylwen',
    'thora',
    'elarion',
    'brann',
    'ilva',
    'grimvald',
    'mira',
  ];
  const out: ArenaOpponent[] = [];
  for (let i = 0; i < 4; i++) {
    const s = seed + i * 977;
    const rankDelta = [-30, -12, 8, 25][i];
    const rank = Math.max(1, playerRank + rankDelta);
    const powerMult = 0.75 + i * 0.18;
    const heroIds: string[] = [];
    let k = s;
    while (heroIds.length < 4) {
      const h = pool[k % pool.length];
      if (!heroIds.includes(h)) heroIds.push(h);
      k += 7;
    }
    out.push({
      id: `opp_${s}`,
      name: OPP_NAMES[s % OPP_NAMES.length] + (s % 100),
      rank,
      power: Math.round(playerPower * powerMult),
      heroIds,
      level: Math.max(1, Math.round((playerPower * powerMult) / 260)),
    });
  }
  return out;
}
