import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

export default function LineFillGauge({ metrics, theme }) {
  const { status, fillPercentage, numLines, statusMessage, totalWidthPx, targetLineWidthPx, neededTrimPx, lines, fontInfo } = metrics;
  const isDark = theme === 'dark';

  const isNearBrim = status === 'NEAR_BRIM';
  const isUnderfilled = status === 'UNDERFILLED';
  const isOrphan = status === 'ORPHAN';
  const isHardOverflow = status === 'HARD_OVERFLOW';
  const isEmpty = status === 'EMPTY';

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

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-5 shadow-xl transition-colors duration-300`}>
      {/* Top Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${statusColor}`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Line Density Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'} mt-0.5`} role="status" aria-live="polite">
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Big Fill Percentage Badge */}
        <div className="text-right">
          <div className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>
            {displayPercentage}<span className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Final Line Fill</p>
        </div>
      </div>

      {/* Visual Fill Progress Meter */}
      <div className="space-y-2">
        <div className={`flex justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
          <span>Start (0px)</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Underfilled (&lt;98%)</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal Brim (98% - 100%)</span>
          <span className="text-rose-600 dark:text-rose-400 font-medium">Overflow (&gt;100%)</span>
        </div>

        {/* Progress Bar Container */}
        <div className={`relative h-7 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} rounded-xl overflow-hidden border p-1 flex items-center`}>
          {/* 0% to 98% Underfilled Zone Background */}
          <div className="absolute left-0 top-0 bottom-0 w-[98%] bg-amber-500/5 border-r border-dashed border-amber-500/30 select-none" />
          
          {/* 98% to 100% Target Zone Background */}
          <div className="absolute left-[98%] top-0 bottom-0 w-[2%] bg-emerald-500/20 border-r border-emerald-500 select-none flex items-center justify-center">
            <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold tracking-tighter">BRIM</span>
          </div>

          {/* Actual Fill Progress Bar */}
          <div
            className={`h-full rounded-lg transition-all duration-300 relative flex items-center ${
              numericPct >= 15 ? 'justify-end pr-2' : 'justify-start pl-2'
            } ${
              isNearBrim
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/30'
                : isUnderfilled
                ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-md shadow-rose-500/30'
            }`}
            style={{ width: `${Math.min(numericPct, 100)}%` }}
          >
            <span className={`text-[11px] font-mono font-bold whitespace-nowrap ${
              numericPct >= 15 ? 'text-slate-950' : 'text-white'
            }`}>
              {displayPercentage}%
            </span>
          </div>
        </div>

        {/* Detailed Metrics Footer */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 mt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'} text-xs`}>
          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} p-2.5 rounded-xl border`}>
            <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} block text-[10px]`}>Total Consumed Width</span>
            <span className={`font-mono text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {totalWidthPx.toFixed(1)} px
            </span>
          </div>

          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} p-2.5 rounded-xl border`}>
            <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} block text-[10px]`}>Line Printable Capacity</span>
            <span className={`font-mono text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {targetLineWidthPx.toFixed(1)} px ({metrics.targetLineWidthPt} pt)
            </span>
          </div>

          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} p-2.5 rounded-xl border`}>
            <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} block text-[10px]`}>Line Count</span>
            <span className={`font-mono text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {numLines} Line{numLines > 1 ? 's' : ''}
            </span>
          </div>

          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} p-2.5 rounded-xl border`}>
            <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} block text-[10px]`}>Right Margin Gap / Needed Trim</span>
            <span className={`font-mono text-sm font-bold ${
              isNearBrim ? 'text-emerald-600 dark:text-emerald-400' : isUnderfilled ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {isUnderfilled
                ? `-${(targetLineWidthPx - lastLine.widthPx).toFixed(1)} px`
                : isNearBrim
                ? `0 to ${(targetLineWidthPx - lastLine.widthPx).toFixed(1)} px (Optimal)`
                : isOrphan
                ? `Trim ~${neededTrimPx.toFixed(0)} px`
                : `+${(lastLine.widthPx - targetLineWidthPx).toFixed(1)} px Over`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
