import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../server.js';

let server = null;
let BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

before(async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/health`);
    if (res.ok) return;
  } catch (e) {
    server = app.listen(0);
    const port = server.address().port;
    BASE_URL = `http://127.0.0.1:${port}`;
  }
});

after(() => {
  if (server) {
    server.close();
  }
});

test('GET /api/v1/health Returns 200 OK', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'cv-pixel-checker');
  assert.equal(data.fontReady, true);
});

test('POST /api/v1/check Evaluates Single Line Width', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Improved fulfilment accuracy by 18% through workflow redesign',
      maxWidthPx: 599
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(typeof data.widthPx, 'number');
  assert.equal(data.maxWidthPx, 599);
  assert.equal(data.fits, true);
  assert.equal(data.measurementVersion, '1.0.0');
});

test('POST /api/v1/check Validates Invalid Width Parameter', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Test line',
      maxWidthPx: -50
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error.code, 'INVALID_MAX_WIDTH');
});

test('POST /api/v1/check-batch Evaluates Multiple Candidates', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/check-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidates: [
        { text: 'Candidate line 1', maxWidthPx: 599 },
        { text: 'Candidate line 2', maxWidthPx: 559 }
      ]
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(Array.isArray(data.results), true);
  assert.equal(data.results.length, 2);
  assert.equal(data.summary.totalCandidates, 2);
});

test('GET /openapi.json Serves OpenAPI Spec', async () => {
  const res = await fetch(`${BASE_URL}/openapi.json`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.openapi, '3.1.0');
  assert.equal(data.info.title, 'CV Pixel Checker Measurement Service API');
});
