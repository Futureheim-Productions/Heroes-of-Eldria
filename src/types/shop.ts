import type { CurrencyBundle, Reward } from './common';

export type OfferCategory = 'featured' | 'daily' | 'currency' | 'summon';

export interface ShopOffer {
  id: string;
  category: OfferCategory;
  cost: CurrencyBundle | { real: number };
  reward: Reward;
  glyph: string;
  limit?: number;
  badge?: 'hot' | 'value' | 'new';
}
