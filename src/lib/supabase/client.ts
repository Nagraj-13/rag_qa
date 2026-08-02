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
        title: 'Customer Support SLA & Incident Escalation Policy',
        fileName: '01_service_level_agreement_and_incident_escalation.md',
        category: 'customer_support',
        chunks: [
          `# Enterprise Customer Support SLA & Incident Escalation Policy\nPriority 1 (P1 - Critical Outage): System down or core service unresponsive for all users. Initial Response Target: Under 15 Minutes. Target Resolution Time: Under 2 Hours. Coverage: 24/7/365 Dedicated Phone & Slack Connect.`,
          `Priority 2 (P2 - Major Degraded Service): Core feature degradation or severe latency (>2000ms). Initial Response Target: Under 1 Hour. Target Resolution Time: Under 6 Hours. Coverage: 24/7 Email & Slack.`,
          `Priority 3 (P3 - Moderate Issue): Non-critical bug or single user access issue. Initial Response Target: Under 4 Business Hours. Coverage: Mon-Fri, 8 AM - 8 PM EST.`,
          `Incident Escalation Ladder: Level 1 (Tier 1 Support Specialist) -> Level 2 (Tier 2 Support Engineer) -> Level 3 (Tier 3 AI Solutions Architect) -> Level 4 (VP of Customer Operations, executive-escalations@antigravity.ai).`
        ]
      },
      {
        id: 'doc-billing-refund',
        title: 'Subscription Billing, Refund & Data Retention Policy',
        fileName: '02_billing_refund_and_subscription_policy.md',
        category: 'customer_support',
        chunks: [
          `# Subscription Billing, Payment, Refund & Data Retention Policy\nSubscription Plans: Developer Starter ($29/mo - 50 docs, 10k queries). Pro Team ($149/mo - 500 docs, 100k queries). Enterprise Custom (Custom pricing, unlimited documents, 99.95% SLA).`,
          `30-Day Money-Back Guarantee: All new subscriptions qualify for a 100% full refund within 30 days of initial purchase if there is an unresolved technical issue or system uptime drops below 99.0%.`,
          `Cancellation & GDPR Data Purge: Cancel anytime via billing portal or billing@antigravity.ai. On Day 30 post-cancellation, all uploaded documents and vector embeddings are permanently purged per GDPR Article 17 & SOC 2.`
        ]
      },
      {
        id: 'doc-security-privacy',
        title: 'Account Security, Access Control & Privacy Policy',
        fileName: '03_account_security_and_privacy_policy.md',
        category: 'customer_support',
        chunks: [
          `# Account Security, Access Control & Privacy Policy\nRole-Based Access Control (RBAC): Customer role is restricted to support chat. Admin role has exclusive access to document management, analytics, and system settings.`,
          `Authentication Security: Mandatory Multi-Factor Authentication (MFA) for admin accounts. Enterprise SAML 2.0 / OAuth 2.0 SSO support (Okta, Azure AD, Google Workspace). Password lockout occurs after 5 failed attempts for 15 minutes.`,
          `Data Encryption: All data in transit is encrypted via TLS 1.3. Documents and vector embeddings at rest are encrypted via AES-256. Database tenant isolation enforced by PostgreSQL Row Level Security (RLS).`
        ]
      },
      {
        id: 'doc-warranty-returns',
        title: 'Product Return, Hardware Warranty & RMA Guidelines',
        fileName: '04_product_return_warranty_and_rma_guide.md',
        category: 'customer_support',
        chunks: [
          `# Product Return, Hardware Warranty & RMA Guidelines\n30-Day Return Window: Customers may return unopened, undamaged, or defective hardware within 30 days of delivery for a 100% full refund or direct replacement.`,
          `1-Year Limited Warranty: Covers manufacturing defects (motherboard failure, power supply issues, component defects) for 12 months from delivery date under the FTC Magnuson-Moss Warranty Act.`,
          `RMA Process: Request RMA via rma@antigravity.ai. Receive prepaid shipping label within 4 hours. Replacement unit dispatches via 2-day air upon carrier scan.`
        ]
      },
      {
        id: 'doc-tech-troubleshooting',
        title: 'Customer Technical Support & Troubleshooting Guide',
        fileName: '05_technical_troubleshooting_and_faq_guide.md',
        category: 'tech_specs',
        chunks: [
          `# Customer Technical Support & Troubleshooting FAQ Guide\nPassword Reset: Click 'Forgot Password' on sign in screen, enter email, and use the 15-minute reset link. Passwords must be at least 10 characters long.`,
          `Account Lockout: Accounts auto-lock for 15 minutes after 5 consecutive failed login attempts, or can be unlocked via email verification.`,
          `High Latency Troubleshooting: Latency spikes >2000ms trigger automatic failovers. If slow response times persist past 5 minutes, clear browser cache or try an alternate network.`
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
        const contentLower = chunk.content.toLowerCase();
        if (queryLower && contentLower.includes(queryLower)) {
          sim = 0.88;
        } else {
          sim = 0.65;
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
