import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingRouter } from '@/lib/embeddings/embedding-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { smartRouter } from '@/lib/router/smart-router';
import { SettingsStore } from '@/lib/settings/store';
import { SourceCitation, DocumentItem } from '@/types/rag';
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
  return SUPPORT_SCOPE_KEYWORDS.some(kw => lower.includes(kw));
}

async function logChatAnalytics(
  query: string,
  provider: string,
  modelUsed: string,
  latencyMs: number,
  retrievedChunkCount: number,
  queryType: string,
  knowledgeMode: string
) {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('chat_analytics').insert({
        query,
        provider,
        model_used: modelUsed,
        latency_ms: latencyMs,
        retrieved_chunk_count: retrievedChunkCount,
        query_type: queryType,
        knowledge_mode: knowledgeMode,
      });

      if (queryType.includes('no_match') || retrievedChunkCount === 0) {
        await supabase.from('unanswered_questions').insert({
          query,
          reason: 'No matching document chunk found in knowledge base repository',
        });
      }
    } catch (err) {
      console.warn('Failed to insert chat analytics:', err);
    }
  }
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

    // Fetch persistent settings from SettingsStore
    const settings = await SettingsStore.getSettings();
    const knowledgeMode = settings.knowledgeMode || 'okf';
    const routerStrategy = settings.routerStrategy || 'smart';

    smartRouter.setStrategy(routerStrategy as any);
    smartRouter.setKnowledgeMode(knowledgeMode as any);

    // 1. Basic greetings — respond as a support agent
    if (isBasicGreeting(message)) {
      const systemPrompt = `You are a friendly customer support assistant.
Respond to the user's greeting warmly and briefly. Introduce yourself as a support assistant.
Let them know you can help with billing, refunds, account issues, product support, returns, and technical troubleshooting.
Keep it to 2-3 sentences max. Use Markdown formatting.`;

      const { text: rawAnswer, telemetry } = await smartRouter.executeWithFailover(systemPrompt, message);

      await logChatAnalytics(message, telemetry.provider, telemetry.modelUsed, telemetry.latencyMs, 0, 'conversational', knowledgeMode);

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

    // 2. Check if query is support-related
    if (!isSupportRelated(message)) {
      await logChatAnalytics(message, 'system', 'content-filter', 5, 0, 'off_topic', knowledgeMode);

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

    // =========================================================================
    // MODE 1: OKF MODE (Open Knowledge Format / LLM Wiki Architecture)
    // =========================================================================
    if (knowledgeMode === 'okf') {
      console.log('\n========== [RAG DEBUG] OKF MODE START ==========');
      console.log('[RAG DEBUG] User query:', message);
      console.log('[RAG DEBUG] Knowledge mode:', knowledgeMode);
      const allDocs: DocumentItem[] = [];
      const supabase = getSupabaseClient();
      console.log('[RAG DEBUG] Supabase client initialized:', !!supabase);
      if (supabase) {
        try {
          const { data, error: docsError } = await supabase.from('documents').select('*');
          console.log('[RAG DEBUG] Supabase documents query - data count:', data?.length ?? 0, ', error:', docsError ?? 'none');
          if (data) {
            data.forEach(d => {
              allDocs.push({
                id: d.id,
                title: d.title,
                fileName: d.file_name,
                fileType: d.file_type,
                fileSize: d.file_size || 4096,
                category: d.category,
                chunkCount: d.chunk_count,
                createdAt: d.created_at,
                isOKF: d.is_okf ?? true,
              });
            });
          }
        } catch (docFetchErr) {
          console.error('[RAG DEBUG] Error fetching documents:', docFetchErr);
        }
      }

      const localDocs = localVectorStore.getDocuments();
      console.log('[RAG DEBUG] Local vector store docs count:', localDocs.length);
      localDocs.forEach(ld => {
        if (!allDocs.some(ad => ad.id === ld.id)) {
          allDocs.push(ld);
        }
      });
      console.log('[RAG DEBUG] Total allDocs (merged) count:', allDocs.length);
      if (allDocs.length > 0) {
        console.log('[RAG DEBUG] Document catalog:', allDocs.map(d => ({ title: d.title, fileName: d.fileName, category: d.category })));
      }

      const masterCatalogText = allDocs.map((doc, idx) => (
        `[Document ${idx + 1}] Title: "${doc.title}", File: "${doc.fileName}", Category: "${doc.category}"`
      )).join('\n');

      let targetFiles: string[] = [];

      if (allDocs.length > 0) {
        try {
          const navSystemPrompt = `You are the AI Master Knowledge Index Navigator for our Open Knowledge Base.
Below is the Master Directory Catalog of all uploaded Knowledge Base documents:

${masterCatalogText}

User Query: "${message}"

Task: Analyze the Master Directory Catalog. Identify which specific document titles or file names are relevant to answer the user's query.
Respond strictly with a JSON array of matching file names or titles. Example: ["01_service_level_agreement_and_incident_escalation.md"]
Output ONLY the JSON array and nothing else.`;

          const { text: navResponse } = await smartRouter.executeWithFailover(navSystemPrompt, message);
          console.log('[RAG DEBUG] Navigator LLM raw response:', navResponse);
          const jsonMatch = navResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            targetFiles = JSON.parse(jsonMatch[0]);
            console.log('[RAG DEBUG] Navigator identified target files:', targetFiles);
          } else {
            console.log('[RAG DEBUG] Navigator response did not contain a JSON array');
          }
        } catch (navErr) {
          console.warn('[RAG DEBUG] OKF index navigation LLM call failed:', navErr);
        }
      }

      const { embedding: queryEmbedding, providerUsed: embeddingProvider } = await EmbeddingRouter.generateEmbedding(message);
      console.log('[RAG DEBUG] Embedding provider used:', embeddingProvider);
      console.log('[RAG DEBUG] Embedding vector length:', queryEmbedding.length);
      console.log('[RAG DEBUG] Embedding sample (first 5 values):', queryEmbedding.slice(0, 5));
      const nonZeroCount = queryEmbedding.filter(v => v !== 0).length;
      console.log('[RAG DEBUG] Embedding non-zero values:', nonZeroCount, '/', queryEmbedding.length);

      let retrievedChunks: Array<{
        id: string;
        documentId: string;
        content: string;
        metadata: any;
        similarity: number;
      }> = [];

      if (supabase) {
        try {
          console.log('[RAG DEBUG] Calling Supabase match_documents RPC with threshold=0.05, count=8');
          const { data, error: rpcError } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.05,
            match_count: 8,
            p_user_id: userId || null,
          });

          console.log('[RAG DEBUG] Supabase RPC result - data:', data?.length ?? 'null', ', error:', rpcError ?? 'none');
          if (rpcError) {
            console.error('[RAG DEBUG] Supabase RPC error details:', JSON.stringify(rpcError));
          }

          if (Array.isArray(data) && data.length > 0) {
            console.log('[RAG DEBUG] Supabase matched chunks:');
            data.forEach((item, idx) => {
              console.log(`  [Chunk ${idx}] similarity=${item.similarity}, docId=${item.document_id}, content preview: "${(item.content || '').slice(0, 100)}..."`);
              retrievedChunks.push({
                id: item.id,
                documentId: item.document_id,
                content: item.content,
                metadata: item.metadata || {},
                similarity: item.similarity,
              });
            });
          } else {
            console.log('[RAG DEBUG] Supabase RPC returned NO matching chunks');
          }
        } catch (rpcCatchErr) {
          console.error('[RAG DEBUG] Supabase RPC call threw exception:', rpcCatchErr);
        }
      }

      const localMatches = localVectorStore.searchSimilarity(queryEmbedding, 0.05, 8, userId, message);
      console.log('[RAG DEBUG] Local vector store matches:', localMatches.length);
      localMatches.forEach((m, idx) => {
        console.log(`  [Local Chunk ${idx}] similarity=${m.similarity}, docId=${m.documentId}, content preview: "${(m.content || '').slice(0, 100)}..."`);
        retrievedChunks.push({
          id: m.id,
          documentId: m.documentId,
          content: m.content,
          metadata: m.metadata,
          similarity: m.similarity || 0.5,
        });
      });

      console.log('[RAG DEBUG] Total retrieved chunks BEFORE filtering:', retrievedChunks.length);

      if (targetFiles.length > 0) {
        const targetChunks = retrievedChunks.filter(c => (
          targetFiles.some(tf => (
            (c.metadata?.fileName && c.metadata.fileName.toLowerCase().includes(tf.toLowerCase())) ||
            (c.metadata?.title && c.metadata.title.toLowerCase().includes(tf.toLowerCase()))
          ))
        ));

        console.log('[RAG DEBUG] After targetFiles filter:', targetChunks.length, 'chunks match target files:', targetFiles);
        if (targetChunks.length > 0) {
          retrievedChunks = targetChunks;
        } else {
          console.log('[RAG DEBUG] No chunks matched target files, keeping all chunks');
          console.log('[RAG DEBUG] Chunk metadata for debugging:', retrievedChunks.map(c => ({ fileName: c.metadata?.fileName, title: c.metadata?.title })));
        }
      }

      const seenContent = new Set<string>();
      const uniqueChunks: typeof retrievedChunks = [];
      for (const chunk of retrievedChunks) {
        const trimmed = chunk.content.trim();
        if (!seenContent.has(trimmed)) {
          seenContent.add(trimmed);
          uniqueChunks.push(chunk);
        }
      }
      uniqueChunks.sort((a, b) => b.similarity - a.similarity);
      retrievedChunks = uniqueChunks.slice(0, 5);
      console.log('[RAG DEBUG] Final unique chunks after dedup + top-5:', retrievedChunks.length);

      const citations: SourceCitation[] = retrievedChunks.map((chunk, idx) => ({
        id: chunk.id || `cit-${idx}`,
        documentId: chunk.documentId,
        fileName: chunk.metadata?.fileName || chunk.metadata?.title || `Document ${idx + 1}`,
        snippet: chunk.content.slice(0, 180) + '...',
        similarity: Math.round((chunk.similarity || 0.75) * 100) / 100,
        category: chunk.metadata?.category,
      }));

      if (retrievedChunks.length > 0) {
        console.log('[RAG DEBUG] ✅ Found chunks! Generating OKF answer with', retrievedChunks.length, 'chunks');
        retrievedChunks.forEach((c, i) => {
          console.log(`[RAG DEBUG] Final Chunk ${i}: similarity=${c.similarity}, doc=${c.metadata?.fileName || 'unknown'}`);
          console.log(`  Content (first 200 chars): "${c.content.slice(0, 200)}..."`);
        });

        const contextText = retrievedChunks.map((c, i) => `[Document: ${c.metadata?.fileName || 'Knowledge Base'}]\n${c.content}`).join('\n\n');

        const okfSystemPrompt = `You are Antigravity's Chief Support Specialist and Knowledge Engineer.
Your goal is to provide a complete, clear, and engaging answer that fully resolves the user's question using ONLY the retrieved context documents below.

Document Context:
${contextText}

Instructions for OKF Response Generation:
1. Thoroughly analyze all provided document chunks. Extract every relevant rule, policy, step, contact detail, timeline, and SLA specification.
2. Structure your answer using clear OKF Markdown headers:
   - "### 📖 Executive Summary & Overview": A warm, engaging, direct answer to the user's question.
   - "### 💡 Core Specifications & Key Policy Rules": Structured bullet points detailing precise policies, deadlines, figures, or step-by-step procedures.
   - "### 🛠️ Actionable Next Steps": Clear instructions on what the user should do next or how to proceed.
3. Keep your tone professional, empathetic, warm, and highly engaging. Use clean formatting, bold text, and bullet points.
4. Do NOT guess or hallucinate any facts not mentioned in the context. Do NOT mention internal AI models or vector databases.`;

        const { text: rawAnswer, telemetry } = await smartRouter.executeWithFailover(okfSystemPrompt, message);
        console.log('[RAG DEBUG] LLM raw answer (first 500 chars):', rawAnswer.slice(0, 500));
        console.log('[RAG DEBUG] LLM telemetry:', { provider: telemetry.provider, model: telemetry.modelUsed, latencyMs: telemetry.latencyMs });

        const { formattedAnswer, webReferences } = OpenKnowledgeEngine.formatOpenKnowledgeWiki(rawAnswer, message, citations);
        console.log('[RAG DEBUG] Formatted answer (first 500 chars):', formattedAnswer.slice(0, 500));
        console.log('========== [RAG DEBUG] OKF MODE END (SUCCESS) ==========\n');

        await logChatAnalytics(message, telemetry.provider, telemetry.modelUsed, telemetry.latencyMs, retrievedChunks.length, 'okf_wiki', knowledgeMode);

        return NextResponse.json({
          answer: formattedAnswer,
          citations,
          webReferences,
          telemetry: {
            providerUsed: telemetry.provider,
            providerName: telemetry.providerName,
            modelUsed: telemetry.modelUsed,
            latencyMs: telemetry.latencyMs,
            isFallback: telemetry.isFallback,
            retrievedChunkCount: retrievedChunks.length,
            queryType: 'okf_wiki',
          },
        });
      }

      console.log('[RAG DEBUG] ❌ NO CHUNKS RETRIEVED — returning fallback response');
      console.log('========== [RAG DEBUG] OKF MODE END (NO MATCH) ==========\n');

      await logChatAnalytics(message, 'system', 'okf-fallback', 10, 0, 'okf_wiki_no_match', knowledgeMode);

      return NextResponse.json({
        answer: `### 📖 Executive Summary & Overview\nI wasn't able to find specific information matching your question in our Open Knowledge Base.\n\n### 💡 Recommended Next Steps\n- **Rephrase your question** with more specific terms\n- **Contact our support team** directly for personalized help\n- **Inspect Knowledge Base Documents** in the Admin Panel`,
        citations: [],
        webReferences: OpenKnowledgeEngine.getWebReferences(message),
        telemetry: {
          providerUsed: 'system' as any,
          providerName: 'Open Knowledge Engine',
          modelUsed: 'okf-fallback',
          latencyMs: 10,
          isFallback: false,
          retrievedChunkCount: 0,
          queryType: 'okf_wiki_no_match',
        },
      });
    }

    // =========================================================================
    // MODE 2: STANDARD RAG MODE (Vector Similarity & Keyword Retrieval)
    // =========================================================================
    console.log('\n========== [RAG DEBUG] STANDARD RAG MODE START ==========');
    console.log('[RAG DEBUG] User query:', message);
    const { embedding: queryEmbedding, providerUsed: stdEmbeddingProvider } = await EmbeddingRouter.generateEmbedding(message);
    console.log('[RAG DEBUG] Embedding provider:', stdEmbeddingProvider);
    console.log('[RAG DEBUG] Embedding vector length:', queryEmbedding.length);
    console.log('[RAG DEBUG] Embedding non-zero values:', queryEmbedding.filter(v => v !== 0).length, '/', queryEmbedding.length);

    let retrievedChunks: Array<{
      id: string;
      documentId: string;
      content: string;
      metadata: any;
      similarity: number;
    }> = [];

    const supabase = getSupabaseClient();
    console.log('[RAG DEBUG] Supabase client initialized:', !!supabase);
    if (supabase) {
      try {
        console.log('[RAG DEBUG] Calling Supabase match_documents RPC...');
        const { data, error } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.05,
          match_count: 5,
          p_user_id: userId || null,
        });

        console.log('[RAG DEBUG] Supabase RPC result - data count:', data?.length ?? 'null', ', error:', error ?? 'none');
        if (error) {
          console.error('[RAG DEBUG] Supabase RPC error details:', JSON.stringify(error));
        }

        if (!error && Array.isArray(data) && data.length > 0) {
          console.log('[RAG DEBUG] Supabase matched chunks:');
          data.forEach((item, idx) => {
            console.log(`  [Chunk ${idx}] similarity=${item.similarity}, docId=${item.document_id}, content preview: "${(item.content || '').slice(0, 100)}..."`);
            retrievedChunks.push({
              id: item.id,
              documentId: item.document_id,
              content: item.content,
              metadata: item.metadata || {},
              similarity: item.similarity,
            });
          });
        } else {
          console.log('[RAG DEBUG] No vector matches, trying keyword ILIKE fallback...');
          // Keyword ILIKE fallback in Supabase
          const keywords = message.toLowerCase().match(/\w+/g) || [];
          const stopWords = ['what', 'how', 'where', 'when', 'tell', 'about', 'your', 'this', 'that', 'with', 'have', 'from'];
          for (const kw of keywords) {
            if (kw.length > 3 && !stopWords.includes(kw)) {
              console.log('[RAG DEBUG] ILIKE search for keyword:', kw);
              const { data: ilikeData } = await supabase
                .from('document_chunks')
                .select('id, document_id, content, metadata')
                .ilike('content', `%${kw}%`)
                .limit(5);

              console.log('[RAG DEBUG] ILIKE results for "' + kw + '":', ilikeData?.length ?? 0);
              if (ilikeData && ilikeData.length > 0) {
                ilikeData.forEach((item, idx) => {
                  retrievedChunks.push({
                    id: item.id,
                    documentId: item.document_id,
                    content: item.content,
                    metadata: item.metadata || {},
                    similarity: 0.85 - (idx * 0.05),
                  });
                });
                break;
              }
            }
          }
        }
      } catch (dbErr) {
        console.error('[RAG DEBUG] Supabase vector search exception:', dbErr);
      }
    }

    const localMatches = localVectorStore.searchSimilarity(queryEmbedding, 0.05, 5, userId, message);
    console.log('[RAG DEBUG] Local vector store matches:', localMatches.length);
    localMatches.forEach((m, idx) => {
      console.log(`  [Local Chunk ${idx}] similarity=${m.similarity}, docId=${m.documentId}, content preview: "${(m.content || '').slice(0, 100)}..."`);
      retrievedChunks.push({
        id: m.id,
        documentId: m.documentId,
        content: m.content,
        metadata: m.metadata,
        similarity: m.similarity || 0.5,
      });
    });
    console.log('[RAG DEBUG] Total retrieved chunks (Supabase + local):', retrievedChunks.length);

    const seenContent = new Set<string>();
    const uniqueChunks: typeof retrievedChunks = [];
    for (const chunk of retrievedChunks) {
      const trimmed = chunk.content.trim();
      if (!seenContent.has(trimmed)) {
        seenContent.add(trimmed);
        uniqueChunks.push(chunk);
      }
    }
    uniqueChunks.sort((a, b) => b.similarity - a.similarity);
    retrievedChunks = uniqueChunks.slice(0, 5);

    const citations: SourceCitation[] = retrievedChunks.map((chunk, idx) => ({
      id: chunk.id || `cit-${idx}`,
      documentId: chunk.documentId,
      fileName: chunk.metadata?.fileName || chunk.metadata?.title || `Document ${idx + 1}`,
      snippet: chunk.content.slice(0, 180) + '...',
      similarity: Math.round((chunk.similarity || 0.75) * 100) / 100,
      category: chunk.metadata?.category,
    }));

    if (retrievedChunks.length > 0) {
      console.log('[RAG DEBUG] ✅ Found chunks! Generating standard RAG answer with', retrievedChunks.length, 'chunks');
      retrievedChunks.forEach((c, i) => {
        console.log(`[RAG DEBUG] Final Chunk ${i}: similarity=${c.similarity}, doc=${c.metadata?.fileName || 'unknown'}`);
        console.log(`  Content (first 200 chars): "${c.content.slice(0, 200)}..."`);
      });

      const contextText = retrievedChunks.map((c, i) => `[Source ${i + 1}: ${c.metadata?.fileName || 'Document'}]\n${c.content}`).join('\n\n');

      const systemPrompt = `You are  Senior Customer Support Assistant.
Your objective is to provide a complete, highly engaging, and clear answer that directly resolves the user's question using ONLY the provided support documents.

Context Documents:
${contextText}

Instructions for Answer Generation:
1. Thoroughly extract all relevant facts, policies, steps, contact info, timelines, and rules from the provided context chunks.
2. Structure your response into clean, engaging Markdown with bold headers, bullet points, and callout sections where appropriate.
3. Keep your tone warm, empathetic, professional, and clear.
4. Highlight key steps, contact emails, SLA response windows, or policy conditions in structured lists so the answer is effortless to read and act upon.
5. Do NOT mention internal database queries, AI model names, or vector thresholds.`;

      const { text: rawAnswer, telemetry } = await smartRouter.executeWithFailover(systemPrompt, message);
      console.log('[RAG DEBUG] LLM raw answer (first 500 chars):', rawAnswer.slice(0, 500));
      console.log('[RAG DEBUG] LLM telemetry:', { provider: telemetry.provider, model: telemetry.modelUsed, latencyMs: telemetry.latencyMs });
      console.log('========== [RAG DEBUG] STANDARD RAG MODE END (SUCCESS) ==========\n');

      await logChatAnalytics(message, telemetry.provider, telemetry.modelUsed, telemetry.latencyMs, retrievedChunks.length, 'document_rag', knowledgeMode);

      return NextResponse.json({
        answer: rawAnswer,
        citations,
        webReferences: [],
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

    console.log('[RAG DEBUG] ❌ NO CHUNKS RETRIEVED in standard RAG — returning fallback');
    console.log('========== [RAG DEBUG] STANDARD RAG MODE END (NO MATCH) ==========\n');
    await logChatAnalytics(message, 'system', 'fallback', 10, 0, 'no_match', knowledgeMode);

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
