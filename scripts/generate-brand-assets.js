import fs from 'fs';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';

const root = process.cwd();
const pluginAssets = path.join(root, 'plugins', 'cv-pixel-checker', 'assets');
const publicAssets = path.join(root, 'public');

fs.mkdirSync(pluginAssets, { recursive: true });
fs.mkdirSync(publicAssets, { recursive: true });

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function renderLogo({ dark = false } = {}) {
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  roundedRect(ctx, 8, 8, 240, 240, 56);
  ctx.fillStyle = dark ? '#111827' : '#4338CA';
  ctx.fill();

  ctx.strokeStyle = '#A5B4FC';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(72, 63);
  ctx.lineTo(52, 63);
  ctx.lineTo(52, 193);
  ctx.lineTo(72, 193);
  ctx.moveTo(184, 63);
  ctx.lineTo(204, 63);
  ctx.lineTo(204, 193);
  ctx.lineTo(184, 193);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PX', 128, 126);

  ctx.fillStyle = '#34D399';
  roundedRect(ctx, 79, 178, 98, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(177, 183, 7, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

const lightLogo = renderLogo();
const darkLogo = renderLogo({ dark: true });

fs.writeFileSync(path.join(pluginAssets, 'icon.png'), lightLogo);
fs.writeFileSync(path.join(pluginAssets, 'logo.png'), lightLogo);
fs.writeFileSync(path.join(pluginAssets, 'logo-dark.png'), darkLogo);
fs.writeFileSync(path.join(publicAssets, 'cv-pixel-checker-icon.png'), lightLogo);
