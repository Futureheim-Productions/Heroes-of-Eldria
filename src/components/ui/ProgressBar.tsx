interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  label?: string;
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max,
  color = 'var(--color-hp)',
  height = 8,
  label,
  className = '',
  showText,
  animated = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-black/50 border border-white/10 ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(180deg, color-mix(in srgb, ${color} 70%, white) 0%, ${color} 60%, color-mix(in srgb, ${color} 70%, black) 100%)`,
          transition: animated ? 'width 0.35s ease' : undefined,
        }}
      />
      {(label || showText) && (
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {label ?? `${Math.round(value)}/${Math.round(max)}`}
        </div>
      )}
    </div>
  );
}
