#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ensureFontReady } from '../src/engine/measurementEngine.js';
import { createCvMcpServer } from './createMcpServer.js';

async function run() {
  const fontReady = await ensureFontReady();
  if (!fontReady) {
    throw new Error('Bundled EB Garamond fonts could not be loaded.');
  }

  const server = createCvMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CV Pixel Checker MCP server running on stdio');
}

run().catch(error => {
  console.error('Fatal error in MCP server:', error);
  process.exit(1);
});
