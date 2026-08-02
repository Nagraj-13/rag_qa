import { NextResponse } from 'next/server';
import { smartRouter } from '@/lib/router/smart-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { AnalyticsSummary, LLMProviderId } from '@/types/rag';

export async function GET() {
  try {
    const providers = smartRouter.getProviderStates();
    const routerLogs = smartRouter.getTelemetryLogs();
    const supabase = getSupabaseClient();

    let totalQueries = 0;
    let avgLatencyMs = 0;
    let totalDocuments = 0;
    let totalChunks = 0;
    let unansweredQuestions: Array<{ id: string; query: string; reason: string; createdAt: string }> = [];

    // 1. Fetch real documents count & total chunks count
    if (supabase) {
      try {
        const { data: docsData } = await supabase.from('documents').select('id, chunk_count');
        if (docsData) {
          totalDocuments = docsData.length;
          totalChunks = docsData.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
        }

        // Fetch real analytics logs from Supabase
        const { data: analyticsData } = await supabase.from('chat_analytics').select('*').order('created_at', { ascending: false });
        if (analyticsData && analyticsData.length > 0) {
          totalQueries = analyticsData.length;
          avgLatencyMs = Math.round(analyticsData.reduce((acc, r) => acc + (r.latency_ms || 0), 0) / totalQueries);
        }

        // Fetch real unanswered questions from Supabase
        const { data: uqData } = await supabase.from('unanswered_questions').select('*').order('created_at', { ascending: false }).limit(10);
        if (uqData && uqData.length > 0) {
          unansweredQuestions = uqData.map(u => ({
            id: u.id,
            query: u.query,
            reason: u.reason || 'No matching document chunk found',
            createdAt: u.created_at,
          }));
        }
      } catch (dbErr) {
        console.warn('Analytics DB fetch error:', dbErr);
      }
    }

    // Fallback to memory store if DB empty or local mode
    if (totalDocuments === 0) {
      const localDocs = localVectorStore.getDocuments();
      totalDocuments = localDocs.length;
      totalChunks = localDocs.reduce((acc, d) => acc + d.chunkCount, 0);
    }

    if (totalQueries === 0 && routerLogs.length > 0) {
      totalQueries = routerLogs.length;
      avgLatencyMs = Math.round(routerLogs.reduce((acc, curr) => acc + curr.latencyMs, 0) / routerLogs.length);
    }

    // 2. Compile real provider stats
    const providerStats: AnalyticsSummary['providerStats'] = {
      groq: { name: 'Groq Cloud', requests: 0, successRate: 100, avgLatency: 240, rateLimitCount: 0, status: 'healthy' },
      gemini: { name: 'Google Gemini', requests: 0, successRate: 100, avgLatency: 410, rateLimitCount: 0, status: 'healthy' },
      openrouter: { name: 'OpenRouter', requests: 0, successRate: 100, avgLatency: 650, rateLimitCount: 0, status: 'healthy' },
    };

    providers.forEach(p => {
      const stats = providerStats[p.id as LLMProviderId];
      if (stats) {
        stats.requests = p.totalRequests;
        stats.avgLatency = p.avgLatencyMs;
        stats.rateLimitCount = p.rateLimitHits;
        const total = p.totalRequests;
        stats.successRate = total > 0 ? Math.round((p.successfulRequests / total) * 100) : 100;
        stats.status = p.cooldownUntil && new Date(p.cooldownUntil) > new Date()
          ? 'cooldown'
          : p.isHealthy ? 'healthy' : 'degraded';
        stats.models = p.models?.map(m => ({
          model: m.model,
          rateLimitHits: m.rateLimitHits,
          isHealthy: m.isHealthy,
          inCooldown: Boolean(m.cooldownUntil && new Date(m.cooldownUntil) > new Date()),
        }));
      }
    });

    const summary: AnalyticsSummary = {
      totalQueries,
      avgLatencyMs,
      activeProvidersCount: providers.filter(p => p.isHealthy).length,
      totalDocuments,
      totalChunks,
      providerStats,
      unansweredQuestions,
    };

    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
