import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { HeroCard } from '@/components/game/HeroCard';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useHeroStore } from '@/stores/heroStore';
import { getHeroDef } from '@/data/heroes';
import { heroPower, teamPower } from '@/services/game';
import { MAX_FORMATION } from '@/utils/constants';
import { formatNumber } from '@/utils/format';
import { haptic } from '@/services/haptics';

export default function FormationScreen() {
  const { t } = useTranslation(['formation', 'common', 'heroes']);
  const heroes = useHeroStore((s) => s.heroes);
  const formation = useHeroStore((s) => s.formation);
  const setSlot = useHeroStore((s) => s.setFormationSlot);
  const [pick, setPick] = useState<number | null>(null);
  const slots = Array.from({ length: MAX_FORMATION }, (_, i) => formation[i] ?? null);
  const power = teamPower();
  const available = Object.values(heroes).sort((a, b) => heroPower(b) - heroPower(a));

  return (
    <Screen title={t('formation:title')} bodyClassName="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-dim">{t('formation:hint')}</span>
        <span className="rounded-full border border-gold/30 bg-black/40 px-3 py-1 text-[12px] font-bold text-gold-2">
          {t('formation:power', { n: formatNumber(power) })}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center gap-3">
        {slots.map((id, i) => {
          const def = id ? getHeroDef(id) : null;
          const owned = id ? heroes[id] : null;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <button
                onClick={() => {
                  haptic('light');
                  setPick(i);
                }}
                className={`btn-press panel flex h-[150px] w-[112px] flex-col items-center justify-center gap-1 ${def ? 'border-gold/50' : 'border-dashed border-white/20'}`}
              >
                {def && owned ? (
                  <>
                    <HeroPortrait
                      heroId={def.id}
                      glyph={def.glyph}
                      element={def.element}
                      rarity={def.rarity}
                      size={64}
                    />
                    <div className="text-[11px] font-semibold">{t(`heroes:${def.id}.name`)}</div>
                    <div className="text-[9px] text-ink-dim">
                      Lv {owned.level} · ⚔ {heroPower(owned)}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-3xl text-white/30">+</span>
                    <span className="text-[10px] text-ink-dim">
                      {t('formation:slot', { n: i + 1 })}
                    </span>
                  </>
                )}
              </button>
              {def && (
                <button
                  onClick={() => setSlot(i, null)}
                  className="text-[9px] text-blood-2 underline"
                >
                  {t('formation:remove')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={pick !== null}
        onClose={() => setPick(null)}
        title={t('formation:choose_hero')}
        width={600}
      >
        <div className="grid-auto-cards">
          {available.map((h) => (
            <HeroCard
              key={h.defId}
              hero={h}
              dim={formation.includes(h.defId) && formation[pick ?? -1] !== h.defId}
              selected={pick !== null && formation[pick] === h.defId}
              onClick={() => {
                if (pick === null) return;
                setSlot(pick, h.defId);
                haptic('success');
                setPick(null);
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setPick(null)}>
            {t('common:close')}
          </Button>
        </div>
      </Modal>
    </Screen>
  );
}
