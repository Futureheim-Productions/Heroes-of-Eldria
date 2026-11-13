/**
 * Brand assets: logo + menu background.
 *
 *   npm run brand-art
 *     art/raw/brand/logo.jpg            → public/logo.png      (black background → alpha, trimmed, 800 px wide)
 *     art/raw/brand/menu_background.jpg → public/bg-menu.jpg   (1600 px wide, q82)
 *     art/raw/brand/bg-battle.jpg       → public/bg-battle.jpg (same)
 *
 * The logo is "glow on black" art, so alpha is derived from brightness (max channel) and the
 * colour is un-premultiplied – edges and the purple glow blend cleanly onto any dark background.
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const LOGO_IN = 'art/raw/brand/logo.jpg';
const BACKGROUNDS = {
  'art/raw/brand/menu_background.jpg': 'public/bg-menu.jpg',
  'art/raw/brand/bg-battle.jpg': 'public/bg-battle.jpg',
};

if (existsSync(LOGO_IN)) {
  const { data: px, info } = await sharp(LOGO_IN)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < info.width * info.height; i++) {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    // Alpha floor removes JPEG noise in the near-black areas
    const a = Math.max(0, Math.round(((Math.max(r, g, b) - 20) * 255) / 235));
    if (a === 0) {
      px[i * 4 + 3] = 0;
      continue;
    }
    px[i * 4] = Math.min(255, Math.round((r * 255) / a));
    px[i * 4 + 1] = Math.min(255, Math.round((g * 255) / a));
    px[i * 4 + 2] = Math.min(255, Math.round((b * 255) / a));
    px[i * 4 + 3] = a;
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .resize({ width: 800, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile('public/logo.png');
  console.log('wrote  public/logo.png');
}

for (const [input, out] of Object.entries(BACKGROUNDS)) {
  if (!existsSync(input)) continue;
  await sharp(input)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log('wrote ', out);
}
