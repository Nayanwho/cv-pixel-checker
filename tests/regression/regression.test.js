import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { measureCvLine } from '../../src/engine/measurementEngine.js';
import app from '../../server.js';

let server = null;
let BASE_URL = process.env.TEST_BASE_URL || null;

before(async () => {
  if (BASE_URL) return;
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.on('error', reject);
  });
  const port = server.address().port;
  BASE_URL = `http://127.0.0.1:${port}`;
});

after(() => {
  if (server) {
    server.close();
  }
});

const REGRESSION_SAMPLES = [
  {
    text: 'Improved fulfilment accuracy by 18% through workflow redesign',
    maxWidthPx: 599
  },
  {
    text: 'Led a cross-functional team to deliver the project two weeks ahead of schedule',
    maxWidthPx: 559
  },
  {
    text: 'Coordinated administration & execution for the National Policy Summit, managing 50+ key stakeholders.',
    maxWidthPx: 599
  }
];

test('Regression Comparison: Direct Engine vs REST API Output (Tolerance <= 0.25 CSS px)', async () => {
  let maxDiff = 0;

  for (const sample of REGRESSION_SAMPLES) {
    const directResult = measureCvLine({
      text: sample.text,
      maxWidthPx: sample.maxWidthPx
    });

    const res = await fetch(`${BASE_URL}/api/v1/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sample)
    });

    assert.equal(res.status, 200);
    const apiResult = await res.json();

    const diff = Math.abs(directResult.widthPx - apiResult.widthPx);
    if (diff > maxDiff) maxDiff = diff;

    assert.ok(
      diff <= 0.25,
      `Engine vs API difference (${diff}px) exceeded tolerance of 0.25px for sample: "${sample.text}"`
    );
    assert.equal(directResult.lineCount, apiResult.lineCount);
    assert.equal(directResult.fits, apiResult.fits);
  }

  console.log(`Regression Test Passed! Maximum observed difference between Direct Engine and REST API: ${maxDiff.toFixed(4)} CSS pixels.`);
});
