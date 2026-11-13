import { useTranslation } from 'react-i18next';
import type { OwnedHero } from '@/types';
import { getHeroDef } from '@/data/heroes';
import { HeroPortrait } from './HeroPortrait';
import { StarRating } from '@/components/ui/misc';
import { RARITY_COLORS, ELEMENT_GLYPH } from '@/utils/constants';
import { heroPower } from '@/services/game';
import { haptic } from '@/services/haptics';

interface HeroCardProps {
  hero: OwnedHero;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  badge?: string;
  dim?: boolean;
}

export function HeroCard({ hero, onClick, selected, compact, badge, dim }: HeroCardProps) {
  const { t } = useTranslation('heroes');
  const def = getHeroDef(hero.defId);
  const power = heroPower(hero);
  return (
    <button
      onClick={() => {
        haptic('light');
        onClick?.();
      }}
      className={`btn-press relative flex flex-col items-center gap-1 rounded-xl border bg-black/35 p-1.5 text-left transition-colors ${
        selected ? 'border-gold bg-gold/15' : 'border-white/10 hover:border-gold/40'
      } ${dim ? 'opacity-45' : ''}`}
      style={{ borderColor: selected ? undefined : `${RARITY_COLORS[def.rarity]}55` }}
    >
      {badge && (
        <span className="absolute left-1 top-1 z-10 rounded bg-gold px-1 text-[8px] font-bold uppercase text-black shadow">
          {badge}
        </span>
      )}
      <span className="absolute right-1 top-1 text-[10px]">{ELEMENT_GLYPH[def.element]}</span>
      <HeroPortrait
        heroId={def.id}
        glyph={def.glyph}
        element={def.element}
        rarity={def.rarity}
        size={compact ? 48 : 60}
      />
      <div className="w-full truncate text-center text-[10px] font-semibold leading-tight">
        {t(`${def.id}.name`)}
      </div>
      <StarRating stars={hero.stars} size={8} />
      <div className="flex w-full items-center justify-between text-[9px] text-ink-dim">
        <span>Lv {hero.level}</span>
        <span className="text-gold-2">⚔ {power}</span>
      </div>
    </button>
  );
}
