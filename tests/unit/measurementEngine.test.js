import test from 'node:test';
import assert from 'node:assert/strict';
import {
  measureCvLine,
  measureCvBatch,
  parseTextToSegments,
  stripFormatting,
  ensureFontReady,
  getEngineStatus
} from '../../src/engine/measurementEngine.js';
import { analyzeFormattedSegments } from '../../src/utils/canvasMetrics.js';

test('CV Measurement Engine Initialization & Font Loading', async () => {
  const ready = await ensureFontReady();
  assert.equal(ready, true, 'Font should be ready in Node environment');
  const status = getEngineStatus();
  assert.equal(status.fontReady, true);
  assert.equal(status.serviceName || 'cv-pixel-checker', 'cv-pixel-checker');
});

test('Parsing Markdown Bold and Stripping Formatting', () => {
  const raw = '**Led an 18-member team** to secure ₹4.8L+';
  const segments = parseTextToSegments(raw);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].text, 'Led an 18-member team');
  assert.equal(segments[0].bold, true);
  assert.equal(segments[1].text, ' to secure ₹4.8L+');
  assert.equal(segments[1].bold, false);

  const stripped = stripFormatting(raw);
  assert.equal(stripped, 'Led an 18-member team to secure ₹4.8L+');
});

test('Single Line Measurement - Fits Underfilled', () => {
  const text = 'Led an 18-member sponsorship team to secure ₹4.8L+ from corporate partners';
  const result = measureCvLine({ text, maxWidthPx: 599 });

  assert.equal(result.fits, true);
  assert.equal(result.lineCount, 1);
  assert.equal(result.overflowPx, 0);
  assert.equal(result.status, 'underfilled');
  assert.ok(result.widthPx > 300 && result.widthPx < 599);
  assert.ok(result.remainingPx > 0);
});

test('Single Line Measurement - Exact Brim / Optimal Fit', () => {
  // Sentence tuned to fall between 98% and 100% of 599px (587px - 599px)
  const text = 'Led an 18-member sponsorship team to secure ₹4.8L+ from 30+ corporate partners and strategic stakeholders across region';
  const result = measureCvLine({ text, maxWidthPx: 599 });

  assert.ok(result.widthPx > 0);
  assert.ok(result.utilisationPct > 0);
  assert.equal(result.characterCount, text.length);
});

test('Multi-Line Overflow Detection & Character Diagnostics', () => {
  const longText = 'Engineered automated data pipelines using Python & SQL, accelerating reporting TAT by 35% & boosting overall team operational efficiency by 28% across departments';
  const result = measureCvLine({ text: longText, maxWidthPx: 599 });

  assert.equal(result.fits, false);
  assert.equal(result.lineCount > 1, true);
  assert.equal(result.status, 'multi-line');
  assert.equal(result.lines.length, result.lineCount);
  assert.ok(result.lines.every(line => line.widthPx <= 599));
  assert.ok(result.lines.every(line => Array.isArray(line.tokens) && line.tokens.length > 0));
  assert.equal(
    result.lines.map(line => line.text).join(' ').replace(/\s+/g, ' ').trim(),
    longText.replace(/\s+/g, ' ').trim(),
    'Wrapped preview lines must preserve the complete source text'
  );
  assert.ok(result.firstOverflowCharacterIndex !== null);
  assert.ok(result.maxFittingPrefix !== null);
  assert.ok(result.overflowText !== null);
  assert.ok(result.lastFittingWord !== null);
  assert.ok(result.estimatedCharsToRemove > 0);
});

test('UI adapter exposes the authoritative wrapped lines to the exact template preview', () => {
  const longText = 'Implemented Agile Kanban workflows & sprint planning across teams, reducing cycle time by 22% & driving 30% ROI growth';
  const metrics = analyzeFormattedSegments(
    [{ text: longText, bold: false }],
    419.25,
    9.75,
    'EB Garamond'
  );

  assert.equal(metrics.status, 'ORPHAN');
  assert.equal(metrics.numLines, 2);
  assert.equal(metrics.lines.length, 2);
  assert.ok(metrics.lines[0].widthPx <= metrics.targetLineWidthPx);
  assert.ok(metrics.lines[1].widthPx <= metrics.targetLineWidthPx);
  assert.equal(
    metrics.lines.map(line => line.text).join(' ').replace(/\s+/g, ' ').trim(),
    longText
  );
});

test('Batch Candidate Evaluation', () => {
  const batch = measureCvBatch({
    maxWidthPx: 599,
    candidates: [
      { id: 'c1', text: 'Short bullet point' },
      { id: 'c2', text: 'Led an 18-member sponsorship team to secure ₹4.8L+ from corporate partners' }
    ]
  });

  assert.equal(batch.summary.totalCandidates, 2);
  assert.equal(batch.results.length, 2);
  assert.equal(batch.results[0].id, 'c1');
  assert.equal(batch.results[1].id, 'c2');
});
