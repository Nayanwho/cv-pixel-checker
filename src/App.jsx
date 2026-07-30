import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import BulletEditor from './components/BulletEditor';
import LineFillGauge from './components/LineFillGauge';
import CVLinePreview from './components/CVLinePreview';
import DensityBreakdown from './components/DensityBreakdown';
import MicroOptimizer from './components/MicroOptimizer';
import BatchChecker from './components/BatchChecker';
import { analyzeFormattedSegments, parseTextToSegments, CV_PRESETS, waitForFont, isFontReady } from './utils/canvasMetrics';
import { RotateCcw, Ruler, Type, Columns3, ShieldCheck } from 'lucide-react';

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
    <div className={`app-shell min-h-screen ${isDark ? 'text-slate-100' : 'text-slate-950'} flex flex-col font-sans transition-colors duration-300`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={handleSetTheme}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10 space-y-5">
        <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="app-kicker mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Deterministic CV measurement
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-tight">
              Make every CV line land cleanly.
            </h2>
            <p className={`mt-2 text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Paste a bullet, preserve its emphasis, and measure the exact rendered width against your chosen document layout.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="app-chip">
              <span className={`w-1.5 h-1.5 rounded-full ${fontLoaded ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {fontLoaded ? 'EB Garamond ready' : 'Loading font'}
            </span>
            <span className="app-chip">Live measurement</span>
          </div>
        </section>

        <section className="app-panel p-4 sm:p-5" aria-labelledby="layout-profile-title">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="min-w-0 lg:w-[36%]">
              <label id="layout-profile-title" htmlFor="layout-profile" className="app-label">
                Layout profile
              </label>
              <select
                id="layout-profile"
                value={selectedPreset.id}
                onChange={(event) => {
                  const found = CV_PRESETS.find((preset) => preset.id === event.target.value);
                  if (found) setSelectedPreset(found);
                }}
                className="app-select mt-1.5"
              >
                {CV_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <p className={`mt-1.5 text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {selectedPreset.description}
              </p>
            </div>

            <div className="grid grid-cols-3 flex-1 divide-x divide-slate-200 dark:divide-slate-800 lg:border-l lg:border-slate-200 lg:dark:border-slate-800">
              <div className="px-3 sm:px-5">
                <Ruler className="w-4 h-4 text-indigo-500 mb-2" />
                <div className="app-label">Capacity</div>
                <div className="text-sm font-semibold font-mono mt-1">
                  {Math.round(selectedPreset.lineWidthPt * (4 / 3))}px
                </div>
              </div>
              <div className="px-3 sm:px-5">
                <Type className="w-4 h-4 text-indigo-500 mb-2" />
                <div className="app-label">Typeface</div>
                <div className="text-sm font-semibold mt-1">9.75pt</div>
              </div>
              <div className="px-3 sm:px-5">
                <Columns3 className="w-4 h-4 text-indigo-500 mb-2" />
                <div className="app-label">Columns</div>
                <div className="text-sm font-semibold mt-1">
                  {selectedPreset.hasYearColumn ? 'Text + year' : 'Full width'}
                </div>
              </div>
            </div>

            <button
              onClick={handleResetDemoData}
              className="app-button app-button-secondary lg:ml-auto"
              aria-label="Reset draft data to demo samples"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset demo
            </button>
          </div>
        </section>

        {activeTab === 'single' ? (
          <div id="panel-single" role="tabpanel" aria-labelledby="tab-single" className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] gap-5 items-start">
              <BulletEditor
                textSegments={textSegments}
                setTextSegments={setTextSegments}
                onSampleLoad={handleSampleLoad}
                autoBoldMetrics={autoBoldMetrics}
                setAutoBoldMetrics={setAutoBoldMetrics}
                theme={theme}
              />
              <div className="xl:sticky xl:top-[88px]">
                <LineFillGauge metrics={metrics} theme={theme} />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              <MicroOptimizer
                textSegments={textSegments}
                setTextSegments={setTextSegments}
                metrics={metrics}
                preset={selectedPreset}
                theme={theme}
              />
              <DensityBreakdown metrics={metrics} theme={theme} />
            </div>

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

      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-5 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Calibrated for EB Garamond 9.75pt · CSS-pixel accurate</span>
          <a
            href="https://www.linkedin.com/in/adarsh-nayan"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          >
            Designed by <strong className="font-semibold">Adarsh Nayan</strong> · Connect on LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
}
