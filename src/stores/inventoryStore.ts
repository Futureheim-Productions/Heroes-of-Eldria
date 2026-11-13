import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OwnedItem } from '@/types';
import { gameStorage } from '@/services/storage';
import { getItemDef } from '@/data/items';
import { uid } from '@/utils/rng';
import { MAX_ENHANCE } from '@/utils/constants';

interface InventoryState {
  items: OwnedItem[];
  addItem: (defId: string, qty?: number) => OwnedItem[];
  removeItem: (uidOrDefId: string, qty?: number) => boolean;
  countOf: (defId: string) => number;
  getItem: (itemUid: string) => OwnedItem | undefined;
  setEquippedBy: (itemUid: string, heroId: string | undefined) => void;
  enhance: (itemUid: string) => boolean;
  reset: () => void;
}

function starterItems(): OwnedItem[] {
  return [
    { uid: uid('it'), defId: 'rusty_sword', qty: 1, enhance: 0 },
    { uid: uid('it'), defId: 'leather_vest', qty: 1, enhance: 0 },
    { uid: uid('it'), defId: 'worn_boots', qty: 1, enhance: 0 },
    { uid: uid('it'), defId: 'xp_potion_s', qty: 5 },
    { uid: uid('it'), defId: 'enhance_stone', qty: 5 },
  ];
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: starterItems(),

      addItem: (defId, qty = 1) => {
        const def = getItemDef(defId);
        const created: OwnedItem[] = [];
        set((s) => {
          const items = [...s.items];
          if (def.type === 'equipment') {
            for (let i = 0; i < qty; i++) {
              const it: OwnedItem = { uid: uid('it'), defId, qty: 1, enhance: 0 };
              items.push(it);
              created.push(it);
            }
          } else {
            const idx = items.findIndex((i) => i.defId === defId);
            if (idx >= 0) {
              items[idx] = { ...items[idx], qty: items[idx].qty + qty };
              created.push(items[idx]);
            } else {
              const it: OwnedItem = { uid: uid('it'), defId, qty };
              items.push(it);
              created.push(it);
            }
          }
          return { items };
        });
        return created;
      },

      removeItem: (uidOrDefId, qty = 1) => {
        const s = get();
        let idx = s.items.findIndex((i) => i.uid === uidOrDefId);
        if (idx < 0) idx = s.items.findIndex((i) => i.defId === uidOrDefId);
        if (idx < 0) return false;
        const it = s.items[idx];
        if (it.qty < qty) return false;
        const items = [...s.items];
        if (it.qty === qty) items.splice(idx, 1);
        else items[idx] = { ...it, qty: it.qty - qty };
        set({ items });
        return true;
      },

      countOf: (defId) =>
        get()
          .items.filter((i) => i.defId === defId)
          .reduce((a, i) => a + i.qty, 0),
      getItem: (itemUid) => get().items.find((i) => i.uid === itemUid),

      setEquippedBy: (itemUid, heroId) =>
        set((s) => ({
          items: s.items.map((i) => (i.uid === itemUid ? { ...i, equippedBy: heroId } : i)),
        })),

      enhance: (itemUid) => {
        const it = get().getItem(itemUid);
        if (!it || (it.enhance ?? 0) >= MAX_ENHANCE) return false;
        set((s) => ({
          items: s.items.map((i) =>
            i.uid === itemUid ? { ...i, enhance: (i.enhance ?? 0) + 1 } : i,
          ),
        }));
        return true;
      },

      reset: () => set({ items: starterItems() }),
    }),
    { name: 'fq_inventory', storage: createJSONStorage(() => gameStorage) },
  ),
);
