import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import {
  measureCvLine,
  measureCvBatch,
  getEngineStatus,
  ensureFontReady
} from './src/engine/measurementEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || process.env.CV_CHECKER_API_KEY || 'dev-secret-key';
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true';

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiter: 120 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

// Auth Middleware
function authenticateApiKey(req, res, next) {
  if (!REQUIRE_AUTH && !process.env.API_KEY) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-api-key'];

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (customHeader) {
    token = customHeader.trim();
  }

  if (token && token === API_KEY) {
    return next();
  }

  return res.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing Bearer API key authorization header.'
    }
  });
}

// Ensure fonts are pre-loaded on server boot
ensureFontReady().then(ready => {
  console.log(`[CV Measurement Engine] Font loading ready: ${ready}`);
});

// Serve OpenAPI Specification JSON
app.get('/openapi.json', (req, res) => {
  const openapiPath = path.resolve(process.cwd(), 'public/openapi.json');
  if (fs.existsSync(openapiPath)) {
    return res.sendFile(openapiPath);
  }
  return res.status(444).json({ error: { code: 'NOT_FOUND', message: 'OpenAPI spec file not found' } });
});

// Serve Interactive Swagger UI Docs
try {
  const openapiContent = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/openapi.json'), 'utf8'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiContent));
} catch (e) {
  console.warn('Could not load swagger docs UI:', e.message);
}

// API Health Check
app.get('/api/v1/health', (req, res) => {
  const status = getEngineStatus();
  return res.json({
    status: 'ok',
    service: 'cv-pixel-checker',
    version: '1.0.0',
    measurementEngine: 'shared',
    fontReady: status.fontReady
  });
});

// Single CV Line Width Check Endpoint
app.post('/api/v1/check', authenticateApiKey, (req, res) => {
  try {
    const { text, maxWidthPx, style, targetRange, presetId, segments } = req.body || {};

    if (maxWidthPx !== undefined) {
      const numWidth = Number(maxWidthPx);
      if (isNaN(numWidth) || numWidth < 50 || numWidth > 2000) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MAX_WIDTH',
            message: 'maxWidthPx must be a number between 50 and 2000.'
          }
        });
      }
    }

    if (text && typeof text === 'string' && text.length > 2000) {
      return res.status(400).json({
        error: {
          code: 'TEXT_TOO_LONG',
          message: 'Text exceeds maximum permitted length of 2000 characters.'
        }
      });
    }

    const result = measureCvLine({
      text: text || '',
      segments,
      maxWidthPx: maxWidthPx !== undefined ? Number(maxWidthPx) : 599,
      style: style || {},
      targetRange: targetRange || {},
      presetId
    });

    return res.json(result);
  } catch (err) {
    console.error('Error in /api/v1/check:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while measuring CV line.'
      }
    });
  }
});

// Batch Candidate CV Line Width Check Endpoint
app.post('/api/v1/check-batch', authenticateApiKey, (req, res) => {
  try {
    const { candidates, maxWidthPx, style, targetRange, presetId } = req.body || {};

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CANDIDATES',
          message: 'candidates must be a non-empty array.'
        }
      });
    }

    if (candidates.length > 50) {
      return res.status(400).json({
        error: {
          code: 'TOO_MANY_CANDIDATES',
          message: 'Maximum batch size is 50 candidates.'
        }
      });
    }

    if (maxWidthPx !== undefined) {
      const numWidth = Number(maxWidthPx);
      if (isNaN(numWidth) || numWidth < 50 || numWidth > 2000) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MAX_WIDTH',
            message: 'maxWidthPx must be a number between 50 and 2000.'
          }
        });
      }
    }

    const batchResult = measureCvBatch({
      candidates,
      maxWidthPx: maxWidthPx !== undefined ? Number(maxWidthPx) : 599,
      style: style || {},
      targetRange: targetRange || {},
      presetId
    });

    return res.json(batchResult);
  } catch (err) {
    console.error('Error in /api/v1/check-batch:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during batch check.'
      }
    });
  }
});

// Serve static frontend assets from dist/ if built
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/docs') && !req.path.startsWith('/openapi.json')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CV Measurement Service API running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📄 OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
  console.log(`📚 Interactive Docs: http://localhost:${PORT}/docs`);
  console.log(`====================================================`);
});

export default app;
