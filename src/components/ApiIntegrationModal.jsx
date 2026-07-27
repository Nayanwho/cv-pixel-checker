import React, { useState } from 'react';
import { X, Code, Terminal, Bot, Copy, Check, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

export default function ApiIntegrationModal({ isOpen, onClose, theme }) {
  const [copiedKey, setCopiedKey] = useState('');
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://cv-pixel-checker.vercel.app';

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const curlExample = `curl -X POST "${baseUrl}/api/v1/check" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Improved fulfilment accuracy by 18% through workflow redesign",
    "maxWidthPx": 599
  }'`;

  const chatGptInstructions = `Draft a one-line CV bullet and validate it through the CV width checker API (${baseUrl}/api/v1/check). The bullet must remain at or below 599 CSS pixels and should ideally use 98–100% of the available width. After every revision, call the checker again. Do not claim that the bullet fits unless the checker returns fits=true and lineCount=1. Return only the final validated bullet and its measured width.`;

  const mcpConfig = `{
  "mcpServers": {
    "cv-pixel-checker": {
      "command": "node",
      "args": ["${typeof window !== 'undefined' ? window.location.origin : '.'}/server/mcpServer.js"]
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl border p-6 shadow-2xl space-y-6`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-500">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Agent & REST API Integration</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Connect ChatGPT, Custom GPT Actions, and MCP Clients directly to the CV Measurement Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/api/v1/health"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
              isDark ? 'bg-slate-950 border-slate-800 hover:border-sky-500/50 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-sky-500/50 text-slate-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Health Endpoint</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          <a
            href="/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
              isDark ? 'bg-slate-950 border-slate-800 hover:border-sky-500/50 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-sky-500/50 text-slate-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-sky-500" />
              <span>OpenAPI Spec 3.1</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
              isDark ? 'bg-slate-950 border-slate-800 hover:border-sky-500/50 text-slate-300' : 'bg-slate-50 border-slate-200 hover:border-sky-500/50 text-slate-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Interactive Docs</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        {/* Section 1: cURL REST API */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">
              <Terminal className="w-4 h-4" />
              <span>1. REST API cURL Command</span>
            </h3>
            <button
              onClick={() => copyToClipboard(curlExample, 'curl')}
              className="flex items-center space-x-1 text-xs font-semibold text-sky-500 hover:underline"
            >
              {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curl' ? 'Copied!' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className={`p-3.5 rounded-xl border text-xs font-mono overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800 text-sky-300' : 'bg-slate-900 border-slate-800 text-sky-300'}`}>
            {curlExample}
          </pre>
        </div>

        {/* Section 2: ChatGPT System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
              <Bot className="w-4 h-4" />
              <span>2. ChatGPT / Custom GPT Agent Prompt</span>
            </h3>
            <button
              onClick={() => copyToClipboard(chatGptInstructions, 'gpt')}
              className="flex items-center space-x-1 text-xs font-semibold text-indigo-500 hover:underline"
            >
              {copiedKey === 'gpt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'gpt' ? 'Copied!' : 'Copy Prompt'}</span>
            </button>
          </div>
          <p className={`p-3.5 rounded-xl border text-xs font-sans leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            {chatGptInstructions}
          </p>
        </div>

        {/* Section 3: MCP Server Setup */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
              <Code className="w-4 h-4" />
              <span>3. Model Context Protocol (MCP) Config</span>
            </h3>
            <button
              onClick={() => copyToClipboard(mcpConfig, 'mcp')}
              className="flex items-center space-x-1 text-xs font-semibold text-amber-500 hover:underline"
            >
              {copiedKey === 'mcp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'mcp' ? 'Copied!' : 'Copy MCP Config'}</span>
            </button>
          </div>
          <pre className={`p-3.5 rounded-xl border text-xs font-mono overflow-x-auto ${isDark ? 'bg-slate-950 border-slate-800 text-amber-300' : 'bg-slate-900 border-slate-800 text-amber-300'}`}>
            {mcpConfig}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
