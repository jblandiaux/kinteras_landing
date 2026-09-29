/**
 * Derives the landing's committed image assets from the two raw sources
 * (the game wordmark and the hero video's first frame).
 *
 * Run once with `npm run assets:prepare`; the outputs are committed, so CI and
 * the Cloudflare build never need sharp or ffmpeg. Re-run only when a source
 * changes.
 *
 * Sources that live outside this repo (the game frontend, the promo video) are
 * read through SOURCE_* env vars rather than hardcoded paths, because this repo
 * is deliberately standalone and must still build on a machine that has no
 * checkout of the game.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const WORDMARK_SRC = process.env.SOURCE_WORDMARK ?? 'assets-src/wordmark-src.png';
const OUT = 'public/assets/logo';

const BG = '#0c1230';
const ACCENT = '#fbbf24';

await mkdir(OUT, { recursive: true });

// 1. Wordmark ------------------------------------------------------------
// The game ships it on a 500x500 canvas that is mostly transparent padding.
// Left as-is, every layout would need magic negative margins to look centred,
// and the intrinsic aspect ratio would lie about the glyphs' real proportions.
const trimmed = await sharp(WORDMARK_SRC)
  .trim({ threshold: 1 })
  .toBuffer({ resolveWithObject: true });

console.log(`wordmark trimmed: ${trimmed.info.width}x${trimmed.info.height}`);

// Shipped at its native trimmed size. No @2x variant: the source is 447px wide
// and the wordmark displays at 180-220px, so this file already *is* the 2x asset.
// Upscaling it would add bytes and no detail.
// Palette PNG, not WebP: the wordmark is a two-hue gradient on transparency, so
// quantising to a palette (18.9 KB) beats lossy WebP at every quality that keeps
// the gold clean (21 KB at q72, 27 KB at q90). The icons below go the other way
// because they are full-colour artwork.
{
  const info = await sharp(trimmed.data)
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(`${OUT}/wordmark.png`);
  console.log(`  wordmark.png: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
}

// 2. Favicon -------------------------------------------------------------
// The full wordmark is unreadable at 32px, so the favicon is the "K" alone:
// crop the left ~17% of the trimmed wordmark, then pad to a square.
// The wordmark's glyphs touch: there is no transparent gutter after the K, so
// scanning the alpha profile finds the gap after "KIN", not after "K". The crop
// width below was tuned against rendered candidates — 88/447 keeps the K body
// and lets its swash exit the frame cleanly, while 100 already drags in the "I".
const K_CROP_RATIO = 88 / 447;
const kBuf = await sharp(trimmed.data)
  .extract({
    left: 0,
    top: 0,
    width: Math.round(trimmed.info.width * K_CROP_RATIO),
    height: trimmed.info.height,
  })
  .trim({ threshold: 1 })
  .resize({ width: 380, height: 380, fit: 'inside' })
  .toBuffer();

// Rendered at the sizes browsers actually request. A single 512px file would be
// 130 KB and still look muddy at 16px, because in-browser downscaling of a gold
// gradient is not the same as resampling it here. 180 is the apple-touch size.
for (const [name, size] of [['public/apple-touch-icon.png', 180], ['public/favicon-32.png', 32]]) {
  const inner = await sharp(kBuf)
    .resize({ width: Math.round(size * 0.74), height: Math.round(size * 0.74), fit: 'inside' })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: inner, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(name);
  console.log(`  ${name}: ${size}x${size}`);
}

// 3. OpenGraph card ------------------------------------------------------
// 1200x630 is the size every platform crops from; anything else gets letterboxed.
const OG_W = 1200;
const OG_H = 630;

const backdrop = Buffer.from(`
<svg width="${OG_W}" height="${OG_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="a" cx="22%" cy="8%" r="62%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="82%" cy="96%" r="62%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect width="100%" height="100%" fill="url(#a)"/>
  <rect width="100%" height="100%" fill="url(#b)"/>
</svg>`);

// Text rendering through librsvg depends on the host's fontconfig, which is not
// guaranteed. Probe it: rasterise the tagline and check that ink actually
// landed. If it did not, ship the wordmark-only card rather than a blank strip —
// og:title already carries the tagline on every platform that matters.
const taglineSvg = Buffer.from(`
<svg width="1000" height="70" xmlns="http://www.w3.org/2000/svg">
  <text x="500" y="50" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="44" font-weight="700" letter-spacing="3" fill="${ACCENT}">
    YOUR RUN BECOMES AN RPG.
  </text>
</svg>`);

let tagline = null;
try {
  const raster = await sharp(taglineSvg).png().toBuffer();
  const { channels } = await sharp(raster).stats();
  // A blank rasterisation has zero variance in the alpha channel.
  if (channels[3] && channels[3].max > 0 && channels[3].mean > 0.5) {
    tagline = raster;
  }
} catch (err) {
  console.warn(`  tagline rasterisation failed: ${err.message}`);
}

const ogWordmark = await sharp(trimmed.data)
  .resize({ width: tagline ? 640 : 760, fit: 'inside' })
  .toBuffer({ resolveWithObject: true });

// Centre the wordmark+tagline as one block. Centring each element against the
// canvas independently is what leaves a dead band at the bottom of the card.
const GAP = 34;
const taglineH = tagline ? (await sharp(tagline).metadata()).height : 0;
const blockH = ogWordmark.info.height + (tagline ? GAP + taglineH : 0);
const blockTop = Math.round((OG_H - blockH) / 2);

const layers = [
  {
    input: ogWordmark.data,
    left: Math.round((OG_W - ogWordmark.info.width) / 2),
    top: blockTop,
  },
];
if (tagline) {
  const taglineW = (await sharp(tagline).metadata()).width;
  layers.push({
    input: tagline,
    left: Math.round((OG_W - taglineW) / 2),
    top: blockTop + ogWordmark.info.height + GAP,
  });
  console.log('  tagline: rendered');
} else {
  console.log('  tagline: SKIPPED (no usable system font) — wordmark-only card');
}

const og = await sharp(backdrop).composite(layers).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log(`  og.png: ${og.width}x${og.height}, ${(og.size / 1024).toFixed(1)} KB`);

// 4. Gameplay loop icons -------------------------------------------------
// A blue-and-gold set drawn for the web (runner, chest, creature, swords,
// compass), kept in assets-src/loop/ as 256px transparent PNGs. They live here
// rather than in the game's folder because the landing is standalone.
const LOOP_SRC = 'assets-src/loop';
const LOOP_ICONS = ['run', 'loot', 'creatures', 'fight', 'explore'];

for (const name of LOOP_ICONS) {
  // 192px for an icon that renders at 64-96 CSS px: covers 2x at the largest
  // size and 3x on phones.
  const info = await sharp(`${LOOP_SRC}/${name}.png`)
    .trim({ threshold: 1 })
    .resize({ width: 192, height: 192, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(`public/assets/icons/${name}.webp`);
  console.log(`  icons/${name}.webp: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
}

// Game art below is read straight from the game's public assets.
const GAME_ASSETS =
  process.env.SOURCE_GAME_ASSETS ?? '../Kinetra_frontend/public/assets';

// 5. Game art for the content sections -----------------------------------
// Scenes, zone banners, creatures and element glyphs, all straight from the
// game. WebP everywhere except the element glyphs: at 64px a palette PNG is
// smaller than any WebP that keeps their outline crisp.
const ART = 'public/assets';

/** [source under GAME_ASSETS, output under public/assets, max width] */
const WEBP_ART = [
  ['backgrounds/quest_hero.png', 'scenes/night-road.webp', 1600],
  ['backgrounds/zones/Kinteras_WorldMap.png', 'scenes/world-map.webp', 688],
  ...['awakened-plains', 'ash-caverns', 'frozen-ruins', 'storm-isles', 'ardent-nexus'].map(
    (zone) => [`backgrounds/zones/banner/${zone}.png`, `zones/${zone}.webp`, 900],
  ),
  // 384px covers a ~190px-wide card image at 2x.
  ...['pyrodrake', 'tsunamion', 'voltguard', 'tectonarch', 'verdant_oracle'].map(
    (creature) => [`creatures/No_BG/${creature}.png`, `creatures/${creature}.webp`, 384],
  ),
];

for (const [src, out, maxWidth] of WEBP_ART) {
  const dest = `${ART}/${out}`;
  await mkdir(dest.slice(0, dest.lastIndexOf('/')), { recursive: true });
  const info = await sharp(`${GAME_ASSETS}/${src}`)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(dest);
  console.log(`  ${out}: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
}

await mkdir(`${ART}/elements`, { recursive: true });
for (const element of ['fire', 'water', 'electric', 'stone', 'nature']) {
  const info = await sharp(`${GAME_ASSETS}/elements/${element}.png`)
    .resize({ width: 64, height: 64, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(`${ART}/elements/${element}.png`);
  console.log(`  elements/${element}.png: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
}
