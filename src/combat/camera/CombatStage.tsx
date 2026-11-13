import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { ActorSide, ActorState, ActorView } from '../types';
import type { CombatAnimator } from '../timeline/CombatAnimator';
import { StillActor } from '../actors/StillActor';
import { formationSlots, slotZ, type Slot } from './slots';
import '../combat.css';

export interface SlotOffset {
  dx: number;
  dy: number;
}

/** Summons are drawn at this fraction of the formation units' height. */
export const SUMMON_SIZE = 0.8;

interface CombatStageProps {
  heroes: ActorView[];
  enemies: ActorView[];
  animator: CombatAnimator;
  /** Persistent per-actor state (idle / focus / death). Defaults to idle. */
  states?: Record<string, ActorState>;
  onActorSelect?: (id: string) => void;
  /** Stage background (CSS `background`), shaken together with the actors. */
  background?: string;
  /** Floor line from the bottom of the stage. */
  floor?: string;
  /** Keeps actors clear of overlay UI along the right edge (px). */
  insetRight?: number;
  /** Clip to the stage box (hides the shake bleed). Off when HUDs may reach above it. */
  clip?: boolean;
  /** HUD / ground markers per actor – drawn in the slot, so attacks never drag them along. */
  renderSlot?: (actor: ActorView, boxHeight: number) => ReactNode;
  /** Debug position editor: saved pixel offset per formation slot. */
  slotOffset?: (side: ActorSide, index: number) => SlotOffset | undefined;
  editable?: boolean;
  onSlotOffsetChange?: (side: ActorSide, index: number, offset: SlotOffset) => void;
  className?: string;
  style?: CSSProperties;
  /** Overlay UI – sits above the stage and does not shake. */
  children?: ReactNode;
}

/**
 * `#combat-stage`: both sides, the FX layer and the floater layer. The camera shakes this
 * element; overlay UI passed as children lives outside it.
 */
export function CombatStage({
  heroes,
  enemies,
  animator,
  states = {},
  onActorSelect,
  background,
  floor = '18%',
  insetRight = 0,
  clip = true,
  renderSlot,
  slotOffset,
  editable,
  onSlotOffsetChange,
  className = '',
  style,
  children,
}: CombatStageProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const floaterRef = useRef<HTMLDivElement>(null);
  const [stageH, setStageH] = useState(0);
  const [drag, setDrag] = useState<{
    key: string;
    x: number;
    y: number;
    from: SlotOffset;
    now: SlotOffset;
  } | null>(null);

  useLayoutEffect(() => {
    animator.attach(stageRef.current!, fxRef.current!, floaterRef.current!);
    return () => animator.detach();
  }, [animator]);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => setStageH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const actorH = Math.round(Math.max(90, Math.min(280, stageH * 0.5)));

  const renderSide = (list: ActorView[], side: ActorSide) => {
    const formation = list.filter((a) => !a.summoned);
    const slots = formationSlots(formation.length, side);
    return list.map((actor) => {
      const fi = formation.indexOf(actor);
      const slot: Slot =
        fi >= 0
          ? slots[fi]
          : { ...(actor.spot ?? { x: side === 'hero' ? 25 : 75, lift: 0 }), depth: 1 };
      const boxH = Math.round(
        actorH *
          (actor.big ? 1.3 : 1) *
          (actor.summoned ? SUMMON_SIZE : 1) *
          (actor.sizeScale ?? 1) *
          slot.depth,
      );
      const key = `${side}:${fi}`;
      const saved = fi >= 0 ? (slotOffset?.(side, fi) ?? { dx: 0, dy: 0 }) : { dx: 0, dy: 0 };
      const off = drag?.key === key ? drag.now : saved;
      const canDrag = editable && fi >= 0;
      const onDown = (e: ReactPointerEvent) => {
        if (!canDrag) return;
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDrag({ key, x: e.clientX, y: e.clientY, from: saved, now: saved });
      };
      const onMove = (e: ReactPointerEvent) => {
        if (!drag || drag.key !== key) return;
        setDrag({
          ...drag,
          now: {
            dx: Math.round(drag.from.dx + e.clientX - drag.x),
            dy: Math.round(drag.from.dy + e.clientY - drag.y),
          },
        });
      };
      const onUp = (e: ReactPointerEvent) => {
        if (!drag || drag.key !== key) return;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        onSlotOffsetChange?.(side, fi, drag.now);
        setDrag(null);
      };
      return (
        <div
          key={actor.id}
          className="combat-slot"
          style={{
            left: `${slot.x}%`,
            bottom: `calc(${floor} + ${slot.lift * stageH}px)`,
            zIndex: slotZ(slot.lift),
            transform: off.dx || off.dy ? `translate(${off.dx}px, ${off.dy}px)` : undefined,
          }}
        >
          <StillActor
            actor={actor}
            state={states[actor.id] ?? 'idle'}
            slotIndex={fi >= 0 ? fi : 3 + list.indexOf(actor)}
            height={boxH}
            onReady={(h) => (h ? animator.register(h) : animator.unregister(actor.id))}
            onSelect={editable ? undefined : onActorSelect}
            overlay={
              canDrag && (
                // Inside the actor box so it always matches the art's width (square and wide
                // monsters are wider than the 2:3 heroes).
                <div
                  className="absolute inset-0 cursor-grab touch-none"
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  style={{ zIndex: 5, outline: '1px dashed rgba(212,175,55,0.7)' }}
                />
              )
            }
          />
          {renderSlot?.(actor, boxH)}
        </div>
      );
    });
  };

  return (
    <div
      ref={outerRef}
      className={`relative ${clip ? 'overflow-hidden' : ''} ${className}`}
      style={style}
    >
      {/* Bleed 16px past the edges so a shake never reveals the background's border. */}
      <div
        ref={stageRef}
        id="combat-stage"
        className="combat-stage"
        // combat.css clips the stage by default; with clip off, units moved low (position editor /
        // battleLayouts) must draw over the skill bar instead of being cut off at the stage edge.
        style={{
          position: 'absolute',
          inset: -16,
          background,
          overflow: clip ? undefined : 'visible',
        }}
      >
        <div className="absolute" style={{ inset: 16, right: 16 + insetRight }}>
          {renderSide(heroes, 'hero')}
          {renderSide(enemies, 'enemy')}
        </div>
        <div ref={fxRef} className="combat-fx-layer" />
        <div ref={floaterRef} className="combat-floater-layer" />
      </div>
      {children}
    </div>
  );
}
