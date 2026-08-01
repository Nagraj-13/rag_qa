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
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
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
    return <div className="text-center py-12 text-zinc-500 text-xs">Loading analytics dashboard telemetry...</div>;
  }

  const stats = data?.providerStats;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Total Queries</p>
            <h4 className="text-xl font-bold text-zinc-100">{data?.totalQueries || 0}</h4>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Avg RAG Latency</p>
            <h4 className="text-xl font-bold text-zinc-100">{data?.avgLatencyMs || 0} ms</h4>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Active LLM Providers</p>
            <h4 className="text-xl font-bold text-zinc-100">{data?.activeProvidersCount || 3} / 3</h4>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Indexed Chunks</p>
            <h4 className="text-xl font-bold text-zinc-100">{data?.totalChunks || 0}</h4>
          </div>
        </div>
      </div>

      {/* Provider Health & Failover Status */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Smart Router Provider Health & Rate-Limit Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats && (Object.keys(stats) as LLMProviderId[]).map((pid) => {
            const p = stats[pid];
            return (
              <div key={pid} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-zinc-200 capitalize">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    p.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    p.status === 'cooldown' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Average Latency:</span>
                    <span className="text-zinc-200 font-mono">{p.avgLatency} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="text-emerald-400 font-mono">{p.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>429 Rate Limit Hits:</span>
                    <span className="text-amber-400 font-mono">{p.rateLimitCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unanswered / Low Confidence Questions Review Queue */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Review Unanswered & Low-Confidence Queries
        </h3>
        <p className="text-xs text-zinc-400">
          User queries that yielded low similarity scores or missing context chunks. Use these insights to expand your document knowledge base.
        </p>

        <div className="space-y-3">
          {data?.unansweredQuestions?.map((q) => (
            <div key={q.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-200">{q.query}</p>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {q.reason}
                </p>
              </div>
              <span className="text-[10px] text-zinc-500 shrink-0">
                {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
