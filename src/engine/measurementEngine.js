import { loadNodeCanvas } from './nodeCanvasLoader.js';

let canvasCtx = null;
let fontStatus = 'loading'; // 'loading' | 'ready' | 'failed'
let engineEnvironment = 'unknown'; // 'browser' | 'node'
const widthCache = new Map();

// Universal preset definitions
export const CV_PRESETS = [
  {
    id: 'preset_internship',
    name: '💼 Internship & Work Experience (Standard B-School)',
    shortLabel: 'Internship & Work Exp',
    description: 'Standard B-School: Category Col (83.0pt) + Net Printable Text (449.25pt / 599.0px)',
    sectionTitle: 'INTERNSHIP / WORK EXPERIENCE',
    categoryTitle: 'Roles &\nResponsibilities',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 449.25, // 599.0 px exact
    maxWidthPx: 599.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: false
  },
  {
    id: 'preset_extracurricular',
    name: '🏆 Competitions & Extra-Curriculars (Standard B-School)',
    shortLabel: 'Competitions & Extra-Curriculars',
    description: 'Standard B-School: Category (83.0pt) + Year Col (32.6pt) + Net Consumed Text (419.25pt / 559.0px)',
    sectionTitle: 'EXTRA-CURRICULAR ACTIVITIES & OTHERS',
    categoryTitle: 'Case Competitions',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 419.25, // 559.0 px
    maxWidthPx: 559.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: true
  },
  {
    id: 'preset_academics',
    name: '🎓 Academic Achievements & Certifications (Standard B-School)',
    shortLabel: 'Academic Achievements',
    description: 'Standard B-School: Wide Section + Year Col (32.6pt) + Net Consumed Text (508.25pt / 677.7px)',
    sectionTitle: 'ACADEMIC ACHIEVEMENTS',
    categoryTitle: '',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 508.25, // 677.67 px
    maxWidthPx: 677.67,
    bulletChar: '▪',
    categoryWidthPt: 0,
    hasYearColumn: true
  },
  {
    id: 'preset_por',
    name: '🎯 Position of Responsibility - POR (Standard B-School)',
    shortLabel: 'Positions of Responsibility',
    description: 'Standard B-School: Role Col (83.0pt) + Year Col (32.6pt) + Net Consumed Text (419.25pt / 559.0px)',
    sectionTitle: 'POSITION OF RESPONSIBILITY',
    categoryTitle: 'PR Coordinator',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 419.25, // 559.0 px
    maxWidthPx: 559.0,
    bulletChar: '▪',
    categoryWidthPt: 83.0,
    hasYearColumn: true
  },
  {
    id: 'preset_standard',
    name: '📄 Standard Full-Width Printable Bullet (Standard B-School)',
    shortLabel: 'Standard Full Width',
    description: 'Full printable table width (540.0pt / 720.0px)',
    sectionTitle: 'GENERAL CV SECTION',
    categoryTitle: '',
    fontFamily: 'EB Garamond',
    fontSizePt: 9.75,
    lineWidthPt: 540.0, // 720.0 px
    maxWidthPx: 720.0,
    bulletChar: '•',
    categoryWidthPt: 0,
    hasYearColumn: false
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
    measurementVersion: '1.0.0'
  };
}

/**
 * Measure width of text segment in pixels
 */
export function measureSegmentWidth(text, isBold = false, fontSizePx = 13, fontFamily = 'EB Garamond') {
  if (!text) return 0;
  initEngine();

  const fontWeight = isBold ? '700' : '400';
  const fontStack = fontStatus === 'ready'
    ? `"${fontFamily}", Garamond, Georgia, serif`
    : `Georgia, "${fontFamily}", Garamond, serif`;

  const cacheKey = `${fontStack}_${fontWeight}_${fontSizePx}_${text}`;
  if (widthCache.has(cacheKey)) {
    return widthCache.get(cacheKey);
  }

  let width = 0;
  if (canvasCtx) {
    canvasCtx.font = `${fontWeight} ${fontSizePx}px ${fontStack}`;
    width = canvasCtx.measureText(text).width;
  } else {
    const factor = isBold ? 0.62 : 0.55;
    width = text.length * fontSizePx * factor;
  }

  widthCache.set(cacheKey, width);
  return width;
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
  const charDetails = [];

  segments.forEach((seg, segIdx) => {
    const segText = seg.text || '';
    const isBold = !!seg.bold || !!seg.fontWeight && seg.fontWeight >= 600;
    fullText += segText;

    const wordsAndSpaces = segText.split(/(\s+)/);

    wordsAndSpaces.forEach(item => {
      if (!item) return;
      if (/^\s+$/.test(item)) {
        const w = measureSegmentWidth(item, isBold, fontSizePx, fontFamily);
        wordTokens.push({ text: item, isSpace: true, isBold, widthPx: w, segmentIndex: segIdx });
      } else {
        const subTokens = item.split(/(?<=[-\/])/);
        subTokens.forEach(sub => {
          if (!sub) return;
          const w = measureSegmentWidth(sub, isBold, fontSizePx, fontFamily);
          wordTokens.push({ text: sub, isSpace: false, isBold, widthPx: w, segmentIndex: segIdx });
        });
      }
    });

    for (let i = 0; i < segText.length; i++) {
      const char = segText[i];
      const charW = measureSegmentWidth(char, isBold, fontSizePx, fontFamily);
      charDetails.push({
        char,
        isBold,
        widthPx: charW
      });
    }
  });

  const lines = [];
  let currentLineWords = [];
  let currentLineWidth = 0;

  // Apply a 5.0px safety kerning buffer to prevent subpixel browser DOM wrapping
  const effectiveLineMaxPx = maxWidthPx - 5.0;

  wordTokens.forEach((token) => {
    if (currentLineWidth + token.widthPx <= effectiveLineMaxPx) {
      currentLineWords.push(token);
      currentLineWidth += token.widthPx;
    } else {
      if (currentLineWords.length > 0) {
        let trimmedWidth = currentLineWidth;
        const lastToken = currentLineWords[currentLineWords.length - 1];
        if (lastToken && lastToken.isSpace) {
          trimmedWidth -= lastToken.widthPx;
        }

        lines.push({
          tokens: currentLineWords,
          text: currentLineWords.map(t => t.text).join(''),
          widthPx: trimmedWidth,
          fillPercentage: (trimmedWidth / maxWidthPx) * 100
        });
      }
      if (token.isSpace) {
        currentLineWidth = 0;
        currentLineWords = [];
      } else {
        currentLineWords = [token];
        currentLineWidth = token.widthPx;
      }
    }
  });

  if (currentLineWords.length > 0) {
    let trimmedWidth = currentLineWidth;
    const lastToken = currentLineWords[currentLineWords.length - 1];
    if (lastToken && lastToken.isSpace) {
      trimmedWidth -= lastToken.widthPx;
    }

    lines.push({
      tokens: currentLineWords,
      text: currentLineWords.map(t => t.text).join(''),
      widthPx: trimmedWidth,
      fillPercentage: (trimmedWidth / maxWidthPx) * 100
    });
  }

  const lineCount = lines.length || 1;
  const firstLine = lines[0] || { widthPx: 0, fillPercentage: 0, tokens: [] };

  const totalTextWidthPx = lines.reduce((acc, l) => acc + l.widthPx, 0);
  const widthPx = lineCount === 1 ? firstLine.widthPx : totalTextWidthPx;

  const fits = lineCount === 1 && widthPx <= maxWidthPx;
  const utilisationPct = lineCount === 1 
    ? Math.round((widthPx / maxWidthPx) * 10000) / 100
    : Math.round((firstLine.widthPx / maxWidthPx) * 10000) / 100;

  const remainingPx = fits ? Math.max(0, Math.round((maxWidthPx - widthPx) * 100) / 100) : 0;
  const overflowPx = !fits ? Math.max(0, Math.round((widthPx - maxWidthPx) * 100) / 100) : 0;
  const targetFit = fits && utilisationPct >= minUtilPct && utilisationPct <= maxUtilPct;

  let firstOverflowCharacterIndex = null;
  let maxFittingPrefix = null;
  let overflowText = null;
  let cumulativeCharWidth = 0;

  for (let i = 0; i < charDetails.length; i++) {
    cumulativeCharWidth += charDetails[i].widthPx;
    if (cumulativeCharWidth > maxWidthPx) {
      firstOverflowCharacterIndex = i;
      maxFittingPrefix = fullText.slice(0, i);
      overflowText = fullText.slice(i);
      break;
    }
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
      fontWeight: style.fontWeight || 400,
      boldFontWeight: style.boldFontWeight || 700,
      letterSpacingPx
    },
    targetRange: {
      minimumUtilisationPct: minUtilPct,
      maximumUtilisationPct: maxUtilPct
    },
    measurementVersion: '1.0.0'
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
      maxWidthPx,
      style,
      targetRange,
      presetId
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
