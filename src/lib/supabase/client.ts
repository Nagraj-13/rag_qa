import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentItem, DocumentChunk } from '@/types/rag';

/**
 * Server-Side Supabase Client (Service Role Key)
 * Used in API routes for document CRUD, embedding storage, and RPC calls.
 * This key bypasses RLS — only use in server-side code (api routes).
 */
let serverClient: SupabaseClient | null = null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (url && serviceKey && !url.includes('placeholder') && !url.includes('your-supabase-project')) {
  serverClient = createClient(url, serviceKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  return serverClient;
}

/**
 * Browser-Side Supabase Client (Anon/Publishable Key)
 * Used for user-facing authentication (signUp, signIn, signOut, getUser).
 * This key respects RLS and uses browser localStorage for session persistence.
 * MUST only be called from client components ('use client').
 */
let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-supabase-project')) {
    return null;
  }

  browserClient = createClient(supabaseUrl, anonKey);
  return browserClient;
}

/**
 * Dynamic Memory Vector Store (Used when Supabase URL is not yet connected to external database)
 * Operates purely on dynamic user uploads with NO hardcoded mock data.
 */
class DynamicVectorStore {
  private documents: Map<string, DocumentItem> = new Map();
  private chunks: DocumentChunk[] = [];

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

  public searchSimilarity(queryVector: number[], matchThreshold = 0.25, matchCount = 5, userId?: string): DocumentChunk[] {
    if (this.chunks.length === 0) return [];

    const availableChunks = this.chunks.filter(chunk => {
      const doc = this.documents.get(chunk.documentId);
      if (!doc) return true;
      if (!userId) return true;
      return !doc.userId || doc.userId === userId || doc.isAdmin;
    });

    const scored = availableChunks.map(chunk => {
      let sim = 0;
      if (chunk.embedding && chunk.embedding.length === queryVector.length) {
        sim = this.cosineSimilarity(queryVector, chunk.embedding);
      }
      return { ...chunk, similarity: sim };
    });

    return scored
      .filter(c => (c.similarity ?? 0) >= matchThreshold)
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, matchCount);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dot / denominator;
  }
}

export const localVectorStore = new DynamicVectorStore();
