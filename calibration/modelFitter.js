import fs from 'fs';
import path from 'path';

/**
 * Fit empirical mathematical calibration parameters from human observations
 */
export function fitSkynetModel(resultsDataset) {
  if (!Array.isArray(resultsDataset) || resultsDataset.length === 0) {
    return {
      status: 'insufficient_data',
      message: 'No human calibration results found. Complete at least Round 1 probes.'
    };
  }

  const profilesSummary = {};

  // Group by profileId
  const byProfile = {};
  resultsDataset.forEach(r => {
    const p = r.profile || 'LARGE-A';
    if (!byProfile[p]) byProfile[p] = [];
    byProfile[p].push(r);
  });

  Object.keys(byProfile).forEach(profileId => {
    const list = byProfile[profileId];

    const fitList = list.filter(r => r.oneLine === true || r.obsCode === 1 || r.obsCode === 2 || r.obsCode === 3);
    const wrapList = list.filter(r => r.oneLine === false || r.obsCode === 4);

    let largestFitPx = 0;
    let smallestWrapPx = Infinity;

    fitList.forEach(r => {
      if (r.engineWidthPx > largestFitPx) {
        largestFitPx = r.engineWidthPx;
      }
    });

    wrapList.forEach(r => {
      if (r.engineWidthPx < smallestWrapPx) {
        smallestWrapPx = r.engineWidthPx;
      }
    });

    if (smallestWrapPx === Infinity) {
      smallestWrapPx = largestFitPx + 20.0;
    }

    const estimatedAbsoluteBoundaryPx = (largestFitPx + smallestWrapPx) / 2;
    const uncertaintyPx = Math.abs(smallestWrapPx - largestFitPx) / 2;
    const safeMarginPx = Math.max(1.5, Math.ceil(uncertaintyPx * 1.5 * 100) / 100);
    const recommendedSafeLimitPx = Math.round((estimatedAbsoluteBoundaryPx - safeMarginPx) * 100) / 100;

    // Detect update classification
    let updateType = 'width_only_change';
    const boldDivergence = list.filter(r => r.tag && r.tag.includes('Bold') && r.obsCode === 4);
    if (boldDivergence.length > 0) {
      updateType = 'bold_and_width_change';
    }

    profilesSummary[profileId] = {
      profileId,
      largestObservedFitPx: Math.round(largestFitPx * 100) / 100,
      smallestObservedWrapPx: Math.round(smallestWrapPx * 100) / 100,
      estimatedAbsoluteBoundaryPx: Math.round(estimatedAbsoluteBoundaryPx * 100) / 100,
      uncertaintyPx: Math.round(uncertaintyPx * 100) / 100,
      recommendedSafeLimitPx,
      updateClassification: updateType,
      sampleCount: list.length,
      fitCount: fitList.length,
      wrapCount: wrapList.length
    };
  });

  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    modelVersion: 'skynet-blackbox-2026-07-v1',
    profiles: profilesSummary
  };
}

/**
 * Save fitted profiles to production JSON file
 */
export function saveCalibratedProfiles(fittedModel) {
  const targetPath = path.resolve(process.cwd(), 'calibration/data/calibrated-profiles.json');
  fs.writeFileSync(targetPath, JSON.stringify(fittedModel, null, 2), 'utf8');
  console.log(`✅ Calibrated profiles saved to ${targetPath}`);
}
