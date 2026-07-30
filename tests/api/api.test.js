import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(data.measurementVersion, '1.1.0');
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

test('POST /api/v1/audit-document Measures Every Line with Mixed Presets', async () => {
  const res = await fetch(`${BASE_URL}/api/v1/audit-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lines: [
        {
          id: 'experience-01',
          section: 'Experience',
          text: 'Improved fulfilment accuracy by 18% through workflow redesign',
          presetId: 'PROJECT_DETAILS'
        },
        {
          id: 'academic-01',
          section: 'Academic achievements',
          text: 'Ranked in the top 5% of the graduating cohort',
          presetId: 'ACADEMIC_WITH_YEAR'
        }
      ]
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.fontReady, true);
  assert.equal(data.coverageComplete, true);
  assert.equal(data.summary.submittedLineCount, 2);
  assert.equal(data.summary.measuredLineCount, 2);
  assert.deepEqual(data.results.map(result => result.id), ['experience-01', 'academic-01']);
  assert.deepEqual(data.results.map(result => result.maxWidthPx), [599, 677.67]);
});

test('POST /mcp Exposes and Executes Whole-Document Audit Tool', async () => {
  const headers = {
    Accept: 'application/json, text/event-stream',
    'Content-Type': 'application/json',
    'MCP-Protocol-Version': '2025-03-26'
  };
  const listResponse = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    })
  });

  assert.equal(listResponse.status, 200);
  const listData = await listResponse.json();
  assert.ok(listData.result.tools.some(tool => tool.name === 'audit_cv_document'));

  const callResponse = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'audit_cv_document',
        arguments: {
          lines: [
            {
              id: 'line-01',
              text: 'Led a cross-functional team to improve reporting TAT by 35%',
              presetId: 'PROJECT_DETAILS'
            },
            {
              id: 'line-02',
              text: 'Secured a national finalist position in a strategy competition',
              presetId: 'EXTRA_CURRICULAR_WITH_YEAR'
            }
          ]
        }
      }
    })
  });

  assert.equal(callResponse.status, 200);
  const callData = await callResponse.json();
  assert.equal(callData.result.isError, undefined);
  assert.equal(callData.result.structuredContent.coverageComplete, true);
  assert.equal(callData.result.structuredContent.summary.measuredLineCount, 2);
});

test('GET /openapi.json Serves OpenAPI Spec', async () => {
  const res = await fetch(`${BASE_URL}/openapi.json`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.openapi, '3.1.0');
  assert.equal(data.info.title, 'CV Pixel Checker Measurement Service API');
});
