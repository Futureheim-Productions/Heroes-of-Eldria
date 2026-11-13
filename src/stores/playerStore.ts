import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CurrencyBundle, CurrencyId, PlayerProfile } from '@/types';
import { gameStorage } from '@/services/storage';
import {
  ENERGY_MAX_BASE,
  ENERGY_REGEN_MS,
  MAX_PLAYER_LEVEL,
  playerXpForLevel,
} from '@/utils/constants';

interface PlayerState {
  profile: PlayerProfile;
  /** Actions */
  setName: (name: string) => void;
  setAvatar: (heroId: string) => void;
  addCurrency: (bundle: CurrencyBundle) => void;
  canAfford: (bundle: CurrencyBundle) => boolean;
  spend: (bundle: CurrencyBundle) => boolean;
  addXp: (xp: number) => { leveled: boolean; level: number };
  tickEnergy: () => void;
  energyMax: () => number;
  bumpStat: (key: keyof PlayerProfile['stats'], n?: number) => void;
  setDailyReset: (ts: number) => void;
  setWeeklyReset: (ts: number) => void;
  claimLogin: (ts: number, streak: number) => void;
  reset: () => void;
}

function defaultProfile(): PlayerProfile {
  const now = Date.now();
  return {
    id: `p_${now.toString(36)}`,
    name: 'Äventyrare',
    level: 1,
    xp: 0,
    avatarHeroId: 'arthen',
    currencies: {
      gold: 5000,
      gems: 300,
      energy: ENERGY_MAX_BASE,
      keys: 2,
      arenaCoins: 0,
      guildCoins: 0,
    },
    energyUpdatedAt: now,
    createdAt: now,
    lastDailyReset: 0,
    lastWeeklyReset: 0,
    loginStreak: 0,
    lastLoginClaim: 0,
    stats: { battlesWon: 0, battlesLost: 0, summons: 0, enhances: 0, arenaWins: 0 },
  };
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile(),

      setName: (name) =>
        set((s) => ({
          profile: { ...s.profile, name: name.trim().slice(0, 16) || s.profile.name },
        })),
      setAvatar: (heroId) => set((s) => ({ profile: { ...s.profile, avatarHeroId: heroId } })),

      energyMax: () => ENERGY_MAX_BASE + (get().profile.level - 1) * 2,

      addCurrency: (bundle) =>
        set((s) => {
          const currencies = { ...s.profile.currencies };
          for (const [k, v] of Object.entries(bundle) as [CurrencyId, number][]) {
            currencies[k] = Math.max(0, (currencies[k] ?? 0) + v);
          }
          return { profile: { ...s.profile, currencies } };
        }),

      canAfford: (bundle) => {
        const c = get().profile.currencies;
        return (Object.entries(bundle) as [CurrencyId, number][]).every(
          ([k, v]) => (c[k] ?? 0) >= v,
        );
      },

      spend: (bundle) => {
        if (!get().canAfford(bundle)) return false;
        set((s) => {
          const currencies = { ...s.profile.currencies };
          for (const [k, v] of Object.entries(bundle) as [CurrencyId, number][]) currencies[k] -= v;
          return { profile: { ...s.profile, currencies } };
        });
        return true;
      },

      addXp: (xp) => {
        let leveled = false;
        let level = get().profile.level;
        set((s) => {
          let cur = s.profile.xp + xp;
          level = s.profile.level;
          const currencies = { ...s.profile.currencies };
          while (level < MAX_PLAYER_LEVEL && cur >= playerXpForLevel(level)) {
            cur -= playerXpForLevel(level);
            level += 1;
            leveled = true;
            // Level up refills energy and grants gems
            currencies.energy = Math.max(currencies.energy, ENERGY_MAX_BASE + (level - 1) * 2);
            currencies.gems += 20;
          }
          return { profile: { ...s.profile, xp: cur, level, currencies } };
        });
        return { leveled, level };
      },

      tickEnergy: () => {
        const { profile } = get();
        const max = get().energyMax();
        const now = Date.now();
        const elapsed = now - profile.energyUpdatedAt;
        const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
        if (gained <= 0) return;
        if (profile.currencies.energy >= max) {
          set({ profile: { ...profile, energyUpdatedAt: now } });
          return;
        }
        set({
          profile: {
            ...profile,
            currencies: {
              ...profile.currencies,
              energy: Math.min(max, profile.currencies.energy + gained),
            },
            energyUpdatedAt: profile.energyUpdatedAt + gained * ENERGY_REGEN_MS,
          },
        });
      },

      bumpStat: (key, n = 1) =>
        set((s) => ({
          profile: { ...s.profile, stats: { ...s.profile.stats, [key]: s.profile.stats[key] + n } },
        })),

      setDailyReset: (ts) => set((s) => ({ profile: { ...s.profile, lastDailyReset: ts } })),
      setWeeklyReset: (ts) => set((s) => ({ profile: { ...s.profile, lastWeeklyReset: ts } })),
      claimLogin: (ts, streak) =>
        set((s) => ({ profile: { ...s.profile, lastLoginClaim: ts, loginStreak: streak } })),

      reset: () => set({ profile: defaultProfile() }),
    }),
    { name: 'fq_player', storage: createJSONStorage(() => gameStorage) },
  ),
);
