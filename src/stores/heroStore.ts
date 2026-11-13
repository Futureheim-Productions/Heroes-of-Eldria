import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EquipSlot, OwnedHero } from '@/types';
import { gameStorage } from '@/services/storage';
import { getHeroDef, STARTER_HEROES } from '@/data/heroes';
import {
  heroXpForLevel,
  MAX_FORMATION,
  MAX_HERO_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_STARS,
} from '@/utils/constants';

interface HeroState {
  heroes: Record<string, OwnedHero>;
  shards: Record<string, number>;
  formation: (string | null)[];
  /** Actions */
  addHero: (defId: string) => 'new' | 'shards';
  addShards: (defId: string, qty: number) => void;
  addHeroXp: (defId: string, xp: number) => { levels: number };
  starUp: (defId: string) => boolean;
  upgradeSkill: (defId: string, skillId: string) => boolean;
  setEquipment: (defId: string, slot: EquipSlot, itemUid: string | undefined) => void;
  /** 0 = default art, n = skin n (see heroSkins) */
  setSkin: (defId: string, skin: number) => void;
  setFormationSlot: (index: number, defId: string | null) => void;
  formationHeroes: () => OwnedHero[];
  reset: () => void;
}

function newOwned(defId: string): OwnedHero {
  const def = getHeroDef(defId);
  return {
    defId,
    level: 1,
    xp: 0,
    stars: def.baseStars,
    skillLevels: Object.fromEntries(def.skills.map((s) => [s.id, 1])),
    equipment: {},
  };
}

function defaultState() {
  const heroes: Record<string, OwnedHero> = {};
  for (const id of STARTER_HEROES) heroes[id] = newOwned(id);
  return {
    heroes,
    shards: {} as Record<string, number>,
    formation: [...STARTER_HEROES, null, null] as (string | null)[],
  };
}

export const useHeroStore = create<HeroState>()(
  persist(
    (set, get) => ({
      ...defaultState(),

      addHero: (defId) => {
        if (get().heroes[defId]) {
          get().addShards(defId, 5);
          return 'shards';
        }
        set((s) => ({ heroes: { ...s.heroes, [defId]: newOwned(defId) } }));
        return 'new';
      },

      addShards: (defId, qty) =>
        set((s) => ({ shards: { ...s.shards, [defId]: (s.shards[defId] ?? 0) + qty } })),

      addHeroXp: (defId, xp) => {
        let levels = 0;
        set((s) => {
          const h = s.heroes[defId];
          if (!h) return s;
          let level = h.level;
          let cur = h.xp + xp;
          while (level < MAX_HERO_LEVEL && cur >= heroXpForLevel(level)) {
            cur -= heroXpForLevel(level);
            level += 1;
            levels += 1;
          }
          if (level >= MAX_HERO_LEVEL) cur = 0;
          return { heroes: { ...s.heroes, [defId]: { ...h, level, xp: cur } } };
        });
        return { levels };
      },

      starUp: (defId) => {
        const h = get().heroes[defId];
        if (!h || h.stars >= MAX_STARS) return false;
        set((s) => ({ heroes: { ...s.heroes, [defId]: { ...h, stars: h.stars + 1 } } }));
        return true;
      },

      upgradeSkill: (defId, skillId) => {
        const h = get().heroes[defId];
        if (!h) return false;
        const lv = h.skillLevels[skillId] ?? 1;
        if (lv >= MAX_SKILL_LEVEL) return false;
        set((s) => ({
          heroes: {
            ...s.heroes,
            [defId]: { ...h, skillLevels: { ...h.skillLevels, [skillId]: lv + 1 } },
          },
        }));
        return true;
      },

      setSkin: (defId, skin) =>
        set((s) => {
          const h = s.heroes[defId];
          if (!h) return s;
          return { heroes: { ...s.heroes, [defId]: { ...h, skin: skin || undefined } } };
        }),

      setEquipment: (defId, slot, itemUid) =>
        set((s) => {
          const h = s.heroes[defId];
          if (!h) return s;
          const equipment = { ...h.equipment };
          if (itemUid) equipment[slot] = itemUid;
          else delete equipment[slot];
          return { heroes: { ...s.heroes, [defId]: { ...h, equipment } } };
        }),

      setFormationSlot: (index, defId) =>
        set((s) => {
          const formation = [...s.formation];
          while (formation.length < MAX_FORMATION) formation.push(null);
          // Remove hero from any other slot
          if (defId) {
            for (let i = 0; i < formation.length; i++)
              if (formation[i] === defId) formation[i] = null;
          }
          formation[index] = defId;
          return { formation };
        }),

      formationHeroes: () => {
        const { formation, heroes } = get();
        return formation.filter((id): id is string => !!id && !!heroes[id]).map((id) => heroes[id]);
      },

      reset: () => set(defaultState()),
    }),
    { name: 'fq_heroes', storage: createJSONStorage(() => gameStorage) },
  ),
);
