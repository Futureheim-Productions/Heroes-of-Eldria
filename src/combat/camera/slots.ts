import type { ActorSide } from '../types';

/** Where an actor stands: centre x in % of the stage, lift above the floor as a fraction of stage height. */
export interface SlotPos {
  x: number;
  lift: number;
}

export interface Slot extends SlotPos {
  /** Fake-depth scale (front 1.0, back 0.92). */
  depth: number;
}

/** Stacking follows depth: lower on screen (smaller lift) = closer = drawn on top. */
export const slotZ = (lift: number) => 100 - Math.round(lift * 200);

/**
 * Formation for the units a side starts with: heroes left in a slight diagonal backwards,
 * enemies mirrored on the right. Summons never take part, so they can never move or
 * shrink the original units.
 */
export function formationSlots(count: number, side: ActorSide): Slot[] {
  // x measured from the centre line inwards; mirrored per side below.
  const place = (fromCentre: number, lift: number, depth: number): Slot => ({
    x: side === 'hero' ? 50 - fromCentre : 50 + fromCentre,
    lift,
    depth,
  });
  if (count <= 3)
    return Array.from({ length: count }, (_, i) =>
      place((count === 1 ? 21 : 19) + i * 11, i * 0.045, i === 0 ? 1 : 0.92),
    );
  // 4–6 units: a front rank (even indices) and a staggered back rank (odd) behind the gaps.
  return Array.from({ length: count }, (_, i) => {
    const rank = Math.floor(i / 2);
    return i % 2 === 0 ? place(17 + rank * 12.5, 0, 1) : place(23 + rank * 12.5, 0.12, 0.9);
  });
}

/** x range (%) of each side's half that a summon may land in. */
const HALF: Record<ActorSide, [number, number]> = { hero: [7, 44], enemy: [56, 93] };
/**
 * Front ranks only: a summon further back is drawn behind whoever stands there and just
 * disappears, so depth barely separates units – mostly x does.
 */
const LIFTS = [-0.03, 0.01, 0.05];
const LIFT_WEIGHT = 25;
/** Roughly one actor width in %, used as "does not overlap". */
const CLEAR = 10;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * A free spot anywhere on the summoner's half: random (seeded by `uid`, so it is stable
 * across re-renders) among the spots that do not overlap anyone standing there; if the
 * half is packed, the spot with the most room.
 */
export function pickSummonSpot(uid: string, side: ActorSide, occupied: SlotPos[]): SlotPos {
  const [x0, x1] = HALF[side];
  const room = (p: SlotPos) =>
    occupied.reduce(
      (min, o) => Math.min(min, Math.hypot(p.x - o.x, (p.lift - o.lift) * LIFT_WEIGHT)),
      Infinity,
    );
  const candidates: { p: SlotPos; room: number }[] = [];
  for (let x = x0; x <= x1; x += 3)
    for (const lift of LIFTS) {
      const p = { x, lift };
      candidates.push({ p, room: room(p) });
    }
  const free = candidates.filter((c) => c.room >= CLEAR);
  if (free.length) return free[hash(uid) % free.length].p;
  return candidates.reduce((best, c) => (c.room > best.room ? c : best)).p;
}
