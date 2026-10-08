/**
 * Google Gemini Cloud Embedding Router
 * 
 * Uses Google Gemini's embedding models for high-fidelity 768-dimensional vectors:
 * 1. Primary: gemini-embedding-2 (768-dim)
 * 2. Fallback: gemini-embedding-001 (768-dim)
 * 
 * Note: Groq does not have embedding models, and local pseudo-embeddings have
 * been removed to maintain semantic precision.
 */

export class EmbeddingRouter {
  public static VECTOR_DIMENSION = 768;

  public static async generateEmbedding(text: string): Promise<{ embedding: number[]; providerUsed: string }> {
    const sanitizedText = text.replace(/\n/g, ' ').trim();
    if (!sanitizedText) {
      throw new Error('Cannot generate embedding for empty text input');
    }

    const failureReasons: string[] = [];

    // Google Gemini Embeddings API (gemini-embedding-2 / gemini-embedding-001, 768-dim)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey && !geminiKey.includes('placeholder') && !geminiKey.includes('your_')) {
      const geminiModels = ['gemini-embedding-2', 'gemini-embedding-001'];
      for (const gemModel of geminiModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:embedContent?key=${geminiKey.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
              model: `models/${gemModel}`,
              content: { parts: [{ text: sanitizedText }] },
              outputDimensionality: this.VECTOR_DIMENSION,
            })
          });

          if (res.ok) {
            const data = await res.json();
            const values = data.embedding?.values;
            if (Array.isArray(values) && values.length > 0) {
              return {
                embedding: this.padOrTruncate(values, this.VECTOR_DIMENSION),
                providerUsed: `gemini-${gemModel}`
              };
            }
          } else {
            const errBody = await res.text().catch(() => '');
            failureReasons.push(`Gemini ${gemModel} (${res.status}): ${errBody.slice(0, 150)}`);
          }
        } catch (err: any) {
          failureReasons.push(`Gemini ${gemModel} network error: ${err.message}`);
        }
      }
    } else {
      failureReasons.push('GEMINI_API_KEY is missing or contains a placeholder');
    }

    throw new Error(
      `Embedding generation failed. Only Google Gemini embedding models are used. Errors: [${failureReasons.join(' | ')}]`
    );
  }

  private static padOrTruncate(arr: number[], targetDim: number): number[] {
    if (arr.length === targetDim) return arr;
    if (arr.length > targetDim) return arr.slice(0, targetDim);
    const padded = [...arr];
    while (padded.length < targetDim) padded.push(0);
    return padded;
  }
}
