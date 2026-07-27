import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { generateProbeCatalog, generateAdaptiveMidpointProbe, FIELD_PROFILES } from './probeGenerator.js';
import { fitSkynetModel, saveCalibratedProfiles } from './modelFitter.js';

const RESULTS_PATH = path.resolve(process.cwd(), 'calibration/data/calibration-results.json');

function loadResults() {
  if (fs.existsSync(RESULTS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveResults(data) {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runInteractiveCalibration() {
  console.log(`\n===============================================================`);
  console.log(`🤖 SKYNET BLACK-BOX CV RENDERER HUMAN-IN-THE-LOOP CALIBRATOR`);
  console.log(`===============================================================\n`);

  console.log(`📋 ENVIRONMENT SETUP CHECKLIST:`);
  console.log(`  1. Browser Zoom: Set to exactly 100% (Cmd+0)`);
  console.log(`  2. Display Scale: Keep OS scale constant throughout test`);
  console.log(`  3. Template: Use identical Skynet template & section`);
  console.log(`  4. Trailing Spaces: Do NOT add extra spaces when pasting\n`);

  console.log(`Select Profile to Calibrate:`);
  console.log(`  1. LARGE-A (Large Width Field - Historical ~599px)`);
  console.log(`  2. SMALL-A (Smaller Width Field - Historical ~559px)`);
  console.log(`  3. ACADEMIC-WIDE (Academic Wide Field - Historical ~677.7px)`);

  const choice = await askQuestion('\nEnter choice (1, 2, or 3) [Default 1]: ');
  let profileId = 'LARGE-A';
  if (choice.trim() === '2') profileId = 'SMALL-A';
  if (choice.trim() === '3') profileId = 'ACADEMIC-WIDE';

  console.log(`\n🎯 Selected Profile: ${profileId} (${FIELD_PROFILES[profileId]?.name})`);

  let results = loadResults();
  let probeCatalog = generateProbeCatalog(profileId);

  // Filter out already tested probes
  const testedIds = new Set(results.map(r => r.id));
  let remainingProbes = probeCatalog.filter(p => !testedIds.has(p.id));

  console.log(`📊 Progress: ${results.length} probes recorded. ${remainingProbes.length} initial catalog probes remaining.\n`);

  let continueTesting = true;
  let sessionCount = 0;

  while (continueTesting && remainingProbes.length > 0) {
    const probe = remainingProbes.shift();
    sessionCount++;

    console.log(`---------------------------------------------------------------`);
    console.log(`📌 PROBE ID:    ${probe.id}`);
    console.log(`🏷️ PHASE:       ${probe.phaseName}`);
    console.log(`🎯 TARGET FIELD: ${probe.profile}`);
    console.log(`📏 ENGINE WIDTH: ${probe.engineWidthPx.toFixed(2)} px`);
    console.log(`✏️ FORMATTING:   ${probe.formattingInstruction}`);
    console.log(`---------------------------------------------------------------`);
    console.log(`📋 EXACT COPY-READY TEXT:\n`);
    console.log(`"${probe.text}"\n`);
    console.log(`---------------------------------------------------------------`);

    console.log(`Select Observable Result in Skynet:`);
    console.log(`  1 = Fits with visible gap (Underfilled)`);
    console.log(`  2 = Fits with hairline gap (Near-limit)`);
    console.log(`  3 = Touches boundary (Exact brim)`);
    console.log(`  4 = WRAPS onto line 2 (Overflow)`);
    console.log(`  5 = Clipped or abnormal rendering`);
    console.log(`  q = Quit & save calibration profile`);

    const ans = await askQuestion('\nEnter observation (1-5 or q): ');

    if (ans.trim().toLowerCase() === 'q') {
      console.log('\nExiting calibration session...');
      continueTesting = false;
      break;
    }

    const obsCode = parseInt(ans.trim(), 10) || 1;
    const oneLine = obsCode === 1 || obsCode === 2 || obsCode === 3;
    let wrappedToken = null;

    if (!oneLine) {
      wrappedToken = await askQuestion('Enter first wrapped word or character on line 2 (optional): ');
      wrappedToken = wrappedToken.trim() || null;
    }

    const rec = {
      id: probe.id,
      phase: probe.phase,
      profile: probe.profile,
      text: probe.text,
      segments: probe.segments,
      formattingInstruction: probe.formattingInstruction,
      engineWidthPx: probe.engineWidthPx,
      historicalTargetPx: probe.historicalTargetPx,
      tag: probe.tag,
      obsCode,
      oneLine,
      wrappedToken,
      timestamp: new Date().toISOString()
    };

    results.push(rec);
    saveResults(results);

    // Fit model & update calibrated profile
    const fitted = fitSkynetModel(results);
    saveCalibratedProfiles(fitted);

    const profStats = fitted.profiles[profileId];
    if (profStats) {
      console.log(`\n📈 CURRENT CALIBRATED STATS FOR ${profileId}:`);
      console.log(`   • Largest Observed Fit:  ${profStats.largestObservedFitPx} px`);
      console.log(`   • Smallest Observed Wrap: ${profStats.smallestObservedWrapPx} px`);
      console.log(`   • Estimated Boundary:     ${profStats.estimatedAbsoluteBoundaryPx} px`);
      console.log(`   • Uncertainty Interval:   ±${profStats.uncertaintyPx} px`);
      console.log(`   • Recommended Safe Limit: ${profStats.recommendedSafeLimitPx} px\n`);

      // If uncertainty is small (<2px), inject adaptive binary search probe
      if (profStats.uncertaintyPx < 5.0 && profStats.uncertaintyPx > 0.5 && sessionCount % 2 === 0) {
        const midProbe = generateAdaptiveMidpointProbe(profileId, profStats.largestObservedFitPx, profStats.smallestObservedWrapPx, sessionCount);
        remainingProbes.unshift(midProbe);
        console.log(`🎯 Injected Adaptive Midpoint Binary-Search Probe (${midProbe.engineWidthPx.toFixed(1)}px)`);
      }
    }

    const nextPrompt = await askQuestion('Press Enter for next probe (or type "q" to stop): ');
    if (nextPrompt.trim().toLowerCase() === 'q') {
      continueTesting = false;
    }
  }

  // Generate final report summary
  const finalFitted = fitSkynetModel(results);
  saveCalibratedProfiles(finalFitted);

  console.log(`\n===============================================================`);
  console.log(`🎉 CALIBRATION SESSION SUMMARY`);
  console.log(`===============================================================`);
  console.log(`Total Human Probes Recorded: ${results.length}`);
  console.log(JSON.stringify(finalFitted, null, 2));
  console.log(`===============================================================\n`);

  rl.close();
}

runInteractiveCalibration().catch(err => {
  console.error('Error in calibration runner:', err);
  rl.close();
});
