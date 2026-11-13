import type { HeroRole } from '@/types';
import { HERO_MAP } from '@/data/heroes';
import { heroArt } from '@/data/heroArt';
import { monsterArt } from '@/data/monsterArt';
import { ELEMENT_COLORS } from '@/utils/constants';
import type { ActorClass, ActorSide, ActorView } from './types';

const ROLE_CLASS: Record<HeroRole, ActorClass> = {
  tank: 'tank',
  offtank: 'tank',
  bruiser: 'warrior',
  assassin: 'assassin',
  mage: 'mage',
  healer: 'mage',
  ranger: 'archer',
};

const HERO_CLASS_OVERRIDE: Record<string, ActorClass> = {
  grimvald: 'necro',
};

/** Signature glow per hero; everyone else falls back to their element colour. */
const HERO_GLOW: Record<string, string> = {
  kael: '#ff8a3d',
  nera: '#2fd4c4',
  elarion: '#f2c14e',
  grimvald: '#5fe08a',
  freja: '#9fd8ff',
  solveig: '#3fe0ff',
};

const MONSTER_CLASS: Record<string, ActorClass> = {
  lich: 'necro',
  necro_apprentice: 'necro',
  soul_eater: 'necro',
  banshee: 'mage',
  ice_queen: 'mage',
  storm_elemental: 'mage',
  time_twister: 'mage',
  fallen_star: 'mage',
  cherry_spirit: 'mage',
  shadow_assassin: 'assassin',
  shadow_wolf: 'assassin',
  blood_bat: 'assassin',
  iron_golem: 'tank',
  war_golem: 'tank',
  stone_knoll: 'tank',
  elder_giant: 'tank',
  corrupt_treelord: 'tank',
};

const titleCase = (id: string) =>
  id
    .split('_')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');

export function heroView(
  id: string,
  o: { side?: ActorSide; skin?: number; name?: string; uid?: string } = {},
): ActorView | undefined {
  const def = HERO_MAP[id];
  const art = heroArt(id, o.skin);
  if (!def || !art) return undefined;
  const side = o.side ?? 'hero';
  return {
    id: o.uid ?? id,
    name: o.name ?? titleCase(id),
    artSrc: art,
    side,
    classId: HERO_CLASS_OVERRIDE[id] ?? ROLE_CLASS[def.role],
    glowColor: HERO_GLOW[id] ?? ELEMENT_COLORS[def.element],
    // Hero art faces the viewer/right; mirror it when a hero fights on the enemy side.
    flip: side === 'enemy',
  };
}

export function monsterView(
  id: string,
  o: { name?: string; uid?: string; big?: boolean; glowColor?: string } = {},
): ActorView | undefined {
  const art = monsterArt(id);
  if (!art) return undefined;
  return {
    id: o.uid ?? id,
    name: o.name ?? titleCase(id),
    artSrc: art,
    side: 'enemy',
    classId: MONSTER_CLASS[id] ?? 'warrior',
    glowColor: o.glowColor ?? '#ff5a4a',
    big: o.big,
  };
}
