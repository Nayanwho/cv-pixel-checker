import test from 'node:test';
import assert from 'node:assert/strict';
import { auditCvDocument } from '../../src/engine/documentAudit.js';

test('Whole-document audit preserves order, IDs, and per-line layout profiles', async () => {
  const audit = await auditCvDocument({
    lines: [
      {
        id: 'project-01',
        section: 'Projects',
        text: 'Built a forecasting model that improved planning accuracy by 18%',
        presetId: 'PROJECT_DETAILS'
      },
      {
        id: 'por-01',
        section: 'Positions of responsibility',
        text: 'Coordinated a 12-member student council and managed event delivery',
        presetId: 'POR_WITH_YEAR'
      },
      {
        id: 'academic-01',
        section: 'Academic achievements',
        text: 'Ranked among the top 5% of the graduating cohort',
        presetId: 'ACADEMIC_WITH_YEAR'
      }
    ]
  });

  assert.equal(audit.fontReady, true);
  assert.equal(audit.coverageComplete, true);
  assert.equal(audit.summary.submittedLineCount, 3);
  assert.equal(audit.summary.measuredLineCount, 3);
  assert.deepEqual(audit.results.map(result => result.id), [
    'project-01',
    'por-01',
    'academic-01'
  ]);
  assert.deepEqual(audit.results.map(result => result.maxWidthPx), [
    599,
    559,
    677.67
  ]);
});

test('Whole-document audit reports duplicate IDs instead of claiming complete coverage', async () => {
  const audit = await auditCvDocument({
    lines: [
      { id: 'duplicate', text: 'First line' },
      { id: 'duplicate', text: 'Second line' }
    ]
  });

  assert.equal(audit.coverageComplete, false);
  assert.deepEqual(audit.summary.duplicateIds, ['duplicate']);
});
