import { loadNodeCanvas } from './nodeCanvasLoader.js';

let canvasCtx = null;
let fontStatus = 'loading'; // 'loading' | 'ready' | 'failed'
let engineEnvironment = 'unknown'; // 'browser' | 'node'
const widthCache = new Map();

export const MEASUREMENT_VERSION = '1.2.0';
export const METRICS_PROFILE = 'eb-garamond-9.75pt-template-css-v1';

// The reference Word/PDF template uses an effective 12.96px EB Garamond
// rendering box for its nominal 9.75pt text. Canvas uses exactly 13px at the
// CSS 96dpi conversion. Apply the template calibration on every runtime so the
// browser UI, REST API, and MCP tools all reproduce the reference layout. The
// Unicode/rupee golden regression locks this contract at 567.50px.
const TEMPLATE_EB_GARAMOND_WIDTH_SCALE = 0.997;

// Universal preset definitions with Versioned Section Profiles v2.0
export const CV_PRESETS = [
  {
    id: 'PROJECT_DETAILS',
    aliasId: 'preset_internship',
    profileCode: 'PROJECT_DETAILS',
    name: 'Project Details (Category Col 83pt, No Year Col)',
    shortLabel: 'Project Details',
    description: 'Top Table: Category Col (83.0pt) + Net Text Column (449.25pt / 599.0px)',
    sectionTitle: 'PROJECT DETAILS',
    categoryTitle: 'Project Details',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 449.25,
    maxWidthPx: 599.0,
    safeLimitPx: 587.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: false,
    version: '2.0.0'
  },
  {
    id: 'PROJECT_ACHIEVEMENTS',
    aliasId: 'preset_project_achievements',
    profileCode: 'PROJECT_ACHIEVEMENTS',
    name: 'Achievements (Category Col 83pt, No Year Col)',
    shortLabel: 'Achievements',
    description: 'Top Table: Achievements Row (83.0pt) + Net Text Column (449.25pt / 599.0px)',
    sectionTitle: 'ACHIEVEMENTS',
    categoryTitle: 'Achievements',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 449.25,
    maxWidthPx: 599.0,
    safeLimitPx: 587.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: false,
    version: '2.0.0'
  },
  {
    id: 'POR_WITH_YEAR',
    aliasId: 'preset_por',
    profileCode: 'POR_WITH_YEAR',
    name: 'Positions of Responsibility (Role Col 83pt, Year Col 32.6pt)',
    shortLabel: 'POR with Year',
    description: 'Bottom Table: Role Col (83.0pt) + Year Col (32.6pt) + Net Text (419.25pt / 559.0px)',
    sectionTitle: 'POSITION OF RESPONSIBILITY',
    categoryTitle: 'Mess Head / PR Coordinator',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 419.25,
    maxWidthPx: 559.0,
    safeLimitPx: 548.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: true,
    version: '2.0.0'
  },
  {
    id: 'EXTRA_CURRICULAR_WITH_YEAR',
    aliasId: 'preset_extracurricular',
    profileCode: 'EXTRA_CURRICULAR_WITH_YEAR',
    name: 'Competitions & Extra-Curriculars (Category 83pt, Year 32.6pt)',
    shortLabel: 'Extra-Curriculars with Year',
    description: 'Bottom Table: Category (83.0pt) + Year Col (32.6pt) + Net Text (419.25pt / 559.0px)',
    sectionTitle: 'EXTRA-CURRICULAR ACTIVITIES',
    categoryTitle: 'Case Competitions',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 419.25,
    maxWidthPx: 559.0,
    safeLimitPx: 548.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: true,
    version: '2.0.0'
  },
  {
    id: 'ACADEMIC_WITH_YEAR',
    aliasId: 'preset_academics',
    profileCode: 'ACADEMIC_WITH_YEAR',
    name: 'Academic Achievements (Wide Section, Year Col 32.6pt)',
    shortLabel: 'Academic with Year',
    description: 'Wide Section: Year Col (32.6pt) + Net Text (508.25pt / 677.67px)',
    sectionTitle: 'ACADEMIC ACHIEVEMENTS',
    categoryTitle: '',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 508.25,
    maxWidthPx: 677.67,
    safeLimitPx: 664.1,
    bulletChar: '▪',
    categoryWidthPt: 0,
    hasYearColumn: true,
    version: '2.0.0'
  },
  {
    id: 'CERTIFICATIONS',
    aliasId: 'preset_certifications',
    profileCode: 'CERTIFICATIONS',
    name: 'Certifications & Licenses (Wide Section, Year Col 32.6pt)',
    shortLabel: 'Certifications',
    description: 'Certifications Section: Net Text (508.25pt / 677.67px)',
    sectionTitle: 'CERTIFICATIONS & LICENSES',
    categoryTitle: '',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 508.25,
    maxWidthPx: 677.67,
    safeLimitPx: 664.1,
    bulletChar: '▪',
    categoryWidthPt: 0,
    hasYearColumn: true,
    version: '2.0.0'
  },
  {
    id: 'PROJECT_TITLE_ROW',
    aliasId: 'preset_standard',
    profileCode: 'PROJECT_TITLE_ROW',
    name: 'Full-Width Section Header / Project Title Row (540pt / 720px)',
    shortLabel: 'Project Title / Header',
    description: 'Full printable table header width (540.0pt / 720.0px)',
    sectionTitle: 'PROJECT TITLE ROW',
    categoryTitle: '',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 540.0,
    maxWidthPx: 720.0,
    safeLimitPx: 705.6,
    bulletChar: '•',
    categoryWidthPt: 0,
    hasYearColumn: false,
    version: '2.0.0'
  },
  // Backwards compatibility aliases
  {
    id: 'preset_internship',
    aliasId: 'PROJECT_DETAILS',
    name: 'Internship & Work Experience (Legacy Alias)',
    shortLabel: 'Internship & Work Exp',
    description: 'Standard B-School: Category Col (83.0pt) + Net Text (449.25pt / 599.0px)',
    sectionTitle: 'INTERNSHIP / WORK EXPERIENCE',
    categoryTitle: 'Roles &\nResponsibilities',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 449.25,
    maxWidthPx: 599.0,
    safeLimitPx: 587.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: false,
    version: '2.0.0'
  },
  {
    id: 'preset_extracurricular',
    aliasId: 'EXTRA_CURRICULAR_WITH_YEAR',
    name: 'Competitions & Extra-Curriculars (Legacy Alias)',
    shortLabel: 'Competitions & Extra-Curriculars',
    description: 'Standard B-School: Category (83.0pt) + Year Col (32.6pt) + Net Text (419.25pt / 559.0px)',
    sectionTitle: 'EXTRA-CURRICULAR ACTIVITIES',
    categoryTitle: 'Case Competitions',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 419.25,
    maxWidthPx: 559.0,
    safeLimitPx: 548.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: true,
    version: '2.0.0'
  },
  {
    id: 'preset_academics',
    aliasId: 'ACADEMIC_WITH_YEAR',
    name: 'Academic Achievements (Legacy Alias)',
    shortLabel: 'Academic Achievements',
    description: 'Standard B-School: Wide Section + Year Col (32.6pt) + Net Text (508.25pt / 677.67px)',
    sectionTitle: 'ACADEMIC ACHIEVEMENTS',
    categoryTitle: '',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 508.25,
    maxWidthPx: 677.67,
    safeLimitPx: 664.1,
    bulletChar: '▪',
    categoryWidthPt: 0,
    hasYearColumn: true,
    version: '2.0.0'
  },
  {
    id: 'preset_por',
    aliasId: 'POR_WITH_YEAR',
    name: 'Position of Responsibility (Legacy Alias)',
    shortLabel: 'Positions of Responsibility',
    description: 'Standard B-School: Role Col (83.0pt) + Year Col (32.6pt) + Net Text (419.25pt / 559.0px)',
    sectionTitle: 'POSITION OF RESPONSIBILITY',
    categoryTitle: 'PR Coordinator',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 419.25,
    maxWidthPx: 559.0,
    safeLimitPx: 548.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: true,
    version: '2.0.0'
  },
  {
    id: 'preset_standard',
    aliasId: 'PROJECT_TITLE_ROW',
    name: 'Standard Full Width (Legacy Alias)',
    shortLabel: 'Standard Full Width',
    description: 'Full printable table width (540.0pt / 720.0px)',
    sectionTitle: 'GENERAL CV SECTION',
    categoryTitle: '',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 540.0,
    maxWidthPx: 720.0,
    safeLimitPx: 705.6,
    bulletChar: '•',
    categoryWidthPt: 0,
    hasYearColumn: false,
    version: '2.0.0'
  }
];

export const DEFAULT_STYLE = {
  fontFamily: 'EB Garamond',
  fontSizePt: 9.75,
  fontSizePx: 13, // 9.75 pt * (4/3) = 13 px
  fontWeight: 400,
  boldFontWeight: 700,
  letterSpacingPx: 0
};

export const DEFAULT_TARGET_RANGE = {
  minimumUtilisationPct: 98,
  maximumUtilisationPct: 100
};

/**
 * Initialize engine and canvas context across Node.js and Browser environments
 */
export function initEngine() {
  if (canvasCtx) return fontStatus;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    engineEnvironment = 'browser';
    const canvas = document.createElement('canvas');
    canvasCtx = canvas.getContext('2d');
    
    if ('fonts' in document) {
      const isReg = document.fonts.check('400 13px "EB Garamond"');
      const isBold = document.fonts.check('700 13px "EB Garamond"');
      fontStatus = (isReg && isBold) ? 'ready' : 'loading';
    } else {
      fontStatus = 'ready'; // fallback canvas
    }
  } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    engineEnvironment = 'node';
    try {
      const { canvas, fontStatus: status } = loadNodeCanvas();
      canvasCtx = canvas.getContext('2d');
      fontStatus = status;
    } catch (e) {
      console.warn('Warning: @napi-rs/canvas not available, using pure metrics fallback:', e.message);
      fontStatus = 'failed';
    }
  }
  return fontStatus;
}

/**
 * Ensure font is ready
 */
export async function ensureFontReady() {
  initEngine();
  if (fontStatus === 'ready') return true;

  if (engineEnvironment === 'browser' && typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
      await Promise.all([
        document.fonts.load('400 13px "EB Garamond"'),
        document.fonts.load('700 13px "EB Garamond"')
      ]);
      fontStatus = 'ready';
      widthCache.clear();
      return true;
    } catch (e) {
      fontStatus = 'failed';
      return false;
    }
  }
  return fontStatus === 'ready';
}

export function getEngineStatus() {
  initEngine();
  return {
    status: fontStatus,
    fontReady: fontStatus === 'ready',
    environment: engineEnvironment,
    measurementVersion: MEASUREMENT_VERSION,
    metricsProfile: METRICS_PROFILE
  };
}

/**
 * Measure width of text segment in pixels
 */
export function measureSegmentWidth(
  text,
  isBold = false,
  fontSizePx = 13,
  fontFamily = 'EB Garamond',
  fontWeight = 400,
  boldFontWeight = 700
) {
  if (!text) return 0;
  initEngine();

  const resolvedFontWeight = isBold ? boldFontWeight : fontWeight;
  const fontStack = fontStatus === 'ready'
    ? `"${fontFamily}", Garamond, Georgia, serif`
    : `Georgia, "${fontFamily}", Garamond, serif`;

  const cacheKey = `${fontStack}_${resolvedFontWeight}_${fontSizePx}_${text}`;
  if (widthCache.has(cacheKey)) {
    return widthCache.get(cacheKey);
  }

  let width = 0;
  if (canvasCtx) {
    canvasCtx.font = `${resolvedFontWeight} ${fontSizePx}px ${fontStack}`;
    width = canvasCtx.measureText(text).width;
    if (fontFamily === 'EB Garamond') {
      width *= TEMPLATE_EB_GARAMOND_WIDTH_SCALE;
    }
  } else {
    const factor = isBold ? 0.62 : 0.55;
    width = text.length * fontSizePx * factor;
  }

  widthCache.set(cacheKey, width);
  return width;
}

function measureStyledTokensWidth(tokens, style) {
  if (!tokens.length) return 0;

  const runs = [];
  for (const token of tokens) {
    const previous = runs[runs.length - 1];
    if (previous && previous.isBold === token.isBold) {
      previous.text += token.text;
    } else {
      runs.push({ text: token.text, isBold: token.isBold });
    }
  }

  const renderedWidth = runs.reduce(
    (total, run) => total + measureSegmentWidth(
      run.text,
      run.isBold,
      style.fontSizePx,
      style.fontFamily,
      style.fontWeight,
      style.boldFontWeight
    ),
    0
  );
  const characterCount = Array.from(tokens.map(token => token.text).join('')).length;
  return renderedWidth + Math.max(0, characterCount - 1) * style.letterSpacingPx;
}

function measureStyledPrefixWidth(segments, endIndex, style) {
  let remaining = endIndex;
  const prefixTokens = [];

  for (const segment of segments) {
    if (remaining <= 0) break;
    const segmentText = segment.text || '';
    const text = segmentText.slice(0, remaining);
    if (text) {
      prefixTokens.push({
        text,
        isBold: !!segment.bold || (!!segment.fontWeight && segment.fontWeight >= 600)
      });
    }
    remaining -= segmentText.length;
  }

  return measureStyledTokensWidth(prefixTokens, style);
}

/**
 * Convert markdown bold text (`**bold**` or `<b>bold</b>`) or plain text into structured segments
 */
export function parseTextToSegments(rawText, autoBoldMetrics = false) {
  if (!rawText) return [{ text: '', bold: false }];

  if (/\*\*.*?\*\*|<b>.*?<\/b>/s.test(rawText)) {
    const segments = [];
    const regex = /(\*\*.*?\*\*|<b>.*?<\/b>)/g;
    const parts = rawText.split(regex);

    parts.forEach(part => {
      if (!part) return;
      if (part.startsWith('**') && part.endsWith('**')) {
        segments.push({ text: part.slice(2, -2), bold: true });
      } else if (part.startsWith('<b>') && part.endsWith('</b>')) {
        segments.push({ text: part.slice(3, -4), bold: true });
      } else {
        segments.push({ text: part, bold: false });
      }
    });
    return segments;
  }

  if (autoBoldMetrics) {
    const segments = [];
    const metricPattern = /((?:₹|Rs\.?|INR|\$)\s*[\d,]+(?:\.\d+)?[LKM]?(?:\b)?|\b\d+(?:\.\d+)?%\s+ROI\b|\b\d+(?:\.\d+)?%[+]?|\b\d+(?:\.\d+)?\+|\bISO\s*\d+|\b(?:TAT|SKU|SKUs|Kanban|DMAIC|CAPEX|GTM|ROIC)\b)/gi;
    let lastIndex = 0;
    let match;

    while ((match = metricPattern.exec(rawText)) !== null) {
      const matchStart = match.index;
      const matchText = match[0];

      if (matchStart > lastIndex) {
        segments.push({ text: rawText.slice(lastIndex, matchStart), bold: false });
      }

      if (/(\d|%|₹|\$|Rs|INR|SKU|DMAIC|Kanban|CAPEX|GTM|TAT|ROIC|ISO)/i.test(matchText)) {
        segments.push({ text: matchText, bold: true });
      } else {
        segments.push({ text: matchText, bold: false });
      }
      lastIndex = metricPattern.lastIndex;
    }

    if (lastIndex < rawText.length) {
      segments.push({ text: rawText.slice(lastIndex), bold: false });
    }

    return segments.length > 0 ? segments : [{ text: rawText, bold: false }];
  }

  return [{ text: rawText, bold: false }];
}

/**
 * Strip formatting tags to produce plain text
 */
export function stripFormatting(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/<b>(.*?)<\/b>/g, '$1');
}

/**
 * Authoritative single line / multi-segment CV line measurement
 */
export function measureCvLine(options = {}) {
  initEngine();

  let {
    text = '',
    segments = null,
    maxWidthPx = 599,
    style = {},
    targetRange = {},
    presetId = null
  } = options;

  if (presetId) {
    const preset = CV_PRESETS.find(p => p.id === presetId);
    if (preset) {
      maxWidthPx = preset.maxWidthPx;
    }
  }

  const fontFamily = style.fontFamily || DEFAULT_STYLE.fontFamily;
  const fontSizePt = style.fontSizePt || DEFAULT_STYLE.fontSizePt;
  const fontSizePx = style.fontSizePx || (fontSizePt * (4 / 3));
  const letterSpacingPx = style.letterSpacingPx || 0;
  const fontWeight = style.fontWeight || DEFAULT_STYLE.fontWeight;
  const boldFontWeight = style.boldFontWeight || DEFAULT_STYLE.boldFontWeight;
  const resolvedStyle = {
    fontFamily,
    fontSizePt,
    fontSizePx,
    fontWeight,
    boldFontWeight,
    letterSpacingPx
  };

  const minUtilPct = targetRange.minimumUtilisationPct ?? DEFAULT_TARGET_RANGE.minimumUtilisationPct;
  const maxUtilPct = targetRange.maximumUtilisationPct ?? DEFAULT_TARGET_RANGE.maximumUtilisationPct;

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    if (typeof text === 'string') {
      segments = parseTextToSegments(text);
    } else {
      segments = [{ text: '', bold: false }];
    }
  }

  let fullText = '';
  const wordTokens = [];

  segments.forEach((seg, segIdx) => {
    const segText = seg.text || '';
    const isBold = !!seg.bold || !!seg.fontWeight && seg.fontWeight >= 600;
    fullText += segText;

    const wordsAndSpaces = segText.split(/(\s+)/);

    wordsAndSpaces.forEach(item => {
      if (!item) return;
      if (/^\s+$/.test(item)) {
        wordTokens.push({ text: item, isSpace: true, isBold, segmentIndex: segIdx });
      } else {
        const subTokens = item.split(/(?<=[-\/])/);
        subTokens.forEach(sub => {
          if (!sub) return;
          wordTokens.push({ text: sub, isSpace: false, isBold, segmentIndex: segIdx });
        });
      }
    });
  });

  const lines = [];
  let currentLineWords = [];

  wordTokens.forEach((token) => {
    const proposedWords = [...currentLineWords, token];
    const proposedWidth = measureStyledTokensWidth(proposedWords, resolvedStyle);

    if (proposedWidth <= maxWidthPx || currentLineWords.length === 0) {
      currentLineWords.push(token);
    } else {
      if (currentLineWords.length > 0) {
        const trimmedWords = [...currentLineWords];
        while (trimmedWords[trimmedWords.length - 1]?.isSpace) trimmedWords.pop();
        const trimmedWidth = measureStyledTokensWidth(trimmedWords, resolvedStyle);

        lines.push({
          tokens: currentLineWords,
          text: currentLineWords.map(t => t.text).join(''),
          widthPx: trimmedWidth,
          fillPercentage: (trimmedWidth / maxWidthPx) * 100
        });
      }
      if (token.isSpace) {
        currentLineWords = [];
      } else {
        currentLineWords = [token];
      }
    }
  });

  if (currentLineWords.length > 0) {
    const trimmedWords = [...currentLineWords];
    while (trimmedWords[trimmedWords.length - 1]?.isSpace) trimmedWords.pop();
    const trimmedWidth = measureStyledTokensWidth(trimmedWords, resolvedStyle);

    lines.push({
      tokens: currentLineWords,
      text: currentLineWords.map(t => t.text).join(''),
      widthPx: trimmedWidth,
      fillPercentage: (trimmedWidth / maxWidthPx) * 100
    });
  }

  const lineCount = lines.length || 1;
  const firstLine = lines[0] || { widthPx: 0, fillPercentage: 0, tokens: [] };
  const widthPx = measureStyledTokensWidth(wordTokens, resolvedStyle);

  const fits = lineCount === 1 && widthPx <= maxWidthPx;
  const utilisationPct = Math.round((widthPx / maxWidthPx) * 10000) / 100;

  const remainingPx = fits ? Math.max(0, Math.round((maxWidthPx - widthPx) * 100) / 100) : 0;
  const overflowPx = !fits ? Math.max(0, Math.round((widthPx - maxWidthPx) * 100) / 100) : 0;
  const targetFit = fits && utilisationPct >= minUtilPct && utilisationPct <= maxUtilPct;

  let firstOverflowCharacterIndex = null;
  let maxFittingPrefix = null;
  let overflowText = null;

  if (widthPx > maxWidthPx) {
    let low = 0;
    let high = fullText.length;
    while (low < high) {
      const midpoint = Math.floor((low + high + 1) / 2);
      if (measureStyledPrefixWidth(segments, midpoint, resolvedStyle) <= maxWidthPx) {
        low = midpoint;
      } else {
        high = midpoint - 1;
      }
    }
    firstOverflowCharacterIndex = low;
    maxFittingPrefix = fullText.slice(0, low);
    overflowText = fullText.slice(low);
  }

  let lastFittingWord = null;
  let firstOverflowingWord = null;

  if (firstLine.tokens && firstLine.tokens.length > 0) {
    const nonSpaceTokens = firstLine.tokens.filter(t => !t.isSpace);
    if (nonSpaceTokens.length > 0) {
      lastFittingWord = nonSpaceTokens[nonSpaceTokens.length - 1].text;
    }
  }

  if (lineCount > 1 && lines[1] && lines[1].tokens) {
    const nextNonSpace = lines[1].tokens.find(t => !t.isSpace);
    if (nextNonSpace) {
      firstOverflowingWord = nextNonSpace.text;
    }
  }

  const charCount = fullText.length;
  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
  const avgCharWidth = charCount > 0 ? (widthPx / charCount) : 7.0;

  const estimatedCharsToRemove = overflowPx > 0 ? Math.ceil(overflowPx / avgCharWidth) : 0;
  const estimatedCharsToAdd = (remainingPx > 0 && fits) ? Math.floor(remainingPx / avgCharWidth) : 0;

  let status = 'underfilled';
  if (!fullText.trim()) {
    status = 'invalid-input';
  } else if (fontStatus === 'failed') {
    status = 'font-error';
  } else if (lineCount > 1) {
    status = 'multi-line';
  } else if (utilisationPct > 105.0 || overflowPx > 30) {
    status = 'hard-overflow';
  } else if (utilisationPct > 100.0) {
    status = 'overflow';
  } else if (utilisationPct >= minUtilPct && utilisationPct <= maxUtilPct) {
    status = 'optimal';
  } else {
    status = 'underfilled';
  }

  return {
    text: fullText,
    segments,
    widthPx: Math.round(widthPx * 100) / 100,
    maxWidthPx,
    remainingPx,
    overflowPx,
    utilisationPct,
    fits,
    targetFit,
    status,
    characterCount: charCount,
    wordCount,
    lineCount,
    lines,
    firstOverflowCharacterIndex,
    maxFittingPrefix,
    overflowText,
    lastFittingWord,
    firstOverflowingWord,
    estimatedCharsToRemove,
    estimatedCharsToAdd,
    renderedStyle: {
      fontFamily,
      fontSizePt,
      fontSizePx,
      fontWeight,
      boldFontWeight,
      letterSpacingPx
    },
    targetRange: {
      minimumUtilisationPct: minUtilPct,
      maximumUtilisationPct: maxUtilPct
    },
    fontReady: fontStatus === 'ready',
    measurementEnvironment: engineEnvironment,
    measurementVersion: MEASUREMENT_VERSION,
    metricsProfile: METRICS_PROFILE
  };
}

/**
 * Batch measurement function
 */
export function measureCvBatch(input = {}) {
  const {
    candidates = [],
    maxWidthPx = 599,
    style = {},
    targetRange = {},
    presetId = null
  } = input;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return {
      summary: {
        bestCandidateId: null,
        bestValidCandidateId: null,
        closestToLimitCandidateId: null,
        targetRangeMatchFound: false,
        totalCandidates: 0
      },
      results: []
    };
  }

  const results = candidates.map((cand, idx) => {
    const id = cand.id || `candidate-${idx + 1}`;
    const rawText = cand.text || '';
    const segments = cand.segments || parseTextToSegments(rawText);

    const measurement = measureCvLine({
      text: rawText,
      segments,
      maxWidthPx: cand.maxWidthPx ?? maxWidthPx,
      style: { ...style, ...(cand.style || {}) },
      targetRange: { ...targetRange, ...(cand.targetRange || {}) },
      presetId: cand.presetId ?? presetId
    });

    return {
      id,
      ...measurement
    };
  });

  let bestValidCandidateId = null;
  let highestValidUtil = -1;
  let closestToLimitCandidateId = null;
  let minDiffFrom100 = 999999;
  let targetRangeMatchFound = false;

  results.forEach(res => {
    if (res.targetFit) {
      targetRangeMatchFound = true;
    }

    const diffFrom100 = Math.abs(100 - res.utilisationPct);
    if (diffFrom100 < minDiffFrom100) {
      minDiffFrom100 = diffFrom100;
      closestToLimitCandidateId = res.id;
    }

    if (res.fits) {
      if (res.utilisationPct > highestValidUtil) {
        highestValidUtil = res.utilisationPct;
        bestValidCandidateId = res.id;
      }
    }
  });

  const bestCandidateId = bestValidCandidateId || closestToLimitCandidateId;

  return {
    summary: {
      bestCandidateId,
      bestValidCandidateId,
      closestToLimitCandidateId,
      targetRangeMatchFound,
      totalCandidates: candidates.length
    },
    results
  };
}
