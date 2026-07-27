import React, { useRef, useState, useEffect } from 'react';
import { Bold, Eraser, Sparkles, Copy, Check, AlertCircle, Linkedin } from 'lucide-react';
import { parseTextToSegments, parseHTMLToSegments } from '../utils/canvasMetrics';

export default function BulletEditor({ textSegments, setTextSegments, onSampleLoad, autoBoldMetrics, setAutoBoldMetrics, theme }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [newlineNotice, setNewlineNotice] = useState(false);
  const editorRef = useRef(null);
  const isDark = theme === 'dark';

  const plainText = textSegments.map(s => s.text).join('');
  const [rawText, setRawText] = useState(plainText);
  // Track explicit user overrides per character: 'bold' | 'unbold' | null
  const [manualOverrides, setManualOverrides] = useState([]);

  useEffect(() => {
    let str = '';
    let overrides = [];
    textSegments.forEach(seg => {
      str += seg.text;
      for (let i = 0; i < seg.text.length; i++) {
        overrides.push(seg.bold ? 'bold' : 'unbold');
      }
    });
    setRawText(str);
    setManualOverrides(overrides);
  }, [textSegments]);

  // Compute final bold map layering: Base Auto-Bold + Explicit User Overrides
  const computeFinalBoldMap = (text, overridesArray, shouldAutoBold = autoBoldMetrics) => {
    if (!text) return [];
    const finalMap = Array(text.length).fill(false);

    if (shouldAutoBold) {
      const metricPattern = /((?:₹|Rs\.?|INR|\$)\s*[\d,]+(?:\.\d+)?[LKM]?(?:\b)?|\b\d+(?:\.\d+)?%\s+ROI\b|\b\d+(?:\.\d+)?%[+]?|\b\d+(?:\.\d+)?\+|\bISO\s*\d+|\b(?:TAT|SKU|SKUs|Kanban|DMAIC|CAPEX|GTM|ROIC)\b)/gi;
      let match;

      while ((match = metricPattern.exec(text)) !== null) {
        const matchStart = match.index;
        const matchText = match[0];

        if (/(\d|%|₹|\$|Rs|INR|SKU|DMAIC|Kanban|CAPEX|GTM|TAT|ROIC|ISO)/i.test(matchText)) {
          for (let i = matchStart; i < matchStart + matchText.length; i++) {
            finalMap[i] = true;
          }
        }
      }
    }

    for (let i = 0; i < text.length; i++) {
      const ov = overridesArray[i];
      if (ov === 'unbold') {
        finalMap[i] = false;
      } else if (ov === 'bold') {
        finalMap[i] = true;
      }
    }

    return finalMap;
  };

  const updateFromTextAndOverrides = (newText, newOverrides, shouldAutoBold = autoBoldMetrics) => {
    const finalBoldMap = computeFinalBoldMap(newText, newOverrides, shouldAutoBold);

    setRawText(newText);
    setManualOverrides(newOverrides);

    if (newText.length === 0) {
      setTextSegments([{ text: '', bold: false }]);
      return;
    }

    const segments = [];
    let currentText = newText[0];
    let currentBold = finalBoldMap[0] || false;

    for (let i = 1; i < newText.length; i++) {
      const b = finalBoldMap[i] || false;
      if (b === currentBold) {
        currentText += newText[i];
      } else {
        segments.push({ text: currentText, bold: currentBold });
        currentText = newText[i];
        currentBold = b;
      }
    }
    if (currentText) {
      segments.push({ text: currentText, bold: currentBold });
    }
    setTextSegments(segments);
  };

  const processTextChange = (newText) => {
    let cleanText = newText;
    if (/\r?\n/.test(cleanText)) {
      cleanText = cleanText.replace(/\r?\n/g, ' ');
      setNewlineNotice(true);
      setTimeout(() => setNewlineNotice(false), 3000);
    }

    if (/\*\*.*?\*\*|<b>.*?<\/b>/s.test(cleanText)) {
      const parsedSegs = parseTextToSegments(cleanText, autoBoldMetrics);
      setTextSegments(parsedSegs);
      return;
    }

    const oldText = rawText;
    const oldOverrides = manualOverrides.length === oldText.length ? manualOverrides : Array(oldText.length).fill(null);

    let prefixLen = 0;
    while (
      prefixLen < oldText.length &&
      prefixLen < cleanText.length &&
      oldText[prefixLen] === cleanText[prefixLen]
    ) {
      prefixLen++;
    }

    let suffixLen = 0;
    while (
      suffixLen < (oldText.length - prefixLen) &&
      suffixLen < (cleanText.length - prefixLen) &&
      oldText[oldText.length - 1 - suffixLen] === cleanText[cleanText.length - 1 - suffixLen]
    ) {
      suffixLen++;
    }

    const insertedCount = cleanText.length - suffixLen - prefixLen;
    const prefixOverrides = oldOverrides.slice(0, prefixLen);
    const suffixOverrides = oldOverrides.slice(oldText.length - suffixLen);

    let inheritOverride = null;
    if (prefixLen > 0 && prefixOverrides[prefixLen - 1]) {
      const charBefore = cleanText[prefixLen - 1];
      const firstInsertedChar = insertedCount > 0 ? cleanText[prefixLen] : '';
      if (charBefore !== ' ' && firstInsertedChar !== ' ') {
        inheritOverride = prefixOverrides[prefixLen - 1];
      }
    }

    const insertedOverrides = Array(Math.max(0, insertedCount)).fill(inheritOverride);
    const newOverridesMap = [...prefixOverrides, ...insertedOverrides, ...suffixOverrides];

    updateFromTextAndOverrides(cleanText, newOverridesMap, autoBoldMetrics);
  };

  const handleTextChange = (e) => {
    let val = e.target.value;
    val = val.replace(/^[■•\-*]\s*/, '');
    processTextChange(val);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const htmlData = e.clipboardData ? e.clipboardData.getData('text/html') : '';
    const pastedData = (e.clipboardData || window.clipboardData).getData('text/plain') || '';

    let cleanPlainText = pastedData.replace(/^[■•\-*]\s*/, '');
    if (/\r?\n/.test(cleanPlainText)) {
      cleanPlainText = cleanPlainText.replace(/\r?\n/g, ' ');
      setNewlineNotice(true);
      setTimeout(() => setNewlineNotice(false), 3000);
    }

    // 1. Try parsing rich HTML clipboard (Word, Google Docs, PDFs, Websites)
    let pastedSegments = null;
    if (htmlData && (/<(b|strong|span|p|div|h[1-6])/i.test(htmlData))) {
      pastedSegments = parseHTMLToSegments(htmlData);
    }

    // 2. Fallback to Markdown bold pattern **bold** or <b>bold</b> in plain text
    if (!pastedSegments && /\*\*.*?\*\*|<b>.*?<\/b>/s.test(cleanPlainText)) {
      pastedSegments = parseTextToSegments(cleanPlainText, false);
    }

    const start = editorRef.current ? editorRef.current.selectionStart : 0;
    const end = editorRef.current ? editorRef.current.selectionEnd : 0;

    if (pastedSegments && pastedSegments.length > 0) {
      let insertedText = '';
      let insertedOverrides = [];
      pastedSegments.forEach(seg => {
        let t = seg.text.replace(/[\r\n]+/g, ' ');
        insertedText += t;
        for (let i = 0; i < t.length; i++) {
          insertedOverrides.push(seg.bold ? 'bold' : 'unbold');
        }
      });

      const newFullText = rawText.slice(0, start) + insertedText + rawText.slice(end);
      const oldOverrides = manualOverrides.length === rawText.length ? manualOverrides : Array(rawText.length).fill(null);
      const newOverrides = [
        ...oldOverrides.slice(0, start),
        ...insertedOverrides,
        ...oldOverrides.slice(end)
      ];

      updateFromTextAndOverrides(newFullText, newOverrides, autoBoldMetrics);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = start + insertedText.length;
          editorRef.current.selectionEnd = start + insertedText.length;
        }
      }, 10);
      return;
    }

    // Plain text paste fallback
    const newFullText = rawText.slice(0, start) + cleanPlainText + rawText.slice(end);
    processTextChange(newFullText);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.selectionStart = start + cleanPlainText.length;
        editorRef.current.selectionEnd = start + cleanPlainText.length;
      }
    }, 10);
  };

  const handleToggleAutoBold = (e) => {
    const isChecked = e.target.checked;
    setAutoBoldMetrics(isChecked);
    updateFromTextAndOverrides(rawText, manualOverrides, isChecked);
  };

  const toggleBoldSelection = () => {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    if (start === end) return;

    const currentFinalMap = computeFinalBoldMap(rawText, manualOverrides, autoBoldMetrics);
    
    let boldCount = 0;
    for (let i = start; i < end; i++) {
      if (currentFinalMap[i]) boldCount++;
    }
    const nextOverride = boldCount >= (end - start) / 2 ? 'unbold' : 'bold';

    const newOverrides = [...manualOverrides];
    for (let i = start; i < end; i++) {
      newOverrides[i] = nextOverride;
    }

    updateFromTextAndOverrides(rawText, newOverrides, autoBoldMetrics);
  };

  const insertSymbol = (symbol) => {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    const newText = rawText.slice(0, start) + symbol + rawText.slice(end);
    processTextChange(newText);
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.selectionStart = start + symbol.length;
        editorRef.current.selectionEnd = start + symbol.length;
        editorRef.current.focus();
      }
    }, 10);
  };

  const copyFormatted = async () => {
    setCopyError('');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = rawText;
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('Fallback copy failed');
        }
      }
    } catch (err) {
      setCopyError("Couldn’t copy automatically. Select text & press Cmd/Ctrl+C.");
      setTimeout(() => setCopyError(''), 5000);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleBoldSelection();
    }
  };

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-5 shadow-xl transition-colors duration-300`}>
      {/* Editor Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="bullet-textarea" className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Bullet Point Input
            </label>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select text & press Bold or Ctrl+B</span>
          </div>

          {/* LinkedIn Pill Banner pushed further to the right */}
          <a
            href="https://www.linkedin.com/in/adarsh-nayan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 hover:border-sky-500 transition-all font-mono shadow-sm ml-auto"
            title="Open Adarsh Nayan's LinkedIn Profile"
          >
            <Linkedin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
            <span>www.linkedin.com/in/adarsh-nayan</span>
          </a>
        </div>

        {/* Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-detect Bold toggle */}
          <label className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'} border text-xs cursor-pointer select-none font-medium focus-within:ring-2 focus-within:ring-sky-500`}>
            <input
              type="checkbox"
              checked={autoBoldMetrics}
              onChange={handleToggleAutoBold}
              aria-label="Auto-detect metrics and numbers as bold"
              className="rounded border-slate-400 text-sky-500 focus:ring-sky-500/20"
            />
            <span>Auto-Detect Metrics</span>
          </label>

          <button
            onClick={toggleBoldSelection}
            aria-label="Toggle bold for selected text"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            } text-xs font-bold transition-all border active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-500`}
            title="Toggle Bold for selected text (Ctrl+B / Cmd+B)"
          >
            <Bold className="w-4 h-4 text-sky-500" />
            <span>Bold Select</span>
          </button>

          <button
            onClick={copyFormatted}
            aria-label="Copy bullet point text to clipboard"
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            } text-xs font-medium transition-all border focus-visible:ring-2 focus-visible:ring-sky-500`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => updateFromTextAndOverrides('', [])}
            aria-label="Clear bullet input text"
            className={`p-1.5 rounded-lg ${
              isDark ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-700' : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
            } transition-all border focus-visible:ring-2 focus-visible:ring-sky-500`}
            title="Clear text"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Copy Error or Newline Warning Banner */}
      {copyError && (
        <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center space-x-2" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{copyError}</span>
        </div>
      )}

      {newlineNotice && (
        <div className="mb-3 p-2 bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 rounded-xl text-xs flex items-center space-x-2" role="status" aria-live="polite">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Newlines automatically converted to spaces for single-line analysis.</span>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="bullet-textarea"
          ref={editorRef}
          value={rawText}
          onChange={handleTextChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste or type your CV bullet point here (e.g. Engineered automated data pipelines using Python & SQL, reducing reporting TAT by 35%)..."
          rows={3}
          className={`w-full ${
            isDark ? 'bg-slate-950 text-slate-100 placeholder-slate-500 border-slate-800' : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200'
          } border rounded-xl p-3.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all leading-relaxed font-garamond`}
        />

        {/* Live Bold Formatted Overlay Preview */}
        <div className={`mt-3 p-3 ${isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'} rounded-xl border text-xs font-garamond min-h-[42px] leading-snug`}>
          <div className={`text-[10px] uppercase font-sans font-semibold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>
            Formatting Preview (EB Garamond)
          </div>
          <div className="flex flex-wrap items-baseline gap-x-0.5 whitespace-pre-wrap">
            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} mr-1.5 select-none`}>■</span>
            {textSegments.map((seg, idx) => (
              <span
                key={idx}
                className={seg.bold ? `${isDark ? 'text-white bg-sky-500/20' : 'text-slate-950 bg-sky-100'} font-bold px-0.5 rounded` : ''}
              >
                {seg.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Insert Symbols & Test Case Presets */}
      <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'} flex flex-wrap items-center justify-between gap-3 text-xs`}>
        {/* Special Symbols */}
        <div className="flex items-center space-x-1.5">
          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium mr-1`}>Quick Symbols:</span>
          {['&', '%', '+', ',', '/', '-', '₹', '$', '250+', '300%'].map(sym => (
            <button
              key={sym}
              onClick={() => insertSymbol(sym)}
              aria-label={`Insert symbol ${sym}`}
              className={`px-2 py-1 rounded ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              } font-mono text-[11px] border transition-all hover:text-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Sample Bullets */}
        <div className="flex items-center space-x-1.5">
          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium mr-1`}>Sample Cases:</span>
          <button
            onClick={() => onSampleLoad('orphan1')}
            aria-label="Load sample bullet with orphan spillover"
            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 transition-all text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Load orphan line overflowing by 1 word"
          >
            Orphan Spill Ex
          </button>
          <button
            onClick={() => onSampleLoad('perfect1')}
            aria-label="Load sample bullet with perfect brim fit"
            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 transition-all text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Load line that fits brim-to-brim perfectly"
          >
            Perfect Brim Ex
          </button>
          <button
            onClick={() => onSampleLoad('underfilled1')}
            aria-label="Load sample bullet with underfilled gap"
            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition-all text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Load short underfilled line with right gap"
          >
            Underfilled Ex
          </button>
        </div>
      </div>
    </div>
  );
}
