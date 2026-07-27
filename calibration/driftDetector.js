import fs from 'fs';
import path from 'path';
import { measureCvLine } from '../src/engine/measurementEngine.js';

const CALIBRATED_PATH = path.resolve(process.cwd(), 'calibration/data/calibrated-profiles.json');

export const SMOKE_TEST_PROBES = [
  { id: 'SMOKE-LARGE-REG-01', profile: 'LARGE-A', text: 'Coordinated administration & execution for the National Policy Summit, managing 50+ key stakeholders.', maxWidthPx: 599 },
  { id: 'SMOKE-LARGE-BOLD-02', profile: 'LARGE-A', text: 'Spearheaded digital transformation & cloud migration for enterprise databases, freeing $120K annual spend', maxWidthPx: 599 },
  { id: 'SMOKE-SMALL-REG-03', profile: 'SMALL-A', text: 'Led a cross-functional team to improve delivery efficiency by 27%', maxWidthPx: 559 },
  { id: 'SMOKE-SMALL-SYMBOL-04', profile: 'SMALL-A', text: 'Secured ₹4.8L+ Corporate Sponsorship from 30+ strategic partners', maxWidthPx: 559 },
  { id: 'SMOKE-ACADEMIC-05', profile: 'ACADEMIC-WIDE', text: 'Sustained 80.20% across 8 semesters, ranking in top 7% of cohort', maxWidthPx: 677.67 }
];

export function runDriftCheck() {
  console.log(`\n===============================================================`);
  console.log(`🔍 SKYNET RENDERER DRIFT DETECTION SMOKE TEST`);
  console.log(`===============================================================\n`);

  let activeProfiles = null;
  if (fs.existsSync(CALIBRATED_PATH)) {
    try {
      activeProfiles = JSON.parse(fs.readFileSync(CALIBRATED_PATH, 'utf8'));
      console.log(`✅ Loaded Active Calibrated Profile Version: ${activeProfiles.modelVersion || 'v1'}`);
    } catch (e) {
      console.warn(`⚠️ Could not parse calibrated-profiles.json. Using fallback engine defaults.`);
    }
  } else {
    console.log(`ℹ️ No calibrated-profiles.json found. Run "npm run skynet-calibrate" first.`);
  }

  console.log(`\n📋 COMPACT SMOKE TEST PROBES (Paste in Skynet to verify zero drift):\n`);

  SMOKE_TEST_PROBES.forEach(p => {
    const meas = measureCvLine({ text: p.text, maxWidthPx: p.maxWidthPx });
    console.log(`ID:        ${p.id}`);
    console.log(`Profile:   ${p.profile}`);
    console.log(`Predicted: ${meas.widthPx.toFixed(2)}px (Fits: ${meas.fits ? 'YES (1 Line)' : 'NO (Multi-line)'})`);
    console.log(`Text:      "${p.text}"\n`);
  });

  console.log(`===============================================================`);
  console.log(`If any probe above behaves differently in Skynet than predicted,`);
  console.log(`run "npm run skynet-calibrate" to trigger dynamic recalibration.`);
  console.log(`===============================================================\n`);
}

if (process.argv[1] && process.argv[1].endsWith('driftDetector.js')) {
  runDriftCheck();
}
