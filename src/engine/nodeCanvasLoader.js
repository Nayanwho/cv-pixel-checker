import { createRequire } from 'module';
import path from 'path';

export function loadNodeCanvas() {
  const req = createRequire(import.meta.url);
  const { GlobalFonts, createCanvas } = req('@napi-rs/canvas');
  const fontDir = path.resolve(process.cwd(), 'public/fonts');

  GlobalFonts.registerFromPath(path.join(fontDir, 'EBGaramond-Regular.ttf'), 'EB Garamond');
  GlobalFonts.registerFromPath(path.join(fontDir, 'EBGaramond-Bold.ttf'), 'EB Garamond');

  const canvas = createCanvas(2000, 200);
  return { canvas, fontStatus: 'ready' };
}
