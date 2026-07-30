import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Activity, Ruler, Rows3, Scissors } from 'lucide-react';

export default function LineFillGauge({ metrics, theme }) {
  const { status, fillPercentage, numLines, statusMessage, totalWidthPx, targetLineWidthPx, neededTrimPx, lines } = metrics;
  const isDark = theme === 'dark';

  const isNearBrim = status === 'NEAR_BRIM';
  const isUnderfilled = status === 'UNDERFILLED';
  const isOrphan = status === 'ORPHAN';
  const isHardOverflow = status === 'HARD_OVERFLOW';

  const statusColor = isNearBrim
    ? isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-300'
    : isUnderfilled
    ? isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-700 bg-amber-50 border-amber-300'
    : isOrphan
    ? isDark ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'text-rose-700 bg-rose-50 border-rose-300'
    : isDark ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'text-rose-700 bg-rose-50 border-rose-300';

  const StatusIcon = isNearBrim ? CheckCircle2 : (isUnderfilled ? AlertTriangle : AlertCircle);

  const lastLine = lines[lines.length - 1] || { fillPercentage: 0, widthPx: 0 };
  const displayPercentage = (numLines === 1 ? fillPercentage : lastLine.fillPercentage).toFixed(1);
  const numericPct = parseFloat(displayPercentage);

  const statusLabel = isNearBrim
    ? 'Optimal Brim Fit (98% - 100%)'
    : isOrphan
    ? 'Orphan Line Spillover'
    : isHardOverflow
    ? 'Hard Overflow (>100%)'
    : isUnderfilled
    ? 'Underfilled (<98%)'
    : 'Empty';

  const progressColor = isNearBrim
    ? 'bg-emerald-500'
    : isUnderfilled
    ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <section className="app-panel p-5 sm:p-6" aria-labelledby="line-density-title">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${statusColor}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span id="line-density-title" className="app-label">Line Density Status</span>
            <div className="mt-1.5">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] border ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-4xl font-semibold tracking-[-0.06em] font-mono leading-none">
            {displayPercentage}<span className="text-xl text-slate-400">%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Final Line Fill</p>
        </div>
      </div>

      <div className={`mt-5 rounded-xl border p-3.5 text-sm leading-relaxed ${statusColor}`} role="status" aria-live="polite">
        {statusMessage}
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
          <span>Start (0px)</span>
          <span className="text-amber-600 dark:text-amber-400">Underfilled (&lt;98%)</span>
          <span className="text-emerald-600 dark:text-emerald-400">Optimal Brim (98% - 100%)</span>
          <span className="text-rose-600 dark:text-rose-400">Overflow (&gt;100%)</span>
        </div>

        <div className={`relative mt-3 h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} border`}>
          <div className="absolute inset-y-0 left-[98%] w-[2%] bg-emerald-500/20 border-x border-emerald-500/50" aria-hidden="true" />
          <div
            className={`relative h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(numericPct, 100)}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 text-xs font-mono font-semibold">{displayPercentage}%</div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-6">
        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Consumed Width</span>
          </div>
          <div className="mt-2 font-mono text-lg font-semibold">
              {totalWidthPx.toFixed(1)} px
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Line Printable Capacity</span>
          </div>
          <div className="mt-2 font-mono text-lg font-semibold leading-tight">
            {targetLineWidthPx.toFixed(1)} px
            <span className="block text-[11px] text-slate-500 mt-1">({metrics.targetLineWidthPt} pt)</span>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Rows3 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Line Count</span>
          </div>
          <div className="mt-2 font-mono text-lg font-semibold">
            {numLines} Line{numLines > 1 ? 's' : ''}
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
          <div className="flex items-center gap-2 text-slate-500">
            <Scissors className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Right Margin Gap / Needed Trim</span>
          </div>
          <div className={`mt-2 font-mono text-lg font-semibold ${
            isNearBrim ? 'text-emerald-600 dark:text-emerald-400' : isUnderfilled ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isUnderfilled
              ? `-${(targetLineWidthPx - lastLine.widthPx).toFixed(1)} px`
              : isNearBrim
              ? `0 to ${(targetLineWidthPx - lastLine.widthPx).toFixed(1)} px`
              : isOrphan
              ? `Trim ~${neededTrimPx.toFixed(0)} px`
              : `+${(lastLine.widthPx - targetLineWidthPx).toFixed(1)} px Over`}
          </div>
        </div>
      </div>
    </section>
  );
}
