import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { haptic } from '@/services/haptics';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'locked';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-[#f2d06b] via-[#d4af37] to-[#9c7d24] text-[#1a1205] border border-[#ffe9a8]/60 shadow-[0_2px_10px_rgba(212,175,55,0.35)] font-bold',
  secondary:
    'bg-gradient-to-b from-[#3a2c5c] to-[#241b3a] text-ink border border-purple-2/40 shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
  danger:
    'bg-gradient-to-b from-[#e74c3c] to-[#8e2a20] text-white border border-[#ff9d92]/50 font-bold',
  ghost: 'bg-transparent text-gold border border-gold/40 hover:bg-gold/10',
  locked: 'bg-[#1d1828] text-ink-dim border border-white/10 cursor-not-allowed opacity-70',
};

const SIZES: Record<Size, string> = {
  sm: 'text-[11px] px-2.5 py-1.5 rounded-md gap-1',
  md: 'text-[13px] px-4 py-2 rounded-lg gap-1.5',
  lg: 'text-[15px] px-6 py-3 rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  block,
  className = '',
  onClick,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const v = disabled ? 'locked' : variant;
  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        haptic(variant === 'primary' ? 'medium' : 'light');
        onClick?.(e);
      }}
      className={`btn-press inline-flex items-center justify-center font-display uppercase tracking-wider select-none ${VARIANTS[v]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {icon && <span className="text-[1.15em] leading-none">{icon}</span>}
      {children}
    </button>
  );
}
