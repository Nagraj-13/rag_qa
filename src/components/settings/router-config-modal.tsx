'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, X, Cpu, Activity, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { RouterStrategy, LLMProviderId, AnalyticsSummary } from '@/types/rag';

interface RouterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: RouterStrategy;
  onStrategyChange: (s: RouterStrategy) => void;
}

export const RouterConfigModal: React.FC<RouterConfigModalProps> = ({
  isOpen,
  onClose,
  strategy,
  onStrategyChange,
}) => {
  const [telemetry, setTelemetry] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/analytics')
        .then(res => res.json())
        .then(data => setTelemetry(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = telemetry?.providerStats;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-base">
            <Settings className="w-5 h-5 text-indigo-400" />
            System & LLM Router Settings
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Router Strategy Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            LLM Routing Strategy
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onStrategyChange('smart')}
              className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                strategy === 'smart'
                  ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-semibold text-xs text-indigo-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Smart AI Router</span>
                {strategy === 'smart' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Dynamic routing based on real-time latency, health score, cost, and automatic 429 rate limit failover.
              </p>
            </button>

            <button
              onClick={() => onStrategyChange('round-robin')}
              className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                strategy === 'round-robin'
                  ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-semibold text-xs text-indigo-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Round Robin</span>
                {strategy === 'round-robin' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Equal distribution cycling through operational providers (Groq ➔ Gemini ➔ OpenRouter).
              </p>
            </button>
          </div>
        </div>

        {/* Live Provider Health Indicators */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            Provider Health & 429 Cooldown Status
          </label>

          <div className="grid grid-cols-3 gap-3">
            {stats && (Object.keys(stats) as LLMProviderId[]).map(pid => {
              const p = stats[pid];
              return (
                <div key={pid} className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 capitalize">{p.name}</span>
                    <span className={`w-2 h-2 rounded-full ${p.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  </div>
                  <p className="text-[10px] font-mono text-zinc-400">{p.avgLatency}ms • {p.successRate}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Key Status Notice */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Environment API Key Status (.env.local)
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            API keys configured in <code className="text-indigo-300">.env.local</code> for <code className="text-indigo-300">GROQ_API_KEY</code>, <code className="text-indigo-300">GEMINI_API_KEY</code>, and <code className="text-indigo-300">OPENROUTER_API_KEY</code> are automatically managed with automatic failover.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
          >
            Save & Apply Settings
          </button>
        </div>

      </div>
    </div>
  );
};
