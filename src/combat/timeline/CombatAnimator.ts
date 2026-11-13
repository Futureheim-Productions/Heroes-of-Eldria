import gsap from 'gsap';
import { frameCount, type SpriteSheetConfig } from '@/utils/spriteSheet';
import { SPELL_FX, type SpellFxId } from '@/data/spellFx';
import type { ActorClass, ActorHandle, ShakeStrength } from '../types';
import { motionPreset, T } from './attackTimings';
import {
  deathTween,
  facing,
  FOCUS_AMP,
  focusTween,
  hitTween,
  IDLE_AMP,
  resetActor,
  returnTween,
  stepInTween,
} from '../actors/actorMotion';
import { heavier, shakeTween } from '../camera/cameraShake';
import { NodePool } from '../fx/nodePool';
import { flightTween, sheetTween, type Point } from '../fx/stageSpellFx';
import { groundPulseTween, projectileTween } from '../fx/projectile';
import { spawnFloater } from '../fx/damageFloater';

export interface HitSpec {
  targetId: string;
  damage?: number;
  isCrit?: boolean;
  /** Plays death right after the hit. */
  lethal?: boolean;
}

export interface AttackParams {
  actorId: string;
  targetId: string;
  skillId?: string;
  damage?: number;
  isCrit?: boolean;
  /** Sprite sheet from data/spellFx, or pass `sheet` directly. */
  fxId?: SpellFxId;
  sheet?: SpriteSheetConfig;
  lethal?: boolean;
  /** Ultimate: heavier camera (zoom + medium shake). */
  ult?: boolean;
  /** AoE: more targets hit at the same impact (no projectile to these). */
  extraHits?: HitSpec[];
  /** Play another class's motion preset (sandbox / special skills). */
  classOverride?: ActorClass;
  /** Fires on the impact frame – for extra numbers / status texts that should land with the blow. */
  onImpact?: () => void;
}

export interface FloatTextOpts {
  color?: string;
  crit?: boolean;
  heal?: boolean;
  small?: boolean;
}

const DIM = 0.65;

/**
 * Owns every combat timeline. Actors are dumb views that register their DOM layers here;
 * the combat reducer calls `playAttack` and awaits the returned promise.
 *
 * Pipeline (timeScale 1, melee):
 *   0.00 focus + dim others · 0.08 wind-up · 0.20 projectile · 0.26 SpellFx
 *   0.28 shake + hit · 0.30 floater · 0.50 return · 0.55 undim
 */
export class CombatAnimator {
  private actors = new Map<string, ActorHandle>();
  private dead = new Set<string>();
  private stage: HTMLElement | null = null;
  private floaterLayer: HTMLElement | null = null;
  private projectiles: NodePool | null = null;
  private sheets: NodePool | null = null;
  private pulses: NodePool | null = null;
  private current: { tl: gsap.core.Timeline; resolve: () => void } | null = null;
  private loose = new Set<gsap.core.Animation>();
  private floaterStacks = new Map<string, number>();
  private speed = 1;
  private focusedId: string | null = null;
  private pendingFocus: string | null | undefined = undefined;

  // ── wiring ────────────────────────────────────────────────────────────────

  attach(stage: HTMLElement, fxLayer: HTMLElement, floaterLayer: HTMLElement) {
    this.detach();
    this.stage = stage;
    this.floaterLayer = floaterLayer;
    this.projectiles = new NodePool(fxLayer, 'combat-projectile', 3);
    this.sheets = new NodePool(fxLayer, 'combat-sheet', 6);
    this.pulses = new NodePool(fxLayer, 'combat-pulse', 2);
  }

  detach() {
    this.kill();
    this.projectiles?.destroy();
    this.sheets?.destroy();
    this.pulses?.destroy();
    this.projectiles = this.sheets = this.pulses = null;
    this.stage = this.floaterLayer = null;
  }

  register(h: ActorHandle) {
    this.actors.set(h.id, h);
  }

  unregister(id: string) {
    // `dead` is kept on purpose: a dead summon is unmounted by the screen and must not
    // look alive again (and die a second time) on the next sync.
    this.actors.delete(id);
  }

  /**
   * New battle on the same screen (retry): uids repeat between battles, so forget who died
   * and stand every mounted actor back up.
   */
  resetBattle() {
    this.kill();
    this.dead.clear();
    this.focusedId = null;
    this.pendingFocus = undefined;
    for (const h of this.actors.values()) {
      resetActor(h.els);
      gsap.set(h.els.body, { opacity: 1 });
      h.setIdleAmp(IDLE_AMP);
    }
  }

  // ── speed / skip ──────────────────────────────────────────────────────────

  get timeScale() {
    return this.speed;
  }

  /** AUTO x2 = 2. Applies to the running timeline, live floaters and everything after. */
  setTimeScale(n: number) {
    this.speed = n;
    this.current?.tl.timeScale(n);
    for (const a of this.loose) a.timeScale(n);
  }

  /** Fast-forward the running attack to its end state (actors back in their slots). */
  skip() {
    const c = this.current;
    if (!c) return;
    c.tl.progress(1);
    c.tl.kill();
    this.finish(c);
  }

  /** Hard stop – everything, including floaters and camera. */
  kill() {
    this.skip();
    for (const a of this.loose) a.progress(1).kill();
    this.loose.clear();
    if (this.stage) gsap.set(this.stage, { x: 0, y: 0, scale: 1 });
  }

  get busy() {
    return !!this.current;
  }

  // ── turn highlight ────────────────────────────────────────────────────────

  /** "Your turn": focus one actor and dim the rest. `null` clears it. */
  setFocus(id: string | null) {
    // Never fight a running attack/cast for the same transforms – apply once it is done.
    if (this.current) {
      this.pendingFocus = id;
      return;
    }
    this.pendingFocus = undefined;
    const prev = this.focusedId;
    this.focusedId = id;
    const tl = gsap.timeline();
    if (prev && prev !== id) {
      const p = this.actors.get(prev);
      if (p && !this.dead.has(prev)) {
        p.setIdleAmp(IDLE_AMP);
        tl.add(focusTween(p.els, false), 0);
      }
    }
    const a = id ? this.actors.get(id) : undefined;
    if (a && !this.dead.has(a.id)) {
      a.setIdleAmp(FOCUS_AMP);
      tl.add(focusTween(a.els, true), 0);
    }
    // Teammates step back; the other side stays fully visible so targets are easy to read.
    tl.to(
      this.bodies(() => true),
      { opacity: (_i: number, el: HTMLElement) => this.restOpacity(el), duration: 0.14 },
      0,
    );
    this.track(tl);
  }

  // ── attack ────────────────────────────────────────────────────────────────

  playAttack(params: AttackParams): Promise<void> {
    this.skip();
    const a = this.actors.get(params.actorId);
    const t = this.actors.get(params.targetId);
    if (!a || !t || !this.stage) return Promise.resolve();

    const p = motionPreset(params.classOverride ?? a.classId);
    const dir = facing(a.side);
    const hits: HitSpec[] = [
      {
        targetId: params.targetId,
        damage: params.damage,
        isCrit: params.isCrit,
        lethal: params.lethal,
      },
      ...(params.extraHits ?? []),
    ];
    const targetIds = new Set(hits.map((h) => h.targetId));
    const sheet = params.sheet ?? (params.fxId ? SPELL_FX[params.fxId] : undefined);
    const anyCrit = hits.some((h) => h.isCrit);

    // Measure once, before anything moves.
    const from = this.point(a.els.root, 0.5);
    const impactAt = this.point(t.els.root, 0.5);
    // A projectile sheet (frost bolt, frost arrow…) is its own missile – every class shoots it.
    const flight = sheet?.flight ? sheet : undefined;
    const flightTime = flight ? (flight.flightTime ?? 0.3) : T.PROJECTILE_FLIGHT;
    const impact = p.projectile || flight ? T.PROJECTILE_START + flightTime : T.IMPACT;
    const returnAt = impact + T.RETURN_AFTER;

    const tl = gsap.timeline({ paused: true });
    const slot = a.els.root.parentElement;

    // 0.00 focus attacker, dim everyone who is neither attacker nor target
    tl.call(() => a.setIdleAmp(FOCUS_AMP), [], T.FOCUS);
    if (slot) tl.set(slot, { zIndex: 40 }, T.FOCUS);
    tl.add(focusTween(a.els, true), T.FOCUS);
    tl.to(a.els.body, { opacity: 1, duration: 0.1 }, T.FOCUS);
    tl.to(
      this.bodies((h) => h.id !== a.id && !targetIds.has(h.id)),
      { opacity: DIM, duration: 0.12 },
      T.FOCUS,
    );
    tl.to(
      this.bodies((h) => targetIds.has(h.id)),
      { opacity: 1, duration: 0.12 },
      T.FOCUS,
    );

    // 0.08 wind-up / step-in
    if (p.kind === 'teleport') {
      // Assassin: vanish 70ms, reappear in front of the target, slash.
      const depth = (slot && (gsap.getProperty(slot, 'scale') as number)) || 1;
      const tw = t.els.root.offsetWidth;
      const dx = (impactAt.x - from.x - dir * tw * 0.55) / depth;
      tl.set(a.els.root, { willChange: 'transform' }, T.WINDUP);
      tl.to(a.els.glow, { autoAlpha: p.glowPeak, duration: 0.06 }, T.WINDUP);
      tl.to(a.els.root, { autoAlpha: 0, duration: 0.035 }, T.WINDUP);
      tl.set(a.els.root, { x: dx, y: 0 }, T.WINDUP + 0.035);
      tl.to(a.els.root, { autoAlpha: 1, duration: 0.035 }, T.WINDUP + 0.07);
      tl.to(
        a.els.root,
        {
          rotate: dir * p.rotate,
          scale: p.scale,
          x: dx + dir * 10,
          duration: 0.08,
          ease: 'power3.out',
        },
        impact - 0.06,
      );
    } else {
      tl.add(stepInTween(a.els, a.side, p), T.WINDUP);
    }

    // 0.20 projectile
    const fxScale = params.ult ? 1.2 : 1;
    if (flight && this.sheets) {
      tl.add(
        flightTween(this.sheets.get(), flight, from, impactAt, flightTime, fxScale),
        T.PROJECTILE_START,
      );
    } else if (p.projectile && this.projectiles) {
      tl.add(
        projectileTween(this.projectiles.get(), from, impactAt, a.glowColor),
        T.PROJECTILE_START,
      );
    }

    // impact: SpellFx on frame 0 exactly when the projectile lands / the blow connects
    if (sheet && this.sheets) {
      for (const h of hits) {
        const target = this.actors.get(h.targetId);
        if (!target) continue;
        const anchor = sheet.anchor ?? 'feet';
        const at = this.point(target.els.root, anchor === 'center' ? 0.55 : 0);
        // Sheets are drawn for a hero striking to the right – mirror them when an enemy attacks.
        tl.add(
          sheetTween(
            this.sheets.get(),
            sheet,
            at,
            fxScale,
            anchor,
            a.side === 'enemy',
            // Projectile sheets: only the hit frames land on the target.
            flight ? [flight.flight!, frameCount(flight) - 1] : undefined,
          ),
          impact,
        );
      }
    }
    if (p.kind === 'pulse' && this.pulses) {
      const feet = this.point(t.els.root, 0);
      tl.add(
        groundPulseTween(this.pulses.get(), feet, t.els.root.offsetWidth * 1.3, a.glowColor),
        impact - 0.04,
      );
    }

    // camera – on the stage, never on the actor
    const shake: ShakeStrength = params.ult ? 'ult' : anyCrit ? heavier(p.shake) : p.shake;
    tl.add(
      shakeTween(this.stage, shake, shake === 'light' ? p.shakeX : undefined),
      impact + T.SHAKE_AFTER,
    );

    // hit reactions + numbers + deaths
    for (const h of hits) {
      const target = this.actors.get(h.targetId);
      if (!target) continue;
      tl.add(
        hitTween(target.els, { side: target.side, knockback: p.knockback, crit: h.isCrit }),
        impact + T.HIT_AFTER,
      );
      if (h.damage !== undefined) {
        const chest = this.point(target.els.root, 0.6);
        tl.call(
          () => this.floater(target.id, chest, h.damage!, !!h.isCrit),
          [],
          impact + T.FLOATER_AFTER,
        );
      }
      if (h.lethal) {
        tl.call(() => this.markDead(target), [], impact + 0.18);
        tl.add(deathTween(target.els, target.side), impact + 0.18);
      }
    }

    if (params.onImpact) tl.call(params.onImpact, [], impact + T.FLOATER_AFTER);

    // return to the slot, still focused
    if (p.kind === 'teleport') {
      tl.to(a.els.root, { autoAlpha: 0, duration: 0.04 }, returnAt);
      tl.set(a.els.root, { x: 0, rotate: 0, scale: 1.06 }, returnAt + 0.04);
      tl.to(a.els.root, { autoAlpha: 1, duration: 0.06 }, returnAt + 0.06);
      tl.to(a.els.glow, { autoAlpha: 0.65, duration: 0.1 }, returnAt);
      tl.set(a.els.root, { willChange: 'auto' }, returnAt + 0.12);
    } else {
      tl.add(returnTween(a.els, true), returnAt);
    }

    // undim + unfocus (unless the attacker is the "your turn" actor)
    const undimAt = returnAt + T.UNDIM_AFTER;
    const keepFocus = this.focusedId === a.id;
    tl.to(
      this.bodies((h) => !hits.some((x) => x.lethal && x.targetId === h.id)),
      { opacity: (_i: number, el: HTMLElement) => this.restOpacity(el), duration: 0.14 },
      undimAt,
    );
    if (!keepFocus) {
      tl.call(() => a.setIdleAmp(IDLE_AMP), [], undimAt);
      tl.add(focusTween(a.els, false), undimAt);
    }
    if (slot) tl.set(slot, { clearProps: 'zIndex' }, undimAt + 0.14);

    return new Promise<void>((resolve) => {
      const entry = { tl, resolve };
      tl.eventCallback('onComplete', () => this.finish(entry));
      this.current = entry;
      tl.timeScale(this.speed).play();
    });
  }

  // ── stand-alone reactions ─────────────────────────────────────────────────

  /** DoT ticks, reflected damage, etc. */
  playHit(targetId: string, opts: { damage?: number; isCrit?: boolean; heal?: boolean } = {}) {
    const t = this.actors.get(targetId);
    if (!t) return;
    if (!opts.heal) this.track(hitTween(t.els, { side: t.side, crit: opts.isCrit }));
    if (opts.damage !== undefined)
      this.floater(targetId, this.point(t.els.root, 0.6), opts.damage, !!opts.isCrit, opts.heal);
  }

  /** Any text over an actor: status names, shields, misses, heals. */
  floatText(targetId: string, text: string | number, o: FloatTextOpts = {}) {
    const t = this.actors.get(targetId);
    if (!t) return;
    this.floater(targetId, this.point(t.els.root, 0.6), text, !!o.crit, !!o.heal, o.color, o.small);
  }

  /** Buff / heal / summon skills: no target to hit – a glow swell and a small lift in place. */
  playCast(actorId: string): Promise<void> {
    this.skip();
    const a = this.actors.get(actorId);
    if (!a || this.dead.has(actorId)) return Promise.resolve();
    const keepFocus = this.focusedId === a.id;
    const tl = gsap.timeline({ paused: true });
    tl.add(focusTween(a.els, true), 0);
    tl.to(a.els.glow, { autoAlpha: 1, duration: 0.14 }, 0.06);
    tl.to(a.els.root, { y: -10, duration: 0.14, ease: 'power2.out' }, 0.06);
    tl.to(a.els.root, { y: 0, duration: 0.22, ease: 'back.out(2)' }, 0.3);
    tl.to(a.els.glow, { autoAlpha: keepFocus ? 0.65 : 0, duration: 0.2 }, 0.34);
    if (!keepFocus) tl.add(focusTween(a.els, false), 0.5);
    return new Promise<void>((resolve) => {
      const entry = { tl, resolve };
      tl.eventCallback('onComplete', () => this.finish(entry));
      this.current = entry;
      tl.timeScale(this.speed).play();
    });
  }

  /**
   * Transformation (e.g. Kael → Drakensson): the sheet plays on the actor itself while the
   * still is hidden; `onSwap` fires on the last frame so the screen can switch the sprite,
   * then the new form is revealed with a flash and a heavy shake.
   */
  playTransform(actorId: string, sheet: SpriteSheetConfig, onSwap: () => void): Promise<void> {
    this.skip();
    const a = this.actors.get(actorId);
    if (!a || !this.stage || !this.sheets || this.dead.has(actorId)) {
      onSwap();
      return Promise.resolve();
    }
    const feet = this.point(a.els.root, 0);
    const scale = (a.els.root.offsetHeight * 1.15) / sheet.size;
    const start = 0.12;
    const end = start + sheet.duration;
    const tl = gsap.timeline({ paused: true });
    tl.call(() => a.setIdleAmp(0), [], 0);
    tl.add(focusTween(a.els, true), 0);
    tl.to(a.els.glow, { autoAlpha: 1, duration: 0.2 }, 0);
    tl.to(a.els.img, { autoAlpha: 0, duration: 0.08 }, start);
    tl.add(sheetTween(this.sheets.get(), sheet, feet, scale, 'ground', a.side === 'enemy'), start);
    // The last frame is already the new form – swap the sprite under it.
    tl.call(onSwap, [], start + (sheet.duration * 8) / 9);
    tl.set(a.els.img, { autoAlpha: 1 }, end);
    tl.set(a.els.overlay, { backgroundColor: '#ffb347' }, end);
    tl.fromTo(
      a.els.overlay,
      { autoAlpha: 0.8 },
      { autoAlpha: 0, duration: 0.3, immediateRender: false },
      end,
    );
    tl.add(shakeTween(this.stage, 'medium'), end);
    tl.to(a.els.glow, { autoAlpha: 0.65, duration: 0.3 }, end);
    tl.call(() => a.setIdleAmp(this.focusedId === a.id ? FOCUS_AMP : IDLE_AMP), [], end + 0.1);
    return new Promise<void>((resolve) => {
      const entry = { tl, resolve };
      tl.eventCallback('onComplete', () => this.finish(entry));
      this.current = entry;
      tl.timeScale(this.speed).play();
    });
  }

  /** A form ends: short flash while the sprite switches back. */
  playRevert(actorId: string, onSwap: () => void) {
    const a = this.actors.get(actorId);
    if (!a || this.dead.has(actorId)) {
      onSwap();
      return;
    }
    const tl = gsap.timeline();
    tl.set(a.els.overlay, { backgroundColor: '#ffffff' });
    tl.to(a.els.overlay, { autoAlpha: 0.9, duration: 0.1 });
    tl.call(onSwap);
    tl.to(a.els.overlay, { autoAlpha: 0, duration: 0.25 }, '+=0.05');
    this.track(tl);
  }

  playDeath(id: string): Promise<void> {
    const h = this.actors.get(id);
    if (!h || this.dead.has(id)) return Promise.resolve();
    this.markDead(h);
    return new Promise((resolve) => {
      const tl = deathTween(h.els, h.side);
      tl.eventCallback('onComplete', () => resolve());
      this.track(tl);
    });
  }

  revive(id: string) {
    const h = this.actors.get(id);
    if (!h) return;
    this.dead.delete(id);
    resetActor(h.els);
    gsap.set(h.els.body, { opacity: this.focusedId && this.focusedId !== id ? DIM : 1 });
    h.setIdleAmp(IDLE_AMP);
  }

  isDead(id: string) {
    return this.dead.has(id);
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private finish(entry: { tl: gsap.core.Timeline; resolve: () => void }) {
    if (this.current === entry) {
      this.current = null;
      if (this.pendingFocus !== undefined) this.setFocus(this.pendingFocus);
    }
    entry.resolve();
  }

  private markDead(h: ActorHandle) {
    this.dead.add(h.id);
    h.setIdleAmp(0);
    if (this.focusedId === h.id) this.focusedId = null;
  }

  /** Opacity an actor rests at outside an attack: dimmed while a teammate has the turn. */
  private restOpacity(body: HTMLElement) {
    const focused = this.focusedId ? this.actors.get(this.focusedId) : undefined;
    if (!focused || focused.els.body === body) return 1;
    for (const h of this.actors.values())
      if (h.els.body === body) return h.side === focused.side ? DIM : 1;
    return 1;
  }

  private bodies(pred: (h: ActorHandle) => boolean) {
    const out: HTMLElement[] = [];
    for (const h of this.actors.values()) if (!this.dead.has(h.id) && pred(h)) out.push(h.els.body);
    return out;
  }

  /** Point inside the actor box in stage space; `up` = fraction from the feet (0.6 = chest). */
  private point(el: HTMLElement, up: number): Point {
    const s = this.stage!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const k = (gsap.getProperty(this.stage!, 'scale') as number) || 1;
    return { x: (r.left + r.width / 2 - s.left) / k, y: (r.bottom - r.height * up - s.top) / k };
  }

  private floater(
    targetId: string,
    at: Point,
    value: number | string,
    crit: boolean,
    heal = false,
    color?: string,
    small?: boolean,
  ) {
    if (!this.floaterLayer) return;
    const stack = this.floaterStacks.get(targetId) ?? 0;
    this.floaterStacks.set(targetId, stack + 1);
    const tl: gsap.core.Timeline = spawnFloater(this.floaterLayer, at, {
      value: heal && typeof value === 'number' ? `+${value}` : value,
      crit,
      heal,
      color,
      small,
      stack,
      timeScale: this.speed,
      onDone: () => {
        this.loose.delete(tl);
        this.floaterStacks.set(targetId, Math.max(0, (this.floaterStacks.get(targetId) ?? 1) - 1));
      },
    });
    this.loose.add(tl);
  }

  private track(a: gsap.core.Animation) {
    a.timeScale(this.speed);
    this.loose.add(a);
    const prev = a.eventCallback('onComplete');
    a.eventCallback('onComplete', () => {
      prev?.();
      this.loose.delete(a);
    });
  }
}
