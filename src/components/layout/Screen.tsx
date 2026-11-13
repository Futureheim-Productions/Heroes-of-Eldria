import type { ReactNode } from 'react';
import { Header } from './Header';
import { useScreenEnter } from '@/hooks/useScreenEnter';

interface ScreenProps {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  header?: boolean;
  background?: 'fantasy' | 'combat' | 'none';
}

/** Standard screen shell with header + safe-area padding + enter animation. */
export function Screen({
  title,
  children,
  className = '',
  bodyClassName = '',
  header = true,
  background = 'fantasy',
}: ScreenProps) {
  const ref = useScreenEnter();
  return (
    <div
      className={`screen ${background === 'fantasy' ? 'bg-fantasy' : background === 'combat' ? 'bg-combat' : ''} ${className}`}
    >
      {header && <Header title={title} />}
      <div ref={ref} className={`screen-body ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
