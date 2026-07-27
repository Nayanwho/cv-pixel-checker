#!/usr/bin/env node
/**
 * Model Context Protocol (MCP) Server for CV Pixel Checker
 * Exposes precision text-width measurement tools to AI agents.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { measureCvLine, measureCvBatch, ensureFontReady } from '../src/engine/measurementEngine.js';

// Pre-load font
await ensureFontReady();

const server = new Server(
  {
    name: 'cv-pixel-checker',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Define MCP Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_cv_line',
        description: 'Check whether a CV bullet point fits within a specified rendered pixel width. Returns exact width, fit status, utilisation percentage, remaining or excess pixels, line count, and overflow diagnostics. Call repeatedly while refining a bullet point.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The CV bullet point text, optionally containing markdown **bold** tags.'
            },
            maxWidthPx: {
              type: 'number',
              default: 599,
              description: 'Maximum permitted width in CSS pixels (default: 599px for internship/work exp).'
            },
            presetId: {
              type: 'string',
              description: 'Optional layout preset (preset_internship, preset_extracurricular, preset_academics, preset_por, preset_standard).'
            },
            fontFamily: {
              type: 'string',
              default: 'EB Garamond',
              description: 'Font family to measure (default: EB Garamond).'
            },
            fontSizePt: {
              type: 'number',
              default: 9.75,
              description: 'Font size in points (default: 9.75pt).'
            },
            fontWeight: {
              type: 'number',
              default: 400,
              description: 'Font weight (400 for regular, 700 for bold).'
            },
            minimumTargetPct: {
              type: 'number',
              default: 98,
              description: 'Minimum target utilisation percentage (default: 98%).'
            },
            maximumTargetPct: {
              type: 'number',
              default: 100,
              description: 'Maximum target utilisation percentage (default: 100%).'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'check_cv_candidates',
        description: 'Check multiple candidate CV bullet points in one batch request. Returns metrics for each candidate and identifies the candidate closest to full single-line fill.',
        inputSchema: {
          type: 'object',
          properties: {
            maxWidthPx: {
              type: 'number',
              default: 599,
              description: 'Maximum permitted width in CSS pixels.'
            },
            candidates: {
              type: 'array',
              description: 'List of candidate objects with id and text.',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' }
                },
                required: ['text']
              }
            }
          },
          required: ['candidates']
        }
      }
    ]
  };
});

// Handle Tool Executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'check_cv_line') {
    const result = measureCvLine({
      text: args.text,
      maxWidthPx: args.maxWidthPx || 599,
      presetId: args.presetId,
      style: {
        fontFamily: args.fontFamily || 'EB Garamond',
        fontSizePt: args.fontSizePt || 9.75,
        fontWeight: args.fontWeight || 400
      },
      targetRange: {
        minimumUtilisationPct: args.minimumTargetPct || 98,
        maximumUtilisationPct: args.maximumTargetPct || 100
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  if (name === 'check_cv_candidates') {
    const result = measureCvBatch({
      candidates: args.candidates || [],
      maxWidthPx: args.maxWidthPx || 599
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start Server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CV Pixel Checker MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error in MCP server:', error);
  process.exit(1);
});
