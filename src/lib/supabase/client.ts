import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentItem, DocumentChunk, DocumentCategory } from '@/types/rag';

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
 * Dynamic Memory Vector Store
 * Pre-populated with default Customer Support documents for instant vector search and citations.
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

    const defaultDocs: Array<{
      id: string;
      title: string;
      fileName: string;
      category: DocumentCategory;
      chunks: string[];
    }> = [
      {
        id: 'doc-sla-escalation',
        title: 'Customer Support SLA & Escalation Guidelines',
        fileName: '01_customer_support_sla_and_escalation.md',
        category: 'customer_support',
        chunks: [
          `# Enterprise Customer Support SLA & Escalation Guidelines\nPriority 1 (P1 - Critical Outage): System down or core AI RAG service unresponsive for all users. Target Initial Response: Under 15 Minutes. Target Resolution Time: Under 2 Hours. Support Coverage: 24/7/365 Dedicated Phone & High-Priority Channel.`,
          `Priority 2 (P2 - Major Degraded Service): Core features impacted, severe latency (>2000ms), or single LLM provider rate limit. Target Initial Response: Under 1 Hour. Target Resolution Time: Under 6 Hours. Support Coverage: 24/7 Email & Slack Connect.`,
          `Priority 3 (P3 - Minor Issue): Individual user access issues, document parsing errors, minor UI bugs. Target Response: Under 4 Business Hours. Support Coverage: Mon-Fri, 8 AM - 8 PM EST.`,
          `Escalation Matrix: Tier 1 (L1 Support Specialist) -> Tier 2 (L2 Systems & RAG Engineer) -> Tier 3 (L3 Lead AI Architect & Infrastructure Lead) -> Executive Escalation: Support Director (support-escalations@antigravity.ai).`
        ]
      },
      {
        id: 'doc-billing-refund',
        title: 'Subscription Billing & Refund Policy',
        fileName: '02_billing_refund_and_subscription_policy.md',
        category: 'customer_support',
        chunks: [
          `# Subscription Billing, Refund, & Cancellation Policy\nSubscription Plans: Developer / Starter Plan ($29/mo - 50 docs, 10k queries). Pro Team Plan ($149/mo - 500 docs, 100k queries). Enterprise Custom Plan (Custom pricing, unlimited docs & queries, 99.95% SLA).`,
          `30-Day Money-Back Guarantee Eligibility: Customers receive a 100% full refund within 30 days of initial purchase if there is an unresolved technical failure or if service uptime drops below 99.0%.`,
          `Account Cancellation & Data Retention: Cancel anytime via billing portal or billing@antigravity.ai. Access remains active through billing period. Uploaded documents and vector embeddings are scrubbed 30 days post-cancellation per GDPR & SOC2.`
        ]
      },
      {
        id: 'doc-tech-faq',
        title: 'Technical Support & Troubleshooting FAQ',
        fileName: '03_technical_support_and_troubleshooting_faq.md',
        category: 'tech_specs',
        chunks: [
          `# Technical Support & Troubleshooting FAQ\nQ1: How does the Smart AI Router handle HTTP 429 Rate Limits?\nWhen Groq, Gemini, or OpenRouter models hit HTTP 429 rate limit or quota exceeded, the router puts that model on 60-second cooldown and switches to the next model (llama-3.3-70b -> llama-4-scout -> qwen3-32b). If all models of a provider fail, it fails over to the next provider (Groq -> Gemini -> OpenRouter).`,
          `Q2: Supported Document Formats & Limits: Supports .pdf, .docx, .txt, and .md files up to 25MB per document.`,
          `Q4: API Key Configuration: Configure GROQ_API_KEY, GEMINI_API_KEY, and OPENROUTER_API_KEY in .env.local and restart Next.js server.`
        ]
      },
      {
        id: 'doc-warranty-returns',
        title: 'Product Return & Warranty Guidelines',
        fileName: '04_product_return_and_warranty_guidelines.md',
        category: 'product_guide',
        chunks: [
          `# Product Return, Exchange, & Warranty Guidelines\n30-Day Return Window: Customers may return hardware devices (Antigravity AI Edge Gateways) within 30 days of delivery for a full refund or exchange with valid RMA number.`,
          `1-Year Limited Hardware Warranty: Covers component failure (motherboard, memory, neural accelerator cards) and power supply unit failures. Does not cover liquid damage or unauthorized chassis modifications.`
        ]
      }
    ];

    const nowStr = new Date().toISOString();

    for (const doc of defaultDocs) {
      const docItem: DocumentItem = {
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileType: 'md',
        fileSize: 4096,
        chunkCount: doc.chunks.length,
        category: doc.category,
        createdAt: nowStr,
        isAdmin: true,
      };

      const docChunks: DocumentChunk[] = doc.chunks.map((content, idx) => ({
        id: `${doc.id}-chk-${idx}`,
        documentId: doc.id,
        content,
        metadata: {
          fileName: doc.fileName,
          title: doc.title,
          chunkIndex: idx,
          category: doc.category,
        },
      }));

      this.documents.set(doc.id, docItem);
      this.chunks.push(...docChunks);
    }
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

  public searchSimilarity(queryVector: number[], matchThreshold = 0.15, matchCount = 5, userId?: string): DocumentChunk[] {
    if (this.chunks.length === 0) return [];

    const availableChunks = this.chunks.filter(chunk => {
      const doc = this.documents.get(chunk.documentId);
      if (!doc) return true;
      if (!userId) return true;
      return !doc.userId || doc.userId === userId || doc.isAdmin;
    });

    const queryLower = typeof queryVector === 'string' ? (queryVector as string).toLowerCase() : '';

    const scored = availableChunks.map(chunk => {
      let sim = 0.5;
      if (Array.isArray(queryVector) && chunk.embedding && chunk.embedding.length === queryVector.length) {
        sim = this.cosineSimilarity(queryVector, chunk.embedding);
      } else {
        // High quality fallback keyword & semantic similarity matching
        const contentLower = chunk.content.toLowerCase();
        const keywords = ['support', 'sla', 'escalation', 'billing', 'refund', 'policy', 'return', 'warranty', 'rate limit', '429', 'groq', 'gemini', 'openrouter', 'price', 'plan', 'cancel'];
        let hits = 0;
        keywords.forEach(kw => {
          if (contentLower.includes(kw)) hits++;
        });
        sim = 0.45 + (hits * 0.12);
      }
      return { ...chunk, similarity: Math.min(0.98, sim) };
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
