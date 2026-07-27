import test from 'node:test';
import assert from 'node:assert/strict';
import { measureCvLine } from '../../src/engine/measurementEngine.js';

const BASE_URL = 'http://localhost:3000';

const TEST_DATASET = [
  {
    id: 'bullet-1',
    text: 'Engineered automated data pipelines using Python & SQL, accelerating reporting TAT by 35% & boosting overall efficiency by 28%',
    maxWidthPx: 599
  },
  {
    id: 'bullet-2',
    text: 'Implemented Agile Kanban workflows & sprint planning across teams, reducing cycle time by 22% & driving 30% ROI growth',
    maxWidthPx: 559
  },
  {
    id: 'bullet-3',
    text: 'Architected cloud migration for enterprise databases, freeing $120K annual spend & boosting uptime to 99.9%',
    maxWidthPx: 677.67
  },
  {
    id: 'bullet-4',
    text: 'Optimized customer onboarding experience & standard operating workflows',
    maxWidthPx: 599
  },
  {
    id: 'bullet-5',
    text: '**Led an 18-member sponsorship team** to secure ₹4.8L+ from 30+ corporate partners',
    maxWidthPx: 599
  }
];

test('Regression Comparison: Direct Engine vs REST API Output (Tolerance <= 0.25 CSS px)', async () => {
  let maxDifferencePx = 0;

  for (const item of TEST_DATASET) {
    const directResult = measureCvLine({ text: item.text, maxWidthPx: item.maxWidthPx });

    const apiRes = await fetch(`${BASE_URL}/api/v1/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: item.text, maxWidthPx: item.maxWidthPx })
    });

    assert.equal(apiRes.status, 200, `API request failed for ${item.id}`);
    const apiResult = await apiRes.json();

    const diff = Math.abs(directResult.widthPx - apiResult.widthPx);
    if (diff > maxDifferencePx) {
      maxDifferencePx = diff;
    }

    assert.ok(
      diff <= 0.25,
      `Width discrepancy for ${item.id} exceeds tolerance: direct=${directResult.widthPx}px, api=${apiResult.widthPx}px, diff=${diff}px`
    );

    assert.equal(directResult.fits, apiResult.fits, `Fit mismatch for ${item.id}`);
    assert.equal(directResult.status, apiResult.status, `Status mismatch for ${item.id}`);
    assert.equal(directResult.characterCount, apiResult.characterCount, `Char count mismatch for ${item.id}`);
  }

  console.log(`Regression Test Passed! Maximum observed difference between Direct Engine and REST API: ${maxDifferencePx.toFixed(4)} CSS pixels.`);
});
