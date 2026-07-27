import React, { useRef, useState } from 'react';
import { Layers, Sparkles, Sliders, Sun, Moon, FileText, Award, Linkedin, Bot } from 'lucide-react';
import { CV_PRESETS } from '../utils/canvasMetrics';
import ApiIntegrationModal from './ApiIntegrationModal';

export default function Navbar({ activeTab, setActiveTab, selectedPreset, setSelectedPreset, theme, setTheme }) {
  const isDark = theme === 'dark';
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const singleTabRef = useRef(null);
  const batchTabRef = useRef(null);

  const switchTabAndFocus = (nextTab) => {
    setActiveTab(nextTab);
    requestAnimationFrame(() => {
      if (nextTab === 'single') singleTabRef.current?.focus();
      if (nextTab === 'batch') batchTabRef.current?.focus();
    });
  };

  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      switchTabAndFocus('batch');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      switchTabAndFocus('single');
    } else if (e.key === 'Home') {
      e.preventDefault();
      switchTabAndFocus('single');
    } else if (e.key === 'End') {
      e.preventDefault();
      switchTabAndFocus('batch');
    }
  };

  return (
    <header className={`${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 min-h-[4rem] gap-3 flex-wrap xl:flex-nowrap">
          
          {/* Left: Logo & Title & Author Badge */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 flex-shrink-0">
              <div className={`w-full h-full ${isDark ? 'bg-slate-950' : 'bg-white'} rounded-[10px] flex items-center justify-center`}>
                <FileText className="w-4 h-4 text-sky-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className={`text-base font-extrabold tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CV Line Density Checker
                </h1>
                
                {/* Author Badge */}
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full whitespace-nowrap">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>Made by <strong>Adarsh Nayan</strong></span>
                </span>
              </div>
              <p className={`text-[11px] hidden md:block whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Optimal brim-fit CV line density optimizer • EB Garamond 9.75pt
              </p>
            </div>
          </div>

          {/* Right Section: Actions & Navigation */}
          <div className="flex items-center space-x-2.5 flex-wrap sm:flex-nowrap justify-end ml-auto">
            
            {/* LinkedIn Link */}
            <a
              href="https://www.linkedin.com/in/adarsh-nayan"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 shadow-sm whitespace-nowrap ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border-slate-200'
              }`}
              title="Connect on LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <span>LinkedIn</span>
            </a>

            {/* Preset Selector Dropdown */}
            <div className={`flex items-center space-x-1.5 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} px-2.5 py-1.5 rounded-xl border max-w-[220px] sm:max-w-none`}>
              <Sliders className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const found = CV_PRESETS.find(p => p.id === e.target.value);
                  if (found) setSelectedPreset(found);
                }}
                aria-label="Select CV layout preset"
                className={`bg-transparent text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'} focus:outline-none cursor-pointer font-bold truncate max-w-[160px] sm:max-w-[200px]`}
              >
                {CV_PRESETS.map(p => (
                  <option key={p.id} value={p.id} className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔥 PRIMARY FEATURE FOCUS: AI Agent API Integration Button */}
            <button
              onClick={() => setIsApiModalOpen(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shadow-sm hover:scale-[1.02] active:scale-95 ${
                isDark
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border-sky-500/40 text-sky-300 hover:border-sky-400 hover:shadow-sky-500/10'
                  : 'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-300 text-sky-700 hover:border-sky-400'
              }`}
              title="Open AI Agent & REST API Integration Guide"
            >
              <Bot className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <span className="whitespace-nowrap">🤖 AI Agent API</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`p-2 rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Tab Navigation */}
            <nav 
              className={`flex space-x-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} p-1 rounded-xl border flex-shrink-0`} 
              role="tablist" 
              aria-label="Mode selector"
              onKeyDown={handleTabKeyDown}
            >
              <button
                ref={singleTabRef}
                role="tab"
                id="tab-single"
                tabIndex={activeTab === 'single' ? 0 : -1}
                aria-selected={activeTab === 'single'}
                aria-controls="panel-single"
                onClick={() => switchTabAndFocus('single')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'single'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span>Single Line</span>
              </button>

              <button
                ref={batchTabRef}
                role="tab"
                id="tab-batch"
                tabIndex={activeTab === 'batch' ? 0 : -1}
                aria-selected={activeTab === 'batch'}
                aria-controls="panel-batch"
                onClick={() => switchTabAndFocus('batch')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'batch'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3 flex-shrink-0" />
                <span>Batch Audit</span>
              </button>
            </nav>

          </div>

        </div>
      </div>

      {/* AI Agent & API Integration Modal */}
      <ApiIntegrationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        theme={theme}
      />
    </header>
  );
}
