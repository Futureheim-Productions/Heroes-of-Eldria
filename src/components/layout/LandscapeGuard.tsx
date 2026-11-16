import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const isLandscapeNow = () => window.innerWidth >= window.innerHeight || window.innerWidth > 900;

export function LandscapeGuard({ children }: { children: ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(isLandscapeNow);
  const { t } = useTranslation('common');

  useEffect(() => {
    // iOS Safari fires resize/orientationchange during a rotation, before innerWidth/innerHeight have
    // their new values – so check again once the rotation has settled, and also follow the media query,
    // which flips at the right moment
    let settle = 0;
    const check = () => {
      setIsLandscape(isLandscapeNow());
      clearTimeout(settle);
      settle = window.setTimeout(() => setIsLandscape(isLandscapeNow()), 350);
    };
    const mq = window.matchMedia('(orientation: landscape)');
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    mq.addEventListener('change', check);
    // Try to lock orientation on supported (installed PWA / Capacitor) platforms
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    so?.lock?.('landscape').catch(() => undefined);
    return () => {
      clearTimeout(settle);
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      mq.removeEventListener('change', check);
    };
  }, []);

  // the game stays mounted under the overlay, so turning the phone mid-battle doesn't lose progress
  return (
    <>
      {children}
      {!isLandscape && (
        <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-bg p-6 text-center text-gold">
          <div className="mb-4 animate-pulse text-5xl">📱↔️</div>
          <h2 className="mb-1 text-xl">{t('rotate_title')}</h2>
          <p className="text-ink-dim">{t('rotate_body')}</p>
          <p className="mt-3 max-w-xs text-sm text-ink-dim">{t('rotate_lock_hint')}</p>
        </div>
      )}
    </>
  );
}
