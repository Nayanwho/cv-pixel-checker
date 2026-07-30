import React, { useState } from 'react';
import { Wand2, ArrowRight, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseTextToSegments, segmentsToMarkdown, analyzeFormattedSegments } from '../utils/canvasMetrics';

export default function MicroOptimizer({ textSegments, setTextSegments, metrics, preset, theme }) {
  const { status, lines, targetLineWidthPx, neededTrimPx } = metrics;
  const rawText = textSegments.map(s => s.text).join('');
  const isDark = theme === 'dark';

  const [undoStack, setUndoStack] = useState([]);

  if (status === 'NEAR_BRIM') {
    return (
      <section className="app-panel p-5 sm:p-6 !border-emerald-500/25">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Optimal Line Fit (98% - 100%)</span>
          </div>
          {undoStack.length > 0 && (
            <button
              onClick={() => {
                const prev = undoStack[undoStack.length - 1];
                setTextSegments(prev);
                setUndoStack(undoStack.slice(0, -1));
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo Last Tweak</span>
            </button>
          )}
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} mt-1.5 font-medium`}>
          No micro-adjustments needed! This bullet point covers the printable width near brim-to-brim with minimal margin gap.
        </p>
      </section>
    );
  }

  const lastLine = lines[lines.length - 1] || { widthPx: 0 };
  const gapPx = targetLineWidthPx - lastLine.widthPx;

  // Helper to dynamically calculate EXACT measured delta for a proposed replacement
  const evaluateReplacement = (targetRegex, replacementText, label, category) => {
    if (!targetRegex.test(rawText)) return null;

    const markdownText = segmentsToMarkdown(textSegments);
    const updatedMarkdown = markdownText.replace(targetRegex, replacementText);
    const proposedSegments = parseTextToSegments(updatedMarkdown, true);

    const proposedMetrics = analyzeFormattedSegments(
      proposedSegments,
      preset ? preset.lineWidthPt : 450.1,
      preset ? preset.fontSizePt : 9.75,
      preset ? preset.fontFamily : 'EB Garamond'
    );

    const measuredDeltaPx = metrics.totalWidthPx - proposedMetrics.totalWidthPx;

    return {
      label,
      category,
      proposedSegments,
      proposedStatus: proposedMetrics.status,
      proposedFill: proposedMetrics.fillPercentage.toFixed(1),
      currentFill: metrics.fillPercentage.toFixed(1),
      measuredDeltaPx,
      apply: () => {
        setUndoStack([...undoStack, textSegments]);
        setTextSegments(proposedSegments);
      }
    };
  };

  const rawCandidates = [];

  if (status === 'ORPHAN' || status === 'HARD_OVERFLOW') {
    rawCandidates.push(evaluateReplacement(/ and /g, ' & ', 'Replace "and" with "&"', 'Conjunction'));
    rawCandidates.push(evaluateReplacement(/ percent/g, '%', 'Replace "percent" with "%"', 'Symbol'));
    rawCandidates.push(evaluateReplacement(/ in order to /gi, ' to ', 'Shorten "in order to" to "to"', 'Conciseness'));
    rawCandidates.push(evaluateReplacement(/ (utilizing|leveraging) /gi, ' using ', 'Replace "utilizing/leveraging" with "using"', 'Conciseness'));
    rawCandidates.push(evaluateReplacement(/ versus /gi, ' vs. ', 'Shorten "versus" to "vs."', 'Abbreviation'));
    rawCandidates.push(evaluateReplacement(/management/gi, 'mgmt', 'Shorten "management" to "mgmt"', 'Abbreviation'));
    rawCandidates.push(evaluateReplacement(/development/gi, 'dev', 'Shorten "development" to "dev"', 'Abbreviation'));
  } else if (status === 'UNDERFILLED') {
    rawCandidates.push(evaluateReplacement(/ & /g, ' and ', 'Replace "&" with "and"', 'Expansion'));
    rawCandidates.push(evaluateReplacement(/\bTAT\b/g, 'Turnaround Time (TAT)', 'Expand "TAT" to "Turnaround Time (TAT)"', 'Acronym Expansion'));
    rawCandidates.push(evaluateReplacement(/\bSKUs\b/g, 'Stock Keeping Units (SKUs)', 'Expand "SKU" to "Stock Keeping Units (SKUs)"', 'Acronym Expansion'));
  }

  const validSuggestions = rawCandidates.filter(Boolean);

  return (
    <section className="app-panel p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold">Smart line balancer</h3>
        </div>

        <div className="flex items-center space-x-2">
          {undoStack.length > 0 && (
            <button
              onClick={() => {
                const prev = undoStack[undoStack.length - 1];
                setTextSegments(prev);
                setUndoStack(undoStack.slice(0, -1));
              }}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all"
              title="Revert last applied micro-tweak"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${
            status === 'UNDERFILLED' 
              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30' 
              : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
          }`}>
            {status === 'UNDERFILLED' ? `Need +${gapPx.toFixed(0)}px` : `Trim ~${(neededTrimPx || gapPx).toFixed(0)}px`}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {validSuggestions.map((sug, idx) => (
          <div
            key={idx}
              className={`flex items-center justify-between p-3.5 rounded-xl ${
              isDark ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/30' : 'bg-slate-50/80 border-slate-200 hover:border-indigo-300'
            } border transition-all group`}
          >
            <div>
                <div className={`text-xs font-semibold ${isDark ? 'text-slate-200 group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-600'} transition-colors`}>
                {sug.label}
              </div>
              <div className="flex items-center space-x-2 mt-0.5 text-[11px] font-mono">
                <span className={sug.measuredDeltaPx > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-sky-600 dark:text-sky-400 font-semibold'}>
                  {sug.measuredDeltaPx > 0 ? `Saves ${sug.measuredDeltaPx.toFixed(1)}px` : `Adds ${Math.abs(sug.measuredDeltaPx).toFixed(1)}px`}
                </span>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>•</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Fit: {sug.currentFill}% → {sug.proposedFill}% ({sug.proposedStatus})
                </span>
              </div>
            </div>

            <button
              onClick={sug.apply}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-300 hover:text-white border border-indigo-500/25 transition-all text-xs font-semibold"
              aria-label={`Apply suggestion: ${sug.label}`}
            >
              <span>Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* High-impact guidance card when underfilled or overflowing */}
        {status === 'UNDERFILLED' && (
          <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'} border text-xs`}>
            <strong>Quality Optimization Tip:</strong> To fill ~{gapPx.toFixed(0)}px of space, add a quantifiable outcome (e.g. <em>"driving $45K revenue"</em>), scope qualifier (e.g. <em>"across 5 cross-functional teams"</em>), or metric impact rather than filler phrases.
          </div>
        )}

        {(status === 'ORPHAN' || status === 'HARD_OVERFLOW') && (
          <div className={`p-3 rounded-xl ${isDark ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'} border text-xs`}>
            <strong>Conciseness Tip:</strong> Trim ~{(neededTrimPx || gapPx).toFixed(0)}px (~{Math.ceil((neededTrimPx || gapPx) / 5.5)} chars) by removing redundant adjectives or passive verbs while preserving key metrics.
          </div>
        )}
      </div>
    </section>
  );
}
