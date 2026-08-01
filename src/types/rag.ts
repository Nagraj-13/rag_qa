export type DocumentFileType = 'pdf' | 'docx' | 'txt' | 'md';

export interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileType: DocumentFileType;
  fileSize: number;
  chunkCount: number;
  createdAt: string;
  isAdmin?: boolean;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    fileName?: string;
    pageNumber?: number;
    chunkIndex?: number;
    title?: string;
  };
  similarity?: number;
}

export type LLMProviderId = 'groq' | 'gemini' | 'openrouter';

export type RouterStrategy = 'smart' | 'round-robin' | 'priority-fallback';

export interface ProviderHealth {
  id: LLMProviderId;
  name: string;
  model: string;
  isHealthy: boolean;
  active: boolean;
  consecutiveErrors: number;
  lastUsedAt?: string;
  cooldownUntil?: string;
  avgLatencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  rateLimitHits: number;
  estimatedCostPer1k: number; // in USD
}

export interface RouterTelemetry {
  provider: LLMProviderId;
  model: string;
  latencyMs: number;
  success: boolean;
  statusCode: number;
  isFallback: boolean;
  error?: string;
  timestamp: string;
}

export interface SourceCitation {
  id: string;
  documentId: string;
  fileName: string;
  snippet: string;
  similarity: number;
  pageNumber?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  citations?: SourceCitation[];
  telemetry?: {
    providerUsed: LLMProviderId;
    providerName: string;
    modelUsed: string;
    latencyMs: number;
    isFallback: boolean;
    retrievedChunkCount: number;
  };
}

export interface AnalyticsSummary {
  totalQueries: number;
  avgLatencyMs: number;
  activeProvidersCount: number;
  totalDocuments: number;
  totalChunks: number;
  providerStats: Record<LLMProviderId, {
    name: string;
    requests: number;
    successRate: number;
    avgLatency: number;
    rateLimitCount: number;
    status: 'healthy' | 'cooldown' | 'degraded' | 'disabled';
  }>;
  unansweredQuestions: Array<{
    id: string;
    query: string;
    reason: string;
    createdAt: string;
  }>;
}
