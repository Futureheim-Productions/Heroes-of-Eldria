/**
 * Spell-FX sprite sheet + transformation sprite pipeline.
 *
 *   npm run fx-art                 → art/raw/fx/*.png    → public/effects/<id>.png (downscaled sheets)
 *                                    art/raw/forms/*.png → public/heroes/forms/<id>.png (form sprites)
 *   npm run fx-art -- --force      → re-process everything
 *   npm run fx-art -- --size=1024  → sheet edge in px (default 768 = 256 px per frame for a 3×3 grid)
 *
 * Without --force a file is (re)processed when its output is missing or older than the raw
 * file – so replacing a raw image and running fastboot picks up the new version.
 *
 * Sheets keep their alpha; only the size changes. Frame positions in the game are percentage
 * based (see src/utils/spriteSheet.ts), so any output size works, but a multiple of the grid
 * (3 × 256 = 768) keeps frame edges pixel-exact. Register new sheets in src/data/spellFx.ts.
 *
 * Forms are a hero's transformed battle sprite (e.g. Kael → Drakensson): scaled to max 768 px
 * tall with the aspect kept. Register them in src/data/heroForms.ts.
 *
 * File names become snake_case ids: `FireSlash.png` → `fire_slash`,
 * `Kael_Drakensson_DragonForm.png` → `kael_drakensson_dragon_form`.
 * `*_old.png` files are backups and are ignored.
 * (The script reminds you about anything not registered yet.)
 */
import sharp from 'sharp';
import { mkdirSync, readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const FX_RAW = 'art/raw/fx';
const FX_OUT = 'public/effects';
const FX_REGISTRY = 'src/data/spellFx.ts';
const FORM_RAW = 'art/raw/forms';
const FORM_OUT = 'public/heroes/forms';
const FORM_REGISTRY = 'src/data/heroForms.ts';

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const size = Number(argv.find((a) => a.startsWith('--size='))?.slice(7) ?? 768);

/** `FireSlash` → `fire_slash`, `Kael_Drakensson_Ulti` → `kael_drakensson_ulti`. */
function toId(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

const rawImages = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).filter(
        (f) =>
          statSync(join(dir, f)).isFile() &&
          /\.(png|webp)$/i.test(f) &&
          // `<name>_old.png` = a kept-around previous version, never shipped
          !/_old\.(png|webp)$/i.test(f),
      )
    : [];

/**
 * Sheets whose generator stamped frame numbers in each cell's top-left corner: that corner
 * (as a fraction of the cell) is wiped to transparent. The raw file is left untouched.
 */
const CLEAR_FRAME_LABELS = { sword_slash: 0.14 };

/** Faint = visible but at most this alpha: leftovers of a generator's grid, never real FX. */
const FAINT_ALPHA = 80;

/**
 * Cleans generator leftovers before the sheet is scaled:
 *  - faint grid lines: a row/column within a few px of a cell border where most of the length is
 *    faintly visible (e.g. LightningStrike had one at ~24% alpha across the whole sheet) – only its
 *    faint pixels are cleared, so an effect that genuinely crosses the border keeps its bright core;
 *  - frame labels, for sheets listed in CLEAR_FRAME_LABELS.
 */
async function cleanSheet(raw, id, columns = 3, rows = 3) {
  const { data, info } = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const alpha = (x, y) => (y * W + x) * 4 + 3;
  const faint = (i) => data[i] > 10 && data[i] <= FAINT_ALPHA;
  const near = (n, cells) =>
    Array.from({ length: cells + 1 }, (_, k) => Math.round((k * n) / cells)).flatMap((b) =>
      Array.from({ length: 13 }, (_, d) => b - 6 + d).filter((v) => v >= 0 && v < n),
    );
  let lines = 0;
  for (const y of new Set(near(H, rows))) {
    let count = 0;
    for (let x = 0; x < W; x++) if (faint(alpha(x, y))) count++;
    if (count < W * 0.5) continue;
    lines++;
    for (let x = 0; x < W; x++) if (faint(alpha(x, y))) data[alpha(x, y)] = 0;
  }
  for (const x of new Set(near(W, columns))) {
    let count = 0;
    for (let y = 0; y < H; y++) if (faint(alpha(x, y))) count++;
    if (count < H * 0.5) continue;
    lines++;
    for (let y = 0; y < H; y++) if (faint(alpha(x, y))) data[alpha(x, y)] = 0;
  }
  if (lines) console.log('clean ', id, `${lines} faint grid line(s) removed`);

  const fraction = CLEAR_FRAME_LABELS[id];
  if (fraction) {
    const cw = W / columns;
    const ch = H / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < columns; c++)
        for (let y = Math.round(r * ch); y < Math.round(r * ch) + Math.ceil(ch * fraction); y++)
          for (let x = Math.round(c * cw); x < Math.round(c * cw) + Math.ceil(cw * fraction); x++)
            data[alpha(x, y)] = 0;
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } });
}

/** Output missing, or older than the raw file → needs processing. */
const stale = (raw, out) =>
  force || !existsSync(out) || statSync(raw).mtimeMs > statSync(out).mtimeMs;

// ── Spell sheets ──
mkdirSync(FX_OUT, { recursive: true });
for (const f of rawImages(FX_RAW)) {
  const id = toId(basename(f, extname(f)));
  const raw = join(FX_RAW, f);
  const out = join(FX_OUT, `${id}.png`);
  if (!stale(raw, out)) {
    console.log('skip  ', id, '(up to date)');
    continue;
  }
  const meta = await sharp(raw).metadata();
  if (meta.width !== meta.height)
    console.warn(`warn   ${id}: sheet is not square (${meta.width}×${meta.height})`);
  const src = await cleanSheet(raw, id);
  await src
    .resize(size, size, { fit: 'fill' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
  const kb = Math.round(statSync(out).size / 1024);
  console.log('wrote ', out, `${size}×${size} · ${kb} kB`);
}

// ── Transformation sprites ──
const forms = rawImages(FORM_RAW);
if (forms.length) mkdirSync(FORM_OUT, { recursive: true });
for (const f of forms) {
  const id = toId(basename(f, extname(f)));
  const raw = join(FORM_RAW, f);
  const out = join(FORM_OUT, `${id}.png`);
  if (!stale(raw, out)) {
    console.log('skip  ', id, '(up to date)');
    continue;
  }
  await sharp(raw)
    .resize({ height: 768, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('form  ', out);
}

// Remind about sheets that are on disk but not yet registered
const registry = existsSync(FX_REGISTRY) ? readFileSync(FX_REGISTRY, 'utf8') : '';
const ids = readdirSync(FX_OUT)
  .filter((f) => f.endsWith('.png'))
  .map((f) => basename(f, '.png'));
const missing = ids.filter((id) => !registry.includes(`fx('${id}'`));
if (missing.length) {
  console.log(`\nnot in ${FX_REGISTRY} yet – add to SPELL_FX:`);
  for (const id of missing) console.log(`  ${id}: fx('${id}'),`);
}

// Remind about form sprites that no hero form points at yet
const formRegistry = existsSync(FORM_REGISTRY) ? readFileSync(FORM_REGISTRY, 'utf8') : '';
const unusedForms = existsSync(FORM_OUT)
  ? readdirSync(FORM_OUT)
      .filter((f) => f.endsWith('.png'))
      .filter((f) => !formRegistry.includes(`/heroes/forms/${f}`))
  : [];
if (unusedForms.length) {
  console.log(`\nnot in ${FORM_REGISTRY} yet – add a HERO_FORMS entry with art:`);
  for (const f of unusedForms) console.log(`  '/heroes/forms/${f}'`);
}
