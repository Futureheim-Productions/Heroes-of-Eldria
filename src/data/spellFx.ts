import type { Element, SkillDef } from '@/types';
import type { SpriteSheetConfig } from '@/utils/spriteSheet';

/**
 * Spell effect registry.
 *
 * To add a new effect:
 *   1. Drop a grid sprite sheet (3×3 = 9 frames, read left→right, top→bottom) in `art/raw/fx/<id>.png`
 *      and run `npm run fx-art` – it writes a downscaled copy to `public/effects/<id>.png`.
 *   2. Add one line to SPELL_FX below: `<id>: fx('<id>')` – tweak duration/size/hitAt if needed.
 *   3. Either map an element to it in ELEMENT_FX (default for every damaging skill of that element)
 *      or point a single skill at it with `{ fx: '<id>' }` in the skill's opts.
 *
 * Variants: `<Name>_<n>.png` (e.g. `SwordSlash_1.png` → `sword_slash_1`) is an alternative look
 * for `<id>`. Register it like any sheet; every skill/element that uses `<id>` then picks one of
 * `<id>`, `<id>_1`, `<id>_2`… at random per attack, never the same one twice in a row.
 */
function fx(id: string, o: Partial<Omit<SpriteSheetConfig, 'src'>> = {}): SpriteSheetConfig {
  return {
    src: `effects/${id}.png`,
    columns: 3,
    rows: 3,
    duration: 0.7,
    size: 190,
    hitAt: 0.4,
    ...o,
  };
}

export const SPELL_FX = {
  fire_explosion: fx('fire_explosion'),
  cold_explosion: fx('cold_explosion', { duration: 0.8 }),
  void_explosion: fx('void_explosion'),
  physical_earthquake: fx('physical_earthquake', { size: 220, hitAt: 0.35 }),
  // Plain blade arc for sword / axe / dagger basics – the hit is the spark on frame 6.
  sword_slash: fx('sword_slash', { duration: 0.5, hitAt: 0.6 }),
  // Variant: flatter arc, the spark lands on frame 5.
  sword_slash_1: fx('sword_slash_1', { duration: 0.5, hitAt: 0.5 }),
  // Sword slash (frames 1–3) that erupts into a burst on the ground – the blow lands on the burst.
  fire_slash: fx('fire_slash', { hitAt: 0.35 }),
  // Variant: a flaming blade arc with the spark on frame 5 (no ground burst).
  fire_slash_1: fx('fire_slash_1', { duration: 0.5, hitAt: 0.5 }),
  wind_slash: fx('wind_slash', { hitAt: 0.35 }),
  // Icy claw/blade arc that shatters into ice shards on frame 5.
  frost_slash: fx('frost_slash', { duration: 0.55, hitAt: 0.5 }),
  // Poison cloud with skulls – rises for 4 frames, bursts on frame 6, fades out.
  poison_effect: fx('poison_effect', { duration: 0.9, hitAt: 0.55, size: 200 }),
  // Round lightning burst drawn in the middle of the cell – sits on the target's chest.
  lightning_explosion: fx('lightning_explosion', { anchor: 'center', size: 170, hitAt: 0.45 }),
  // Bolt from above that hits the ground at the bottom of the cell – tall enough to start over
  // the target's head; the bolt connects on frame 5.
  lightning_strike: fx('lightning_strike', {
    anchor: 'ground',
    size: 260,
    duration: 0.8,
    hitAt: 0.5,
  }),
  // Astral star burst drawn in the middle of the cell – charges up, bursts on frame 5, rings out.
  nova_explosion: fx('nova_explosion', { anchor: 'center', size: 180, hitAt: 0.5 }),
  // Projectile sheets: frames 1–6 fly from the caster to the target, frames 7–9 are the hit.
  frost_bolt: fx('frost_bolt', {
    flight: 6,
    flightTime: 0.32,
    duration: 0.35,
    anchor: 'center',
    size: 160,
  }),
  frost_arrow: fx('frost_arrow', {
    flight: 6,
    flightTime: 0.26,
    duration: 0.35,
    anchor: 'center',
    size: 170,
  }),
  // Kael's transformation into Drakensson – played on Kael himself, see data/heroForms.ts.
  kael_drakensson_ulti: fx('kael_drakensson_ulti', { duration: 1.3, hitAt: 0.85 }),
} satisfies Record<string, SpriteSheetConfig>;

export type SpellFxId = keyof typeof SPELL_FX;

/** Default effect per element. Elements without a sheet yet simply play no effect. */
export const ELEMENT_FX: Partial<Record<Element, SpellFxId>> = {
  fire: 'fire_explosion',
  ice: 'cold_explosion',
  shadow: 'void_explosion',
  astral: 'nova_explosion',
  poison: 'poison_effect',
  lightning: 'lightning_explosion',
  earth: 'physical_earthquake',
  physical: 'physical_earthquake',
};

const dealsDamage = (s: SkillDef) => s.effects.some((e) => e.kind === 'damage');

/** Variant ids per base id: `sword_slash` → [`sword_slash`, `sword_slash_1`, …]. */
const VARIANTS: Partial<Record<SpellFxId, SpellFxId[]>> = {};
for (const id of Object.keys(SPELL_FX) as SpellFxId[]) {
  const base = id.replace(/_\d+$/, '') as SpellFxId;
  const key = base !== id && base in SPELL_FX ? base : id;
  (VARIANTS[key] ??= []).push(id);
}
const lastPicked: Partial<Record<SpellFxId, SpellFxId>> = {};

/** All looks of an effect (the base first). */
export const fxVariants = (id: SpellFxId): SpellFxId[] => VARIANTS[id] ?? [id];

/** One look of `id` at random – never the same one twice in a row when there are several. */
export function pickFx(id: SpellFxId): SpriteSheetConfig {
  const all = fxVariants(id);
  const pool = all.length > 1 ? all.filter((v) => v !== lastPicked[id]) : all;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastPicked[id] = pick;
  return SPELL_FX[pick];
}

/**
 * Effect id `skill` plays on each target hit, or undefined for none.
 * Basic attacks stay silent unless they opt in with an explicit `fx`; skills and ultimates
 * that deal damage fall back to their element's default.
 */
export function skillFxId(skill: SkillDef): SpellFxId | undefined {
  if (skill.fx) return skill.fx as SpellFxId;
  if (skill.kind === 'basic' || !dealsDamage(skill)) return undefined;
  return ELEMENT_FX[skill.element];
}

/** The sheet to play for one cast of `skill` (a random variant when the effect has several). */
export function skillFx(skill: SkillDef): SpriteSheetConfig | undefined {
  const id = skillFxId(skill);
  return id ? pickFx(id) : undefined;
}

/** Every sheet `skill` can play – for preloading. */
export function skillFxAll(skill: SkillDef): SpriteSheetConfig[] {
  const id = skillFxId(skill);
  return id ? fxVariants(id).map((v) => SPELL_FX[v]) : [];
}

export const ALL_SPELL_FX: SpriteSheetConfig[] = Object.values(SPELL_FX);
