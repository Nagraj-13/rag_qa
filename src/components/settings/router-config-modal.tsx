'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, RefreshCw, Cpu, Activity, Zap, CheckCircle2, BookOpen, Layers, Save } from 'lucide-react';
import { RouterStrategy, LLMProviderId, AnalyticsSummary, KnowledgeMode } from '@/types/rag';

interface RouterConfigPanelProps {
  adminEmail: string;
  onSettingsSaved?: () => void;
}

export const RouterConfigPanel: React.FC<RouterConfigPanelProps> = ({ adminEmail, onSettingsSaved }) => {
  const [strategy, setStrategy] = useState<RouterStrategy>('smart');
  const [knowledgeMode, setKnowledgeMode] = useState<KnowledgeMode>('okf');
  const [telemetry, setTelemetry] = useState<AnalyticsSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load current system settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.knowledgeMode) setKnowledgeMode(data.knowledgeMode);
        if (data.routerStrategy) setStrategy(data.routerStrategy);
      })
      .catch(() => {});

    // Load telemetry
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setTelemetry(data))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeMode, routerStrategy: strategy, adminEmail }),
      });

      if (res.ok) {
        setSavedMessage('Settings saved successfully');
        if (onSettingsSaved) onSettingsSaved();
        setTimeout(() => setSavedMessage(null), 3000);
      }
    } catch {
      setSavedMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const stats = telemetry?.providerStats;

  return (
    <div className="space-y-6">

      {/* Knowledge Mode */}
      <div className="linear-card p-6 space-y-4">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Response Format — How the chatbot answers queries
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setKnowledgeMode('okf')}
            className={`p-4 rounded-xl border text-left transition-all space-y-1.5 cursor-pointer ${
              knowledgeMode === 'okf'
                ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                : 'bg-[#0f0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/20'
            }`}
          >
            <div className="font-semibold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-indigo-400" /> OKF Enhanced Mode</span>
              {knowledgeMode === 'okf' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Structured responses with executive summaries, policy specs, and relevant external reference links.
            </p>
          </button>

          <button
            onClick={() => setKnowledgeMode('standard-rag')}
            className={`p-4 rounded-xl border text-left transition-all space-y-1.5 cursor-pointer ${
              knowledgeMode === 'standard-rag'
                ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                : 'bg-[#0f0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/20'
            }`}
          >
            <div className="font-semibold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Standard RAG Mode</span>
              {knowledgeMode === 'standard-rag' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Direct, concise factual answers using document vector chunks only.
            </p>
          </button>
        </div>
      </div>

      {/* Router Strategy */}
      <div className="linear-card p-6 space-y-4">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          LLM Routing Strategy
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setStrategy('smart')}
            className={`p-4 rounded-xl border text-left transition-all space-y-1.5 cursor-pointer ${
              strategy === 'smart'
                ? 'bg-white/[0.06] border-indigo-500/80 text-white shadow-sm'
                : 'bg-[#0f0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/20'
            }`}
          >
            <div className="font-semibold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-indigo-400" /> Smart Router</span>
              {strategy === 'smart' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Dynamic routing with automatic rate-limit failover across models.
            </p>
          </button>

          <button
            onClick={() => setStrategy('round-robin')}
            className={`p-4 rounded-xl border text-left transition-all space-y-1.5 cursor-pointer ${
              strategy === 'round-robin'
                ? 'bg-white/[0.06] border-indigo-500/80 text-white shadow-sm'
                : 'bg-[#0f0f12] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/20'
            }`}
          >
            <div className="font-semibold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Round Robin</span>
              {strategy === 'round-robin' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Balanced load distribution across all operational providers.
            </p>
          </button>
        </div>
      </div>

      {/* Provider Health */}
      {stats && (
        <div className="linear-card p-6 space-y-4">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Provider Health Status
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(stats) as LLMProviderId[]).map(pid => {
              const p = stats[pid];
              return (
                <div key={pid} className="bg-[#0f0f12] border border-white/[0.08] p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white capitalize">{p.name}</span>
                    <span className={`w-2 h-2 rounded-full ${p.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  </div>
                  <p className="text-[10px] font-mono text-zinc-400">{p.avgLatency}ms • {p.successRate}% success</p>
                  {p.models && p.models.length > 0 && (
                    <div className="pt-1.5 border-t border-white/[0.08] space-y-0.5">
                      {p.models.map(m => (
                        <div key={m.model} className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span className="truncate max-w-[110px]">{m.model.split('/').pop()}</span>
                          {m.inCooldown ? (
                            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/20">429</span>
                          ) : (
                            <span className="text-[9px] text-emerald-400">ready</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* API Keys Banner */}
      <div className="linear-card p-5 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>API Keys Configured</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded text-[10px]">GROQ_API_KEY</code>,{' '}
          <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded text-[10px]">GEMINI_API_KEY</code>,{' '}
          <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded text-[10px]">OPENROUTER_API_KEY</code> are active.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {savedMessage && (
          <span className={`text-xs font-mono ${savedMessage.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
            {savedMessage}
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

    </div>
  );
};
