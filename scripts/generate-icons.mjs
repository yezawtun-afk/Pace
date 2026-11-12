/**
 * Draws every app icon from one vector definition.
 *
 * Run with `npm run icons`. Keeping the art in code means the icon, the Android
 * adaptive layers, the splash mark and the favicon always agree, and changing
 * the brand colour is a one-line edit instead of four exports from a design tool.
 *
 * The mark is the same leaf as `LeafIcon` in `src/components/ui/icons.tsx`.
 */

import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const OUT = path.join(process.cwd(), 'assets', 'images');

const PAPER = '#FBF8F4';
const CHARCOAL = '#1C1917';
const TERRACOTTA = '#C4472E';
/** The dark-theme accent: the light terracotta from `src/constants/theme.ts`. */
const TERRACOTTA_LIGHT = '#F0927B';

// 24×24 geometry, copied from LeafIcon.
const LEAF = 'M20.5 3.5c0 9.4-6.6 16-16 16 0-9.4 6.6-16 16-16Z';
const VEIN = 'M4.5 19.5C7.4 14.6 10.9 11.1 15.8 8.2';

/** Bounding box of the leaf inside the 24×24 viewBox. */
const LEAF_BOX = { x: 4.5, y: 3.5, size: 16 };

/**
 * The leaf centred by its own bounding box, so optical centring does not depend
 * on the path's internal padding.
 */
function glyph({ canvas, leafWidth, fill, vein, stroke = 1.3 }) {
  const scale = leafWidth / LEAF_BOX.size;
  const offsetX = (canvas - leafWidth) / 2 - LEAF_BOX.x * scale;
  const offsetY = (canvas - leafWidth) / 2 - LEAF_BOX.y * scale;

  return `<g transform="translate(${offsetX.toFixed(2)} ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${LEAF}" fill="${fill}" />
    ${
      vein
        ? `<path d="${VEIN}" fill="none" stroke="${vein}" stroke-width="${stroke}" stroke-linecap="round" />`
        : ''
    }
  </g>`;
}

function document(canvas, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
  ${body}
</svg>`;
}

function tile({ canvas, leafWidth, background, fill, vein }) {
  return document(
    canvas,
    `<rect width="${canvas}" height="${canvas}" fill="${background}" />
  ${glyph({ canvas, leafWidth, fill, vein })}`,
  );
}

async function png(name, svg) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, name));
  console.log(`  ${name}`);
}

await mkdir(OUT, { recursive: true });

// The store icon: full-bleed square, the OS applies its own mask.
await png(
  'icon.png',
  tile({ canvas: 1024, leafWidth: 530, background: TERRACOTTA, fill: PAPER, vein: TERRACOTTA }),
);

// Android adaptive layers. The foreground keeps the mark inside the safe zone
// (66% of the canvas), the background is a flat colour from app.json.
await png(
  'android-icon-foreground.png',
  document(1024, glyph({ canvas: 1024, leafWidth: 420, fill: PAPER, vein: TERRACOTTA })),
);
await png(
  'android-icon-monochrome.png',
  document(1024, glyph({ canvas: 1024, leafWidth: 420, fill: '#000000' })),
);

// Splash mark, transparent so it sits on the paper (or charcoal) background.
await png(
  'splash-icon.png',
  document(512, glyph({ canvas: 512, leafWidth: 380, fill: TERRACOTTA, vein: PAPER })),
);
await png(
  'splash-icon-dark.png',
  document(512, glyph({ canvas: 512, leafWidth: 380, fill: TERRACOTTA_LIGHT, vein: CHARCOAL })),
);

// Browser tab.
await png(
  'favicon.png',
  tile({ canvas: 64, leafWidth: 38, background: TERRACOTTA, fill: PAPER, vein: TERRACOTTA }),
);

// Left over from the template: the colour now comes from app.json.
await rm(path.join(OUT, 'android-icon-background.png'), { force: true });

console.log('Icons written to assets/images.');
