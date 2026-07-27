/**
 * Precision Canvas & DOM Measurement Engine Adapter for React UI
 * Integrates with the Authoritative Shared Measurement Engine.
 */

import {
  measureCvLine,
  measureCvBatch,
  parseTextToSegments,
  ensureFontReady,
  getEngineStatus,
  CV_PRESETS,
  DEFAULT_STYLE,
  DEFAULT_TARGET_RANGE
} from '../engine/measurementEngine';

let canvasContext = null;
let fontStatus = 'loading'; // 'loading' | 'ready' | 'failed'
let hiddenDOMContainer = null;

export { CV_PRESETS, parseTextToSegments };

export async function waitForFont() {
  const ready = await ensureFontReady();
  fontStatus = ready ? 'ready' : 'failed';
  return fontStatus;
}

export function isFontReady() {
  const status = getEngineStatus();
  return status.fontReady;
}

export function getFontInfo() {
  const status = getEngineStatus();
  return {
    status: status.status,
    fontName: status.fontReady ? 'EB Garamond' : 'Georgia (Fallback)',
    isFallback: !status.fontReady
  };
}

export function measureTextWidth(text, isBold = false, fontSizePt = 9.75, fontFamily = 'EB Garamond') {
  const res = measureCvLine({
    text,
    segments: [{ text, bold: isBold }],
    style: { fontFamily, fontSizePt }
  });
  return res.widthPx;
}

/**
 * Measure formatted segments using authoritative measurement engine
 */
export function analyzeFormattedSegments(segments, targetLineWidthPt = 449.25, fontSizePt = 9.75, fontFamily = 'EB Garamond', preset = null) {
  const grossLineWidthPx = targetLineWidthPt * (4 / 3);
  
  const result = measureCvLine({
    segments,
    maxWidthPx: grossLineWidthPx,
    style: {
      fontFamily,
      fontSizePt,
      fontSizePx: fontSizePt * (4 / 3)
    },
    presetId: preset?.id
  });

  const fontInfo = getFontInfo();

  // Map to format expected by UI components (DensityBreakdown, LineFillGauge, CVLinePreview, MicroOptimizer)
  let uiStatus = 'UNDERFILLED';
  let uiStatusMessage = '';

  if (result.status === 'invalid-input') {
    uiStatus = 'EMPTY';
    uiStatusMessage = 'Empty text input.';
  } else if (result.status === 'optimal' || result.status === 'near-limit') {
    uiStatus = 'NEAR_BRIM';
    const gapPx = grossLineWidthPx - result.widthPx;
    if (gapPx <= 2.0) {
      uiStatusMessage = 'Exact Zero-Gap Fit! Single line brim-to-brim (99.5% - 100%).';
    } else {
      uiStatusMessage = `Optimal Fit! Single line near brim (${result.utilisationPct.toFixed(1)}%).`;
    }
  } else if (result.status === 'underfilled') {
    uiStatus = 'UNDERFILLED';
    const gapPx = grossLineWidthPx - result.widthPx;
    uiStatusMessage = `Underfilled (${result.utilisationPct.toFixed(1)}%). Has a ~${gapPx.toFixed(0)}px gap at right margin.`;
  } else if (result.status === 'multi-line' && result.lineCount > 1) {
    uiStatus = 'ORPHAN';
    const lastWord = result.firstOverflowingWord || 'word(s)';
    uiStatusMessage = `Orphan Spillover! Trailing text on line ${result.lineCount}. Trim ~${result.overflowPx.toFixed(0)}px to merge onto single line.`;
  } else {
    uiStatus = 'HARD_OVERFLOW';
    uiStatusMessage = `Hard Overflow (${result.utilisationPct.toFixed(1)}%). Exceeds printable line by ~${result.overflowPx.toFixed(0)}px!`;
  }

  if (fontInfo.isFallback) {
    uiStatusMessage = `[Approximate result — EB Garamond unavailable] ${uiStatusMessage}`;
  }

  return {
    totalWidthPx: result.widthPx,
    targetLineWidthPx: grossLineWidthPx,
    targetLineWidthPt,
    fillPercentage: result.utilisationPct,
    lines: result.lineCount === 1 ? [{
      tokens: result.segments,
      text: result.text,
      widthPx: result.widthPx,
      fillPercentage: result.utilisationPct
    }] : [],
    numLines: result.lineCount,
    status: uiStatus,
    statusMessage: uiStatusMessage,
    orphanWords: result.firstOverflowingWord ? [result.firstOverflowingWord] : [],
    neededTrimPx: result.overflowPx,
    fontInfo,
    layoutInfo: {
      cellWidthPt: targetLineWidthPt,
      grossLineWidthPx,
      paddingLeftPx: 0,
      paddingRightPx: 0,
      borderLeftPx: 0,
      borderRightPx: 0,
      bulletInsideTextCell: false,
      bulletWidthPx: 0,
      bulletGapPx: 0,
      rendererCalibrationFactor: 1.0,
      netPrintableWidthPx: grossLineWidthPx
    },
    counts: {
      totalChars: result.characterCount,
      uppercase: (result.text.match(/[A-Z]/g) || []).length,
      lowercase: (result.text.match(/[a-z]/g) || []).length,
      numbers: (result.text.match(/[0-9]/g) || []).length,
      spaces: (result.text.match(/\s/g) || []).length,
      specialChars: (result.text.match(/[\-&%+,\/₹\$]/g) || []).length,
      boldChars: result.segments.filter(s => s.bold).reduce((a, b) => a + (b.text || '').length, 0),
      regularChars: result.segments.filter(s => !s.bold).reduce((a, b) => a + (b.text || '').length, 0)
    },
    widths: {
      spaces: 0,
      bold: 0,
      regular: 0,
      numbers: 0,
      special: 0
    },
    rawEngineResult: result
  };
}

export function parseHTMLToSegments(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const body = doc.body;

    if (!body || !body.textContent.trim()) return null;

    const segments = [];

    function traverse(node, isBoldContext) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text) {
          segments.push({ text, bold: isBoldContext });
        }
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toUpperCase();
        if (tagName === 'STYLE' || tagName === 'SCRIPT' || tagName === 'META') return;

        const style = node.getAttribute('style') || '';
        const isBoldTag = tagName === 'B' || tagName === 'STRONG' || tagName === 'H1' || tagName === 'H2' || tagName === 'H3';
        const isBoldStyle = /font-weight\s*:\s*(bold|[6-9]00)/i.test(style);
        const childIsBold = isBoldContext || isBoldTag || isBoldStyle;

        for (let child of node.childNodes) {
          traverse(child, childIsBold);
        }
      }
    }

    traverse(body, false);

    const mergedSegments = [];
    segments.forEach(seg => {
      if (!seg.text) return;
      if (mergedSegments.length > 0 && mergedSegments[mergedSegments.length - 1].bold === seg.bold) {
        mergedSegments[mergedSegments.length - 1].text += seg.text;
      } else {
        mergedSegments.push({ ...seg });
      }
    });

    return mergedSegments.length > 0 ? mergedSegments : null;
  } catch (e) {
    return null;
  }
}

export function segmentsToMarkdown(segments) {
  if (!segments || segments.length === 0) return '';
  return segments.map(seg => seg.bold ? `**${seg.text}**` : seg.text).join('');
}
