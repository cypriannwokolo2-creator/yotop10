import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const fontsDir = join(process.cwd(), 'public', 'fonts');

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export const geistSansRegular = toArrayBuffer(await readFile(join(fontsDir, 'geist-sans-regular.ttf')));
export const geistSansBold = toArrayBuffer(await readFile(join(fontsDir, 'geist-sans-bold.ttf')));
export const geistMonoRegular = toArrayBuffer(await readFile(join(fontsDir, 'geist-mono-regular.ttf')));

export interface OgFontEntry {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
}

export const ogSansFonts: OgFontEntry[] = [
  { name: 'Geist Sans', data: geistSansRegular, weight: 400, style: 'normal' },
  { name: 'Geist Sans', data: geistSansBold, weight: 700, style: 'normal' },
];

export const ogMonoFonts: OgFontEntry[] = [
  { name: 'Geist Mono', data: geistMonoRegular, weight: 400, style: 'normal' },
];

export const ogFonts: OgFontEntry[] = [...ogSansFonts, ...ogMonoFonts];
