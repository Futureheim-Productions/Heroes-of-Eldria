import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { CurrencyId, Rarity } from '@/types';
import { RARITY_COLORS } from '@/utils/constants';
import { formatCompact } from '@/utils/format';

export const CURRENCY_GLYPH: Record<CurrencyId, string> = {
  gold: '💰',
  gems: '💎',
  energy: '⚡',
  keys: '🔑',
  arenaCoins: '🏅',
  guildCoins: '🛡️',
};

export function StarRating({
  stars,
  max = 6,
  size = 10,
}: {
  stars: number;
  max?: number;
  size?: number;
}) {
  return (
    <div className="flex gap-[1px] leading-none" style={{ fontSize: size }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={
            i < stars ? 'text-gold-2 drop-shadow-[0_0_3px_rgba(242,208,107,0.7)]' : 'text-white/15'
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const { t } = useTranslation('common');
  return (
    <span
      className="rounded px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider"
      style={{
        background: `${RARITY_COLORS[rarity]}22`,
        color: RARITY_COLORS[rarity],
        border: `1px solid ${RARITY_COLORS[rarity]}66`,
      }}
    >
      {t(`rarity.${rarity}`)}
    </span>
  );
}

export function CurrencyDisplay({
  id,
  amount,
  size = 'md',
  className = '',
}: {
  id: CurrencyId;
  amount: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/45 font-semibold tabular-nums ${size === 'sm' ? 'px-1.5 py-[1px] text-[10px]' : 'px-2 py-[2px] text-[12px]'} ${className}`}
    >
      <span>{CURRENCY_GLYPH[id]}</span>
      <span>{formatCompact(amount)}</span>
    </span>
  );
}

export function Chip({
  children,
  active,
  onClick,
  className = '',
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-press whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        active
          ? 'border-gold bg-gold/20 text-gold-2'
          : 'border-white/10 bg-black/30 text-ink-dim hover:border-gold/40'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="spinner" />
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function EmptyState({ text, glyph = '📭' }: { text: string; glyph?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-ink-dim">
      <div className="text-4xl opacity-60">{glyph}</div>
      <div className="text-[12px]">{text}</div>
    </div>
  );
}

export function StatRow({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1 text-[12px] last:border-0">
      <span className="text-ink-dim">{label}</span>
      <span className="font-semibold tabular-nums">
        {value}
        {delta !== undefined && delta !== 0 && (
          <span className={`ml-1 text-[10px] ${delta > 0 ? 'text-hp' : 'text-blood-2'}`}>
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
      </span>
    </div>
  );
}

export function Badge({
  children,
  color = 'var(--color-blood)',
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className="absolute -right-1 -top-1 z-10 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow"
      style={{ background: color, height: 16 }}
    >
      {children}
    </span>
  );
}
