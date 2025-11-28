import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/icon.svg');

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

async function generateIcons() {
  for (const { size, name } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`./public/${name}`);
    console.log(`Generated ${name}`);
  }
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
