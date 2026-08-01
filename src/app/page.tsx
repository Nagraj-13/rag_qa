'use client';

import React, { useState } from 'react';
import { MessageSquare, Database, BarChart3, Settings, Sparkles, Cpu, Layers } from 'lucide-react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { DocumentManager } from '@/components/documents/document-manager';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { RouterConfigModal } from '@/components/settings/router-config-modal';
import { RouterStrategy } from '@/types/rag';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'analytics'>('chat');
  const [strategy, setStrategy] = useState<RouterStrategy>('smart');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Antigravity RAG
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Smart AI Router
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">Groq • Gemini • OpenRouter • Supabase pgvector</p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Assistant
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'documents'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Knowledge Base
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Admin Analytics
            </button>
          </nav>

          {/* Settings & Active Router Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Strategy:</span>
              <span className="font-semibold text-indigo-400 capitalize">{strategy}</span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm"
              title="Router Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'chat' && (
          <ChatInterface routerStrategy={strategy} onStrategyChange={setStrategy} />
        )}
        {activeTab === 'documents' && <DocumentManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Settings Modal */}
      <RouterConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        strategy={strategy}
        onStrategyChange={setStrategy}
      />

    </div>
  );
}
