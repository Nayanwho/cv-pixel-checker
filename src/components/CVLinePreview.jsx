import React from 'react';
import { Eye, ShieldAlert, CheckCircle2, Calendar, AlertTriangle } from 'lucide-react';

export default function CVLinePreview({ textSegments, preset, metrics, theme }) {
  const { lines, status, orphanWords, targetLineWidthPx, neededTrimPx, fontInfo } = metrics;
  const isDark = theme === 'dark';

  const isOrphan = status === 'ORPHAN';
  const isHardOverflow = status === 'HARD_OVERFLOW';
  const isNearBrim = status === 'NEAR_BRIM';

  const categoryWidthPx = preset.categoryWidthPt > 0 ? Math.round(preset.categoryWidthPt * (4 / 3)) : 0;
  const yearColumnWidthPx = preset.hasYearColumn ? Math.round((preset.yearColumnWidthPt || 35.0) * (4 / 3)) : 0;
  const fontSizePx = preset.fontSizePt * (4 / 3);
  const lineHeightPx = fontSizePx * 1.3;

  // Bullet symbol cell width
  const bulletSymbolWidthPx = 14;

  // Total table width = Category + Bullet Symbol + Bullet Printable Capacity + Year Column
  const totalTableWidthPx = categoryWidthPx + bulletSymbolWidthPx + Math.round(targetLineWidthPx) + yearColumnWidthPx;

  return (
    <section className="app-panel p-5 sm:p-6" aria-labelledby="template-preview-title">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-indigo-500" />
          <h2 id="template-preview-title" className="text-sm font-semibold">
            Exact template preview
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fontInfo && (
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-medium ${
              fontInfo.isFallback
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              Font: {fontInfo.fontName} {fontInfo.isFallback ? '(Fallback)' : '(Loaded)'}
            </span>
          )}
          {preset.hasYearColumn && (
            <span className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 font-semibold">
              <Calendar className="w-3 h-3" />
              <span>Right Year Column Active</span>
            </span>
          )}
          <span className={`text-xs ${isDark ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'} px-2.5 py-1 rounded-lg border font-mono`}>
            {preset.fontSizePt}pt • {targetLineWidthPx.toFixed(1)}px capacity
          </span>
          <span className={`text-xs ${isDark ? 'text-slate-300 bg-slate-950 border-slate-800' : 'text-slate-700 bg-slate-100 border-slate-200'} px-2.5 py-1 rounded-lg border font-mono font-semibold`}>
            {metrics.numLines} rendered line{metrics.numLines > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Visual CV Document Card - Authentic CV Table Rendering */}
      <div className="bg-[#f7f5f0] text-slate-900 rounded-2xl p-5 sm:p-8 border border-stone-200 paper-shadow overflow-x-auto relative min-h-[120px] flex items-center justify-center">
        
        {/* Authentic CV Table Container */}
        <table 
          className="border-collapse border border-slate-900 bg-white select-none shadow-sm text-left"
          style={{ width: `${totalTableWidthPx}px`, minWidth: `${totalTableWidthPx}px`, tableLayout: 'fixed' }}
        >
          {/* Column width definitions */}
          <colgroup>
            {categoryWidthPx > 0 && <col style={{ width: `${categoryWidthPx}px` }} />}
            <col style={{ width: `${bulletSymbolWidthPx}px` }} />
            <col style={{ width: `${Math.round(targetLineWidthPx)}px` }} />
            {preset.hasYearColumn && <col style={{ width: `${yearColumnWidthPx}px` }} />}
          </colgroup>

          {/* Section Header Row */}
          <thead>
            <tr>
              <th 
                colSpan={
                  (categoryWidthPx > 0 ? 1 : 0) + 
                  1 + 1 + 
                  (preset.hasYearColumn ? 1 : 0)
                }
                className="bg-[#cfd4d9] text-slate-950 border border-slate-900 px-3 py-1 text-left"
                style={{ 
                  fontFamily: fontInfo.isFallback ? 'Georgia, Garamond, serif' : '"EB Garamond", Garamond, Georgia, serif', 
                  fontWeight: 700,
                  fontSize: `${fontSizePx * 0.85}px`,
                  letterSpacing: '0.04em'
                }}
              >
                {preset.sectionTitle || 'CV SECTION'}
              </th>
            </tr>
          </thead>

          {/* Bullet Row */}
          <tbody>
            <tr>
              {/* Left Category Column */}
              {categoryWidthPx > 0 && (
                <td 
                  className="font-bold text-slate-950 border border-slate-900 text-center align-middle bg-slate-50/40"
                  style={{ 
                    width: `${categoryWidthPx}px`,
                    fontFamily: fontInfo.isFallback ? 'Georgia, Garamond, serif' : '"EB Garamond", Garamond, Georgia, serif',
                    fontSize: `${fontSizePx}px`,
                    fontWeight: 700,
                    padding: '4px 6px',
                    lineHeight: `${lineHeightPx}px`,
                    whiteSpace: 'pre-line',
                    verticalAlign: 'middle'
                  }}
                >
                  {preset.categoryTitle || 'Category'}
                </td>
              )}

              {/* Bullet Symbol Cell */}
              <td 
                className="text-slate-900 select-none align-top border-b border-slate-900"
                style={{ 
                  width: `${bulletSymbolWidthPx}px`,
                  fontFamily: fontInfo.isFallback ? 'Georgia, Garamond, serif' : '"EB Garamond", Garamond, Georgia, serif',
                  fontSize: `${fontSizePx}px`,
                  padding: '4px 0 4px 5px',
                  lineHeight: `${lineHeightPx}px`,
                  verticalAlign: 'top'
                }}
              >
                {preset.bulletChar || '▪'}
              </td>

              {/* Bullet Content Cell - Geometrically locked to exact targetLineWidthPx with 0px horizontal padding */}
              <td 
                className="relative align-top border-b border-slate-900"
                style={{ 
                  width: `${Math.round(targetLineWidthPx)}px`,
                  padding: '4px 0px 4px 0px',
                  verticalAlign: 'top',
                  boxSizing: 'border-box'
                }}
              >
                {/* Red Dashed Right Margin Edge Line */}
                <div 
                  className="absolute top-[-8px] bottom-[-8px] right-0 border-r-2 border-dashed border-rose-500 z-20 pointer-events-none"
                >
                  <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-full mb-1">
                    <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                      {preset.hasYearColumn ? 'Year Line (100%)' : 'Right Margin Edge (100%)'}
                    </span>
                  </div>
                </div>

                {/* Render Lines Matching Canvas Engine 1-to-1 */}
                {lines.map((line, lIdx) => {
                  const isLastLine = lIdx === lines.length - 1;
                  const lineFill = line.fillPercentage.toFixed(1);
                  
                  return (
                    <div 
                      key={lIdx} 
                      className="relative group whitespace-pre z-10"
                      tabIndex={0}
                      aria-label={`Line ${lIdx + 1}: ${lineFill}% filled, ${line.widthPx.toFixed(1)}px of ${targetLineWidthPx.toFixed(1)}px`}
                      style={{ 
                        fontFamily: fontInfo.isFallback ? 'Georgia, Garamond, serif' : '"EB Garamond", Garamond, Georgia, serif',
                        fontSize: `${fontSizePx}px`,
                        lineHeight: `${lineHeightPx}px`,
                        minHeight: `${lineHeightPx}px`
                      }}
                    >
                      <span className="whitespace-pre">
                        {line.tokens.map((token, tIdx) => {
                          const isOrphanWord = isLastLine && isOrphan && orphanWords.includes(token.text.trim());
                          
                          return (
                            <span
                              key={tIdx}
                              style={{
                                fontFamily: fontInfo.isFallback ? 'Georgia, Garamond, serif' : '"EB Garamond", Garamond, Georgia, serif',
                                fontSize: `${fontSizePx}px`,
                                fontWeight: token.isBold ? 700 : 400,
                                whiteSpace: 'pre'
                              }}
                              className={
                                isOrphanWord 
                                  ? 'bg-rose-500 text-white font-bold px-1 rounded ring-2 ring-rose-400 animate-pulse' 
                                  : token.isBold 
                                  ? 'font-bold text-slate-950' 
                                  : 'font-normal text-slate-900'
                              }
                            >
                              {token.text}
                            </span>
                          );
                        })}
                      </span>

                      {/* Line Fill Badge on Hover / Keyboard Focus */}
                      <div className="absolute right-2 top-0 hidden group-hover:flex group-focus-visible:flex items-center space-x-1 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow z-30 font-mono">
                        <span>Line {lIdx + 1}: {lineFill}% ({line.widthPx.toFixed(1)}px / {targetLineWidthPx.toFixed(1)}px)</span>
                      </div>
                    </div>
                  );
                })}
              </td>

              {/* Right Year Column */}
              {preset.hasYearColumn && (
                <td 
                  className="text-slate-950 border border-slate-900 text-center align-middle font-normal bg-white"
                  style={{ 
                    width: `${yearColumnWidthPx}px`,
                    fontFamily: fontInfo.isFallback ? 'Georgia, Garamond, serif' : '"EB Garamond", Garamond, Georgia, serif',
                    fontSize: `${fontSizePx}px`,
                    fontWeight: 400,
                    padding: '4px 4px',
                    lineHeight: `${lineHeightPx}px`,
                    verticalAlign: 'middle'
                  }}
                >
                  {preset.sampleYear || '2026'}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Status Notifications */}
      {isOrphan && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 font-medium" role="status" aria-live="polite">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Orphan Warning:</strong> Trailing word(s) ({orphanWords.join(', ')}) spilled onto line {metrics.numLines}. Trim ~{neededTrimPx.toFixed(0)}px of text to pull onto line {metrics.numLines - 1}.
          </span>
        </div>
      )}

      {isHardOverflow && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 font-medium" role="status" aria-live="polite">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Hard Overflow:</strong> Content exceeds line boundary capacity. Trim text to fit within printable margins.
          </span>
        </div>
      )}

      {isNearBrim && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 font-semibold" role="status" aria-live="polite">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Optimal Brim Fit:</strong> Excellent line density (98% - 100%) with minimal margin gap!
          </span>
        </div>
      )}
    </section>
  );
}
