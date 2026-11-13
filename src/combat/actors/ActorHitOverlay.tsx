import type { CSSProperties, Ref } from 'react';

/**
 * White/red flash in the exact silhouette of the art: a solid colour masked by the same PNG,
 * so a hit flashes the character and not its bounding box.
 */
export function ActorHitOverlay({
  ref,
  src,
  flip,
}: {
  ref: Ref<HTMLDivElement>;
  src: string;
  flip?: boolean;
}) {
  const mask = `url("${src}")`;
  const style: CSSProperties = {
    maskImage: mask,
    WebkitMaskImage: mask,
    transform: flip ? 'scaleX(-1)' : undefined,
  };
  return <div ref={ref} className="actor-hit-overlay" aria-hidden style={style} />;
}
