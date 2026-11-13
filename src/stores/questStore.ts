import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuestDef, QuestObjective, QuestProgress } from '@/types';
import { gameStorage } from '@/services/storage';
import { QUESTS, QUEST_MAP } from '@/data/quests';

export type QuestEvent =
  | { type: 'winBattle' }
  | { type: 'clearStage'; stageId: string }
  | { type: 'heroLevel'; level: number }
  | { type: 'summon'; count: number }
  | { type: 'enhance' }
  | { type: 'spendEnergy'; amount: number }
  | { type: 'playerLevel'; level: number }
  | { type: 'ownHeroes'; count: number }
  | { type: 'arenaBattle' }
  | { type: 'guildContribute' }
  | { type: 'claimDaily' };

interface QuestState {
  progress: Record<string, QuestProgress>;
  track: (ev: QuestEvent) => void;
  markClaimed: (id: string) => void;
  resetCategory: (cat: 'daily' | 'weekly') => void;
  isAvailable: (q: QuestDef) => boolean;
  claimableCount: () => number;
  reset: () => void;
}

function objectiveTarget(o: QuestObjective): number {
  switch (o.type) {
    case 'clearStage':
      return 1;
    case 'levelHero':
      return o.level;
    case 'reachPlayerLevel':
      return o.level;
    case 'spendEnergy':
      return o.amount;
    default:
      return o.count;
  }
}

export function questTarget(q: QuestDef): number {
  return objectiveTarget(q.objective);
}

function applyEvent(o: QuestObjective, p: QuestProgress, ev: QuestEvent): number {
  switch (o.type) {
    case 'winBattles':
      return ev.type === 'winBattle' ? p.progress + 1 : p.progress;
    case 'clearStage':
      return ev.type === 'clearStage' && ev.stageId === o.stageId ? 1 : p.progress;
    case 'levelHero':
      return ev.type === 'heroLevel' ? Math.max(p.progress, ev.level) : p.progress;
    case 'summon':
      return ev.type === 'summon' ? p.progress + ev.count : p.progress;
    case 'enhanceEquipment':
      return ev.type === 'enhance' ? p.progress + 1 : p.progress;
    case 'spendEnergy':
      return ev.type === 'spendEnergy' ? p.progress + ev.amount : p.progress;
    case 'reachPlayerLevel':
      return ev.type === 'playerLevel' ? Math.max(p.progress, ev.level) : p.progress;
    case 'ownHeroes':
      return ev.type === 'ownHeroes' ? Math.max(p.progress, ev.count) : p.progress;
    case 'arenaBattles':
      return ev.type === 'arenaBattle' ? p.progress + 1 : p.progress;
    case 'guildContribute':
      return ev.type === 'guildContribute' ? p.progress + 1 : p.progress;
    case 'claimDaily':
      return ev.type === 'claimDaily' ? p.progress + 1 : p.progress;
  }
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      progress: {},

      isAvailable: (q) => {
        if (!q.requires) return true;
        return !!get().progress[q.requires]?.claimed;
      },

      track: (ev) =>
        set((s) => {
          const progress = { ...s.progress };
          for (const q of QUESTS) {
            const cur = progress[q.id] ?? { progress: 0, completed: false, claimed: false };
            if (cur.claimed) continue;
            const next = Math.min(objectiveTarget(q.objective), applyEvent(q.objective, cur, ev));
            if (next !== cur.progress || (!cur.completed && next >= objectiveTarget(q.objective))) {
              progress[q.id] = {
                progress: next,
                completed: next >= objectiveTarget(q.objective),
                claimed: false,
              };
            }
          }
          return { progress };
        }),

      markClaimed: (id) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [id]: { ...(s.progress[id] ?? { progress: 0, completed: true }), claimed: true },
          },
        })),

      resetCategory: (cat) =>
        set((s) => {
          const progress = { ...s.progress };
          for (const q of QUESTS) if (q.category === cat) delete progress[q.id];
          return { progress };
        }),

      claimableCount: () => {
        const { progress, isAvailable } = get();
        return QUESTS.filter(
          (q) => isAvailable(q) && progress[q.id]?.completed && !progress[q.id]?.claimed,
        ).length;
      },

      reset: () => set({ progress: {} }),
    }),
    { name: 'fq_quests', storage: createJSONStorage(() => gameStorage) },
  ),
);

export { QUEST_MAP };
