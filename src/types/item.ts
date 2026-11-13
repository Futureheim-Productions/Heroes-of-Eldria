import type { Rarity, Stats } from './common';
import type { EquipSlot } from './hero';

export type ItemType = 'equipment' | 'material' | 'consumable';

export type MaterialKind =
  'enhanceStone' | 'xpPotion' | 'skillBook' | 'awakenCrystal' | 'energyPotion';

export interface ItemDef {
  id: string;
  type: ItemType;
  rarity: Rarity;
  glyph: string;
  /** Equipment only */
  slot?: EquipSlot;
  baseStats?: Partial<Stats>;
  setId?: string;
  /** Material/consumable only */
  material?: MaterialKind;
  value?: number;
  sellPrice: number;
}

export interface OwnedItem {
  /** Unique instance id */
  uid: string;
  defId: string;
  qty: number;
  /** Equipment only */
  enhance?: number;
  equippedBy?: string;
}

export interface SetBonusDef {
  id: string;
  pieces: number;
  bonus: Partial<Stats>;
}
