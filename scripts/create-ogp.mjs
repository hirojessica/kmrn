import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Treat the brand mark as an existing asset: preserve its alpha exactly.
// Do not send the logo through image generation or redraw its lettering/curves.
const root = new URL('../', import.meta.url);
const { data, info } = await sharp(await fs.readFile(new URL('mockups/assets/logo.webp', root)))
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(info.channels, 4);
const originalAlpha = Buffer.from(data.filter((_, index) => index % 4 === 3));
for (let index = 0; index < data.length; index += 4) {
  data[index] = 139; data[index + 1] = 105; data[index + 2] = 77;
}
assert.deepEqual(Buffer.from(data.filter((_, index) => index % 4 === 3)), originalAlpha);
const logo = await sharp(data, { raw: info }).resize({ width: 580 }).png().toBuffer();
const target = new URL('mockups/assets/ogp-common-20260917-v2.jpg', root);
const result = await sharp(await fs.readFile(new URL('design/ogp/background-20260917.png', root)))
  .composite([{ input: logo, left: 55, top: 99 }])
  .jpeg({ quality: 92, mozjpeg: true }).toFile(fileURLToPath(target));
console.log(JSON.stringify({ originalLogo: `${info.width}x${info.height}`, logoAlphaPreserved: true, output: result }));
