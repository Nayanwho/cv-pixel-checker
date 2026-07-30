import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  ensureFontReady,
  measureCvBatch,
  measureCvLine,
  MEASUREMENT_VERSION
} from '../src/engine/measurementEngine.js';
import {
  auditCvDocument,
  MAX_DOCUMENT_LINES
} from '../src/engine/documentAudit.js';

const segmentSchema = z.object({
  text: z.string().max(2000),
  bold: z.boolean().optional(),
  fontWeight: z.number().int().min(100).max(900).optional()
});

const styleSchema = z.object({
  fontFamily: z.string().min(1).max(100).optional(),
  fontSizePt: z.number().min(5).max(72).optional(),
  fontSizePx: z.number().min(5).max(100).optional(),
  fontWeight: z.number().int().min(100).max(900).optional(),
  boldFontWeight: z.number().int().min(100).max(900).optional(),
  letterSpacingPx: z.number().min(-5).max(20).optional()
});

const targetRangeSchema = z.object({
  minimumUtilisationPct: z.number().min(0).max(200).optional(),
  maximumUtilisationPct: z.number().min(0).max(200).optional()
});

const lineSchema = z.object({
  id: z.string().min(1).max(120),
  text: z.string().max(2000),
  section: z.string().max(200).optional(),
  presetId: z.string().max(100).optional(),
  maxWidthPx: z.number().min(50).max(2000).optional(),
  segments: z.array(segmentSchema).max(100).optional(),
  style: styleSchema.optional(),
  targetRange: targetRangeSchema.optional()
});

const statusSchema = z.enum([
  'invalid-input',
  'font-error',
  'multi-line',
  'hard-overflow',
  'overflow',
  'optimal',
  'underfilled'
]);

const renderedStyleOutputSchema = z.object({
  fontFamily: z.string(),
  fontSizePt: z.number(),
  fontSizePx: z.number(),
  fontWeight: z.number().int(),
  boldFontWeight: z.number().int(),
  letterSpacingPx: z.number()
});

const targetRangeOutputSchema = z.object({
  minimumUtilisationPct: z.number(),
  maximumUtilisationPct: z.number()
});

const previewLineOutputSchema = z.object({
  text: z.string(),
  widthPx: z.number(),
  fillPercentage: z.number()
});

const measurementContractOutputSchema = z.object({
  authoritative: z.boolean(),
  unit: z.string(),
  fallbackUsed: z.boolean(),
  fontSubstitutionAllowed: z.boolean(),
  inputPreserved: z.boolean(),
  reportingRule: z.string()
});

const measurementOutputSchema = z.object({
  inputText: z.string(),
  renderedText: z.string(),
  authoritativeWidthPx: z.number(),
  widthPx: z.number(),
  maxWidthPx: z.number(),
  capacityPt: z.number(),
  remainingPx: z.number(),
  overflowPx: z.number(),
  neededTrimPx: z.number(),
  utilisationPct: z.number(),
  finalLineFillPct: z.number(),
  fits: z.boolean(),
  targetFit: z.boolean(),
  status: statusSchema,
  characterCount: z.number().int(),
  wordCount: z.number().int(),
  lineCount: z.number().int(),
  lines: z.array(previewLineOutputSchema),
  orphanText: z.string().nullable(),
  firstOverflowCharacterIndex: z.number().int().nullable(),
  maxFittingPrefix: z.string().nullable(),
  overflowText: z.string().nullable(),
  lastFittingWord: z.string().nullable(),
  firstOverflowingWord: z.string().nullable(),
  estimatedCharsToRemove: z.number().int(),
  estimatedCharsToAdd: z.number().int(),
  renderedStyle: renderedStyleOutputSchema,
  targetRange: targetRangeOutputSchema,
  fontReady: z.boolean(),
  measurementEnvironment: z.string(),
  measurementVersion: z.string(),
  metricsProfile: z.string(),
  measurementContract: measurementContractOutputSchema
});

const candidateOutputSchema = measurementOutputSchema.extend({
  id: z.string()
});

const batchOutputSchema = z.object({
  summary: z.object({
    bestCandidateId: z.string().nullable(),
    bestValidCandidateId: z.string().nullable(),
    closestToLimitCandidateId: z.string().nullable(),
    targetRangeMatchFound: z.boolean(),
    totalCandidates: z.number().int()
  }),
  results: z.array(candidateOutputSchema)
});

const auditResultOutputSchema = measurementOutputSchema.extend({
  id: z.string(),
  section: z.string().nullable(),
  sourceIndex: z.number().int(),
  presetId: z.string().nullable()
});

const auditOutputSchema = z.object({
  fontReady: z.boolean(),
  coverageComplete: z.boolean(),
  measurementVersion: z.string(),
  measurementEnvironment: z.string(),
  metricsProfile: z.string(),
  summary: z.object({
    submittedLineCount: z.number().int(),
    measuredLineCount: z.number().int(),
    optimalCount: z.number().int(),
    fittingCount: z.number().int(),
    overflowCount: z.number().int(),
    underfilledCount: z.number().int(),
    invalidInputCount: z.number().int(),
    missingIds: z.array(z.string()),
    duplicateIds: z.array(z.string())
  }),
  results: z.array(auditResultOutputSchema)
});

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

function successfulToolResult(result, summary) {
  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: result
  };
}

function roundTo(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(Number(value || 0) * factor) / factor;
}

function toMcpMeasurement(result, inputText = result.text) {
  const lines = (result.lines || []).map(line => ({
    text: line.text,
    widthPx: roundTo(line.widthPx),
    fillPercentage: roundTo(line.fillPercentage)
  }));
  const finalLine = lines[lines.length - 1];
  const orphanText = result.lineCount > 1
    ? lines.slice(1).map(line => line.text.trim()).filter(Boolean).join(' ')
    : null;

  return {
    inputText,
    renderedText: result.text,
    authoritativeWidthPx: result.widthPx,
    widthPx: result.widthPx,
    maxWidthPx: result.maxWidthPx,
    capacityPt: roundTo(result.maxWidthPx * 0.75),
    remainingPx: result.remainingPx,
    overflowPx: result.overflowPx,
    neededTrimPx: result.overflowPx,
    utilisationPct: result.utilisationPct,
    finalLineFillPct: finalLine ? finalLine.fillPercentage : 0,
    fits: result.fits,
    targetFit: result.targetFit,
    status: result.status,
    characterCount: result.characterCount,
    wordCount: result.wordCount,
    lineCount: result.lineCount,
    lines,
    orphanText,
    firstOverflowCharacterIndex: result.firstOverflowCharacterIndex,
    maxFittingPrefix: result.maxFittingPrefix,
    overflowText: result.overflowText,
    lastFittingWord: result.lastFittingWord,
    firstOverflowingWord: result.firstOverflowingWord,
    estimatedCharsToRemove: result.estimatedCharsToRemove,
    estimatedCharsToAdd: result.estimatedCharsToAdd,
    renderedStyle: result.renderedStyle,
    targetRange: result.targetRange,
    fontReady: result.fontReady,
    measurementEnvironment: result.measurementEnvironment,
    measurementVersion: result.measurementVersion,
    metricsProfile: result.metricsProfile,
    measurementContract: {
      authoritative: true,
      unit: 'CSS px',
      fallbackUsed: false,
      fontSubstitutionAllowed: false,
      inputPreserved: result.text === inputText,
      reportingRule:
        'Report authoritativeWidthPx exactly and name renderedStyle exactly. Never estimate, convert, substitute Arial, or retry through another tool.'
    }
  };
}

function singleLineSummary(result) {
  const orphan = result.orphanText ? ` Orphan text: "${result.orphanText}".` : '';
  return [
    `AUTHORITATIVE WIDTH: ${result.authoritativeWidthPx.toFixed(2)} CSS px.`,
    `Measured text: "${result.renderedText}".`,
    `Renderer: ${result.renderedStyle.fontFamily} ${result.renderedStyle.fontSizePt} pt, weight ${result.renderedStyle.fontWeight}; no fallback or font substitution.`,
    `Capacity: ${result.maxWidthPx.toFixed(2)} px (${result.capacityPt.toFixed(2)} pt). Status: ${result.status}; ${result.lineCount} line(s); trim needed: ${result.neededTrimPx.toFixed(2)} px.${orphan}`,
    'Use this result exactly. Do not estimate or call a different tool to replace it.'
  ].join('\n');
}

function fontErrorResult() {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'Exact measurement stopped because the bundled EB Garamond font is not ready. Do not estimate widths.'
    }]
  };
}

async function requireFont() {
  return ensureFontReady();
}

export function createCvMcpServer() {
  const server = new McpServer(
    {
      name: 'cv-pixel-checker',
      version: MEASUREMENT_VERSION
    },
    {
      instructions:
        'Returned widths are authoritative CSS pixels from bundled EB Garamond 9.75pt unless the user explicitly supplies another style. Preserve Unicode and punctuation exactly. For one isolated line, call check_cv_line once and report authoritativeWidthPx plus renderedStyle. Never estimate, substitute Arial, or retry a failed single-line call through check_cv_candidates. Use audit_cv_document once for multiple CV lines.'
    }
  );

  server.registerTool(
    'audit_cv_document',
    {
      title: 'Audit every CV line',
      description:
        `Measure every bullet or line from a CV in one deterministic call. Each of the ${MAX_DOCUMENT_LINES} supported lines can use its own preset, width, style, bold segments, and target range. Returns source-order results plus coverageComplete so the caller can prove no submitted line was skipped. Use this instead of repeated check_cv_line calls for any document or multi-line request.`,
      inputSchema: z.object({
        lines: z.array(lineSchema).min(1).max(MAX_DOCUMENT_LINES)
      }),
      outputSchema: auditOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    async ({ lines }) => {
      try {
        const result = await auditCvDocument({ lines });
        const response = {
          fontReady: result.fontReady,
          coverageComplete: result.coverageComplete,
          measurementVersion: result.measurementVersion,
          measurementEnvironment: result.measurementEnvironment,
          metricsProfile: result.metricsProfile,
          summary: {
            submittedLineCount: result.summary.submittedLineCount,
            measuredLineCount: result.summary.measuredLineCount,
            optimalCount: result.summary.optimalCount,
            fittingCount: result.summary.fittingCount,
            overflowCount: result.summary.overflowCount,
            underfilledCount: result.summary.underfilledCount,
            invalidInputCount: result.summary.invalidInputCount,
            missingIds: result.summary.missingIds,
            duplicateIds: result.summary.duplicateIds
          },
          results: result.results.map(measurement => ({
            id: measurement.id,
            section: measurement.section,
            sourceIndex: measurement.sourceIndex,
            presetId: measurement.presetId,
            ...toMcpMeasurement(
              measurement,
              lines[measurement.sourceIndex]?.text || measurement.text
            )
          }))
        };
        return successfulToolResult(
          response,
          `AUTHORITATIVE DOCUMENT AUDIT: measured ${result.summary.measuredLineCount}/${result.summary.submittedLineCount} submitted CV lines with bundled EB Garamond; coverage complete: ${result.coverageComplete}; optimal: ${result.summary.optimalCount}; overflow: ${result.summary.overflowCount}. Report only returned authoritativeWidthPx values and rendered styles.`
        );
      } catch (error) {
        if (error?.code === 'FONT_NOT_READY') return fontErrorResult();
        throw error;
      }
    }
  );

  server.registerTool(
    'check_cv_line',
    {
      title: 'Check one CV line',
      description:
        'Authoritatively measure one isolated CV line. Preserve the submitted text exactly, including ₹, %, punctuation, and spaces. With no explicit style, this uses bundled EB Garamond 9.75pt regular weight 400. Report authoritativeWidthPx and renderedStyle exactly as returned; never infer another font or calculate a replacement. maxWidthPx defaults to 599 and affects fit/wrapping, not the total measured width. Do not use check_cv_candidates as a fallback.',
      inputSchema: z.object({
        text: z.string().max(2000),
        presetId: z.string().max(100).optional(),
        maxWidthPx: z.number().min(50).max(2000).optional(),
        segments: z.array(segmentSchema).max(100).optional(),
        style: styleSchema.optional(),
        targetRange: targetRangeSchema.optional()
      }),
      outputSchema: measurementOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    async ({ text, presetId, maxWidthPx, segments, style, targetRange }) => {
      if (!(await requireFont())) return fontErrorResult();
      const result = measureCvLine({
        text,
        presetId,
        maxWidthPx: maxWidthPx ?? 599,
        segments,
        style: style || {},
        targetRange: targetRange || {}
      });
      const measurement = toMcpMeasurement(result, text);
      return successfulToolResult(
        measurement,
        singleLineSummary(measurement)
      );
    }
  );

  server.registerTool(
    'check_cv_candidates',
    {
      title: 'Compare CV line candidates',
      description:
        'Compare two or more alternative phrasings for the same CV bullet. Use only when the user actually supplied or requested alternatives. Never call this to retry or replace check_cv_line. Preserve every candidate exactly and report only the authoritative returned widths and rendered style.',
      inputSchema: z.object({
        candidates: z.array(z.object({
          id: z.string().min(1).max(120),
          text: z.string().max(2000),
          segments: z.array(segmentSchema).max(100).optional()
        })).min(1).max(50),
        presetId: z.string().max(100).optional(),
        maxWidthPx: z.number().min(50).max(2000).optional(),
        style: styleSchema.optional(),
        targetRange: targetRangeSchema.optional()
      }),
      outputSchema: batchOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    async ({ candidates, presetId, maxWidthPx, style, targetRange }) => {
      if (!(await requireFont())) return fontErrorResult();
      const result = measureCvBatch({
        candidates,
        presetId,
        maxWidthPx: maxWidthPx ?? 599,
        style: style || {},
        targetRange: targetRange || {}
      });
      const response = {
        summary: result.summary,
        results: result.results.map(candidate => ({
          id: candidate.id,
          ...toMcpMeasurement(candidate, candidate.text)
        }))
      };
      return successfulToolResult(
        response,
        `AUTHORITATIVE CANDIDATE COMPARISON: measured ${result.summary.totalCandidates} supplied alternatives with bundled EB Garamond. Best valid candidate: ${result.summary.bestValidCandidateId || 'none'}. Use only the returned authoritativeWidthPx values; do not estimate or substitute fonts.`
      );
    }
  );

  return server;
}
