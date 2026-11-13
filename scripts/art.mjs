/**
 * Art pipeline for heroes and monsters.
 *
 *   npm run hero-art                → art/raw/*.png          → public/heroes/<id>.png   + src/data/heroArt.ts
 *   npm run monster-art             → art/raw/monsters/*.png → public/monsters/<id>.png + src/data/monsterArt.ts
 *   npm run hero-art -- --force     → re-process everything (default: only new images, or raw
 *                                     files newer than their processed copy)
 *   node scripts/art.mjs monster art/raw/monsters/Lich.png lich   → single file (always overwrites)
 *
 * Monster expansions: `art/raw/monsters/second/*.png` → `public/monsters/second/<id>.png` and a
 * separate MONSTER_ART_SECOND map (batch 2 – see monster_prompt_batch2.txt and
 * monster_prompt_bosses.txt). `monsterArt(id)` looks in both, so an expansion monster gets its art
 * as soon as it is added to the game data.
 *
 * Hero skins: `art/raw/<id>_alt_<n>.png` → `public/heroes/<id>_alt_<n>.png` and HERO_SKINS[id][n-1].
 * (`<id>_alt.png` without a number is a discarded draft and is ignored.)
 *
 * Removes a white background (flood fill from the borders, so white details inside the figure are
 * kept; already-transparent images pass through untouched), writes a lowercase <id>.png and
 * regenerates the registry file.
 */
import sharp from 'sharp';
import { mkdirSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const KINDS = {
  hero: {
    rawDir: 'art/raw',
    outDir: 'public/heroes',
    registry: 'src/data/heroArt.ts',
    constName: 'HERO_ART',
    fnName: 'heroArt',
    label: 'hero',
    skins: true,
  },
  monster: {
    rawDir: 'art/raw/monsters',
    outDir: 'public/monsters',
    registry: 'src/data/monsterArt.ts',
    constName: 'MONSTER_ART',
    fnName: 'monsterArt',
    label: 'monster',
    /** Sub-folder → registry constant, for monsters of later expansions. */
    expansions: { second: 'MONSTER_ART_SECOND' },
  },
};

async function knockout(input, outDir, id) {
  const { data: px, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const visited = new Uint8Array(w * h);
  const stack = [];
  // Background level = median darkest channel along the border. Only pixels within a few steps
  // of it count as background, so near-white art (frost fur, snow, pale robes) touching the
  // edge survives; a greyer background still gets the old, looser 232 cut-off.
  const border = [];
  const minCh = (i) => Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
  for (let x = 0; x < w; x += 3) border.push(minCh(x), minCh((h - 1) * w + x));
  for (let y = 0; y < h; y += 3) border.push(minCh(y * w), minCh(y * w + w - 1));
  border.sort((a, b) => a - b);
  const bg = border[Math.floor(border.length / 2)];
  const cut = Math.min(248, Math.max(232, bg - 6));
  const isWhite = (i) =>
    px[i * 4] > cut && px[i * 4 + 1] > cut && px[i * 4 + 2] > cut && px[i * 4 + 3] > 0;
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (visited[i] || !isWhite(i)) continue;
    visited[i] = 1;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  // Background pockets enclosed by the figure (between legs, under a belly) are unreachable from
  // the border. Knock out a pocket only when it is big and has the background's exact level –
  // small white details (sparks, eye glints, bubbles) and shaded near-white art stay.
  const pocketLevel = Math.max(240, bg - 3);
  const minPocket = Math.max(150, Math.round(w * h * 0.0008));
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (visited[start] || seen[start] || minCh(start) < pocketLevel) continue;
    const pocket = [];
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop();
      pocket.push(i);
      const x = i % w;
      const y = (i - x) / w;
      for (const j of [x > 0 && i - 1, x < w - 1 && i + 1, y > 0 && i - w, y < h - 1 && i + w]) {
        if (j === false || seen[j] || visited[j] || minCh(j) < pocketLevel) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
    if (pocket.length >= minPocket) for (const i of pocket) visited[i] = 1;
  }
  for (let i = 0; i < w * h; i++) {
    if (visited[i]) {
      px[i * 4 + 3] = 0;
      continue;
    }
    const x = i % w;
    const y = (i - x) / w;
    const nb = [];
    if (x > 0) nb.push(i - 1);
    if (x < w - 1) nb.push(i + 1);
    if (y > 0) nb.push(i - w);
    if (y < h - 1) nb.push(i + w);
    if (nb.some((j) => visited[j])) {
      // Anti-aliased edge: fade alpha by how close to white the pixel is
      const lum = (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3;
      px[i * 4 + 3] = Math.round(Math.min(255, Math.max(0, (255 - lum) * 2)));
    }
  }
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `${id}.png`);
  await sharp(px, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('wrote ', out);
}

/** `<folder>/<id>.png` ids in a processed output folder. */
function pngIds(dir) {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.png'))
        .map((f) => basename(f, '.png'))
        .sort()
    : [];
}

/** Maps for expansion sub-folders plus a lookup that searches the base map first. */
function expansionBlock(kind) {
  const subs = Object.entries(kind.expansions ?? {});
  const folder = basename(kind.outDir);
  const maps = subs
    .map(([sub, constName]) => {
      const lines = pngIds(join(kind.outDir, sub))
        .map((id) => `  ${id}: '/${folder}/${sub}/${id}.png',`)
        .join('\n');
      return `
/** Expansion art from \`${kind.rawDir}/${sub}/\`. */
export const ${constName}: Record<string, string> = {
${lines}
};
`;
    })
    .join('');
  const lookup = [kind.constName, ...subs.map(([, c]) => c)].map((c) => `${c}[id]`).join(' ?? ');
  return `${maps}
export function ${kind.fnName}(id: string): string | undefined {
  return ${lookup};
}
`;
}

function writeRegistry(kind) {
  const ids = existsSync(kind.outDir)
    ? readdirSync(kind.outDir)
        .filter((f) => f.endsWith('.png'))
        .map((f) => basename(f, '.png'))
        .sort()
    : [];
  const folder = basename(kind.outDir);
  // `<id>_alt_<n>` files are skins of <id>, not ids of their own
  const skins = {};
  const baseIds = [];
  for (const id of ids) {
    const m = kind.skins && id.match(/^(.+)_alt_(\d+)$/);
    if (m) (skins[m[1]] ??= [])[Number(m[2]) - 1] = `/${folder}/${id}.png`;
    else baseIds.push(id);
  }
  const skinsName = kind.constName.replace('_ART', '_SKINS');
  const lines = baseIds.map((id) => `  ${id}: '/${folder}/${id}.png',`).join('\n');
  const skinLines = Object.entries(skins)
    .map(
      ([id, list]) =>
        `  ${id}: [${list
          .filter(Boolean)
          .map((u) => `'${u}'`)
          .join(', ')}],`,
    )
    .join('\n');
  const skinBlock = kind.skins
    ? `
/** Alternate skins per hero – \`${folder}/<id>_alt_<n>.png\` → ${skinsName}[id][n - 1]. */
export const ${skinsName}: Record<string, string[]> = {
${skinLines}
};

/** Default art, or skin \`skin\` (1-based) when the hero has one. */
export function ${kind.fnName}(id: string, skin = 0): string | undefined {
  return (skin > 0 ? ${skinsName}[id]?.[skin - 1] : undefined) ?? ${kind.constName}[id];
}

export function ${kind.fnName.replace('Art', 'Skins')}(id: string): string[] {
  return ${skinsName}[id] ?? [];
}
`
    : expansionBlock(kind);
  writeFileSync(
    kind.registry,
    `/**
 * GENERATED by scripts/art.mjs – do not edit by hand.
 * Drop a raw image into ${kind.rawDir}/<id>.png and run \`npm run ${kind.label}-art\`.
 * ${kind.label === 'hero' ? 'Heroes' : 'Monsters'} without art fall back to the procedural glyph portrait.
 */
export const ${kind.constName}: Record<string, string> = {
${lines}
};
${skinBlock}`,
  );
  console.log(`registry (${baseIds.length}):`, baseIds.join(', ') || '–');
  for (const sub of Object.keys(kind.expansions ?? {})) {
    const ids = pngIds(join(kind.outDir, sub));
    console.log(`registry ${sub} (${ids.length}):`, ids.join(', ') || '–');
  }
  if (kind.skins && Object.keys(skins).length)
    console.log(
      'skins:',
      Object.entries(skins)
        .map(([id, l]) => `${id}×${l.filter(Boolean).length}`)
        .join(', '),
    );
}

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const args = argv.filter((a) => !a.startsWith('--'));
const kindName = args[0];
const kind = KINDS[kindName];
if (!kind) {
  console.error('usage: node scripts/art.mjs <hero|monster> [--force] [input id]');
  process.exit(1);
}
const [, input, id] = args;

/** Knock out every raw image in `rawDir` that is new or changed since it was last processed. */
async function processDir(rawDir, outDir) {
  if (!existsSync(rawDir)) return;
  const files = readdirSync(rawDir).filter(
    (f) =>
      statSync(join(rawDir, f)).isFile() && /\.(png|jpe?g|webp)$/i.test(f) && !/_alt\./i.test(f),
  );
  for (const f of files) {
    const outId = basename(f, extname(f)).toLowerCase();
    const out = join(outDir, `${outId}.png`);
    const upToDate = existsSync(out) && statSync(join(rawDir, f)).mtimeMs <= statSync(out).mtimeMs;
    if (!force && upToDate) {
      console.log('skip  ', outId, '(up to date)');
      continue;
    }
    await knockout(join(rawDir, f), outDir, outId);
  }
}

if (input && id) {
  await knockout(input, kind.outDir, id.toLowerCase());
} else {
  if (!existsSync(kind.rawDir)) {
    console.log(`(no ${kind.rawDir} directory – nothing to process)`);
  } else {
    await processDir(kind.rawDir, kind.outDir);
    for (const sub of Object.keys(kind.expansions ?? {}))
      await processDir(join(kind.rawDir, sub), join(kind.outDir, sub));
  }
}
writeRegistry(kind);
