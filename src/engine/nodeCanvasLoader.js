import { createRequire } from 'module';
import { fileURLToPath } from 'url';

export function loadNodeCanvas() {
  const req = createRequire(import.meta.url);
  const { GlobalFonts, createCanvas } = req('@napi-rs/canvas');
  const fontDir = fileURLToPath(new URL('../../public/fonts/', import.meta.url));

  GlobalFonts.registerFromPath(`${fontDir}EBGaramond-Regular.ttf`, 'EB Garamond');
  GlobalFonts.registerFromPath(`${fontDir}EBGaramond-Bold.ttf`, 'EB Garamond');

  if (!GlobalFonts.has('EB Garamond')) {
    throw new Error(`EB Garamond could not be registered from ${fontDir}`);
  }

  const canvas = createCanvas(2000, 200);
  return { canvas, fontStatus: 'ready' };
}
