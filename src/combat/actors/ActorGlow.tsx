import type { Ref } from 'react';

/** Class-coloured aura behind the art. Hidden (autoAlpha 0) until focus / wind-up. */
export function ActorGlow({ ref, color }: { ref: Ref<HTMLDivElement>; color: string }) {
  return (
    <div
      ref={ref}
      className="actor-glow"
      aria-hidden
      style={{
        background: `radial-gradient(ellipse 50% 46% at 50% 58%, ${color} 0%, ${color}99 35%, transparent 72%)`,
      }}
    />
  );
}
