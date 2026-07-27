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
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo & Title & Original Made by Adarsh Nayan Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20">
              <div className={`w-full h-full ${isDark ? 'bg-slate-950' : 'bg-white'} rounded-[10px] flex items-center justify-center`}>
                <FileText className="w-5 h-5 text-sky-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className={`text-base sm:text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CV Line Density Checker
                </h1>
                
                {/* Original Made by Adarsh Nayan Badge */}
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full shadow-sm">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>Made by <strong>Adarsh Nayan</strong></span>
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Optimal brim-fit CV line density optimizer • EB Garamond 9.75pt
              </p>
            </div>
          </div>

          {/* Center White Space: Sleek, Minimalist & Elegant LinkedIn Pill Button */}
          <a
            href="https://www.linkedin.com/in/adarsh-nayan"
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden md:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold font-sans border transition-all duration-200 shadow-sm ${
              isDark
                ? 'bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border-slate-700 hover:border-sky-500/40'
                : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border-slate-200 hover:border-sky-300'
            }`}
            title="Connect on LinkedIn (www.linkedin.com/in/adarsh-nayan)"
          >
            <Linkedin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
            <span>LinkedIn</span>
          </a>

          {/* Right Controls: Preset Selector, Light/Dark Toggle, Tabs */}
          <div className="flex items-center space-x-3">
            
            {/* Preset Selector Dropdown */}
            <div className={`hidden lg:flex items-center space-x-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} px-3 py-1.5 rounded-xl border`}>
              <Sliders className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const found = CV_PRESETS.find(p => p.id === e.target.value);
                  if (found) setSelectedPreset(found);
                }}
                aria-label="Select CV layout preset"
                className={`bg-transparent text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'} focus:outline-none cursor-pointer pr-1 font-bold`}
              >
                {CV_PRESETS.map(p => (
                  <option key={p.id} value={p.id} className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Agent API Integration Button */}
            <button
              onClick={() => setIsApiModalOpen(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isDark
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
                  : 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100'
              }`}
              title="Open AI Agent & REST API Integration Guide"
            >
              <Bot className="w-3.5 h-3.5 text-sky-500" />
              <span>AI Agent API</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`p-2 rounded-xl border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Tab Navigation with Roving TabIndex & Focus Movement */}
            <nav 
              className={`flex space-x-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} p-1 rounded-xl border`} 
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
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  activeTab === 'single'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
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
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  activeTab === 'batch'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
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
