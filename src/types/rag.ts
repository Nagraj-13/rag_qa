export type DocumentFileType = 'pdf' | 'docx' | 'txt' | 'md';

export type DocumentCategory = 'customer_support' | 'product_guide' | 'faq' | 'tech_specs' | 'general';

export interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileType: DocumentFileType;
  fileSize: number;
  chunkCount: number;
  category?: DocumentCategory;
  userId?: string;
  createdAt: string;
  isAdmin?: boolean;
  isOKF?: boolean;
  okfContent?: string;
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
    category?: DocumentCategory;
    isOKF?: boolean;
  };
  similarity?: number;
}

export type LLMProviderId = 'groq' | 'gemini' | 'openrouter';

export type RouterStrategy = 'smart' | 'round-robin' | 'priority-fallback';

export type KnowledgeMode = 'okf' | 'standard-rag';

export interface ModelHealth {
  model: string;
  provider: LLMProviderId;
  isHealthy: boolean;
  consecutiveErrors: number;
  rateLimitHits: number;
  cooldownUntil?: string;
  lastUsedAt?: string;
  totalRequests: number;
  successfulRequests: number;
  avgLatencyMs: number;
}

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
  estimatedCostPer1k: number;
  models?: ModelHealth[];
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
  category?: DocumentCategory;
}

export interface WebReference {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  isConversational?: boolean;
  citations?: SourceCitation[];
  webReferences?: WebReference[];
  telemetry?: {
    providerUsed: LLMProviderId;
    providerName: string;
    modelUsed: string;
    latencyMs: number;
    isFallback: boolean;
    retrievedChunkCount: number;
    queryType: 'conversational' | 'document_rag';
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
    models?: Array<{
      model: string;
      rateLimitHits: number;
      isHealthy: boolean;
      inCooldown: boolean;
    }>;
  }>;
  unansweredQuestions: Array<{
    id: string;
    query: string;
    reason: string;
    createdAt: string;
  }>;
}
