import React, { useRef, useState } from 'react';
import { Layers, Sparkles, Sun, Moon, Bot, Linkedin } from 'lucide-react';
import ApiIntegrationModal from './ApiIntegrationModal';

export default function Navbar({ activeTab, setActiveTab, theme, setTheme }) {
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
    <header className="app-nav sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[68px] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="brand-mark flex-shrink-0" aria-hidden="true">
              <span>PX</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight truncate">
                CV Pixel Checker
              </h1>
              <a
                href="https://www.linkedin.com/in/adarsh-nayan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors hidden sm:inline-flex items-center gap-1"
              >
                By <strong className="font-semibold">Adarsh Nayan</strong>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <nav
              className="app-tab-list"
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
                className={`app-tab ${activeTab === 'single' ? 'app-tab-active' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Single</span>
              </button>

              <button
                ref={batchTabRef}
                role="tab"
                id="tab-batch"
                tabIndex={activeTab === 'batch' ? 0 : -1}
                aria-selected={activeTab === 'batch'}
                aria-controls="panel-batch"
                onClick={() => switchTabAndFocus('batch')}
                className={`app-tab ${activeTab === 'batch' ? 'app-tab-active' : ''}`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Batch</span>
              </button>
            </nav>

            <button
              onClick={() => setIsApiModalOpen(true)}
              className="app-icon-button hidden sm:inline-flex"
              title="Open AI Agent & REST API Integration Guide"
              aria-label="Open AI Agent and API guide"
            >
              <Bot className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className="app-icon-button"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a
              href="https://www.linkedin.com/in/adarsh-nayan"
              target="_blank"
              rel="noopener noreferrer"
              className="app-button !border-indigo-500/25 !text-indigo-600 dark:!text-indigo-300 !bg-indigo-500/5 hover:!bg-indigo-500/10"
              aria-label="Open Adarsh Nayan's LinkedIn profile"
              title="Connect with Adarsh Nayan on LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
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
