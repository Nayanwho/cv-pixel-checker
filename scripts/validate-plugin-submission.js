import fs from 'fs';
import path from 'path';
import { loadImage } from '@napi-rs/canvas';

const root = process.cwd();
const pluginRoot = path.join(root, 'plugins', 'cv-pixel-checker');
const manifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const ui = manifest.interface || {};
const errors = [];

function requireText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${label} is required`);
    return;
  }
  if (value.includes('\n')) errors.push(`${label} must be one line`);
  if (value.length > maxLength) {
    errors.push(`${label} must be ${maxLength} characters or fewer`);
  }
}

function requireHttpsUrl(value, label) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') errors.push(`${label} must use HTTPS`);
    if (value.length > 1024) errors.push(`${label} must be 1,024 characters or fewer`);
  } catch {
    errors.push(`${label} must be a valid URL`);
  }
}

requireText(manifest.name, 'Package name', 64);
if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(manifest.name || '')) {
  errors.push('Package name contains unsupported characters');
}
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version || '')) {
  errors.push('Version must use semantic versioning');
}

requireText(ui.displayName, 'Display name', 30);
requireText(ui.shortDescription, 'Short description', 30);
if (typeof ui.longDescription !== 'string' || !ui.longDescription.trim()) {
  errors.push('Long description is required');
} else if (ui.longDescription.length > 4000) {
  errors.push('Long description must be 4,000 characters or fewer');
}
requireText(ui.developerName, 'Developer name', 80);

const allowedCategories = new Set([
  'Productivity',
  'Creativity',
  'Developer Tools',
  'Business & Operations',
  'Data & Analytics',
  'Communication',
  'Education & Research',
  'Security',
  'Finance',
  'Healthcare',
  'Travel',
  'Entertainment',
  'Other'
]);
if (!allowedCategories.has(ui.category)) errors.push('Category is not supported');

if (!Array.isArray(ui.capabilities) || ui.capabilities.length > 20) {
  errors.push('Capabilities must contain no more than 20 entries');
} else {
  ui.capabilities.forEach((capability, index) => {
    requireText(capability, `Capability ${index + 1}`, 120);
  });
}

for (const [field, label] of [
  ['websiteURL', 'Website URL'],
  ['supportURL', 'Support URL'],
  ['privacyPolicyURL', 'Privacy policy URL'],
  ['termsOfServiceURL', 'Terms URL']
]) {
  requireHttpsUrl(ui[field], label);
}

if (!Array.isArray(ui.defaultPrompt) || ui.defaultPrompt.length > 3) {
  errors.push('Starter prompts must contain no more than three entries');
} else {
  const normalized = new Set();
  ui.defaultPrompt.forEach((prompt, index) => {
    requireText(prompt, `Starter prompt ${index + 1}`, 128);
    if (prompt.includes('@')) errors.push(`Starter prompt ${index + 1} must not contain an app mention`);
    const key = prompt.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (normalized.has(key)) errors.push(`Starter prompt ${index + 1} is duplicated`);
    normalized.add(key);
  });
}

for (const field of ['composerIcon', 'logo', 'logoDark']) {
  const relativePath = ui[field];
  const absolutePath = path.resolve(pluginRoot, relativePath || '');
  if (!relativePath || !absolutePath.startsWith(`${pluginRoot}${path.sep}`) || !fs.existsSync(absolutePath)) {
    errors.push(`${field} must point to an existing plugin asset`);
    continue;
  }
  if (path.extname(absolutePath).toLowerCase() !== '.png') {
    errors.push(`${field} must be a PNG`);
    continue;
  }
  const image = await loadImage(absolutePath);
  if (image.width < 256 || image.height < 256) {
    errors.push(`${field} must be at least 256 x 256`);
  }
  if (field === 'composerIcon' && fs.statSync(absolutePath).size > 10 * 1024) {
    errors.push('composerIcon must be 10 KB or smaller for ChatGPT developer-mode upload');
  }
}

if (manifest.apps !== undefined) {
  errors.push('Public submission must use the production MCP URL, not an existing app integration reference');
}

if (errors.length) {
  console.error('Plugin submission validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Plugin submission metadata passed: ${manifest.name} ${manifest.version}`);
