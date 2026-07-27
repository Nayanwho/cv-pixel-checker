import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import BulletEditor from './components/BulletEditor';
import LineFillGauge from './components/LineFillGauge';
import CVLinePreview from './components/CVLinePreview';
import DensityBreakdown from './components/DensityBreakdown';
import MicroOptimizer from './components/MicroOptimizer';
import BatchChecker from './components/BatchChecker';
import { analyzeFormattedSegments, parseTextToSegments, CV_PRESETS, waitForFont, isFontReady } from './utils/canvasMetrics';
import { Heart, Sliders, Check, RotateCcw } from 'lucide-react';

const DEFAULT_SINGLE_SEGMENTS = [
  { text: 'Engineered automated ', bold: false },
  { text: 'data pipelines', bold: true },
  { text: ' using ', bold: false },
  { text: 'Python & SQL', bold: true },
  { text: ', accelerating ', bold: false },
  { text: 'reporting TAT by ', bold: true },
  { text: '35%', bold: true },
  { text: ' & boosting overall ', bold: false },
  { text: 'efficiency by ', bold: true },
  { text: '28%', bold: true }
];

const DEFAULT_BATCH_INPUT = `Engineered automated **data pipelines** using **Python & SQL**, accelerating **reporting TAT by 35%** & boosting **efficiency by 28%**
Implemented **Agile Kanban workflows** & sprint planning across teams, reducing **cycle time by 22%** & driving **30% ROI growth**
Architected **cloud migration** for enterprise databases, freeing **$120K annual spend** & boosting **uptime to 99.9%**
Optimized **customer onboarding experience** & standard operating **workflows**
Formulated **digital marketing campaigns**, expanding **qualified leads by 45%** & reducing **CAC by 18%**
Standardized **API integrations**, reducing **system latency by 25%** & improving **throughput**`;

// Universal safe helper for reading localStorage (plain strings or JSON) without risking app crashes
function readStorage(key, fallback, parseJson = false) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    if (!parseJson) return raw;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    try { localStorage.removeItem(key); } catch (err) {}
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('single');

  // Persistence: Selected Preset
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const savedPresetId = readStorage('cv_checker_preset_id', null);
    if (savedPresetId) {
      const found = CV_PRESETS.find(p => p.id === savedPresetId);
      if (found) return found;
    }
    return CV_PRESETS[0];
  });

  // Persistence: Auto-Bold Metrics (Set to OFF / false by default)
  const [autoBoldMetrics, setAutoBoldMetrics] = useState(() => {
    return readStorage('cv_checker_autobold', false, true);
  });

  // Persistence: Theme
  const [theme, setTheme] = useState(() => {
    return readStorage('cv_checker_theme', 'dark');
  });

  // Persistence: Single Line Text Segments
  const [textSegments, setTextSegments] = useState(() => {
    const parsed = readStorage('cv_checker_single_segments', null, true);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_SINGLE_SEGMENTS;
  });

  // Persistence: Batch Input Text
  const [batchInput, setBatchInput] = useState(() => {
    return readStorage('cv_checker_batch_input', DEFAULT_BATCH_INPUT);
  });

  const isDark = theme === 'dark';

  // Font cold-start race condition fix & status listener
  const [fontLoaded, setFontLoaded] = useState(isFontReady());

  useEffect(() => {
    if (!fontLoaded) {
      waitForFont().then(() => {
        setFontLoaded(true);
      });
    }
  }, [fontLoaded]);

  // Persist settings to localStorage
  useEffect(() => {
    try { localStorage.setItem('cv_checker_preset_id', selectedPreset.id); } catch (e) {}
  }, [selectedPreset]);

  useEffect(() => {
    try { localStorage.setItem('cv_checker_autobold', JSON.stringify(autoBoldMetrics)); } catch (e) {}
  }, [autoBoldMetrics]);

  // Debounced persistence for heavy text changes to prevent main-thread storage write thrashing
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem('cv_checker_single_segments', JSON.stringify(textSegments)); } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [textSegments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem('cv_checker_batch_input', batchInput); } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [batchInput]);

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    try { localStorage.setItem('cv_checker_theme', newTheme); } catch (e) {}
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Calculate live density & line fit metrics
  const metrics = useMemo(() => {
    return analyzeFormattedSegments(
      textSegments,
      selectedPreset.lineWidthPt,
      selectedPreset.fontSizePt,
      selectedPreset.fontFamily,
      selectedPreset
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textSegments, selectedPreset, fontLoaded]);

  // Reset to original demo data
  const handleResetDemoData = () => {
    setTextSegments(DEFAULT_SINGLE_SEGMENTS);
    setBatchInput(DEFAULT_BATCH_INPUT);
    setSelectedPreset(CV_PRESETS[0]);
    setAutoBoldMetrics(false);
    try {
      localStorage.removeItem('cv_checker_single_segments');
      localStorage.removeItem('cv_checker_batch_input');
      localStorage.removeItem('cv_checker_preset_id');
      localStorage.removeItem('cv_checker_autobold');
    } catch (e) {}
  };

  // Handle loading sample bullets
  const handleSampleLoad = (type) => {
    if (type === 'orphan1') {
      setTextSegments([
        { text: 'Implemented ', bold: false },
        { text: 'Agile Kanban workflows', bold: true },
        { text: ' & sprint planning across teams, reducing ', bold: false },
        { text: 'cycle time by ', bold: true },
        { text: '22%', bold: true },
        { text: ' & driving ', bold: false },
        { text: '30% ROI ', bold: true },
        { text: 'growth', bold: true }
      ]);
    } else if (type === 'perfect1') {
      setTextSegments([
        { text: 'Architected ', bold: false },
        { text: 'cloud migration', bold: true },
        { text: ' for enterprise databases, freeing ', bold: false },
        { text: '$120K annual spend', bold: true },
        { text: ' & boosting ', bold: false },
        { text: 'uptime to 99.9%', bold: true }
      ]);
    } else if (type === 'underfilled1') {
      setTextSegments([
        { text: 'Optimized ', bold: false },
        { text: 'customer onboarding experience', bold: true },
        { text: ' & standard operating ', bold: false },
        { text: 'workflows', bold: true }
      ]);
    }
  };

  const handleSelectBatchLine = (lineSegmentsOrText) => {
    if (Array.isArray(lineSegmentsOrText)) {
      setTextSegments(lineSegmentsOrText);
    } else {
      setTextSegments(parseTextToSegments(lineSegmentsOrText, autoBoldMetrics));
    }
    setActiveTab('single');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-300`}>
      
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPreset={selectedPreset}
        setSelectedPreset={setSelectedPreset}
        theme={theme}
        setTheme={handleSetTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Visual CV Section Preset Switcher Toolbar */}
        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl border p-4 shadow-md transition-colors duration-300`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Select CV Section Layout
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetDemoData}
                aria-label="Reset draft data to demo samples"
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                } focus-visible:ring-2 focus-visible:ring-sky-500`}
                title="Reset all fields to sample demo data"
              >
                <RotateCcw className="w-3 h-3 text-sky-500" />
                <span>Reset Demo Data</span>
              </button>

              <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Capacity: <span className="text-sky-500 font-bold">{selectedPreset.lineWidthPt.toFixed(1)}pt ({Math.round(selectedPreset.lineWidthPt * (4/3))}px)</span>
              </span>
            </div>
          </div>

          {/* Quick Preset Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="CV section layout presets">
            {CV_PRESETS.map(preset => {
              const isSelected = selectedPreset.id === preset.id;
              const pxCapacity = Math.round(preset.lineWidthPt * (4 / 3));

              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${preset.name}: ${preset.lineWidthPt.toFixed(1)} pt (${pxCapacity} px capacity)`}
                  className={`p-3.5 rounded-xl border text-left transition-all relative group focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/20 text-sky-600 dark:text-sky-300 shadow-sm'
                      : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold truncate pr-1">{preset.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-sky-500 flex-shrink-0" />}
                  </div>

                  {/* Minimalist Technical Spec Tag */}
                  <div className="flex items-center space-x-1.5 mt-1.5">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isSelected 
                        ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30' 
                        : isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      {preset.lineWidthPt.toFixed(1)}pt • {pxCapacity}px
                    </span>
                    <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {preset.hasYearColumn ? '+Year Col' : 'Full Width'}
                    </span>
                  </div>

                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1.5 truncate`}>
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'single' ? (
          <div id="panel-single" role="tabpanel" aria-labelledby="tab-single" className="space-y-6">
            {/* Top Grid: Bullet Editor & Live Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left 7 cols: Rich Bullet Point Editor */}
              <div className="lg:col-span-7 space-y-6">
                <BulletEditor
                  textSegments={textSegments}
                  setTextSegments={setTextSegments}
                  onSampleLoad={handleSampleLoad}
                  autoBoldMetrics={autoBoldMetrics}
                  setAutoBoldMetrics={setAutoBoldMetrics}
                  theme={theme}
                />

                {/* Character & Density Footprint Breakdown */}
                <DensityBreakdown metrics={metrics} theme={theme} />
              </div>

              {/* Right 5 cols: Live Density Gauge & Micro Optimizer */}
              <div className="lg:col-span-5 space-y-6">
                {/* Live Gauge Meter */}
                <LineFillGauge metrics={metrics} theme={theme} />

                {/* Smart Micro Optimizer Suggestions */}
                <MicroOptimizer
                  textSegments={textSegments}
                  setTextSegments={setTextSegments}
                  metrics={metrics}
                  preset={selectedPreset}
                  theme={theme}
                />
              </div>

            </div>

            {/* Full Width CV Document Visual Preview */}
            <CVLinePreview
              textSegments={textSegments}
              preset={selectedPreset}
              metrics={metrics}
              theme={theme}
            />
          </div>
        ) : (
          /* Batch Checker Mode */
          <div id="panel-batch" role="tabpanel" aria-labelledby="tab-batch">
            <BatchChecker
              preset={selectedPreset}
              onSelectLine={handleSelectBatchLine}
              autoBoldMetrics={autoBoldMetrics}
              setAutoBoldMetrics={setAutoBoldMetrics}
              theme={theme}
              batchInput={batchInput}
              setBatchInput={setBatchInput}
            />
          </div>
        )}

      </main>

      {/* Footer with Made by Adarsh Nayan Branding */}
      <footer className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'} border-t py-4 text-center text-xs transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            CV Line Density & Brim Checker • Calibrated for EB Garamond 9.75pt (B-School Standard)
          </div>
          <div className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>by <strong className="text-sky-500 font-bold">Adarsh Nayan</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
