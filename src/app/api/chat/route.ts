import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingRouter } from '@/lib/embeddings/embedding-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { smartRouter } from '@/lib/router/smart-router';
import { SourceCitation } from '@/types/rag';

/**
 * Detect if a user prompt is a basic conversational query (greetings, general Q&A)
 * or requires deep document vector retrieval.
 */
function isBasicConversationalQuery(text: string): boolean {
  const clean = text.trim().toLowerCase();
  
  // Very short phrases or common greetings
  const basicPhrases = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'how are you doing', 'who are you', 'what can you do', 'what is your name',
    'help', 'thanks', 'thank you', 'ok', 'okay', 'cool', 'awesome', 'tell me a joke',
    'what is 2+2', 'what is 2 + 2', 'who created you'
  ];

  if (basicPhrases.includes(clean)) return true;
  if (clean.length < 8 && !clean.includes('pdf') && !clean.includes('doc')) return true;

  // Pattern matching for general conversational questions
  const conversationalRegex = /^(hi|hello|hey|greetings|who are you|what can you do|how are you|tell me a joke|what is the capital of|who is the president of)/i;
  return conversationalRegex.test(clean);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], routerStrategy, userId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message string is required' }, { status: 400 });
    }

    if (routerStrategy) {
      smartRouter.setStrategy(routerStrategy);
    }

    const isConversational = isBasicConversationalQuery(message);

    // If query is basic conversational, answer directly via Smart AI Router
    if (isConversational) {
      const systemPrompt = `You are an intelligent, friendly AI assistant.
Answer the user's general conversational input clearly, politely, and concisely.
If the user asks what you can do, mention that you can also answer questions based on uploaded documents (Customer Support guides, FAQs, product manuals, etc.) using your Smart AI Router & pgvector database.`;

      const { text: answerText, telemetry } = await smartRouter.executeWithFailover(systemPrompt, message);

      return NextResponse.json({
        answer: answerText,
        citations: [],
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

    // Knowledge Search Query: Generate embedding and search pgvector
    const { embedding: queryEmbedding, providerUsed: embedProvider } = await EmbeddingRouter.generateEmbedding(message);

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
        console.warn('Supabase match_documents error, using dynamic memory vector store fallback:', dbErr);
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

    // Build Citations
    const citations: SourceCitation[] = retrievedChunks.map((chunk, idx) => ({
      id: chunk.id || `cit-${idx}`,
      documentId: chunk.documentId,
      fileName: chunk.metadata?.fileName || chunk.metadata?.title || `Document ${idx + 1}`,
      snippet: chunk.content.slice(0, 180) + '...',
      similarity: Math.round((chunk.similarity || 0.75) * 100) / 100,
      pageNumber: chunk.metadata?.pageNumber,
      category: chunk.metadata?.category,
    }));

    // If chunks are found, perform RAG
    if (retrievedChunks.length > 0) {
      const contextText = retrievedChunks.map((c, i) => `[Source ${i + 1}: ${c.metadata?.fileName || 'Doc'} (${c.metadata?.category || 'General'})\n${c.content}`).join('\n\n');

      const systemPrompt = `You are a specialized RAG AI assistant.
Answer the user's question accurately using the provided document context chunks below (e.g. Customer Support, Technical Guides, Product Manuals).

Context Documents:
${contextText}

Instructions:
1. Provide a direct, well-structured, and helpful answer based on the context.
2. If the user asks about something mentioned in the documents, cite the relevant information clearly.
3. If the context does not fully answer the question, state what is known from the context and supplement with general AI knowledge politely.`;

      const { text: answerText, telemetry } = await smartRouter.executeWithFailover(systemPrompt, message);

      return NextResponse.json({
        answer: answerText,
        citations,
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

    // No document chunks matched: politely decline — only answer from knowledge base
    return NextResponse.json({
      answer: "I'm sorry, I don't have information about that in my knowledge base yet. Please upload relevant documents (such as customer support manuals, product guides, or FAQs) to the Knowledge Base, and I'll be able to answer your question accurately with verified source citations.",
      citations: [],
      telemetry: {
        providerUsed: 'groq' as const,
        providerName: 'Knowledge Base',
        modelUsed: 'none',
        latencyMs: 0,
        isFallback: false,
        retrievedChunkCount: 0,
        queryType: 'document_rag' as const,
      },
    });

  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error in RAG pipeline',
    }, { status: 500 });
  }
}
