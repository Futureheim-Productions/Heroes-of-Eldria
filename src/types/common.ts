export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Element =
  'physical' | 'holy' | 'ice' | 'lightning' | 'fire' | 'shadow' | 'poison' | 'earth' | 'astral';

export type CurrencyId = 'gold' | 'gems' | 'energy' | 'keys' | 'arenaCoins' | 'guildCoins';

export type CurrencyBundle = Partial<Record<CurrencyId, number>>;

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  /** Crit chance in percent (0-100) */
  crit: number;
  /** Crit damage multiplier in percent (150 = 1.5x) */
  critDmg: number;
}

export type StatKey = keyof Stats;

export interface Reward {
  currencies?: CurrencyBundle;
  items?: { itemId: string; qty: number }[];
  heroShards?: { heroId: string; qty: number }[];
  xp?: number;
}
