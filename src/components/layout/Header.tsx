import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { usePlayerStore } from '@/stores/playerStore';
import { CURRENCY_GLYPH } from '@/components/ui/misc';
import { formatCompact, formatDuration } from '@/utils/format';
import { ENERGY_REGEN_MS, playerXpForLevel } from '@/utils/constants';
import { haptic } from '@/services/haptics';
import { getHeroDef } from '@/data/heroes';
import { HeroPortrait } from '@/components/game/HeroPortrait';
import { useNow } from '@/hooks/useNow';

function CurrencyPill({
  id,
  value,
  sub,
  onClick,
}: {
  id: 'gold' | 'gems' | 'energy' | 'keys';
  value: number;
  sub?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      gsap.fromTo(
        ref.current,
        { scale: 1.35, color: value > prev.current ? '#45d17c' : '#ff6b5b' },
        { scale: 1, color: '#f2d06b', duration: 0.5, ease: 'back.out(2)' },
      );
    }
    prev.current = value;
  }, [value]);
  return (
    <button
      onClick={onClick}
      className="btn-press flex h-7 items-center gap-1 rounded-md border border-gold/60 bg-gradient-to-b from-[#2a2140] to-[#120e1f] px-2 text-[11px] font-bold tabular-nums text-gold-2 shadow-[inset_0_1px_0_rgba(255,233,168,0.15),0_2px_6px_rgba(0,0,0,0.5)]"
    >
      <span className="text-[12px]">{CURRENCY_GLYPH[id]}</span>
      <span ref={ref} className="inline-block">
        {formatCompact(value)}
        {sub && <span className="text-[9px] font-semibold text-ink-dim">/{sub}</span>}
      </span>
    </button>
  );
}

export function Header({ title, showBack = true }: { title?: string; showBack?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'main-menu']);
  const profile = usePlayerStore((s) => s.profile);
  const energyMax = usePlayerStore((s) => s.energyMax)();
  const now = useNow(1000);
  const avatar = getHeroDef(profile.avatarHeroId);
  const xpNeeded = playerXpForLevel(profile.level);
  const untilNext =
    profile.currencies.energy >= energyMax
      ? 0
      : ENERGY_REGEN_MS - ((now - profile.energyUpdatedAt) % ENERGY_REGEN_MS);
  const isHome = location.pathname === '/';
  const screenTitle = title ?? t('main-menu:title');

  return (
    <header
      className="absolute left-0 right-0 top-0 z-50 flex items-center gap-2 border-b border-gold/40 bg-gradient-to-b from-[#1a1330]/95 to-[#0f0c1a]/85 backdrop-blur-md"
      style={{
        height: 'var(--header-h)',
        paddingTop: 'var(--safe-top)',
        paddingLeft: 'calc(var(--safe-left) + 10px)',
        paddingRight: 'calc(var(--safe-right) + 10px)',
      }}
    >
      {/* Centered ornamental title */}
      <div
        className="pointer-events-none absolute left-[170px] right-[318px] top-0 flex items-center justify-center gap-2 overflow-hidden"
        style={{ height: 'var(--header-h)', paddingTop: 'var(--safe-top)' }}
      >
        <span className="h-px w-8 shrink-0 bg-gradient-to-r from-transparent to-gold/70" />
        <span className="gold-gradient-text whitespace-nowrap font-display text-[14px] font-black uppercase tracking-[0.2em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {screenTitle}
        </span>
        <span className="h-px w-8 shrink-0 bg-gradient-to-l from-transparent to-gold/70" />
      </div>

      {showBack && !isHome ? (
        <button
          onClick={() => {
            haptic('light');
            navigate(-1);
          }}
          className="btn-press flex h-8 w-8 items-center justify-center rounded-md border border-gold/60 bg-black/40 text-[18px] leading-none text-gold"
          aria-label={t('common:back')}
        >
          ‹
        </button>
      ) : (
        <button onClick={() => navigate('/profile')} className="btn-press">
          <HeroPortrait
            heroId={avatar.id}
            glyph={avatar.glyph}
            element={avatar.element}
            rarity={avatar.rarity}
            size={36}
            className="!rounded-md !border-gold"
          />
        </button>
      )}
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[12px] font-bold text-ink">{profile.name}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gold-2">
            {t('common:level', { level: profile.level })}
          </span>
          {isHome && (
            <div className="h-1.5 w-16 overflow-hidden rounded-full border border-gold/30 bg-black/60">
              <div
                className="h-full bg-gradient-to-r from-gold-dim to-gold-2"
                style={{ width: `${Math.min(100, (profile.xp / xpNeeded) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="flex flex-col items-end">
          <CurrencyPill
            id="energy"
            value={profile.currencies.energy}
            sub={String(energyMax)}
            onClick={() => navigate('/shop?tab=daily')}
          />
          {untilNext > 0 && (
            <span className="text-[8px] leading-none text-ink-dim">
              +1 {formatDuration(untilNext)}
            </span>
          )}
        </div>
        <CurrencyPill
          id="gold"
          value={profile.currencies.gold}
          onClick={() => navigate('/shop?tab=daily')}
        />
        <CurrencyPill
          id="gems"
          value={profile.currencies.gems}
          onClick={() => navigate('/shop?tab=currency')}
        />
        <CurrencyPill id="keys" value={profile.currencies.keys} />
        <button
          onClick={() => {
            haptic('light');
            navigate('/settings');
          }}
          className="btn-press flex h-7 w-7 items-center justify-center rounded-md border border-gold/60 bg-black/40 text-[14px] text-gold"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
