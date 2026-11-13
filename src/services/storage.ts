import type { StateStorage } from 'zustand/middleware';

/**
 * Storage wrapper used by zustand persist. Uses localStorage on web; can be swapped
 * for Capacitor Preferences later without touching the stores.
 */
export const gameStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* ignore quota errors */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const STORAGE_KEYS = [
  'fq_player',
  'fq_heroes',
  'fq_inventory',
  'fq_quests',
  'fq_progress',
  'fq_shop',
  'fq_arena',
  'fq_guild',
  'fq_mail',
  'fq_settings',
  'fq_battle_layout',
];

export function wipeSave(): void {
  for (const k of STORAGE_KEYS) gameStorage.removeItem(k);
}
