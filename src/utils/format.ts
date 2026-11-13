import i18n from 'i18next';

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(i18n.language || 'sv').format(Math.round(n));
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return formatNumber(n);
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function pct(v: number): string {
  return `${Math.round(v)}%`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function weekKey(ts: number): string {
  const d = new Date(ts);
  const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.floor(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7,
  );
  return `${d.getUTCFullYear()}-w${week}`;
}
