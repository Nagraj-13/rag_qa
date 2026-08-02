/**
 * Multi-Tier Embedding Router
 * 
 * Priority:
 * 1. Gemini Embedding API (text-embedding-004) -> 768-dim
 * 2. OpenAI-compatible Embedding API -> 768-dim
 * 3. Local Deterministic Feature Embedder -> 768-dim (guarantees local offline fallback)
 */

export class EmbeddingRouter {
  public static VECTOR_DIMENSION = 768;

  public static async generateEmbedding(text: string): Promise<{ embedding: number[]; providerUsed: string }> {
    const sanitizedText = text.replace(/\n/g, ' ').trim();
    if (!sanitizedText) {
      return { embedding: new Array(this.VECTOR_DIMENSION).fill(0), providerUsed: 'zero-fill' };
    }

    // Tier 1: Gemini Embeddings API
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: sanitizedText }] }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const values = data.embedding?.values;
          if (Array.isArray(values) && values.length > 0) {
            return { embedding: this.padOrTruncate(values, this.VECTOR_DIMENSION), providerUsed: 'gemini-embedding-004' };
          }
        }
      } catch (err) {
        console.warn('Gemini embedding failed, falling back to next tier...', err);
      }
    }

    // Tier 2: OpenAI-Compatible Embedding API
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (openaiKey) {
      try {
        const endpoint = process.env.OPENAI_API_KEY 
          ? 'https://api.openai.com/v1/embeddings'
          : 'https://openrouter.ai/api/v1/embeddings';
          
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: sanitizedText,
            model: 'text-embedding-3-small',
            dimensions: 768
          })
        });

        if (res.ok) {
          const data = await res.json();
          const values = data.data?.[0]?.embedding;
          if (Array.isArray(values) && values.length > 0) {
            return { embedding: this.padOrTruncate(values, this.VECTOR_DIMENSION), providerUsed: 'openai-compatible' };
          }
        }
      } catch (err) {
        console.warn('OpenAI embedding failed, falling back to local embedder...', err);
      }
    }

    // Tier 3: Local Deterministic Embedder Fallback (Ensures complete reliability and local indexing without failing)
    const localVec = this.generateLocalDeterministicEmbedding(sanitizedText, this.VECTOR_DIMENSION);
    return { embedding: localVec, providerUsed: 'local-deterministic-fallback' };
  }

  private static padOrTruncate(arr: number[], targetDim: number): number[] {
    if (arr.length === targetDim) return arr;
    if (arr.length > targetDim) return arr.slice(0, targetDim);
    const padded = [...arr];
    while (padded.length < targetDim) padded.push(0);
    return padded;
  }

  /**
   * Deterministic Hashing + N-Gram Feature Frequency Vector Normalizer
   * Creates a normalized unit vector in R^768 representing text semantic features.
   */
  private static generateLocalDeterministicEmbedding(text: string, dim: number): number[] {
    const vector = new Array(dim).fill(0);
    const words = text.toLowerCase().match(/\w+/g) || [];

    // Hash word unigrams and bigrams into vector space
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash1 = this.fnv1aHash(word) % dim;
      const sign1 = (this.fnv1aHash(word + '_sign') % 2 === 0) ? 1 : -1;
      vector[hash1] += sign1 * 1.0;

      if (i < words.length - 1) {
        const bigram = `${word}_${words[i + 1]}`;
        const hash2 = this.fnv1aHash(bigram) % dim;
        const sign2 = (this.fnv1aHash(bigram + '_sign') % 2 === 0) ? 1 : -1;
        vector[hash2] += sign2 * 0.5;
      }
    }

    // Cosine Unit Vector Normalization (L2 norm)
    let normSq = 0;
    for (let i = 0; i < dim; i++) {
      normSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(normSq);

    if (norm === 0) {
      return new Array(dim).fill(0);
    }

    return vector.map(val => Number((val / norm).toFixed(6)));
  }

  private static fnv1aHash(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return Math.abs(hash >>> 0);
  }
}
