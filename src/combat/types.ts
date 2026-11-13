export type ActorSide = 'hero' | 'enemy';
export type ActorClass = 'warrior' | 'mage' | 'assassin' | 'archer' | 'tank' | 'necro';
export type ActorState = 'idle' | 'focus' | 'attack' | 'hit' | 'death';

/** Everything a still actor needs to be drawn – one PNG plus a class and a glow colour. */
export interface ActorView {
  id: string;
  name: string;
  artSrc: string;
  side: ActorSide;
  classId: ActorClass;
  glowColor: string;
  /** Mirror the art horizontally (e.g. a hero drawn facing right used as an enemy). */
  flip?: boolean;
  /** Bosses get a bigger box. */
  big?: boolean;
  /** Art width / height (default 2/3). Transformation sprites with wings are wider. */
  aspect?: number;
  /** Extra box size on top of `big` (transformations). */
  sizeScale?: number;
  /** Spawned mid-battle: drawn smaller at `spot`, outside the side's formation. */
  summoned?: boolean;
  /** Where a summon stands (see camera/slots.ts). Ignored for formation units. */
  spot?: { x: number; lift: number };
}

/** The DOM layers of one actor. Only the animator and useActorMotion touch these. */
export interface ActorEls {
  /** Action transforms: x / y / scale / rotate / autoAlpha (attack, hit, death, focus). */
  root: HTMLDivElement;
  /** Idle breathing (y) and dimming (opacity) – kept off root so they never fight attack tweens. */
  body: HTMLDivElement;
  glow: HTMLDivElement;
  img: HTMLImageElement;
  shadow: HTMLDivElement;
  overlay: HTMLDivElement;
}

/** What a mounted StillActor hands to the CombatAnimator. */
export interface ActorHandle {
  id: string;
  side: ActorSide;
  classId: ActorClass;
  glowColor: string;
  slotIndex: number;
  els: ActorEls;
  /** Restarts the idle breathing with a new amplitude (5 = idle, 3 = focus, 0 = stop). */
  setIdleAmp: (amp: number) => void;
}

export type ShakeStrength = 'light' | 'medium' | 'ult';
