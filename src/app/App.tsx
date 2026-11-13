import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ErrorBoundary } from './ErrorBoundary';
import { LandscapeGuard } from '@/components/layout/LandscapeGuard';
import { DebugOverlay } from '@/components/debug/DebugOverlay';
import { Toasts } from '@/components/layout/Toasts';

export function App() {
  return (
    <ErrorBoundary>
      <LandscapeGuard>
        <DebugOverlay />
        <Toasts />
        <RouterProvider router={router} />
      </LandscapeGuard>
    </ErrorBoundary>
  );
}
