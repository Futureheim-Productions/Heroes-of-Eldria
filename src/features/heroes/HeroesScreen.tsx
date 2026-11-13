import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { EquipSlot, OwnedHero, OwnedItem, Stats } from '@/types';
import { EQUIP_SLOTS } from '@/types/hero';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HeroArt, HeroPortrait } from '@/components/game/HeroPortrait';
import { ItemCard } from '@/components/game/ItemCard';
import { RarityBadge, StarRating, StatRow } from '@/components/ui/misc';
import { getHeroDef, HEROES } from '@/data/heroes';
import { heroArt, heroSkins } from '@/data/heroArt';
import { getItemDef } from '@/data/items';
import { useHeroStore } from '@/stores/heroStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import {
  applyXpPotion,
  equipItem,
  equippedItems,
  heroPower,
  heroStats,
  levelHeroWithGold,
  starUpCost,
  starUpHero,
  unequipItem,
  upgradeHeroSkill,
} from '@/services/game';
import { heroFullStats, powerRating, setBonusesFor } from '@/utils/stats';
import {
  ELEMENT_GLYPH,
  heroLevelCost,
  heroXpForLevel,
  MAX_HERO_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_STARS,
  RARITY_COLORS,
  RARITY_ORDER,
  skillUpgradeCost,
} from '@/utils/constants';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/services/haptics';
import { useStaggerIn } from '@/hooks/useScreenEnter';

type Tab = 'info' | 'lore' | 'equipment' | 'skills' | 'upgrade' | 'skins';
const TABS: Tab[] = ['info', 'lore', 'equipment', 'skills', 'upgrade', 'skins'];
const TAB_LABEL: Record<Tab, string> = {
  info: 'heroes:info',
  lore: 'heroes:lore_title',
  equipment: 'heroes:equipment',
  skills: 'heroes:skills_title',
  upgrade: 'heroes:upgrade_tab',
  skins: 'heroes:skins',
};

export default function HeroesScreen() {
  const { heroId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['heroes', 'common', 'items', 'inventory', 'formation']);
  const heroes = useHeroStore((s) => s.heroes);
  const shards = useHeroStore((s) => s.shards);
  const formation = useHeroStore((s) => s.formation);
  const items = useInventoryStore((s) => s.items);
  const gold = usePlayerStore((s) => s.profile.currencies.gold);
  const [tab, setTab] = useState<Tab>('info');
  const [slotPick, setSlotPick] = useState<EquipSlot | null>(null);
  const listRef = useStaggerIn();

  const sorted = useMemo(() => {
    const owned = Object.values(heroes).sort((a, b) => heroPower(b) - heroPower(a));
    const notOwned = HEROES.filter((h) => !heroes[h.id]).sort(
      (a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity),
    );
    return [...owned.map((o) => o.defId), ...notOwned.map((d) => d.id)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroes, items]);

  const selectedId = heroId && HEROES.some((h) => h.id === heroId) ? heroId : sorted[0];
  useEffect(() => {
    if (!heroId) navigate(`/heroes/${sorted[0]}`, { replace: true });
  }, [heroId, sorted, navigate]);

  const def = getHeroDef(selectedId);
  const owned: OwnedHero | undefined = heroes[selectedId];
  const stats: Stats = useMemo(
    () =>
      owned
        ? heroStats(owned)
        : heroFullStats(
            def,
            {
              defId: def.id,
              level: 1,
              xp: 0,
              stars: def.baseStars,
              skillLevels: {},
              equipment: {},
            },
            [],
          ),
    // `items` feeds heroStats through equipped items
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [owned, def, items],
  );
  const power = powerRating(stats);
  const art = heroArt(def.id, owned?.skin);
  const sets = setBonusesFor(owned ? equippedItems(owned) : []);
  const candidates: OwnedItem[] = slotPick
    ? items.filter((i) => getItemDef(i.defId).slot === slotPick && i.equippedBy !== selectedId)
    : [];

  const select = (id: string) => {
    haptic('light');
    navigate(`/heroes/${id}`, { replace: true });
  };

  return (
    <Screen
      title={t('heroes:title')}
      background="none"
      className="bg-castle"
      bodyClassName="flex gap-2.5 !overflow-hidden !p-2.5"
    >
      {/* Left: hero list */}
      <div className="gold-frame flex w-[118px] shrink-0 flex-col p-1.5">
        <div className="mb-1 text-center text-[8px] uppercase tracking-widest text-ink-dim">
          {t('heroes:owned_count', { n: Object.keys(heroes).length, max: HEROES.length })}
        </div>
        <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
          {sorted.map((id) => {
            const d = getHeroDef(id);
            const o = heroes[id];
            const active = id === selectedId;
            return (
              <button
                key={id}
                onClick={() => select(id)}
                className={`btn-press relative flex shrink-0 items-center gap-1.5 rounded-md border p-1 text-left ${
                  active ? 'border-gold bg-gold/20' : 'border-white/10 bg-black/40'
                } ${o ? '' : 'opacity-50 grayscale'}`}
                style={{ borderColor: active ? undefined : `${RARITY_COLORS[d.rarity]}66` }}
              >
                <HeroPortrait
                  heroId={id}
                  glyph={d.glyph}
                  element={d.element}
                  rarity={d.rarity}
                  size={40}
                  className="!rounded-md"
                />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[9px] font-bold text-gold-2">
                    {o ? `Lv ${o.level}` : t('common:locked')}
                  </div>
                  <StarRating stars={o?.stars ?? d.baseStars} size={7} />
                  <div className="text-[8px] text-ink-dim">
                    {o
                      ? `⚔ ${formatNumber(heroPower(o))}`
                      : `${shards[id] ?? 0} ${t('common:shards')}`}
                  </div>
                </div>
                {formation.includes(id) && (
                  <span className="absolute -right-1 -top-1 rounded bg-gold px-[3px] text-[7px] font-bold text-black">
                    ⚔
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: hero showcase */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div>
            <div className="gold-gradient-text font-display text-[22px] font-black uppercase leading-none tracking-wider">
              {t(`heroes:${def.id}.name`)}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <StarRating stars={owned?.stars ?? def.baseStars} size={13} />
              <span className="text-[10px] text-ink-dim">
                {t('heroes:level_of', { level: owned?.level ?? 1, max: MAX_HERO_LEVEL })}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
              <span className="text-[12px]">{ELEMENT_GLYPH[def.element]}</span>
              <span className="font-semibold text-ink">{t(`heroes:${def.id}.class`)}</span>
              <span className="text-ink-dim">· {t(`common:role.${def.role}`)}</span>
              <RarityBadge rarity={def.rarity} />
            </div>
          </div>
        </div>

        <div className="relative mt-1 flex min-h-0 flex-1 gap-2">
          {/* Tab content */}
          <div className="gold-frame relative z-10 min-h-0 flex-1 overflow-y-auto p-2">
            {tab === 'info' && (
              <InfoTab
                def={def}
                stats={stats}
                sets={sets}
                t={t}
                owned={!!owned}
                shards={shards[def.id] ?? 0}
              />
            )}
            {tab === 'equipment' && (
              <EquipmentTab
                owned={owned}
                items={items}
                t={t}
                onPick={setSlotPick}
                onUnequip={(slot) => unequipItem(def.id, slot)}
              />
            )}
            {tab === 'skills' && <SkillsTab def={def} owned={owned} items={items} t={t} />}
            {tab === 'upgrade' && (
              <UpgradeTab
                def={def}
                owned={owned}
                items={items}
                gold={gold}
                shards={shards[def.id] ?? 0}
                t={t}
              />
            )}
            {tab === 'lore' && <LoreTab def={def} t={t} />}
            {tab === 'skins' && <SkinsTab def={def} owned={owned} t={t} />}
          </div>

          {/* Art */}
          <div className="relative flex w-[210px] shrink-0 items-end justify-center">
            {art ? (
              <HeroArt
                src={art}
                height={300}
                className={`max-h-full ${owned ? '' : 'grayscale brightness-50'}`}
              />
            ) : (
              <HeroPortrait
                heroId={def.id}
                glyph={def.glyph}
                element={def.element}
                rarity={def.rarity}
                size={150}
                dead={!owned}
                className="mb-8"
              />
            )}
            <div className="pointer-events-none absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-col items-center rounded-full border border-gold/40 bg-black/70 px-4 py-1 leading-none backdrop-blur-sm">
              <span className="text-[8px] uppercase tracking-[0.25em] text-ink-dim">
                {t('heroes:power_label')}
              </span>
              <span className="gold-gradient-text font-display text-[20px] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                ⚔ {formatNumber(power)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: vertical tabs */}
      <div className="flex w-[112px] shrink-0 flex-col gap-1">
        <div className="mb-0.5 flex justify-end gap-1">
          <button
            onClick={() => navigate('/formation')}
            title={t('formation:title')}
            className="btn-press flex h-7 w-7 items-center justify-center rounded-md border border-gold/60 bg-black/50 text-[13px]"
          >
            ⚔️
          </button>
          <button
            onClick={() => setTab('upgrade')}
            className="btn-press flex h-7 w-7 items-center justify-center rounded-md border border-gold/60 bg-black/50 text-[13px] text-gold-2"
          >
            ＋
          </button>
        </div>
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => {
              haptic('light');
              setTab(tb);
            }}
            disabled={!owned && tb !== 'info' && tb !== 'skills' && tb !== 'lore'}
            className={`vtab btn-press ${tab === tb ? 'active' : ''}`}
          >
            {t(TAB_LABEL[tb])}
          </button>
        ))}
      </div>

      <Modal
        open={!!slotPick}
        onClose={() => setSlotPick(null)}
        title={t('heroes:choose_item')}
        width={560}
      >
        {candidates.length === 0 ? (
          <div className="text-center text-[11px] text-ink-dim">{t('inventory:empty')}</div>
        ) : (
          <div className="grid-auto-cards">
            {candidates.map((it) => {
              const d = getItemDef(it.defId);
              return (
                <div key={it.uid} className="flex flex-col gap-1">
                  <ItemCard
                    item={it}
                    onClick={() => {
                      equipItem(def.id, it.uid);
                      haptic('success');
                      setSlotPick(null);
                    }}
                  />
                  <div className="text-center text-[8px] text-ink-dim">
                    {Object.entries(d.baseStats ?? {})
                      .map(
                        ([k, v]) =>
                          `${t(`common:stat.${k}`)} +${Math.round(v * (1 + (it.enhance ?? 0) * 0.08))}`,
                      )
                      .join(' ')}
                  </div>
                  {it.equippedBy && (
                    <div className="text-center text-[8px] text-gold-2">
                      {t('inventory:equipped_by', { name: t(`heroes:${it.equippedBy}.name`) })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </Screen>
  );
}

type T = (key: string, opts?: Record<string, unknown>) => string;

/** Default art + every `<id>_alt_<n>.png` skin; tapping one swaps the art everywhere the hero is shown. */
function SkinsTab({
  def,
  owned,
  t,
}: {
  def: ReturnType<typeof getHeroDef>;
  owned?: OwnedHero;
  t: T;
}) {
  const setSkin = useHeroStore((s) => s.setSkin);
  const skins = [heroArt(def.id), ...heroSkins(def.id)];
  const current = owned?.skin ?? 0;
  if (skins.length < 2 || !skins[0])
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-dim">
        <span className="text-3xl">🎭</span>
        <span className="text-[11px]">{t('heroes:skins_none')}</span>
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      <div className="panel-title">{t('heroes:skins')}</div>
      <div className="flex flex-wrap gap-2">
        {skins.map((src, i) => {
          const active = i === current;
          return (
            <button
              key={i}
              disabled={!owned}
              onClick={() => {
                haptic('light');
                setSkin(def.id, i);
              }}
              className={`btn-press relative flex h-[118px] w-[78px] flex-col items-center justify-end overflow-hidden rounded-md border-2 bg-black/50 ${
                active ? 'border-gold-2 shadow-[0_0_12px_rgba(242,208,107,0.6)]' : 'border-gold/40'
              } ${owned ? '' : 'opacity-50'}`}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none h-[100px] w-auto select-none object-contain"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/75 py-[2px] text-center text-[8px] font-bold uppercase tracking-wider text-gold-2">
                {i === 0 ? t('heroes:skin_default') : t('heroes:skin_n', { n: i })}
              </span>
              {active && (
                <span className="absolute right-1 top-1 rounded-full bg-gold-2 px-1 text-[8px] font-black text-[#1a1205]">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoreTab({ def, t }: { def: ReturnType<typeof getHeroDef>; t: T }) {
  const paras = t(`heroes:${def.id}.lore`, { returnObjects: true, defaultValue: [] }) as unknown;
  const list = Array.isArray(paras) ? (paras as string[]) : [];
  return (
    <div className="flex flex-col gap-2">
      <div className="panel-title">{t('heroes:lore_heading')}</div>
      <div className="text-[10px] italic text-ink-dim">{t(`heroes:${def.id}.desc`)}</div>
      {list.map((p, i) => (
        <p key={i} className="text-[11px] leading-relaxed text-ink">
          {i === 0 && (
            <span className="gold-gradient-text float-left mr-1 font-display text-[26px] font-black leading-[0.8]">
              {p.charAt(0)}
            </span>
          )}
          {i === 0 ? p.slice(1) : p}
        </p>
      ))}
    </div>
  );
}

function InfoTab({
  def,
  stats,
  sets,
  t,
  owned,
  shards,
}: {
  def: ReturnType<typeof getHeroDef>;
  stats: Stats;
  sets: ReturnType<typeof setBonusesFor>;
  t: T;
  owned: boolean;
  shards: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      {(['hp', 'atk', 'def', 'spd', 'crit', 'critDmg'] as (keyof Stats)[]).map((k) => (
        <StatRow
          key={k}
          label={t(`common:stat.${k}`)}
          value={k === 'crit' || k === 'critDmg' ? `${stats[k]}%` : formatNumber(stats[k])}
        />
      ))}
      {sets.length > 0 && (
        <div className="mt-1">
          <div className="panel-title mb-0.5">{t('heroes:set_bonus')}</div>
          {sets.map((s) => (
            <div key={s.setId} className={`text-[10px] ${s.active ? 'text-hp' : 'text-ink-dim'}`}>
              {t(`items:sets.${s.setId}`)} ({s.pieces}) {s.active ? '✓' : ''}
            </div>
          ))}
        </div>
      )}
      <p className="mt-1 text-[10px] italic leading-snug text-ink-dim">
        {t(`heroes:${def.id}.desc`)}
      </p>
      {!owned && (
        <div className="mt-1 text-[10px] text-gold-2">
          {t('heroes:not_owned')} · {t('heroes:shards_owned', { n: shards })}
        </div>
      )}
    </div>
  );
}

function EquipmentTab({
  owned,
  items,
  t,
  onPick,
  onUnequip,
}: {
  owned?: OwnedHero;
  items: OwnedItem[];
  t: T;
  onPick: (slot: EquipSlot) => void;
  onUnequip: (slot: EquipSlot) => void;
}) {
  if (!owned) return null;
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {EQUIP_SLOTS.map((slot) => {
        const uid = owned.equipment[slot];
        const item = uid ? items.find((i) => i.uid === uid) : undefined;
        return (
          <div key={slot} className="flex flex-col items-center gap-1">
            <div className="text-[8px] uppercase tracking-wider text-ink-dim">
              {t(`common:slot.${slot}`)}
            </div>
            {item ? (
              <ItemCard item={item} onClick={() => onPick(slot)} size={44} />
            ) : (
              <button
                onClick={() => onPick(slot)}
                className="btn-press flex h-[74px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-gold/30 text-[9px] text-ink-dim"
              >
                <span className="text-lg">+</span>
                {t('heroes:empty_slot')}
              </button>
            )}
            {item && (
              <button onClick={() => onUnequip(slot)} className="text-[8px] text-blood-2 underline">
                {t('heroes:unequip')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SkillsTab({
  def,
  owned,
  items,
  t,
}: {
  def: ReturnType<typeof getHeroDef>;
  owned?: OwnedHero;
  items: OwnedItem[];
  t: T;
}) {
  const gold = usePlayerStore((s) => s.profile.currencies.gold);
  const books = items.filter((i) => i.defId === 'skill_book').reduce((a, i) => a + i.qty, 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="panel-title">{t('heroes:skills_title')}</div>
        {owned && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold">
            <span className="rounded-full border border-white/10 bg-black/50 px-1.5 py-[1px] text-gold-2">
              💰 {formatNumber(gold)}
            </span>
            <span className="rounded-full border border-white/10 bg-black/50 px-1.5 py-[1px] text-ink">
              📘 {books}
            </span>
          </div>
        )}
      </div>
      {def.skills.map((s) => {
        const lv = owned?.skillLevels[s.id] ?? 1;
        const maxed = lv >= MAX_SKILL_LEVEL;
        const cost = skillUpgradeCost(lv);
        const lackGold = gold < cost.gold;
        const lackBooks = books < cost.books;
        const ult = s.kind === 'ultimate';
        return (
          <div
            key={s.id}
            className={`relative overflow-hidden rounded-lg border p-2 ${
              ult
                ? 'border-purple-2/60 bg-gradient-to-br from-purple/25 to-black/40 shadow-[inset_0_0_14px_rgba(124,77,255,0.18)]'
                : 'border-gold/20 bg-black/35'
            }`}
          >
            {/* Header: icon, name, kind, level pips */}
            <div className="flex items-center gap-2">
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-black/60 text-[22px] ${
                  ult ? 'border-purple-2/70' : 'border-gold/40'
                }`}
              >
                {s.glyph}
                <span className="absolute -bottom-1 -right-1 rounded bg-gold px-[3px] text-[8px] font-black leading-[12px] text-[#1a1205]">
                  {lv}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-display text-[12px] font-bold text-ink">
                    {t(`heroes:skills.${s.id}.name`)}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1 py-[1px] text-[7px] font-bold uppercase tracking-wider ${
                      ult ? 'bg-purple-2/30 text-purple-2' : 'bg-white/10 text-ink-dim'
                    }`}
                  >
                    {t(`heroes:skill_kind.${s.kind}`)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-[3px]">
                  {Array.from({ length: MAX_SKILL_LEVEL }, (_, i) => (
                    <span
                      key={i}
                      className={`h-[5px] w-3 rounded-sm ${
                        i < lv ? 'bg-gold-2 shadow-[0_0_4px_rgba(242,208,107,0.6)]' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="mt-1.5 text-[10px] leading-snug text-ink-dim">
              {t(`heroes:skills.${s.id}.desc`)}
            </p>

            {/* Footer: tags + upgrade */}
            <div className="mt-1.5 flex items-center gap-1">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[8px]">
                <span className="rounded bg-black/50 px-1 py-[1px] text-ink">
                  {ELEMENT_GLYPH[s.element]} {t(`common:element.${s.element}`)}
                </span>
                {s.cooldown > 0 && (
                  <span className="rounded bg-black/50 px-1 py-[1px] text-ink">
                    ⏳ {t('heroes:cooldown', { n: s.cooldown })}
                  </span>
                )}
                {lv > 1 && (
                  <span className="rounded bg-hp/15 px-1 py-[1px] font-bold text-hp">
                    +{(lv - 1) * 10}%
                  </span>
                )}
              </div>
              {owned && (
                <Button
                  size="sm"
                  variant={lackGold || lackBooks ? 'secondary' : 'primary'}
                  disabled={maxed}
                  className="shrink-0 !px-2 !py-1 !text-[10px] normal-case"
                  onClick={() => upgradeHeroSkill(def.id, s.id) && haptic('success')}
                >
                  {maxed ? (
                    t('common:max')
                  ) : (
                    <>
                      <span className={lackGold ? 'text-blood-2' : ''}>💰 {formatNumber(cost.gold)}</span>
                      <span className={lackBooks ? 'text-blood-2' : ''}>📘 {cost.books}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UpgradeTab({
  def,
  owned,
  items,
  gold,
  shards,
  t,
}: {
  def: ReturnType<typeof getHeroDef>;
  owned?: OwnedHero;
  items: OwnedItem[];
  gold: number;
  shards: number;
  t: T;
}) {
  if (!owned) return null;
  const xpPotions = items.filter((i) => getItemDef(i.defId).material === 'xpPotion');
  const crystals = items.filter((i) => i.defId === 'awaken_crystal').reduce((a, i) => a + i.qty, 0);
  const cost = starUpCost(owned);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="panel-title">{t('heroes:level_up')}</div>
        <div className="flex justify-between text-[9px] text-ink-dim">
          <span>{t('common:lv', { level: owned.level })}</span>
          <span>
            {owned.level >= MAX_HERO_LEVEL
              ? t('common:max')
              : `${formatNumber(owned.xp)}/${formatNumber(heroXpForLevel(owned.level))}`}
          </span>
        </div>
        <ProgressBar
          value={owned.level >= MAX_HERO_LEVEL ? 1 : owned.xp}
          max={owned.level >= MAX_HERO_LEVEL ? 1 : heroXpForLevel(owned.level)}
          color="#7c4dff"
          height={6}
        />
        <Button
          block
          size="sm"
          disabled={owned.level >= MAX_HERO_LEVEL || gold < heroLevelCost(owned.level)}
          onClick={() => levelHeroWithGold(def.id) && haptic('success')}
          icon="💰"
        >
          {owned.level >= MAX_HERO_LEVEL
            ? t('common:max')
            : t('heroes:level_up_cost', { gold: formatNumber(heroLevelCost(owned.level)) })}
        </Button>
        <div className="flex flex-wrap gap-1">
          {xpPotions.map((p) => (
            <Button
              key={p.uid}
              size="sm"
              variant="secondary"
              disabled={owned.level >= MAX_HERO_LEVEL}
              onClick={() => applyXpPotion(def.id, p.defId)}
            >
              {getItemDef(p.defId).glyph} +{getItemDef(p.defId).value} ×{p.qty}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="panel-title">{t('heroes:star_up')}</div>
        <StarRating stars={owned.stars} size={14} />
        <div className="text-[9px] text-ink-dim">
          {t('heroes:shards_owned', { n: shards })}
          {owned.stars < MAX_STARS &&
            ` · ${t('heroes:star_up_cost', { shards: cost.shards, gold: formatNumber(cost.gold) })}`}
          {owned.stars < MAX_STARS &&
            cost.crystals > 0 &&
            ` ${t('heroes:star_up_crystals', { n: cost.crystals })} (${crystals})`}
        </div>
        <Button
          block
          size="sm"
          variant="secondary"
          disabled={owned.stars >= MAX_STARS}
          onClick={() => starUpHero(def.id) && haptic('success')}
          icon="⭐"
        >
          {owned.stars >= MAX_STARS ? t('common:max') : `${owned.stars}★ → ${owned.stars + 1}★`}
        </Button>
      </div>
    </div>
  );
}
