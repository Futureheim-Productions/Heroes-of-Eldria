import { create } from 'zustand';
import type { BattleConfig, BattleEvent, BattleState } from '@/types';
import { advance, chooseAction, performAction } from '@/utils/battle';

export interface CombatRewardSummary {
  gold: number;
  xp: number;
  gems: number;
  keys: number;
  arenaCoins: number;
  items: { itemId: string; qty: number }[];
  heroXp: number;
  stars: number;
  firstClear: boolean;
  playerLeveled: boolean;
  rankDelta?: number;
}

interface CombatState {
  battle: BattleState | null;
  config: BattleConfig | null;
  auto: boolean;
  speed: 1 | 2 | 3;
  /** Events not yet animated */
  pending: BattleEvent[];
  eventCursor: number;
  summary: CombatRewardSummary | null;
  busy: boolean;
  selectedSkillId: string | null;

  begin: (battle: BattleState, config: BattleConfig) => void;
  setAuto: (auto: boolean) => void;
  setSpeed: (speed: 1 | 2 | 3) => void;
  setSelectedSkill: (id: string | null) => void;
  /** Advance until a decision is needed. Returns new events. */
  step: () => BattleEvent[];
  act: (skillId: string, targetUid?: string) => BattleEvent[];
  aiAct: () => BattleEvent[];
  setSummary: (s: CombatRewardSummary | null) => void;
  setBusy: (b: boolean) => void;
  clear: () => void;
}

export const useCombatStore = create<CombatState>()((set, get) => ({
  battle: null,
  config: null,
  auto: false,
  speed: 1,
  pending: [],
  eventCursor: 0,
  summary: null,
  busy: false,
  selectedSkillId: null,

  begin: (battle, config) =>
    set({
      battle,
      config,
      pending: [],
      eventCursor: battle.log.length,
      summary: null,
      busy: false,
      selectedSkillId: null,
    }),
  setAuto: (auto) => set({ auto }),
  setSpeed: (speed) => set({ speed }),
  setSelectedSkill: (id) => set({ selectedSkillId: id }),

  step: () => {
    const { battle, eventCursor } = get();
    if (!battle) return [];
    const next = advance(battle);
    const events = next.log.slice(eventCursor);
    set({ battle: next, eventCursor: next.log.length, selectedSkillId: null });
    return events;
  },

  act: (skillId, targetUid) => {
    const { battle, eventCursor } = get();
    if (!battle || !battle.activeId) return [];
    const next = performAction(battle, skillId, targetUid);
    const events = next.log.slice(eventCursor);
    set({ battle: next, eventCursor: next.log.length, selectedSkillId: null });
    return events;
  },

  aiAct: () => {
    const { battle } = get();
    if (!battle || !battle.activeId) return [];
    const { skillId, targetUid } = chooseAction(battle, battle.activeId);
    return get().act(skillId, targetUid);
  },

  setSummary: (summary) => set({ summary }),
  setBusy: (busy) => set({ busy }),
  clear: () =>
    set({ battle: null, config: null, pending: [], eventCursor: 0, summary: null, busy: false }),
}));
