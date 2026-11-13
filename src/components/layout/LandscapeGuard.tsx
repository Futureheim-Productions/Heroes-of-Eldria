import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function LandscapeGuard({ children }: { children: ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(true);
  const { t } = useTranslation('common');

  useEffect(() => {
    const check = () =>
      setIsLandscape(window.innerWidth >= window.innerHeight || window.innerWidth > 900);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    // Try to lock orientation on supported (installed PWA / Capacitor) platforms
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    so?.lock?.('landscape').catch(() => undefined);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isLandscape) {
    return (
      <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-bg p-6 text-center text-gold">
        <div className="mb-4 animate-pulse text-5xl">📱↔️</div>
        <h2 className="mb-1 text-xl">{t('rotate_title')}</h2>
        <p className="text-ink-dim">{t('rotate_body')}</p>
      </div>
    );
  }
  return <>{children}</>;
}
