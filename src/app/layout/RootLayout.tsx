import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingScreen } from '../LoadingScreen';
import { usePlayerStore } from '@/stores/playerStore';
import { runResets } from '@/services/game';

export function RootLayout() {
  const tickEnergy = usePlayerStore((s) => s.tickEnergy);

  useEffect(() => {
    runResets();
    tickEnergy();
    const id = setInterval(() => {
      tickEnergy();
      runResets();
    }, 15000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        tickEnergy();
        runResets();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [tickEnergy]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
