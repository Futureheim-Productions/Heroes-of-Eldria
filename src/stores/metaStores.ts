import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GuildMember, MailItem, Reward } from '@/types';
import { gameStorage } from '@/services/storage';
import { generateGuildMembers } from '@/data/social';
import { uid } from '@/utils/rng';

// ───────────── Shop ─────────────
interface ShopState {
  purchases: Record<string, number>;
  pity: number;
  totalSummons: number;
  lastSummonResults: string[];
  recordPurchase: (id: string) => void;
  resetDaily: () => void;
  setPity: (n: number) => void;
  setSummonResults: (ids: string[]) => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      purchases: {},
      pity: 0,
      totalSummons: 0,
      lastSummonResults: [],
      recordPurchase: (id) =>
        set((s) => ({ purchases: { ...s.purchases, [id]: (s.purchases[id] ?? 0) + 1 } })),
      resetDaily: () =>
        set((s) => {
          const purchases = { ...s.purchases };
          for (const k of Object.keys(purchases)) if (k.startsWith('daily_')) delete purchases[k];
          return { purchases };
        }),
      setPity: (n) => set({ pity: n }),
      setSummonResults: (ids) =>
        set((s) => ({ lastSummonResults: ids, totalSummons: s.totalSummons + ids.length })),
      reset: () => set({ purchases: {}, pity: 0, totalSummons: 0, lastSummonResults: [] }),
    }),
    { name: 'fq_shop', storage: createJSONStorage(() => gameStorage) },
  ),
);

// ───────────── Arena ─────────────
interface ArenaState {
  rank: number;
  points: number;
  dailyBattles: number;
  seed: number;
  history: { opponent: string; won: boolean; delta: number; at: number }[];
  applyResult: (opponent: string, won: boolean, delta: number) => void;
  refreshOpponents: () => void;
  resetDaily: () => void;
  reset: () => void;
}

export const useArenaStore = create<ArenaState>()(
  persist(
    (set) => ({
      rank: 5000,
      points: 1000,
      dailyBattles: 0,
      seed: Math.floor(Math.random() * 100000),
      history: [],
      applyResult: (opponent, won, delta) =>
        set((s) => ({
          points: Math.max(0, s.points + delta),
          rank: Math.max(
            1,
            won
              ? s.rank - Math.max(5, Math.floor(s.rank * 0.08))
              : s.rank + Math.floor(s.rank * 0.03),
          ),
          dailyBattles: s.dailyBattles + 1,
          seed: Math.floor(Math.random() * 100000),
          history: [{ opponent, won, delta, at: Date.now() }, ...s.history].slice(0, 10),
        })),
      refreshOpponents: () => set({ seed: Math.floor(Math.random() * 100000) }),
      resetDaily: () => set({ dailyBattles: 0 }),
      reset: () => set({ rank: 5000, points: 1000, dailyBattles: 0, history: [] }),
    }),
    { name: 'fq_arena', storage: createJSONStorage(() => gameStorage) },
  ),
);

// ───────────── Guild ─────────────
interface GuildState {
  guildId: string | null;
  customGuild: { id: string; name: string; glyph: string } | null;
  members: GuildMember[];
  contribution: number;
  dailyContributed: boolean;
  guildXp: number;
  join: (guildId: string, seed: number, memberCount: number) => void;
  createGuild: (name: string, glyph: string) => void;
  leave: () => void;
  contribute: (amount: number) => void;
  resetDaily: () => void;
  reset: () => void;
}

export const useGuildStore = create<GuildState>()(
  persist(
    (set, get) => ({
      guildId: null,
      customGuild: null,
      members: [],
      contribution: 0,
      dailyContributed: false,
      guildXp: 0,
      join: (guildId, seed, memberCount) =>
        set({
          guildId,
          customGuild: null,
          members: generateGuildMembers(guildId, memberCount, seed),
          contribution: 0,
          dailyContributed: false,
          guildXp: 0,
        }),
      createGuild: (name, glyph) => {
        const id = uid('guild');
        set({
          guildId: id,
          customGuild: { id, name, glyph },
          members: [],
          contribution: 0,
          dailyContributed: false,
          guildXp: 0,
        });
      },
      leave: () =>
        set({
          guildId: null,
          customGuild: null,
          members: [],
          contribution: 0,
          dailyContributed: false,
          guildXp: 0,
        }),
      contribute: (amount) =>
        set({
          contribution: get().contribution + amount,
          dailyContributed: true,
          guildXp: get().guildXp + amount,
        }),
      resetDaily: () => set({ dailyContributed: false }),
      reset: () =>
        set({
          guildId: null,
          customGuild: null,
          members: [],
          contribution: 0,
          dailyContributed: false,
          guildXp: 0,
        }),
    }),
    { name: 'fq_guild', storage: createJSONStorage(() => gameStorage) },
  ),
);

// ───────────── Mail ─────────────
interface MailState {
  mails: MailItem[];
  send: (
    titleKey: string,
    bodyKey: string,
    reward?: Reward,
    params?: Record<string, string | number>,
  ) => void;
  markRead: (id: string) => void;
  markClaimed: (id: string) => void;
  remove: (id: string) => void;
  unreadCount: () => number;
  reset: () => void;
}

export const useMailStore = create<MailState>()(
  persist(
    (set, get) => ({
      mails: [
        {
          id: 'welcome',
          titleKey: 'welcome_title',
          bodyKey: 'welcome_body',
          reward: {
            currencies: { gems: 200, gold: 3000 },
            items: [{ itemId: 'xp_potion_m', qty: 2 }],
          },
          claimed: false,
          read: false,
          createdAt: Date.now(),
        },
      ],
      send: (titleKey, bodyKey, reward, params) =>
        set((s) => ({
          mails: [
            {
              id: uid('mail'),
              titleKey,
              bodyKey,
              reward,
              params,
              claimed: false,
              read: false,
              createdAt: Date.now(),
            },
            ...s.mails,
          ].slice(0, 30),
        })),
      markRead: (id) =>
        set((s) => ({ mails: s.mails.map((m) => (m.id === id ? { ...m, read: true } : m)) })),
      markClaimed: (id) =>
        set((s) => ({
          mails: s.mails.map((m) => (m.id === id ? { ...m, claimed: true, read: true } : m)),
        })),
      remove: (id) => set((s) => ({ mails: s.mails.filter((m) => m.id !== id) })),
      unreadCount: () => get().mails.filter((m) => !m.read || (m.reward && !m.claimed)).length,
      reset: () => set({ mails: [] }),
    }),
    { name: 'fq_mail', storage: createJSONStorage(() => gameStorage) },
  ),
);
