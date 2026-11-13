/**
 * Grid sprite sheets ("9-slice" = 3×3) played frame by frame with GSAP.
 * The element uses `background-size: columns*100% rows*100%` so every frame is exactly
 * the element's size; frame positions are then pure percentages and the pixel size of
 * the image never has to be measured.
 */
export interface SpriteSheetConfig {
  /** Public URL of the sheet (e.g. `/effects/fire_explosion.png`). */
  src: string;
  columns: number;
  rows: number;
  /** Total play time of one loop in seconds (at timeScale 1). */
  duration: number;
  /** Rendered size in px (both axes) at scale 1. */
  size: number;
  /** Fraction of the play time at which the "hit" happens (damage numbers, shake). */
  hitAt: number;
  /** `screen` makes black pixels vanish – for sheets without real alpha. */
  blend?: 'normal' | 'screen';
  /**
   * Where the sheet sits on its target (combat stage):
   * `feet` (default) – stands on the ground, sinking 15% below the feet (bursts, slashes);
   * `ground` – bottom edge exactly on the feet (a bolt that hits the ground);
   * `center` – centred on the target's chest (explosions drawn in the middle of the cell).
   */
  anchor?: 'feet' | 'ground' | 'center';
  /**
   * Projectile sheets: the first `flight` frames are the missile in the air – it travels from
   * the caster to the target during `flightTime` seconds – and the remaining frames are the hit,
   * played on the target (anchored by `anchor`) over `duration` seconds.
   */
  flight?: number;
  /** Seconds the missile spends in the air (default 0.3). */
  flightTime?: number;
}

export const frameCount = (c: SpriteSheetConfig) => c.columns * c.rows;

/** `background-position` for a frame (index 0 = top-left, reads left→right, top→bottom). */
export function frameToPosition(index: number, c: SpriteSheetConfig): { x: string; y: string } {
  const col = index % c.columns;
  const row = Math.floor(index / c.columns);
  const pct = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);
  return { x: `${pct(col, c.columns)}%`, y: `${pct(row, c.rows)}%` };
}

export const sheetBackgroundSize = (c: SpriteSheetConfig) => `${c.columns * 100}% ${c.rows * 100}%`;

const preloaded = new Set<string>();

/** Warm the browser cache so the first frame does not pop in late. */
export function preloadSheets(sheets: Iterable<SpriteSheetConfig>) {
  for (const s of sheets) {
    if (preloaded.has(s.src)) continue;
    preloaded.add(s.src);
    const img = new Image();
    img.src = s.src;
  }
}
