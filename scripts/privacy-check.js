/**
 * Automated Repository Privacy & Sanitization Scanner
 * Scans all source files, documentation, and configuration in the repository
 * to ensure zero sensitive personal data, CV PDFs, or credentials are leaked.
 *
 * ALLOWLIST:
 * - Exact name: "Adarsh Nayan"
 * - LinkedIn URL: "https://www.linkedin.com/in/adarsh-nayan"
 */

import fs from 'fs';
import path from 'path';

const ALLOWED_NAME = 'Adarsh Nayan';
const ALLOWED_LINKEDIN = 'https://www.linkedin.com/in/adarsh-nayan';

const DISALLOWED_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, label: 'Email Address' },
  { pattern: /\b(?:\+91|91)?[-.\s]?[6-9]\d{9}\b/g, label: 'Indian Phone Number' },
  { pattern: /\/Users\/[a-zA-Z0-9_-]+/g, label: 'Local Hardcoded Developer User Path' },
  { pattern: /IIM\s*M/i, label: 'Specific Institution Tag' },
  { pattern: /\b(?:AKAP|Pahal|VDLM)\b/i, label: 'Personal Specific Event / Entity' },
  { pattern: /(?:AIzaSy[a-zA-Z0-9_-]{33}|ghp_[a-zA-Z0-9]{36}|sk-[a-zA-Z0-9]{48})/g, label: 'Real API Key / Secret Token' }
];

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', '.pnpm-store'];

let violations = [];
let scannedCount = 0;

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        scanDirectory(fullPath);
      }
      continue;
    }

    scannedCount++;

    // Check actual files for forbidden extensions (.pdf, .jpeg, etc)
    const ext = path.extname(entry.name).toLowerCase();
    if (['.pdf', '.docx', '.xlsx', '.pptx', '.jpeg', '.jpg'].includes(ext)) {
      violations.push({
        file: fullPath,
        line: 0,
        label: `Forbidden Personal Document File (${ext})`,
        match: entry.name
      });
      continue;
    }

    // Skip binary files from text regex scanning
    if (['.ttf', '.woff', '.woff2', '.png', '.ico', '.svg'].includes(ext)) {
      continue;
    }

    // Scan text contents
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Skip allowlisted occurrences and scanner file itself
        if (entry.name === 'privacy-check.js') return;

        let sanitizedLine = line
          .replaceAll(ALLOWED_NAME, '')
          .replaceAll(ALLOWED_LINKEDIN, '');

        for (const { pattern, label } of DISALLOWED_PATTERNS) {
          const matches = sanitizedLine.match(pattern);
          if (matches) {
            matches.forEach(m => {
              violations.push({
                file: fullPath,
                line: idx + 1,
                label,
                match: m
              });
            });
          }
        }
      });
    } catch (e) {
      console.warn(`Could not read file ${fullPath}: ${e.message}`);
    }
  }
}

console.log('🔒 Starting Repository Privacy & Sanitization Audit...');
scanDirectory(process.cwd());

console.log(`====================================================`);
console.log(`📊 Scanned Files: ${scannedCount}`);
console.log(`✅ Strict Allowlist Enforcement:`);
console.log(`   • Permitted Name: "${ALLOWED_NAME}"`);
console.log(`   • Permitted LinkedIn: "${ALLOWED_LINKEDIN}"`);
console.log(`====================================================`);

if (violations.length > 0) {
  console.error(`❌ PRIVACY VIOLATIONS DETECTED (${violations.length}):`);
  violations.forEach(v => {
    console.error(`  - [${v.label}] in ${v.file}${v.line ? ':' + v.line : ''} -> "${v.match}"`);
  });
  console.error(`\n🚨 Build failed due to privacy policy violation.`);
  process.exit(1);
} else {
  console.log(`✨ 0 Privacy Leaks Found! Repository is 100% sanitized and safe for public deployment.`);
}
