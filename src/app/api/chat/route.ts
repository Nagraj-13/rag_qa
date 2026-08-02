import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingRouter } from '@/lib/embeddings/embedding-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { smartRouter } from '@/lib/router/smart-router';
import { SourceCitation } from '@/types/rag';
import { OpenKnowledgeEngine } from '@/lib/wiki/open-knowledge';

const SUPPORT_SCOPE_KEYWORDS = [
  'support', 'help', 'issue', 'problem', 'refund', 'billing', 'invoice', 'payment',
  'subscription', 'cancel', 'return', 'warranty', 'replace', 'broken', 'defective',
  'sla', 'escalation', 'ticket', 'complaint', 'contact', 'hours', 'availability',
  'account', 'password', 'login', 'sign in', 'reset', 'access', 'error', 'bug',
  'shipping', 'delivery', 'order', 'tracking', 'product', 'plan', 'pricing',
  'upgrade', 'downgrade', 'trial', 'feature', 'policy', 'privacy', 'terms',
  'data', 'gdpr', 'security', 'outage', 'status', 'maintenance', 'api',
  'integration', 'setup', 'install', 'configure', 'documentation', 'guide',
  'faq', 'how to', 'how do', 'can i', 'what is', 'where', 'when', 'who',
];

function isBasicGreeting(text: string): boolean {
  const clean = text.trim().toLowerCase();
  const greetings = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'thanks', 'thank you', 'ok', 'okay', 'cool', 'awesome',
  ];
  if (greetings.includes(clean)) return true;
  if (clean.length < 6) return true;
  return /^(hi|hello|hey|greetings|how are you)/i.test(clean);
}

function isSupportRelated(text: string): boolean {
  const lower = text.toLowerCase();
  // If it contains any support-related keyword, it's in scope
  return SUPPORT_SCOPE_KEYWORDS.some(kw => lower.includes(kw));
}

const OFF_TOPIC_RESPONSE = `I'm a customer support assistant, so I can only help with questions about our products, services, billing, refunds, account access, and technical support.

Here are some things I can help with:
- **Billing & Refunds** — subscription plans, charges, refund requests
- **Account Access** — login issues, password resets
- **Product Support** — setup guides, troubleshooting
- **Returns & Warranty** — return policies, replacement requests
- **SLA & Escalation** — support response times, escalation process

Please try asking a support-related question!`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch current system settings (admin-configured)
    let knowledgeMode = 'okf';
    let routerStrategy = 'smart';
    try {
      const settingsRes = await fetch(new URL('/api/settings', req.url).toString());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        knowledgeMode = settings.knowledgeMode || 'okf';
        routerStrategy = settings.routerStrategy || 'smart';
      }
    } catch { /* use defaults */ }

    smartRouter.setStrategy(routerStrategy as any);
    smartRouter.setKnowledgeMode(knowledgeMode as any);

    // Basic greetings — respond as a support agent
    if (isBasicGreeting(message)) {
      const systemPrompt = `You are a friendly customer support assistant for a company.
Respond to the user's greeting warmly and briefly. Introduce yourself as a support assistant.
Let them know you can help with billing, refunds, account issues, product support, returns, and technical troubleshooting.
Keep it to 2-3 sentences max. Use Markdown formatting.`;

      const { text: rawAnswer, telemetry } = await smartRouter.executeWithFailover(systemPrompt, message);

      return NextResponse.json({
        answer: rawAnswer,
        citations: [],
        webReferences: [],
        telemetry: {
          providerUsed: telemetry.provider,
          providerName: telemetry.providerName,
          modelUsed: telemetry.modelUsed,
          latencyMs: telemetry.latencyMs,
          isFallback: telemetry.isFallback,
          retrievedChunkCount: 0,
          queryType: 'conversational',
        },
      });
    }

    // Check if query is support-related — if not, refuse politely
    if (!isSupportRelated(message)) {
      return NextResponse.json({
        answer: OFF_TOPIC_RESPONSE,
        citations: [],
        webReferences: [],
        telemetry: {
          providerUsed: 'system' as any,
          providerName: 'Support Guard',
          modelUsed: 'content-filter',
          latencyMs: 5,
          isFallback: false,
          retrievedChunkCount: 0,
          queryType: 'off_topic',
        },
      });
    }

    // --- RAG Pipeline: Embed query, search vector store, generate answer ---

    const { embedding: queryEmbedding } = await EmbeddingRouter.generateEmbedding(message);

    let retrievedChunks: Array<{
      id: string;
      documentId: string;
      content: string;
      metadata: any;
      similarity: number;
    }> = [];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.20,
          match_count: 5,
          p_user_id: userId || null,
        });

        if (!error && Array.isArray(data)) {
          retrievedChunks = data.map(item => ({
            id: item.id,
            documentId: item.document_id,
            content: item.content,
            metadata: item.metadata || {},
            similarity: item.similarity,
          }));
        }
      } catch (dbErr) {
        console.warn('Supabase vector search error, using local fallback:', dbErr);
      }
    }

    if (retrievedChunks.length === 0) {
      const localMatches = localVectorStore.searchSimilarity(queryEmbedding, 0.15, 5, userId);
      retrievedChunks = localMatches.map(m => ({
        id: m.id,
        documentId: m.documentId,
        content: m.content,
        metadata: m.metadata,
        similarity: m.similarity || 0.5,
      }));
    }

    // Build citations
    const citations: SourceCitation[] = retrievedChunks.map((chunk, idx) => ({
      id: chunk.id || `cit-${idx}`,
      documentId: chunk.documentId,
      fileName: chunk.metadata?.fileName || chunk.metadata?.title || `Document ${idx + 1}`,
      snippet: chunk.content.slice(0, 180) + '...',
      similarity: Math.round((chunk.similarity || 0.75) * 100) / 100,
      pageNumber: chunk.metadata?.pageNumber,
      category: chunk.metadata?.category,
    }));

    // If chunks found — generate RAG answer
    if (retrievedChunks.length > 0) {
      const contextText = retrievedChunks.map((c, i) => `[Source ${i + 1}: ${c.metadata?.fileName || 'Document'}]\n${c.content}`).join('\n\n');

      const isOKF = knowledgeMode === 'okf';

      const systemPrompt = isOKF
        ? `You are a customer support assistant. Answer the customer's question accurately using the provided internal documents.

Context Documents:
${contextText}

Instructions:
1. Answer ONLY based on the provided context. If the context doesn't contain the answer, say so.
2. Be helpful, professional, and empathetic.
3. Format your response in clear Markdown with structured sections if needed.
4. Do NOT mention internal systems, vector databases, AI models, or technical architecture.
5. Speak as a knowledgeable support agent, not a robot.`
        : `You are a customer support assistant. Answer the customer's question using the provided documents.

Context Documents:
${contextText}

Instructions:
1. Provide a direct, helpful answer based on the context.
2. Be concise and professional.
3. Format in Markdown.
4. Do NOT mention technical systems or AI architecture.`;

      const { text: rawAnswer, telemetry } = await smartRouter.executeWithFailover(systemPrompt, message);

      const { formattedAnswer, webReferences } = isOKF
        ? OpenKnowledgeEngine.formatOpenKnowledgeWiki(rawAnswer, message, citations)
        : { formattedAnswer: rawAnswer, webReferences: [] };

      return NextResponse.json({
        answer: formattedAnswer,
        citations,
        webReferences: isOKF ? webReferences : [],
        telemetry: {
          providerUsed: telemetry.provider,
          providerName: telemetry.providerName,
          modelUsed: telemetry.modelUsed,
          latencyMs: telemetry.latencyMs,
          isFallback: telemetry.isFallback,
          retrievedChunkCount: retrievedChunks.length,
          queryType: 'document_rag',
        },
      });
    }

    // No matching documents — polite fallback
    return NextResponse.json({
      answer: `I wasn't able to find specific information about that in our support knowledge base. Here's what you can try:\n\n- **Rephrase your question** with more specific terms\n- **Contact our support team** directly for personalized help\n- **Check our FAQ section** for common questions\n\nIs there anything else I can help you with?`,
      citations: [],
      webReferences: [],
      telemetry: {
        providerUsed: 'system' as any,
        providerName: 'Knowledge Base',
        modelUsed: 'fallback',
        latencyMs: 10,
        isFallback: false,
        retrievedChunkCount: 0,
        queryType: 'no_match',
      },
    });

  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json({
      error: error.message || 'Something went wrong. Please try again.',
    }, { status: 500 });
  }
}
