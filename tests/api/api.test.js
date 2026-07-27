import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

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
      text: 'Led an 18-member sponsorship team to secure ₹4.8L+ from 30+ corporate partners',
      maxWidthPx: 599
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.fits, true);
  assert.ok(data.widthPx > 300);
  assert.equal(data.characterCount, 78);
});

test('POST /api/v1/check Validates Invalid Width Parameter', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Sample bullet',
      maxWidthPx: 10 // Invalid < 50
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
      maxWidthPx: 599,
      candidates: [
        { id: 'cand-1', text: 'Candidate line 1' },
        { id: 'cand-2', text: 'Candidate line 2' }
      ]
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.summary.totalCandidates, 2);
  assert.equal(data.results.length, 2);
});

test('GET /openapi.json Serves OpenAPI Spec', async () => {
  const res = await fetch(`${BASE_URL}/openapi.json`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.openapi, '3.1.0');
  assert.equal(data.info.title, 'CV Pixel Checker Measurement Service API');
});
