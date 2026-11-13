import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useUiStore, type Toast } from '@/stores/uiStore';

const COLORS: Record<Toast['kind'], string> = {
  info: 'border-purple-2/50',
  success: 'border-hp/60',
  error: 'border-blood-2/60',
  reward: 'border-gold/70',
};

function ToastItem({ toast }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: -14, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.8)' },
    );
  }, []);
  return (
    <div
      ref={ref}
      className={`panel pointer-events-auto max-w-[70vw] px-3 py-1.5 text-[12px] font-semibold shadow-lg ${COLORS[toast.kind]}`}
    >
      {toast.text}
    </div>
  );
}

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed left-1/2 z-[1000] flex -translate-x-1/2 flex-col items-center gap-1.5"
      style={{ top: 'calc(var(--header-h) + var(--safe-top) + 6px)' }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
