import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import type { OfferCategory } from '@/types';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Chip, RarityBadge } from '@/components/ui/misc';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { OfferCard } from './OfferCard';
import { SHOP_OFFERS, SUMMON_RATES } from '@/data/shop';
import { getHeroDef } from '@/data/heroes';
import { useShopStore } from '@/stores/metaStores';
import { usePlayerStore } from '@/stores/playerStore';
import { useUiStore } from '@/stores/uiStore';
import { summon } from '@/services/game';
import {
  PITY_THRESHOLD,
  RARITY_COLORS,
  SUMMON_COST_SINGLE,
  SUMMON_COST_TEN,
} from '@/utils/constants';
import { haptic } from '@/services/haptics';
import { useStaggerIn } from '@/hooks/useScreenEnter';

const TABS: OfferCategory[] = ['featured', 'summon', 'daily', 'currency'];

export default function ShopScreen() {
  const { t } = useTranslation(['shop', 'common', 'heroes']);
  const [params] = useSearchParams();
  const initial = (params.get('tab') as OfferCategory) || 'featured';
  const [tab, setTab] = useState<OfferCategory>(TABS.includes(initial) ? initial : 'featured');
  const gems = usePlayerStore((s) => s.profile.currencies.gems);
  const pity = useShopStore((s) => s.pity);
  const toast = useUiStore((s) => s.toast);
  const [results, setResults] = useState<{ heroId: string; isNew: boolean }[] | null>(null);
  const ref = useStaggerIn([tab]);

  const doSummon = (n: 1 | 10) => {
    const r = summon(n);
    if (!r.ok) {
      toast(r.reason ?? '', 'error');
      return;
    }
    haptic('heavy');
    setResults(r.results!);
  };

  return (
    <Screen title={t('shop:title')}>
      <div className="mb-2 flex gap-1.5">
        {TABS.map((c) => (
          <Chip key={c} active={tab === c} onClick={() => setTab(c)}>
            {t(`shop:${c}`)}
          </Chip>
        ))}
      </div>

      {tab === 'summon' ? (
        <div className="flex h-full gap-3">
          <div
            className="panel relative flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden p-4"
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(124,77,255,0.35), transparent 60%), rgba(20,15,35,0.8)',
            }}
          >
            <div className="text-[56px] drop-shadow-[0_0_20px_rgba(179,136,255,0.8)]">🔮</div>
            <div className="gold-gradient-text font-display text-lg font-black tracking-widest">
              {t('shop:summon')}
            </div>
            <div className="text-[10px] text-ink-dim">
              {t('shop:pity', { n: PITY_THRESHOLD - pity })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => doSummon(1)}
                disabled={gems < SUMMON_COST_SINGLE}
              >
                {t('shop:summon_1')} · 💎 {SUMMON_COST_SINGLE}
              </Button>
              <Button onClick={() => doSummon(10)} disabled={gems < SUMMON_COST_TEN}>
                {t('shop:summon_10')} · 💎 {SUMMON_COST_TEN}
              </Button>
            </div>
          </div>
          <div className="panel w-[200px] shrink-0 p-3">
            <div className="panel-title mb-2">{t('shop:rates')}</div>
            {SUMMON_RATES.map((r) => (
              <div key={r.rarity} className="flex items-center justify-between py-1 text-[11px]">
                <span style={{ color: RARITY_COLORS[r.rarity] }}>
                  {t(`common:rarity.${r.rarity}`)}
                </span>
                <span className="tabular-nums">{r.weight}%</span>
              </div>
            ))}
            <div className="mt-2 text-[9px] text-ink-dim">
              10x: min. 1 {t('common:rarity.epic')}+
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={ref} className="grid grid-cols-3 gap-2.5 xl:grid-cols-4">
            {SHOP_OFFERS.filter((o) => o.category === tab).map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
          {tab === 'currency' && (
            <div className="mt-3 text-center text-[10px] text-ink-dim">{t('shop:iap_note')}</div>
          )}
        </>
      )}

      <Modal
        open={!!results}
        onClose={() => setResults(null)}
        title={t('shop:summon_result')}
        width={640}
      >
        {results && <SummonResults results={results} />}
        <div className="mt-3 flex justify-end">
          <Button onClick={() => setResults(null)}>{t('common:ok')}</Button>
        </div>
      </Modal>
    </Screen>
  );
}

function SummonResults({ results }: { results: { heroId: string; isNew: boolean }[] }) {
  const { t } = useTranslation(['shop', 'heroes']);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const cards = Array.from(ref.current.children);
    const tl = gsap.timeline();
    tl.fromTo(
      cards,
      { opacity: 0, rotateY: 180, scale: 0.5 },
      { opacity: 1, rotateY: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(1.5)' },
    );
    return () => {
      tl.kill();
    };
  }, [results]);
  return (
    <div ref={ref} className="grid grid-cols-5 gap-2" style={{ perspective: 800 }}>
      {results.map((r, i) => {
        const def = getHeroDef(r.heroId);
        return (
          <div
            key={i}
            className={`relative flex flex-col items-center gap-1 rounded-lg border bg-black/40 p-2 ${def.rarity === 'legendary' ? 'rarity-glow-legendary' : def.rarity === 'epic' ? 'rarity-glow-epic' : ''}`}
            style={{ borderColor: RARITY_COLORS[def.rarity] }}
          >
            {r.isNew && (
              <span className="absolute -top-2 rounded bg-gold px-1 text-[8px] font-bold text-black">
                {t('shop:new_hero')}
              </span>
            )}
            <HeroPortrait
              heroId={def.id}
              glyph={def.glyph}
              element={def.element}
              rarity={def.rarity}
              size={54}
            />
            <div className="w-full truncate text-center text-[10px] font-semibold">
              {t(`heroes:${def.id}.name`)}
            </div>
            <RarityBadge rarity={def.rarity} />
            {!r.isNew && <div className="text-[8px] text-ink-dim">{t('shop:shards_gained')}</div>}
          </div>
        );
      })}
    </div>
  );
}
