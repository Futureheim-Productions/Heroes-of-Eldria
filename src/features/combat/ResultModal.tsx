import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import type { BattleConfig } from '@/types';
import type { CombatRewardSummary } from '@/stores/combatStore';
import { useCombatStore } from '@/stores/combatStore';
import { Button } from '@/components/ui/Button';
import { getItemDef } from '@/data/items';
import { getStage } from '@/data/dungeons';
import { startDungeon } from '@/services/game';
import { useUiStore } from '@/stores/uiStore';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/services/haptics';

export function ResultModal({
  summary,
  result,
  config,
}: {
  summary: CombatRewardSummary;
  result: 'ongoing' | 'victory' | 'defeat';
  config: BattleConfig;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation(['combat', 'items', 'common']);
  const won = result === 'victory';
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const clear = useCombatStore((s) => s.clear);
  const toast = useUiStore((s) => s.toast);

  useEffect(() => {
    haptic(won ? 'success' : 'error');
    if (!boxRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(
      boxRef.current,
      { opacity: 0, scale: 0.6, rotate: won ? -4 : 0 },
      { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(1.7)' },
    );
    if (listRef.current)
      tl.fromTo(
        Array.from(listRef.current.children),
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, stagger: 0.07, duration: 0.3 },
        '-=0.2',
      );
    return () => {
      tl.kill();
    };
  }, [won]);

  const leave = (to: string) => {
    clear();
    navigate(to, { replace: true });
  };

  const retry = () => {
    if (config.mode !== 'dungeon' || !config.stageId) return leave('/arena');
    const stage = getStage(config.stageId);
    const r = startDungeon(stage.id, config.difficulty ?? 'normal');
    if (!r.ok) {
      toast(r.reason ?? '', 'error');
      leave(`/world/${stage.regionId}?stage=${stage.id}`);
    }
  };

  const backTarget =
    config.mode === 'dungeon' && config.stageId
      ? `/world/${getStage(config.stageId).regionId}?stage=${config.stageId}`
      : '/arena';

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/75 backdrop-blur-[3px] p-3">
      <div
        ref={boxRef}
        className="panel w-full max-w-[520px] overflow-hidden"
        style={{ borderColor: won ? 'rgba(212,175,55,0.6)' : 'rgba(192,57,43,0.6)' }}
      >
        <div
          className={`px-5 py-3 text-center ${won ? 'bg-gradient-to-b from-gold/25 to-transparent' : 'bg-gradient-to-b from-blood/30 to-transparent'}`}
        >
          <div
            className={`font-display text-[30px] font-black tracking-widest ${won ? 'gold-gradient-text' : 'text-blood-2'}`}
          >
            {won ? t('combat:victory') : t('combat:defeat')}
          </div>
          {won && (
            <div className="text-[22px] text-gold-2">
              {'★'.repeat(summary.stars)}
              <span className="text-white/20">{'★'.repeat(3 - summary.stars)}</span>
            </div>
          )}
          {summary.firstClear && (
            <div className="text-[11px] font-semibold text-gold-2">
              {t('combat:first_clear_bonus')}
            </div>
          )}
          {!won && <div className="mt-1 text-[11px] text-ink-dim">{t('combat:defeat_hint')}</div>}
        </div>

        <div className="px-5 pb-3">
          <div className="panel-title mb-1">{t('combat:rewards')}</div>
          <div ref={listRef} className="flex flex-wrap gap-1.5">
            {summary.gold > 0 && <RewardPill glyph="💰" text={`+${formatNumber(summary.gold)}`} />}
            {summary.xp > 0 && <RewardPill glyph="✨" text={`+${formatNumber(summary.xp)} XP`} />}
            {summary.heroXp > 0 && (
              <RewardPill
                glyph="🛡️"
                text={`+${formatNumber(summary.heroXp)} ${t('combat:hero_xp')}`}
              />
            )}
            {summary.gems > 0 && <RewardPill glyph="💎" text={`+${summary.gems}`} />}
            {summary.keys > 0 && <RewardPill glyph="🔑" text={`+${summary.keys}`} />}
            {summary.arenaCoins > 0 && <RewardPill glyph="🏅" text={`+${summary.arenaCoins}`} />}
            {summary.rankDelta !== undefined && (
              <RewardPill
                glyph="📈"
                text={t('combat:rank_change', {
                  delta: (summary.rankDelta > 0 ? '+' : '') + summary.rankDelta,
                })}
              />
            )}
            {summary.items.map((it, i) => {
              const def = getItemDef(it.itemId);
              return (
                <RewardPill
                  key={i}
                  glyph={def.glyph}
                  text={`${t(`items:${it.itemId}.name`)} x${it.qty}`}
                />
              );
            })}
            {summary.playerLeveled && (
              <RewardPill glyph="🎉" text={t('common:player_level_up', { level: '' }).trim()} />
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/10 bg-black/30 px-5 py-3">
          <Button variant="secondary" onClick={() => leave(backTarget)}>
            {t('common:back')}
          </Button>
          {config.mode === 'dungeon' && (
            <Button variant="ghost" onClick={retry}>
              {t('combat:retry')}
            </Button>
          )}
          <Button
            className="ml-auto"
            onClick={() => leave(won && config.mode === 'dungeon' ? backTarget : '/')}
          >
            {t('combat:continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RewardPill({ glyph, text }: { glyph: string; text: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-black/50 px-2 py-[3px] text-[11px] font-semibold">
      <span>{glyph}</span>
      <span>{text}</span>
    </span>
  );
}
