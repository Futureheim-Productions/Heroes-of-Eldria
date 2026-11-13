import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BattleConfig } from '@/types';
import { gameStorage } from '@/services/storage';
import { BATTLE_LAYOUTS } from '@/data/battleLayouts';

export interface UnitOffset {
  dx: number;
  dy: number;
}

interface MapLayout {
  heroes: Record<number, UnitOffset>;
  enemies: Record<number, UnitOffset>;
}

type Side = 'heroes' | 'enemies';

const ZERO: UnitOffset = { dx: 0, dy: 0 };

/** The shipped `BATTLE_LAYOUTS` with local overrides laid on top, per unit – exactly what
 *  `getOffset` shows in game. */
export function mergeLayouts(local: Record<string, MapLayout>): Record<string, MapLayout> {
  const out: Record<string, MapLayout> = {};
  for (const key of new Set([...Object.keys(BATTLE_LAYOUTS), ...Object.keys(local)])) {
    const shipped = BATTLE_LAYOUTS[key];
    const mine = local[key];
    out[key] = {
      heroes: { ...shipped?.heroes, ...mine?.heroes },
      enemies: { ...shipped?.enemies, ...mine?.enemies },
    };
  }
  return out;
}

/** Pretty-prints layouts as a complete `BATTLE_LAYOUTS` literal. Pass `mergeLayouts(...)` so the
 *  output replaces src/data/battleLayouts.ts wholesale without dropping maps you didn't touch. */
export function serializeLayouts(layouts: Record<string, MapLayout>): string {
  const sideEntries = (side: Record<number, UnitOffset>) =>
    Object.entries(side)
      .map(([i, o]) => `${i}: { dx: ${Math.round(o.dx)}, dy: ${Math.round(o.dy)} }`)
      .join(', ');
  const maps = Object.entries(layouts)
    .filter(([, m]) => Object.keys(m.heroes).length || Object.keys(m.enemies).length)
    .map(
      ([key, m]) =>
        `  '${key}': { heroes: { ${sideEntries(m.heroes)} }, enemies: { ${sideEntries(m.enemies)} } },`,
    )
    .join('\n');
  return `export const BATTLE_LAYOUTS: Record<string, MapLayout> = {\n${maps}\n};`;
}

/** Stable per-map key so position overrides for a dungeon stage or arena battles never mix. */
export function battleMapKey(config: BattleConfig | null | undefined): string {
  if (!config) return 'unknown';
  if (config.mode === 'arena') return 'arena';
  return `dungeon:${config.stageId ?? 'unknown'}`;
}

interface BattleLayoutState {
  layouts: Record<string, MapLayout>;
  /** Debug-only: whether the drag-to-reposition editor is active. Not persisted. */
  editing: boolean;
  setEditing: (v: boolean) => void;
  getOffset: (mapKey: string, side: Side, index: number) => UnitOffset;
  setOffset: (mapKey: string, side: Side, index: number, offset: UnitOffset) => void;
  resetMap: (mapKey: string) => void;
}

export const useBattleLayoutStore = create<BattleLayoutState>()(
  persist(
    (set, get) => ({
      layouts: {},
      editing: false,

      setEditing: (editing) => set({ editing }),

      getOffset: (mapKey, side, index) =>
        get().layouts[mapKey]?.[side][index] ?? BATTLE_LAYOUTS[mapKey]?.[side][index] ?? ZERO,

      setOffset: (mapKey, side, index, offset) =>
        set((s) => {
          const map = s.layouts[mapKey] ?? { heroes: {}, enemies: {} };
          return {
            layouts: {
              ...s.layouts,
              [mapKey]: { ...map, [side]: { ...map[side], [index]: offset } },
            },
          };
        }),

      resetMap: (mapKey) =>
        set((s) => {
          if (!s.layouts[mapKey]) return s;
          const next = { ...s.layouts };
          delete next[mapKey];
          return { layouts: next };
        }),
    }),
    {
      name: 'fq_battle_layout',
      storage: createJSONStorage(() => gameStorage),
      partialize: (s) => ({ layouts: s.layouts }),
      // v1: the combat stage used to save under `<mapKey>@stage`; fold those into the plain key
      // (they are the positions the player actually arranged on the current stage).
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { layouts?: Record<string, MapLayout> };
        if (version < 1 && state.layouts) {
          const layouts: Record<string, MapLayout> = {};
          for (const [key, map] of Object.entries(state.layouts)) {
            if (!key.endsWith('@stage')) layouts[key] ??= map;
          }
          for (const [key, map] of Object.entries(state.layouts)) {
            if (key.endsWith('@stage')) layouts[key.slice(0, -'@stage'.length)] = map;
          }
          state.layouts = layouts;
        }
        return state as BattleLayoutState;
      },
    },
  ),
);
