import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OwnedItem, Stats } from '@/types';
import { Screen } from '@/components/layout/Screen';
import { ItemCard } from '@/components/game/ItemCard';
import { Button } from '@/components/ui/Button';
import { Chip, EmptyState, RarityBadge, StatRow } from '@/components/ui/misc';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { getItemDef } from '@/data/items';
import { getHeroDef } from '@/data/heroes';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHeroStore } from '@/stores/heroStore';
import { usePlayerStore } from '@/stores/playerStore';
import {
  enhanceItem,
  equipItem,
  sellItem,
  drinkEnergyPotion,
  applyXpPotion,
} from '@/services/game';
import { equipmentStats } from '@/utils/stats';
import { enhanceCost, MAX_ENHANCE, RARITY_ORDER } from '@/utils/constants';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/services/haptics';
import { useStaggerIn } from '@/hooks/useScreenEnter';

type Filter = 'all' | 'equipment' | 'materials';

export default function InventoryScreen() {
  const { t } = useTranslation(['inventory', 'items', 'common', 'heroes']);
  const items = useInventoryStore((s) => s.items);
  const heroes = useHeroStore((s) => s.heroes);
  const gold = usePlayerStore((s) => s.profile.currencies.gold);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [equipPick, setEquipPick] = useState(false);
  const ref = useStaggerIn([filter]);

  const list = useMemo(() => {
    const f = items.filter((i) => {
      const d = getItemDef(i.defId);
      if (filter === 'equipment') return d.type === 'equipment';
      if (filter === 'materials') return d.type !== 'equipment';
      return true;
    });
    return f.sort((a, b) => {
      const da = getItemDef(a.defId);
      const db = getItemDef(b.defId);
      if (da.type !== db.type) return da.type === 'equipment' ? -1 : 1;
      return (
        RARITY_ORDER.indexOf(db.rarity) - RARITY_ORDER.indexOf(da.rarity) ||
        (b.enhance ?? 0) - (a.enhance ?? 0)
      );
    });
  }, [items, filter]);

  const selected: OwnedItem | undefined = items.find((i) => i.uid === selectedUid);
  const def = selected ? getItemDef(selected.defId) : undefined;
  const stones = items.filter((i) => i.defId === 'enhance_stone').reduce((a, i) => a + i.qty, 0);

  return (
    <Screen title={t('inventory:title')} bodyClassName="flex gap-3 !overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex gap-1.5">
          {(['all', 'equipment', 'materials'] as Filter[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {t(`inventory:${f}`)}
            </Chip>
          ))}
          <span className="ml-auto text-[10px] text-ink-dim">{list.length}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <EmptyState text={t('inventory:empty')} glyph="🎒" />
          ) : (
            <div ref={ref} className="grid-auto-cards">
              {list.map((it) => (
                <ItemCard
                  key={it.uid}
                  item={it}
                  selected={it.uid === selectedUid}
                  onClick={() => setSelectedUid(it.uid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="panel flex w-[250px] shrink-0 flex-col gap-2 overflow-y-auto p-3">
        {selected && def ? (
          <>
            <div className="flex items-center gap-2">
              <ItemCard item={selected} size={48} showName={false} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold">{t(`items:${def.id}.name`)}</div>
                <RarityBadge rarity={def.rarity} />
                {def.slot && (
                  <div className="text-[10px] text-ink-dim">{t(`common:slot.${def.slot}`)}</div>
                )}
                {selected.qty > 1 && (
                  <div className="text-[10px] text-ink-dim">
                    {t('inventory:qty', { n: selected.qty })}
                  </div>
                )}
              </div>
            </div>

            {def.type === 'equipment' ? (
              <>
                <div>
                  {(Object.entries(equipmentStats(selected)) as [keyof Stats, number][]).map(
                    ([k, v]) => (
                      <StatRow key={k} label={t(`common:stat.${k}`)} value={`+${v}`} />
                    ),
                  )}
                  {def.setId && (
                    <div className="mt-1 text-[10px] text-purple-2">
                      {t(`items:sets.${def.setId}`)}
                    </div>
                  )}
                </div>
                {selected.equippedBy && (
                  <div className="flex items-center gap-1 text-[10px] text-gold-2">
                    <HeroPortrait
                      heroId={selected.equippedBy}
                      glyph={getHeroDef(selected.equippedBy).glyph}
                      element={getHeroDef(selected.equippedBy).element}
                      rarity={getHeroDef(selected.equippedBy).rarity}
                      size={22}
                    />
                    {t('inventory:equipped_by', { name: t(`heroes:${selected.equippedBy}.name`) })}
                  </div>
                )}
                <div className="mt-auto flex flex-col gap-1.5">
                  <Button
                    block
                    size="sm"
                    disabled={
                      (selected.enhance ?? 0) >= MAX_ENHANCE ||
                      gold < enhanceCost(selected.enhance ?? 0).gold ||
                      stones < enhanceCost(selected.enhance ?? 0).stones
                    }
                    onClick={() => enhanceItem(selected.uid) && haptic('success')}
                    icon="💎"
                  >
                    {(selected.enhance ?? 0) >= MAX_ENHANCE
                      ? t('inventory:max_enhance')
                      : `${t('inventory:enhance')} +${(selected.enhance ?? 0) + 1} · ${t('inventory:enhance_cost', { gold: formatNumber(enhanceCost(selected.enhance ?? 0).gold), stones: enhanceCost(selected.enhance ?? 0).stones })}`}
                  </Button>
                  <div className="text-center text-[9px] text-ink-dim">💎 {stones}</div>
                  {!equipPick ? (
                    <Button
                      block
                      size="sm"
                      variant="secondary"
                      onClick={() => setEquipPick(true)}
                      icon="🧍"
                    >
                      {t('inventory:equip_to')}
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {Object.values(heroes).map((h) => {
                        const d = getHeroDef(h.defId);
                        return (
                          <button
                            key={h.defId}
                            onClick={() => {
                              equipItem(h.defId, selected.uid);
                              haptic('success');
                              setEquipPick(false);
                            }}
                            className="btn-press"
                            title={t(`heroes:${h.defId}.name`)}
                          >
                            <HeroPortrait
                              heroId={h.defId}
                              glyph={d.glyph}
                              element={d.element}
                              rarity={d.rarity}
                              size={34}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    block
                    size="sm"
                    variant="danger"
                    disabled={!!selected.equippedBy}
                    onClick={() => sellItem(selected.uid) && setSelectedUid(null)}
                  >
                    {t('inventory:sell_price', {
                      gold: formatNumber(
                        Math.round(def.sellPrice * (1 + (selected.enhance ?? 0) * 0.3)),
                      ),
                    })}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-ink-dim">
                  {t(`inventory:material_desc.${def.material}`, { value: def.value ?? 0 })}
                </div>
                <div className="mt-auto flex flex-col gap-1.5">
                  {def.material === 'xpPotion' && (
                    <div className="flex flex-wrap gap-1">
                      <div className="w-full text-[10px] text-ink-dim">{t('inventory:use')}:</div>
                      {Object.values(heroes).map((h) => {
                        const d = getHeroDef(h.defId);
                        return (
                          <button
                            key={h.defId}
                            onClick={() => applyXpPotion(h.defId, def.id) && haptic('success')}
                            className="btn-press"
                            title={t(`heroes:${h.defId}.name`)}
                          >
                            <HeroPortrait
                              heroId={h.defId}
                              glyph={d.glyph}
                              element={d.element}
                              rarity={d.rarity}
                              size={34}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {def.material === 'energyPotion' && (
                    <Button
                      block
                      size="sm"
                      onClick={() => drinkEnergyPotion() && haptic('success')}
                      icon="⚡"
                    >
                      {t('inventory:use')}
                    </Button>
                  )}
                  <Button
                    block
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      sellItem(selected.uid, 1) &&
                      (selected.qty <= 1 ? setSelectedUid(null) : undefined)
                    }
                  >
                    {t('inventory:sell_price', { gold: def.sellPrice })}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <EmptyState text={t('inventory:all')} glyph="👈" />
        )}
      </div>
    </Screen>
  );
}
