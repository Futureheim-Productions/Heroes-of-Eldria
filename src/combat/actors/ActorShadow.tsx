import type { Ref } from 'react';

/** Ellipse under the feet. Breathes (scaleX) with idle; fades first on death. */
export function ActorShadow({ ref }: { ref: Ref<HTMLDivElement> }) {
  return <div ref={ref} className="actor-shadow" aria-hidden />;
}
