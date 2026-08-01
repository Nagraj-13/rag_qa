import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingRouter } from '@/lib/embeddings/embedding-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { smartRouter } from '@/lib/router/smart-router';
import { SourceCitation } from '@/types/rag';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], routerStrategy } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message string is required' }, { status: 400 });
    }

    if (routerStrategy) {
      smartRouter.setStrategy(routerStrategy);
    }

    // 1. Generate query embedding via Embedding Router
    const { embedding: queryEmbedding, providerUsed: embedProvider } = await EmbeddingRouter.generateEmbedding(message);

    // 2. Vector Similarity Search against Supabase pgvector or Local Vector Store
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
          match_threshold: 0.15,
          match_count: 5,
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
        console.warn('Supabase match_documents error, using local vector store fallback:', dbErr);
      }
    }

    if (retrievedChunks.length === 0) {
      const localMatches = localVectorStore.searchSimilarity(queryEmbedding, 0.05, 5);
      retrievedChunks = localMatches.map(m => ({
        id: m.id,
        documentId: m.documentId,
        content: m.content,
        metadata: m.metadata,
        similarity: m.similarity || 0.5,
      }));
    }

    // 3. Build Source Citations
    const citations: SourceCitation[] = retrievedChunks.map((chunk, idx) => ({
      id: chunk.id || `cit-${idx}`,
      documentId: chunk.documentId,
      fileName: chunk.metadata?.fileName || chunk.metadata?.title || `Document Chunk ${idx + 1}`,
      snippet: chunk.content.slice(0, 180) + '...',
      similarity: Math.round((chunk.similarity || 0.75) * 100) / 100,
      pageNumber: chunk.metadata?.pageNumber,
    }));

    // 4. Build Augmented RAG Prompt
    const contextText = retrievedChunks.length > 0
      ? retrievedChunks.map((c, i) => `[Source ${i + 1}: ${c.metadata?.fileName || 'Doc'}]\n${c.content}`).join('\n\n')
      : 'No relevant document context found in knowledge base.';

    const systemPrompt = `You are an AI assistant powered by a Smart Multi-Provider RAG Router.
Your goal is to answer the user's question accurately based on the provided document context chunks.

Context Documents:
${contextText}

Instructions:
1. Provide a clear, structured, and helpful answer.
2. If the answer is found in the context, cite the relevant sources.
3. Keep your tone professional and engaging.`;

    // 5. Execute Smart AI Router (Groq -> Gemini -> OpenRouter failover)
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
        embedProvider,
      },
    });

  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error in RAG pipeline',
    }, { status: 500 });
  }
}
