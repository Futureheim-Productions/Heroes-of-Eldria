import type { CurrencyId } from './common';

export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  avatarHeroId: string;
  currencies: Record<CurrencyId, number>;
  energyUpdatedAt: number;
  createdAt: number;
  lastDailyReset: number;
  lastWeeklyReset: number;
  loginStreak: number;
  lastLoginClaim: number;
  stats: {
    battlesWon: number;
    battlesLost: number;
    summons: number;
    enhances: number;
    arenaWins: number;
  };
}
