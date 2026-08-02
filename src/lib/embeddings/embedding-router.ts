/**
 * Multi-Tier Embedding Router (Groq & OpenRouter Support)
 * 
 * Priority:
 * 1. Groq Cloud Embeddings API (using GROQ_API_KEY) -> 768-dim
 * 2. OpenRouter Embeddings API (using OPENROUTER_API_KEY) -> 768-dim
 * 3. Gemini / OpenAI Embeddings API -> 768-dim
 * 4. Local Deterministic Feature Embedder -> 768-dim (instant zero-latency fallback)
 */

export class EmbeddingRouter {
  public static VECTOR_DIMENSION = 768;

  public static async generateEmbedding(text: string): Promise<{ embedding: number[]; providerUsed: string }> {
    const sanitizedText = text.replace(/\n/g, ' ').trim();
    if (!sanitizedText) {
      return { embedding: new Array(this.VECTOR_DIMENSION).fill(0), providerUsed: 'zero-fill' };
    }

    // Tier 1: Groq Cloud Embeddings API
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.startsWith('gsk_')) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(2000),
          body: JSON.stringify({
            input: sanitizedText,
            model: 'bge-large-en-v1.5',
            dimensions: this.VECTOR_DIMENSION,
          })
        });

        if (res.ok) {
          const data = await res.json();
          const values = data.data?.[0]?.embedding;
          if (Array.isArray(values) && values.length > 0) {
            return { embedding: this.padOrTruncate(values, this.VECTOR_DIMENSION), providerUsed: 'groq-embedding-bge' };
          }
        }
      } catch {
        /* fallback to next tier */
      }
    }

    // Tier 2: OpenRouter Embeddings API
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey && openrouterKey.startsWith('sk-or-')) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://antigravity.ai',
            'X-Title': 'RAG Customer Support Assistant',
          },
          signal: AbortSignal.timeout(2000),
          body: JSON.stringify({
            input: sanitizedText,
            model: 'openai/text-embedding-3-small',
            dimensions: this.VECTOR_DIMENSION,
          })
        });

        if (res.ok) {
          const data = await res.json();
          const values = data.data?.[0]?.embedding;
          if (Array.isArray(values) && values.length > 0) {
            return { embedding: this.padOrTruncate(values, this.VECTOR_DIMENSION), providerUsed: 'openrouter-embedding' };
          }
        }
      } catch {
        /* fallback to next tier */
      }
    }

    // Tier 3: Gemini Embeddings API
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey && geminiKey.startsWith('AIzaSy')) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(2000),
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
      } catch {
        /* fallback to local embedder */
      }
    }

    // Tier 4: Local Deterministic Embedder (Sub-1ms zero-latency feature vector generator)
    const localVec = this.generateLocalDeterministicEmbedding(sanitizedText, this.VECTOR_DIMENSION);
    return { embedding: localVec, providerUsed: 'local-deterministic-embedder' };
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
