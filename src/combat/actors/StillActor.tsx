import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { ActorEls, ActorHandle, ActorState, ActorView } from '../types';
import { useActorMotion } from './useActorMotion';
import { ActorShadow } from './ActorShadow';
import { ActorGlow } from './ActorGlow';
import { ActorHitOverlay } from './ActorHitOverlay';

interface StillActorProps {
  actor: ActorView;
  state: ActorState;
  slotIndex: number;
  /** Box height in px (width follows the art's own aspect ratio once it has loaded). */
  height: number;
  /** Called with the handle once mounted, and with null on unmount. */
  onReady?: (handle: ActorHandle | null) => void;
  /** Makes the actor a focusable button (targeting). */
  onSelect?: (id: string) => void;
  /** Drawn on top of the art, filling the actor box (e.g. the position editor's drag handle). */
  overlay?: ReactNode;
}

/**
 * One still PNG made to feel alive by animating the wrapper layers around it.
 *
 *   .actor-root          x / y / scale / rotate / autoAlpha
 *     .actor-shadow      ellipse under the feet
 *     .actor-body        idle breathing (y), dimming (opacity)
 *       .actor-glow      class colour, behind
 *       .actor-img       the still, pointer-events none
 *       .actor-hit-overlay  silhouette flash
 */
export function StillActor({
  actor,
  state,
  slotIndex,
  height,
  onReady,
  onSelect,
  overlay,
}: StillActorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const els = useRef<ActorEls | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Natural width / height of the PNG – square or wide art (most monsters) would otherwise be
  // letterboxed into the 2:3 hero box and shrink.
  const [naturalAspect, setNaturalAspect] = useState<number>();

  // Must run before useActorMotion's layout effect (declaration order) so els is set.
  useLayoutEffect(() => {
    els.current = {
      root: rootRef.current!,
      body: bodyRef.current!,
      glow: glowRef.current!,
      img: imgRef.current!,
      shadow: shadowRef.current!,
      overlay: overlayRef.current!,
    };
  }, []);

  const { setIdleAmp } = useActorMotion({
    els,
    state,
    side: actor.side,
    classId: actor.classId,
    slotIndex,
  });

  const readyCb = useRef(onReady);
  readyCb.current = onReady;
  useLayoutEffect(() => {
    if (!els.current) return;
    readyCb.current?.({
      id: actor.id,
      side: actor.side,
      classId: actor.classId,
      glowColor: actor.glowColor,
      slotIndex,
      els: els.current,
      setIdleAmp,
    });
    return () => readyCb.current?.(null);
  }, [actor.id, actor.side, actor.classId, actor.glowColor, slotIndex, setIdleAmp]);

  const dead = state === 'death';
  const width = Math.round(height * (actor.aspect ?? naturalAspect ?? 2 / 3));

  const onImgLoad = () => {
    const img = imgRef.current;
    if (img?.naturalWidth && img.naturalHeight)
      setNaturalAspect(img.naturalWidth / img.naturalHeight);
    setLoaded(true);
  };

  return (
    <div
      ref={rootRef}
      className="actor-root"
      data-actor={actor.id}
      data-side={actor.side}
      style={{ width, height, marginLeft: -width / 2 }}
      role={onSelect ? 'button' : undefined}
      aria-label={onSelect ? actor.name : undefined}
      tabIndex={onSelect && !dead ? 0 : undefined}
      onClick={onSelect && !dead ? () => onSelect(actor.id) : undefined}
      onKeyDown={
        onSelect && !dead
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(actor.id);
              }
            }
          : undefined
      }
    >
      <ActorShadow ref={shadowRef} />
      <div ref={bodyRef} className="actor-body">
        <ActorGlow ref={glowRef} color={actor.glowColor} />
        <img
          ref={imgRef}
          className="actor-img"
          src={actor.artSrc}
          alt={actor.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          data-loaded={loaded || undefined}
          onLoad={onImgLoad}
          style={actor.flip ? { transform: 'scaleX(-1)' } : undefined}
        />
        <ActorHitOverlay ref={overlayRef} src={actor.artSrc} flip={actor.flip} />
      </div>
      {overlay}
    </div>
  );
}
