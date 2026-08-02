'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, ShieldCheck, Zap, AlertTriangle, HelpCircle, Layers, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { AnalyticsSummary, LLMProviderId } from '@/types/rag';

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="text-center py-12 text-zinc-500 text-xs font-mono">Loading telemetry dashboard...</div>;
  }

  const stats = data?.providerStats;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="linear-card p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Total Queries</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <h4 className="text-2xl font-bold text-white tracking-tight font-mono">{data?.totalQueries || 0}</h4>
          <p className="text-[10px] text-zinc-500 font-mono">Conversational & Document RAG</p>
        </div>

        <div className="linear-card p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Avg RAG Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-2xl font-bold text-white tracking-tight font-mono">{data?.avgLatencyMs || 0} <span className="text-xs text-zinc-400 font-normal">ms</span></h4>
          <p className="text-[10px] text-zinc-500 font-mono">End-to-end response time</p>
        </div>

        <div className="linear-card p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Active Providers</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-2xl font-bold text-white tracking-tight font-mono">{data?.activeProvidersCount || 3} <span className="text-xs text-zinc-400 font-normal">/ 3</span></h4>
          <p className="text-[10px] text-zinc-500 font-mono">Groq, Gemini, OpenRouter</p>
        </div>

        <div className="linear-card p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>Vector Chunks</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-2xl font-bold text-white tracking-tight font-mono">{data?.totalChunks || 0}</h4>
          <p className="text-[10px] text-zinc-500 font-mono">Indexed in pgvector store</p>
        </div>
      </div>

      {/* Provider & Multi-Model Rate-Limit Panel */}
      <div className="linear-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Smart Router Engine & Model 429 Cooldown Status
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">Auto failover active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats && (Object.keys(stats) as LLMProviderId[]).map((pid) => {
            const p = stats[pid];
            return (
              <div key={pid} className="bg-[#0f0f12] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white capitalize">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider ${
                    p.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    p.status === 'cooldown' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] font-mono text-zinc-400">
                  <div className="flex justify-between">
                    <span>Avg Latency:</span>
                    <span className="text-zinc-200">{p.avgLatency} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="text-emerald-400">{p.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>429 Rate Limit Hits:</span>
                    <span className="text-amber-400">{p.rateLimitCount}</span>
                  </div>
                </div>

                {p.models && p.models.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.08] space-y-1">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Model Pool:</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {p.models.map(m => (
                        <div key={m.model} className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span className="truncate max-w-[110px]" title={m.model}>{m.model.split('/').pop()}</span>
                          {m.inCooldown ? (
                            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/20">429</span>
                          ) : (
                            <span className="text-[9px] text-emerald-400">ready</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Queue */}
      <div className="linear-card p-6 space-y-4">
        <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Review Unanswered & Low-Confidence Queries
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Queries requiring additional context documents to reach high similarity thresholds.
        </p>

        <div className="space-y-2.5">
          {data?.unansweredQuestions?.map((q) => (
            <div key={q.id} className="p-3.5 rounded-lg bg-[#0f0f12] border border-white/[0.08] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-200">{q.query}</p>
                <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  {q.reason}
                </p>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
