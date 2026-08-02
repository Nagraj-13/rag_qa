import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentItem, DocumentChunk, DocumentCategory } from '@/types/rag';

let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (serverClient) return serverClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-supabase-url')) {
    return null;
  }

  try {
    serverClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    return serverClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return getSupabaseClient();
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || supabaseUrl.includes('your-supabase-url')) {
    return null;
  }

  browserClient = createClient(supabaseUrl, anonKey);
  return browserClient;
}

/**
 * Dynamic Memory Vector Store
 * Starts 100% empty — populated solely by user and admin document uploads.
 */
class DynamicVectorStore {
  private documents: Map<string, DocumentItem> = new Map();
  private chunks: DocumentChunk[] = [];
  private initialized = false;

  constructor() {
    this.seedDefaultDocs();
  }

  private seedDefaultDocs() {
    if (this.initialized) return;
    this.initialized = true;
  }

  public getDocuments(userId?: string): DocumentItem[] {
    const all = Array.from(this.documents.values());
    if (!userId) return all;
    return all.filter(d => !d.userId || d.userId === userId || d.isAdmin);
  }

  public addDocument(doc: DocumentItem, chunks: DocumentChunk[]) {
    this.documents.set(doc.id, doc);
    this.chunks.push(...chunks);
  }

  public deleteDocument(id: string) {
    this.documents.delete(id);
    this.chunks = this.chunks.filter(c => c.documentId !== id);
  }

  public getChunksByDocumentId(documentId: string): DocumentChunk[] {
    return this.chunks.filter(c => c.documentId === documentId);
  }

  /**
   * Hybrid Vector Similarity & Keyword Semantic Search
   */
  public searchSimilarity(
    queryVectorOrText: number[] | string,
    matchThreshold = 0.10,
    matchCount = 5,
    userId?: string,
    rawQueryText?: string
  ): DocumentChunk[] {
    if (this.chunks.length === 0) return [];

    const availableChunks = this.chunks.filter(chunk => {
      const doc = this.documents.get(chunk.documentId);
      if (!doc) return true;
      if (!userId) return true;
      return !doc.userId || doc.userId === userId || doc.isAdmin;
    });

    const searchText = (typeof queryVectorOrText === 'string' ? queryVectorOrText : rawQueryText || '').toLowerCase();
    const keywords = searchText.match(/\w+/g) || [];

    const scored = availableChunks.map(chunk => {
      let sim = 0;

      // 1. Vector Cosine Distance Match (if vector array provided)
      if (Array.isArray(queryVectorOrText) && chunk.embedding && chunk.embedding.length === queryVectorOrText.length) {
        sim = this.cosineSimilarity(queryVectorOrText, chunk.embedding);
      }

      // 2. Keyword Overlap & Semantic Boost
      if (keywords.length > 0) {
        const contentLower = chunk.content.toLowerCase();
        let keywordHits = 0;
        for (const kw of keywords) {
          if (kw.length > 2 && contentLower.includes(kw)) {
            keywordHits++;
          }
        }

        if (keywordHits > 0) {
          const keywordScore = Math.min(0.95, 0.40 + (keywordHits / keywords.length) * 0.55);
          sim = Math.max(sim, keywordScore);
        }
      }

      return { chunk, sim };
    });

    scored.sort((a, b) => b.sim - a.sim);

    return scored
      .filter(s => s.sim >= matchThreshold)
      .slice(0, matchCount)
      .map(s => ({ ...s.chunk, similarity: s.sim }));
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const localVectorStore = new DynamicVectorStore();
