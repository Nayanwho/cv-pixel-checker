import React from 'react';
import { PieChart, Type, Hash, Space, Sparkles, Bold } from 'lucide-react';

export default function DensityBreakdown({ metrics, theme }) {
  const { counts, widths, totalWidthPx } = metrics;
  const isDark = theme === 'dark';

  const items = [
    {
      label: 'Capital letters',
      value: counts.uppercase,
      detail: `~${(counts.uppercase * 8.2).toFixed(0)}px`,
      icon: Type,
      tone: 'text-indigo-500'
    },
    {
      label: 'Small letters',
      value: counts.lowercase,
      detail: `~${(counts.lowercase * 5.4).toFixed(0)}px`,
      icon: Type,
      tone: 'text-violet-500'
    },
    {
      label: 'Numbers',
      value: counts.numbers,
      detail: counts.numbers > 0 ? `~${(widths.numbers || 0).toFixed(1)}px` : 'No footprint',
      icon: Hash,
      tone: 'text-emerald-500'
    },
    {
      label: 'Blank spaces',
      value: counts.spaces,
      detail: `~${(widths.spaces || 0).toFixed(1)}px`,
      icon: Space,
      tone: 'text-amber-500'
    },
    {
      label: 'Bold characters',
      value: counts.boldChars,
      detail: `+${((widths.bold || 0) * 0.18).toFixed(1)}px`,
      icon: Bold,
      tone: 'text-fuchsia-500'
    },
    {
      label: 'Special characters',
      value: counts.specialChars,
      detail: counts.specialChars > 0 ? `~${(widths.special || 0).toFixed(1)}px` : 'No footprint',
      icon: Sparkles,
      tone: 'text-rose-500'
    }
  ];

  return (
    <section className="app-panel p-5 sm:p-6" aria-labelledby="density-breakdown-title">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 id="density-breakdown-title" className="text-sm font-semibold">Character density</h3>
            <p className="text-xs text-slate-500 mt-0.5">What contributes to the rendered footprint.</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-semibold">{totalWidthPx.toFixed(1)}px</div>
          <div className="app-label mt-1">Total</div>
        </div>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 rounded-2xl border overflow-hidden ${
        isDark ? 'border-slate-800 bg-slate-950/45' : 'border-slate-200 bg-slate-50/70'
      }`}>
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`p-3.5 sm:p-4 ${index % 3 !== 2 ? 'sm:border-r' : ''} ${index < 3 ? 'border-b' : ''} ${
                index % 2 === 0 ? 'max-sm:border-r' : ''
              } ${index < 4 ? 'max-sm:border-b' : ''} ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
                <Icon className={`w-3.5 h-3.5 ${item.tone}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-lg font-semibold">{item.value}</span>
                <span className="text-[10px] text-slate-500">{item.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
