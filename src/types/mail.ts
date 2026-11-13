import type { Reward } from './common';

export interface MailItem {
  id: string;
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string | number>;
  reward?: Reward;
  claimed: boolean;
  read: boolean;
  createdAt: number;
}
