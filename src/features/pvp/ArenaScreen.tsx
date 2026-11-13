import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/misc';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { OfferCard } from '@/features/shop/OfferCard';
import { ARENA_SHOP } from '@/data/shop';
import { getHeroDef } from '@/data/heroes';
import { useArenaStore } from '@/stores/metaStores';
import { usePlayerStore } from '@/stores/playerStore';
import { useUiStore } from '@/stores/uiStore';
import { arenaOpponents, startArena, teamPower } from '@/services/game';
import { ARENA_MAX_DAILY } from '@/utils/constants';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/services/haptics';
import { useStaggerIn } from '@/hooks/useScreenEnter';

export default function ArenaScreen() {
  const { t } = useTranslation(['pvp', 'common', 'heroes']);
  const navigate = useNavigate();
  const arena = useArenaStore();
  const coins = usePlayerStore((s) => s.profile.currencies.arenaCoins);
  const toast = useUiStore((s) => s.toast);
  const [tab, setTab] = useState<'fight' | 'shop' | 'history'>('fight');
  const opponents = useMemo(() => arenaOpponents(), [arena.seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const power = teamPower();
  const ref = useStaggerIn([tab, arena.seed]);

  const fight = (id: string) => {
    const opp = opponents.find((o) => o.id === id)!;
    const r = startArena(opp);
    if (!r.ok) return toast(r.reason ?? '', 'error');
    haptic('heavy');
    navigate('/combat');
  };

  return (
    <Screen title={t('pvp:title')}>
      <div className="mb-2 flex items-center gap-2">
        <div className="panel flex items-center gap-3 px-3 py-1.5 text-[11px]">
          <span className="font-bold text-gold-2">
            {t('pvp:rank', { n: formatNumber(arena.rank) })}
          </span>
          <span className="text-ink-dim">{t('pvp:points', { n: arena.points })}</span>
          <span className="text-ink-dim">🏅 {coins}</span>
        </div>
        <span
          className={`text-[10px] ${arena.dailyBattles >= ARENA_MAX_DAILY ? 'text-blood-2' : 'text-ink-dim'}`}
        >
          {t('pvp:attempts', { n: ARENA_MAX_DAILY - arena.dailyBattles, max: ARENA_MAX_DAILY })}
        </span>
        <div className="ml-auto flex gap-1.5">
          <Chip active={tab === 'fight'} onClick={() => setTab('fight')}>
            {t('pvp:opponents')}
          </Chip>
          <Chip active={tab === 'shop'} onClick={() => setTab('shop')}>
            {t('pvp:arena_shop')}
          </Chip>
          <Chip active={tab === 'history'} onClick={() => setTab('history')}>
            {t('pvp:history')}
          </Chip>
        </div>
      </div>

      {tab === 'fight' && (
        <>
          <div ref={ref} className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {opponents.map((o) => (
              <div key={o.id} className="panel flex flex-col gap-2 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-bold">{o.name}</div>
                    <div className="text-[9px] text-ink-dim">
                      {t('pvp:rank', { n: formatNumber(o.rank) })}
                    </div>
                  </div>
                  <div
                    className={`text-[11px] font-bold ${o.power > power ? 'text-blood-2' : 'text-hp'}`}
                  >
                    {t('pvp:power', { n: formatNumber(o.power) })}
                  </div>
                </div>
                <div className="flex gap-1">
                  {o.heroIds.map((h) => {
                    const d = getHeroDef(h);
                    return (
                      <HeroPortrait
                        key={h}
                        heroId={h}
                        glyph={d.glyph}
                        element={d.element}
                        rarity={d.rarity}
                        size={36}
                      />
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  block
                  onClick={() => fight(o.id)}
                  disabled={arena.dailyBattles >= ARENA_MAX_DAILY}
                  icon="⚔️"
                >
                  {t('pvp:fight')}
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => arena.refreshOpponents()}>
              🔄 {t('pvp:refresh')}
            </Button>
          </div>
        </>
      )}

      {tab === 'shop' && (
        <div ref={ref} className="grid grid-cols-3 gap-2.5 xl:grid-cols-4">
          {ARENA_SHOP.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div ref={ref} className="flex flex-col gap-1">
          {arena.history.length === 0 && <div className="text-[11px] text-ink-dim">—</div>}
          {arena.history.map((h, i) => (
            <div
              key={i}
              className="panel flex items-center justify-between px-3 py-1.5 text-[11px]"
            >
              <span>{h.opponent}</span>
              <span className={h.won ? 'text-hp' : 'text-blood-2'}>
                {h.won ? t('pvp:won') : t('pvp:lost')} ({h.delta > 0 ? '+' : ''}
                {h.delta})
              </span>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
