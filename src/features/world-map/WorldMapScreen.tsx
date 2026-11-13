import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { REGIONS } from '@/data/dungeons';
import { useProgressStore } from '@/stores/progressStore';
import { useStaggerIn } from '@/hooks/useScreenEnter';
import { haptic } from '@/services/haptics';

export default function WorldMapScreen() {
  const { t } = useTranslation(['world-map', 'common']);
  const navigate = useNavigate();
  const isRegionUnlocked = useProgressStore((s) => s.isRegionUnlocked);
  const regionStars = useProgressStore((s) => s.regionStars);
  const stages = useProgressStore((s) => s.stages);
  const ref = useStaggerIn([stages]);

  return (
    <Screen title={t('world-map:title')} bodyClassName="flex items-center">
      <div ref={ref} className="flex w-full gap-3 overflow-x-auto pb-2 no-scrollbar">
        {REGIONS.map((r) => {
          const unlocked = isRegionUnlocked(r.id);
          const { stars, max } = regionStars(r.id);
          const cleared = r.stages.filter((s) => stages[s.id]?.normalClears).length;
          return (
            <button
              key={r.id}
              disabled={!unlocked}
              onClick={() => {
                haptic('medium');
                navigate(`/world/${r.id}`);
              }}
              className={`btn-press panel relative flex h-[min(62vh,300px)] w-[190px] shrink-0 flex-col justify-end overflow-hidden p-3 text-left ${
                unlocked ? 'hover:border-gold/60' : 'opacity-60 grayscale'
              }`}
              style={{
                background: `radial-gradient(ellipse at 50% 25%, ${r.color}66, transparent 60%), linear-gradient(180deg, #17122a 0%, #0f0c1a 100%)`,
              }}
            >
              <div className="absolute left-1/2 top-[22%] -translate-x-1/2 -translate-y-1/2 text-[64px] drop-shadow-[0_6px_10px_rgba(0,0,0,0.8)]">
                {unlocked ? r.glyph : '🔒'}
              </div>
              <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-[2px] text-[10px] font-bold text-gold-2">
                {r.index + 1}
              </div>
              <div className="font-display text-[15px] font-bold text-gold">
                {t(`world-map:regions.${r.id}.name`)}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[10px] text-ink-dim">
                {unlocked ? t(`world-map:regions.${r.id}.desc`) : t('world-map:locked_hint')}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-ink-dim">
                  {cleared}/{r.stages.length}
                </span>
                <span className="text-gold-2">
                  ★ {stars}/{max}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold-2"
                  style={{ width: `${(cleared / r.stages.length) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
