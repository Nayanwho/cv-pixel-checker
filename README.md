# CV Pixel Checker — AI-Accessible Measurement Service & API

A high-precision, programmatically accessible text-measurement service designed for AI agents (such as ChatGPT, Custom GPT Actions, and MCP clients) to evaluate, revise, and validate CV bullet points against exact rendered pixel widths in real time.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start REST API & Web UI server
npm start

# 3. Test single CV bullet line width via cURL
curl -X POST "http://localhost:3000/api/v1/check" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Led an 18-member sponsorship team to secure ₹4.8L+ from 30+ corporate partners",
    "maxWidthPx": 599
  }'
```

---

## 📐 Overview & Problem Solved

Traditional CV line checking requires a manual, multi-step copy-paste loop:
1. ChatGPT generates a CV bullet point.
2. The user copies the sentence.
3. The user opens the hosted CV checker webpage and pastes the text.
4. The user observes if the sentence overflows or leaves wide gaps.
5. The user manually reports back the pixel width to ChatGPT to request rewrites.

The **CV Measurement Service** transforms the tool into an AI-accessible measurement engine. ChatGPT or any AI agent can call the service directly over HTTP/REST or MCP to measure candidates, receive character-level overflow diagnostics, adjust wording, and iterate automatically until the sentence fits the target width (ideally 98%–100% of line capacity).

---

## 🏛️ Architecture

```text
               ┌──────────────────────────────────────────────────┐
               │    Authoritative Shared Measurement Engine      │
               │         (src/engine/measurementEngine.js)        │
               └────────────────────────┬─────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│   Web UI (React)   │      │  Versioned REST    │      │  MCP Tool Server   │
│ (src/App.jsx, etc) │      │  API (/api/v1/*)   │      │(server/mcpServer.js│
└────────────────────┘      └────────────────────┘      └────────────────────┘
```

### Authoritative Shared Engine Principles
- **Single Source of Truth**: The React Web UI, Express REST API, MCP Server, and Automated Tests all call `src/engine/measurementEngine.js`.
- **Deterministic Rendering**: Pre-loads bundled `EB Garamond` fonts (`EBGaramond-Regular.ttf` & `EBGaramond-Bold.ttf`) using Canvas 2D API (`@napi-rs/canvas` in Node, HTML5 Canvas in browser).
- **Subpixel Precision**: Measurements retain full floating-point precision, measured in CSS pixels.

---

## 🔌 REST API Endpoints (`/api/v1`)

### 1. Health Check
`GET /api/v1/health`

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "service": "cv-pixel-checker",
  "version": "1.0.0",
  "measurementEngine": "shared",
  "fontReady": true
}
```

---

### 2. Check Single CV Line
`POST /api/v1/check`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_API_KEY` *(optional in local dev)*

**Request Example:**
```json
{
  "text": "**Led an 18-member sponsorship team** to secure ₹4.8L+ from 30+ corporate partners",
  "maxWidthPx": 599,
  "style": {
    "fontFamily": "EB Garamond",
    "fontSizePt": 9.75,
    "fontWeight": 400
  },
  "targetRange": {
    "minimumUtilisationPct": 98,
    "maximumUtilisationPct": 100
  }
}
```

**Response Example (`200 OK`):**
```json
{
  "text": "Led an 18-member sponsorship team to secure ₹4.8L+ from 30+ corporate partners",
  "segments": [
    { "text": "Led an 18-member sponsorship team", "bold": true },
    { "text": " to secure ₹4.8L+ from 30+ corporate partners", "bold": false }
  ],
  "widthPx": 429.25,
  "maxWidthPx": 599,
  "remainingPx": 169.75,
  "overflowPx": 0,
  "utilisationPct": 71.66,
  "fits": true,
  "targetFit": false,
  "status": "underfilled",
  "characterCount": 78,
  "wordCount": 12,
  "lineCount": 1,
  "firstOverflowCharacterIndex": null,
  "maxFittingPrefix": null,
  "overflowText": null,
  "lastFittingWord": "partners",
  "firstOverflowingWord": null,
  "estimatedCharsToRemove": 0,
  "estimatedCharsToAdd": 30,
  "renderedStyle": {
    "fontFamily": "EB Garamond",
    "fontSizePt": 9.75,
    "fontSizePx": 13,
    "fontWeight": 400,
    "boldFontWeight": 700,
    "letterSpacingPx": 0
  },
  "measurementVersion": "1.0.0"
}
```

---

### 3. Batch Check Candidates
`POST /api/v1/check-batch`

Evaluates multiple bullet candidates in a single round-trip.

**Request Example:**
```json
{
  "maxWidthPx": 599,
  "candidates": [
    { "id": "cand-1", "text": "First proposed CV bullet point" },
    { "id": "cand-2", "text": "Second revised CV bullet point" }
  ]
}
```

**Response Summary Example:**
```json
{
  "summary": {
    "bestCandidateId": "cand-2",
    "bestValidCandidateId": "cand-2",
    "closestToLimitCandidateId": "cand-2",
    "targetRangeMatchFound": true,
    "totalCandidates": 2
  },
  "results": [...]
}
```

---

## 🤖 ChatGPT Agent Workflow & Setup

### Custom GPT / Assistant System Prompt
Provide the following instruction to ChatGPT:

> **Instruction for AI Agent:**  
> Draft a one-line CV bullet and validate it through the CV width checker API (`POST /api/v1/check` with `maxWidthPx = 599`). The bullet must remain at or below 599 CSS pixels and should ideally use 98–100% of the available width (`targetFit = true`). Read `widthPx`, `utilisationPct`, `status`, `remainingPx`, and `overflowPx`. After every revision, call the checker again. Do not claim that the bullet fits unless the checker returns `fits = true` and `lineCount = 1`. Return only the final validated bullet and its measured width.

### OpenAPI Specification & Docs
- **OpenAPI 3.1 Spec**: `http://localhost:3000/openapi.json`
- **Interactive Swagger Documentation**: `http://localhost:3000/docs`

---

## 🛠️ Model Context Protocol (MCP) Server Setup

The repository includes a native MCP server exposing `check_cv_line` and `check_cv_candidates` tools.

### Claude Desktop Config (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "cv-pixel-checker": {
      "command": "node",
      "args": ["/absolute/path/to/repository/server/mcpServer.js"]
    }
  }
}
```

---

## 🧪 Testing Suite

Run the full automated test suite:

```bash
# Run all unit, API, and regression tests
npm test

# Run unit tests for shared measurement engine
npm run test:unit

# Run REST API endpoint integration tests
npm run test:api

# Run regression tests verifying Engine vs API 0.00px tolerance
npm run test:regression
```

---

## 🚀 Production Deployment

### Option 1: Node Server
```bash
npm run build
npm start
```

### Option 2: Docker / Container Deployment
```bash
docker build -t cv-pixel-checker .
docker run -d -p 3000:3000 cv-pixel-checker
```

### Option 3: Docker Compose
```bash
docker-compose up -d
```

---

## 📜 License
MIT License • Created with ❤️ by **Adarsh Nayan**
