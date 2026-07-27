import React, { useMemo, useDeferredValue } from 'react';
import { Layers, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { analyzeFormattedSegments, parseTextToSegments } from '../utils/canvasMetrics';

export default function BatchChecker({ preset, onSelectLine, autoBoldMetrics, setAutoBoldMetrics, theme, batchInput, setBatchInput }) {
  const isDark = theme === 'dark';
  
  // Use React deferred value so textarea updates immediately on typing, deferring heavy line calculations
  const deferredBatchInput = useDeferredValue(batchInput);

  // Memoized batch results calculated against deferred value
  const results = useMemo(() => {
    const rawLines = deferredBatchInput.split('\n').filter(l => l.trim().length > 0);

    return rawLines.map((lineText, idx) => {
      const cleanText = lineText.replace(/^[■•\-*]\s*/, '');
      const segments = parseTextToSegments(cleanText, autoBoldMetrics);
      
      const metrics = analyzeFormattedSegments(
        segments,
        preset.lineWidthPt,
        preset.fontSizePt,
        preset.fontFamily
      );

      return {
        id: idx + 1,
        rawText: cleanText,
        segments,
        metrics
      };
    });
  }, [deferredBatchInput, preset, autoBoldMetrics]);

  const nearBrimCount = results.filter(r => r.metrics.status === 'NEAR_BRIM').length;
  const underfilledCount = results.filter(r => r.metrics.status === 'UNDERFILLED').length;
  const orphanCount = results.filter(r => r.metrics.status === 'ORPHAN').length;
  const overflowCount = results.filter(r => r.metrics.status === 'HARD_OVERFLOW').length;

  return (
    <div className="space-y-6">
      {/* Batch Input Textarea */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-5 shadow-xl transition-colors duration-300`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <label htmlFor="batch-textarea" className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Paste Entire CV Section (Multiple Bullets)
            </label>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auto-bold toggle */}
            <label className={`flex items-center space-x-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} cursor-pointer select-none font-medium focus-within:ring-2 focus-within:ring-sky-500 rounded`}>
              <input
                type="checkbox"
                checked={autoBoldMetrics}
                onChange={(e) => setAutoBoldMetrics(e.target.checked)}
                aria-label="Auto-detect metrics in batch mode"
                className="rounded border-slate-400 text-sky-500 focus:ring-sky-500/20"
              />
              <span>Auto-Detect Metrics</span>
            </label>
            <span className={`text-xs ${isDark ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'} px-2 py-0.5 rounded border font-mono`}>
              {results.length} Bullets
            </span>
          </div>
        </div>

        <textarea
          id="batch-textarea"
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="Paste multiple CV bullet points (one per line, use **bold** or plain text)..."
          rows={6}
          className={`w-full ${
            isDark ? 'bg-slate-950 text-slate-100 placeholder-slate-500 border-slate-800' : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200'
          } border rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 leading-relaxed`}
        />
        <div className={`mt-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center justify-between`}>
          <span>Tip: You can use <code className="text-sky-600 dark:text-sky-300 font-mono font-bold">**bold text**</code> or paste plain text directly.</span>
        </div>
      </div>

      {/* Audit Summary Header Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Optimal Brim (98-100%)</span>
            <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{nearBrimCount}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Underfilled (&lt;98%)</span>
            <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{underfilledCount}</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Orphan Spillover</span>
            <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{orphanCount}</span>
          </div>
          <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Hard Overflow (&gt;100%)</span>
            <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{overflowCount}</span>
          </div>
          <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
        </div>
      </div>

      {/* Results Matrix */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-5 shadow-xl space-y-3 transition-colors duration-300`}>
        <h3 className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-3`}>Line Audit Matrix</h3>

        {results.map((res) => {
          const { status, fillPercentage, numLines, statusMessage, lines } = res.metrics;
          const lastLine = lines[lines.length - 1] || { fillPercentage: 0 };
          const displayPct = (numLines === 1 ? fillPercentage : lastLine.fillPercentage).toFixed(1);

          const badgeColor = status === 'NEAR_BRIM'
            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
            : status === 'UNDERFILLED'
            ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
            : 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';

          return (
            <div
              key={res.id}
              className={`p-3.5 ${
                isDark ? 'bg-slate-950 border-slate-800 hover:border-sky-500/30' : 'bg-slate-50 border-slate-200 hover:border-sky-300'
              } rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-400">#{res.id}</span>
                  {/* Formatted Text Preview */}
                  <div className={`text-xs font-garamond ${isDark ? 'text-slate-200' : 'text-slate-900'} truncate block max-w-xl whitespace-pre-wrap`}>
                    {res.segments.map((seg, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontFamily: '"EB Garamond", Garamond, Georgia, serif',
                          fontWeight: seg.bold ? 700 : 400
                        }}
                        className={seg.bold ? `${isDark ? 'text-white bg-sky-500/20' : 'text-slate-950 bg-sky-100'} font-bold px-0.5 rounded` : ''}
                      >
                        {seg.text}
                      </span>
                    ))}
                  </div>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{statusMessage}</p>
              </div>

              <div className="flex items-center space-x-3 flex-shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold border ${badgeColor}`}>
                  {displayPct}%
                </span>

                <button
                  onClick={() => onSelectLine(res.segments)}
                  aria-label={`Inspect line ${res.id} in single line editor`}
                  className={`p-1.5 rounded-lg ${
                    isDark ? 'bg-slate-800 hover:bg-sky-500 text-slate-300 hover:text-white' : 'bg-slate-200 hover:bg-sky-500 text-slate-700 hover:text-white'
                  } transition-all text-xs font-bold flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-sky-500`}
                  title="Inspect and optimize in Single Line Checker"
                >
                  <span>Edit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
