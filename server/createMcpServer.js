import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  ensureFontReady,
  measureCvBatch,
  measureCvLine
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

const flexibleObjectSchema = z.record(z.string(), z.unknown());
const measurementOutputSchema = flexibleObjectSchema;
const auditOutputSchema = z.object({
  fontReady: z.boolean(),
  coverageComplete: z.boolean(),
  measurementVersion: z.string(),
  measurementEnvironment: z.string(),
  summary: flexibleObjectSchema,
  results: z.array(flexibleObjectSchema)
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
      version: '1.1.0'
    },
    {
      instructions:
        'Measure CV lines deterministically. For documents or multiple bullets, call audit_cv_document once with every line and a stable unique ID. Never estimate pixel widths.'
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
        return successfulToolResult(
          result,
          `Measured ${result.summary.measuredLineCount}/${result.summary.submittedLineCount} CV lines; coverage complete: ${result.coverageComplete}; optimal: ${result.summary.optimalCount}; overflow: ${result.summary.overflowCount}.`
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
        'Measure one CV line against a rendered pixel-width limit. Use only for an isolated line; use audit_cv_document for a CV file or multiple bullets.',
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
      return successfulToolResult(
        result,
        `${result.status}: ${result.widthPx}px of ${result.maxWidthPx}px (${result.utilisationPct}%).`
      );
    }
  );

  server.registerTool(
    'check_cv_candidates',
    {
      title: 'Compare CV line candidates',
      description:
        'Measure up to 50 alternative phrasings for one CV bullet and identify the closest valid fit. This compares alternatives; it does not replace audit_cv_document for a whole CV.',
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
      outputSchema: measurementOutputSchema,
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
      return successfulToolResult(
        result,
        `Measured ${result.summary.totalCandidates} candidates; best valid candidate: ${result.summary.bestValidCandidateId || 'none'}.`
      );
    }
  );

  return server;
}
