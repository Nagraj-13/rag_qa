import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentItem, DocumentChunk } from '@/types/rag';

let supabaseClient: SupabaseClient | null = null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (url && key && !url.includes('placeholder')) {
  supabaseClient = createClient(url, key);
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}

/**
 * In-Memory Vector Store Fallback (when Supabase DB is not yet connected)
 */
class LocalVectorStore {
  private documents: Map<string, DocumentItem> = new Map();
  private chunks: DocumentChunk[] = [];

  constructor() {
    // Seed demo documents
    const demoId = 'demo-doc-1';
    this.documents.set(demoId, {
      id: demoId,
      title: 'Company_Policy_Guide_2026.pdf',
      fileName: 'Company_Policy_Guide_2026.pdf',
      fileType: 'pdf',
      fileSize: 1048576,
      chunkCount: 3,
      createdAt: new Date().toISOString(),
      isAdmin: true,
    });

    const sampleChunks: DocumentChunk[] = [
      {
        id: 'chunk-1',
        documentId: demoId,
        content: 'Employees are entitled to 25 days of annual leave per calendar year. Remote work requests can be submitted via the HR portal with manager approval.',
        metadata: { fileName: 'Company_Policy_Guide_2026.pdf', pageNumber: 1, title: 'Company Policy 2026' }
      },
      {
        id: 'chunk-2',
        documentId: demoId,
        content: 'Expense reimbursements must be claimed within 30 days of purchase. Submissions require itemized digital receipts for hardware or client meetings.',
        metadata: { fileName: 'Company_Policy_Guide_2026.pdf', pageNumber: 2, title: 'Company Policy 2026' }
      },
      {
        id: 'chunk-3',
        documentId: demoId,
        content: 'Our core AI routing system operates across Groq, Gemini, and OpenRouter to ensure 99.99% chatbot availability with dynamic rate-limit failovers.',
        metadata: { fileName: 'Company_Policy_Guide_2026.pdf', pageNumber: 3, title: 'Company Policy 2026' }
      }
    ];

    this.chunks.push(...sampleChunks);
  }

  public getDocuments(): DocumentItem[] {
    return Array.from(this.documents.values());
  }

  public addDocument(doc: DocumentItem, chunks: DocumentChunk[]) {
    this.documents.set(doc.id, doc);
    this.chunks.push(...chunks);
  }

  public deleteDocument(id: string) {
    this.documents.delete(id);
    this.chunks = this.chunks.filter(c => c.documentId !== id);
  }

  public searchSimilarity(queryVector: number[], matchThreshold = 0.1, matchCount = 5): DocumentChunk[] {
    if (this.chunks.length === 0) return [];

    const scored = this.chunks.map(chunk => {
      let sim = 0;
      if (chunk.embedding && chunk.embedding.length === queryVector.length) {
        sim = this.cosineSimilarity(queryVector, chunk.embedding);
      } else {
        // Fallback keyword score if embedding missing
        sim = 0.5;
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

export const localVectorStore = new LocalVectorStore();
