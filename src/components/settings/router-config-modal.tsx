'use client';

import React, { useState } from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, X, Cpu } from 'lucide-react';
import { RouterStrategy, LLMProviderId } from '@/types/rag';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-base">
            <Settings className="w-5 h-5 text-indigo-400" />
            Smart AI Router Configuration
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Router Mode Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Active Routing Algorithm
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onStrategyChange('smart')}
              className={`p-4 rounded-xl border text-left transition-all space-y-1 ${
                strategy === 'smart'
                  ? 'bg-indigo-600/10 border-indigo-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-semibold text-xs text-indigo-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Smart AI Router
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Dynamic routing based on real-time latency, health score, cost, and 429 rate limit failover.
              </p>
            </button>

            <button
              onClick={() => onStrategyChange('round-robin')}
              className={`p-4 rounded-xl border text-left transition-all space-y-1 ${
                strategy === 'round-robin'
                  ? 'bg-indigo-600/10 border-indigo-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="font-semibold text-xs text-indigo-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Round Robin
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Equal distribution cycling through operational providers (Groq ➔ Gemini ➔ OpenRouter).
              </p>
            </button>
          </div>
        </div>

        {/* API Key Status Notice */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Environment Key Detection (.env.local)
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            The application detects API keys configured in <code className="text-indigo-300">.env.local</code> for <code className="text-indigo-300">GROQ_API_KEY</code>, <code className="text-indigo-300">GEMINI_API_KEY</code>, and <code className="text-indigo-300">OPENROUTER_API_KEY</code>.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
