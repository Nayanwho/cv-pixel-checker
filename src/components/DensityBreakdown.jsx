import React from 'react';
import { PieChart, Type, Hash, Space, Sparkles, Bold } from 'lucide-react';

export default function DensityBreakdown({ metrics, theme }) {
  const { counts, widths, totalWidthPx } = metrics;
  const isDark = theme === 'dark';

  const capitalPx = (counts.uppercase * 8.2).toFixed(0);
  const lowercasePx = (counts.lowercase * 5.4).toFixed(0);
  const spacePx = (widths.spaces || 0).toFixed(1);
  const boldExtraPx = (widths.bold * 0.18).toFixed(1);
  const numbersPx = (widths.numbers || 0).toFixed(1);
  const specialPx = (widths.special || 0).toFixed(1);

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-5 shadow-xl transition-colors duration-300`}>
      <div className="flex items-center space-x-2 mb-4">
        <PieChart className="w-4 h-4 text-sky-500" />
        <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Character & Space Density Breakdown</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Capital Letters */}
        <div className={`${cardBg} p-3 rounded-xl border flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Capital Letters</span>
            <Type className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="mt-2">
            <span className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{counts.uppercase}</span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>High Density (~8.2px/char)</span>
          </div>
        </div>

        {/* Small Letters */}
        <div className={`${cardBg} p-3 rounded-xl border flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Small Letters</span>
            <Type className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{counts.lowercase}</span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>Med Density (~5.4px/char)</span>
          </div>
        </div>

        {/* Numbers */}
        <div className={`${cardBg} p-3 rounded-xl border flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Numbers</span>
            <Hash className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{counts.numbers}</span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>
              {counts.numbers > 0 ? `Total ~${numbersPx}px width` : 'Numeric Footprint'}
            </span>
          </div>
        </div>

        {/* Blank Spaces */}
        <div className={`${cardBg} p-3 rounded-xl border flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Blank Spaces</span>
            <Space className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-300 font-mono">{counts.spaces}</span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>Total ~{spacePx}px space width</span>
          </div>
        </div>

        {/* Bold Weight Chars */}
        <div className={`${cardBg} p-3 rounded-xl border flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Bold Chars</span>
            <Bold className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-extrabold text-purple-600 dark:text-purple-300 font-mono">{counts.boldChars}</span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>+{boldExtraPx}px extra bold weight</span>
          </div>
        </div>

        {/* Special Chars */}
        <div className={`${cardBg} p-3 rounded-xl border flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Special (- & % +)</span>
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono`}>{counts.specialChars}</span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>
              {counts.specialChars > 0 ? `Total ~${specialPx}px width` : 'High Density Symbols'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
