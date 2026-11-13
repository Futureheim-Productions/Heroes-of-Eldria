import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StageProgress } from '@/types';
import { gameStorage } from '@/services/storage';
import { REGIONS, REGION_MAP, STAGE_MAP } from '@/data/dungeons';

interface ProgressState {
  stages: Record<string, StageProgress>;
  recordClear: (
    stageId: string,
    difficulty: 'normal' | 'hard',
    stars: number,
  ) => { firstClear: boolean };
  isStageUnlocked: (stageId: string, difficulty: 'normal' | 'hard') => boolean;
  isRegionUnlocked: (regionId: string) => boolean;
  regionStars: (regionId: string) => { stars: number; max: number };
  totalStars: () => number;
  reset: () => void;
  /** Debug-only: marks every stage in every region as 3-starred on both difficulties. */
  unlockAll: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      stages: {},

      recordClear: (stageId, difficulty, stars) => {
        const cur = get().stages[stageId] ?? {
          normalStars: 0,
          hardStars: 0,
          normalClears: 0,
          hardClears: 0,
        };
        const firstClear = difficulty === 'normal' ? cur.normalClears === 0 : cur.hardClears === 0;
        const next: StageProgress =
          difficulty === 'normal'
            ? {
                ...cur,
                normalStars: Math.max(cur.normalStars, stars),
                normalClears: cur.normalClears + 1,
              }
            : { ...cur, hardStars: Math.max(cur.hardStars, stars), hardClears: cur.hardClears + 1 };
        set((s) => ({ stages: { ...s.stages, [stageId]: next } }));
        return { firstClear };
      },

      isRegionUnlocked: (regionId) => {
        const region = REGION_MAP[regionId];
        if (!region?.requiresRegion) return true;
        const prev = REGION_MAP[region.requiresRegion];
        const last = prev.stages[prev.stages.length - 1];
        return (get().stages[last.id]?.normalClears ?? 0) > 0;
      },

      isStageUnlocked: (stageId, difficulty) => {
        const stage = STAGE_MAP[stageId];
        if (!stage) return false;
        if (!get().isRegionUnlocked(stage.regionId)) return false;
        const region = REGION_MAP[stage.regionId];
        if (difficulty === 'hard') {
          // Hard mode requires the region to be cleared on normal
          const last = region.stages[region.stages.length - 1];
          if ((get().stages[last.id]?.normalClears ?? 0) === 0) return false;
          if (stage.index === 1) return true;
          const prev = region.stages[stage.index - 2];
          return (get().stages[prev.id]?.hardClears ?? 0) > 0;
        }
        if (stage.index === 1) return true;
        const prev = region.stages[stage.index - 2];
        return (get().stages[prev.id]?.normalClears ?? 0) > 0;
      },

      regionStars: (regionId) => {
        const region = REGION_MAP[regionId];
        const stars = region.stages.reduce((a, st) => {
          const p = get().stages[st.id];
          return a + (p?.normalStars ?? 0) + (p?.hardStars ?? 0);
        }, 0);
        return { stars, max: region.stages.length * 6 };
      },

      totalStars: () => REGIONS.reduce((a, r) => a + get().regionStars(r.id).stars, 0),

      reset: () => set({ stages: {} }),

      unlockAll: () =>
        set({
          stages: Object.fromEntries(
            Object.keys(STAGE_MAP).map((id) => [
              id,
              { normalStars: 3, hardStars: 3, normalClears: 1, hardClears: 1 },
            ]),
          ),
        }),
    }),
    { name: 'fq_progress', storage: createJSONStorage(() => gameStorage) },
  ),
);
