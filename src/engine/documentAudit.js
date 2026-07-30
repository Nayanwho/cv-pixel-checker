import {
  ensureFontReady,
  getEngineStatus,
  measureCvLine
} from './measurementEngine.js';

export const MAX_DOCUMENT_LINES = 200;

export async function auditCvDocument({ lines = [] } = {}) {
  const fontReady = await ensureFontReady();
  const engine = getEngineStatus();

  if (!fontReady) {
    const error = new Error('EB Garamond is not loaded; exact measurement is unavailable.');
    error.code = 'FONT_NOT_READY';
    throw error;
  }

  const results = lines.map((line, index) => {
    const id = line.id || `line-${index + 1}`;
    const result = measureCvLine({
      text: line.text || '',
      segments: line.segments,
      presetId: line.presetId || null,
      maxWidthPx: line.maxWidthPx ?? 599,
      style: line.style || {},
      targetRange: line.targetRange || {}
    });

    return {
      id,
      section: line.section || null,
      sourceIndex: index,
      presetId: line.presetId || null,
      ...result
    };
  });

  const byStatus = results.reduce((counts, result) => {
    counts[result.status] = (counts[result.status] || 0) + 1;
    return counts;
  }, {});
  const resultIds = new Set(results.map(result => result.id));
  const duplicateIds = results
    .map(result => result.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  const missingIds = lines
    .map((line, index) => line.id || `line-${index + 1}`)
    .filter(id => !resultIds.has(id));

  return {
    fontReady,
    coverageComplete:
      results.length === lines.length &&
      missingIds.length === 0 &&
      duplicateIds.length === 0,
    measurementVersion: engine.measurementVersion,
    measurementEnvironment: engine.environment,
    summary: {
      submittedLineCount: lines.length,
      measuredLineCount: results.length,
      optimalCount: byStatus.optimal || 0,
      fittingCount: results.filter(result => result.fits).length,
      overflowCount: results.filter(result => !result.fits).length,
      underfilledCount: byStatus.underfilled || 0,
      invalidInputCount: byStatus['invalid-input'] || 0,
      missingIds,
      duplicateIds: [...new Set(duplicateIds)],
      byStatus
    },
    results
  };
}
