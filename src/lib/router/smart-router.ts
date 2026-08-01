import { LLMProviderId, ProviderHealth, RouterStrategy, RouterTelemetry } from '@/types/rag';

export interface RouteResult {
  provider: LLMProviderId;
  providerName: string;
  model: string;
  isFallback: boolean;
  attemptedProviders: LLMProviderId[];
}

/**
 * Model fallback chains per provider (latest available as of 2026).
 * When one model hits a rate limit (429) or error, the next model in the chain is tried.
 */
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
  'llama-3.1-8b-instant',
];

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

const OPENROUTER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-32b:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'openrouter/auto',
];

class SmartAIRouter {
  private strategy: RouterStrategy = 'smart';
  private roundRobinIndex = 0;
  private telemetryLogs: RouterTelemetry[] = [];
  
  private providers: Record<LLMProviderId, ProviderHealth> = {
    groq: {
      id: 'groq',
      name: 'Groq (Llama 3.3 70B)',
      model: GROQ_MODELS[0],
      isHealthy: true,
      active: true,
      consecutiveErrors: 0,
      avgLatencyMs: 240,
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitHits: 0,
      estimatedCostPer1k: 0.0007,
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini 2.5 Flash',
      model: GEMINI_MODELS[0],
      isHealthy: true,
      active: true,
      consecutiveErrors: 0,
      avgLatencyMs: 410,
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitHits: 0,
      estimatedCostPer1k: 0.0001,
    },
    openrouter: {
      id: 'openrouter',
      name: 'OpenRouter (Multi-Model Free)',
      model: OPENROUTER_MODELS[0],
      isHealthy: true,
      active: true,
      consecutiveErrors: 0,
      avgLatencyMs: 650,
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitHits: 0,
      estimatedCostPer1k: 0.0000,
    },
  };

  public setStrategy(strategy: RouterStrategy) {
    this.strategy = strategy;
  }

  public getStrategy(): RouterStrategy {
    return this.strategy;
  }

  public getProviderStates(): ProviderHealth[] {
    const now = new Date();
    return Object.values(this.providers).map(p => {
      const inCooldown = p.cooldownUntil && new Date(p.cooldownUntil) > now;
      return {
        ...p,
        isHealthy: !inCooldown && p.consecutiveErrors < 3 && p.active,
      };
    });
  }

  public toggleProviderActive(providerId: LLMProviderId, active: boolean) {
    if (this.providers[providerId]) {
      this.providers[providerId].active = active;
    }
  }

  public selectRouteSequence(): RouteResult {
    const now = new Date();
    const activeProviders = Object.values(this.providers).filter(p => {
      const inCooldown = p.cooldownUntil && new Date(p.cooldownUntil) > now;
      return p.active && !inCooldown && p.consecutiveErrors < 3;
    });

    const candidates = activeProviders.length > 0 ? activeProviders : Object.values(this.providers).filter(p => p.active);
    
    let primaryProvider: ProviderHealth;

    if (this.strategy === 'round-robin') {
      primaryProvider = candidates[this.roundRobinIndex % candidates.length];
      this.roundRobinIndex = (this.roundRobinIndex + 1) % candidates.length;
    } else if (this.strategy === 'priority-fallback') {
      primaryProvider = candidates[0] || this.providers.groq;
    } else {
      const scored = [...candidates].sort((a, b) => {
        const scoreA = (a.avgLatencyMs * 0.6) + (a.estimatedCostPer1k * 1000 * 0.4) - (a.successfulRequests > 0 ? 50 : 0);
        const scoreB = (b.avgLatencyMs * 0.6) + (b.estimatedCostPer1k * 1000 * 0.4) - (b.successfulRequests > 0 ? 50 : 0);
        return scoreA - scoreB;
      });
      primaryProvider = scored[0] || this.providers.groq;
    }

    const sequence = [primaryProvider.id, ...Object.keys(this.providers).filter(id => id !== primaryProvider.id) as LLMProviderId[]];

    return {
      provider: primaryProvider.id,
      providerName: primaryProvider.name,
      model: primaryProvider.model,
      isFallback: false,
      attemptedProviders: sequence,
    };
  }

  public async executeWithFailover(
    systemPrompt: string,
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ text: string; telemetry: RouterTelemetry & { providerName: string; modelUsed: string } }> {
    const sequence = this.selectRouteSequence().attemptedProviders;
    const attempted: LLMProviderId[] = [];
    const errorsList: Array<{ provider: string; error: string }> = [];

    for (let i = 0; i < sequence.length; i++) {
      const providerId = sequence[i];
      const provider = this.providers[providerId];
      if (!provider || !provider.active) continue;

      attempted.push(providerId);
      const isFallback = i > 0;
      const startTime = Date.now();

      try {
        const { text: responseText, model: modelUsed } = await this.callProviderApi(providerId, systemPrompt, userPrompt, onChunk);
        const latency = Date.now() - startTime;

        this.recordSuccess(providerId, latency);
        
        // Update the provider's display model to whichever model actually worked
        provider.model = modelUsed;
        
        const telemetryItem: RouterTelemetry & { providerName: string; modelUsed: string } = {
          provider: providerId,
          providerName: provider.name,
          modelUsed,
          model: modelUsed,
          latencyMs: latency,
          success: true,
          statusCode: 200,
          isFallback,
          timestamp: new Date().toISOString(),
        };

        this.telemetryLogs.unshift(telemetryItem);
        if (this.telemetryLogs.length > 200) this.telemetryLogs.pop();

        return { text: responseText, telemetry: telemetryItem };
      } catch (err: any) {
        const latency = Date.now() - startTime;
        const statusCode = err.status || err.statusCode || (err.message?.includes('429') ? 429 : 500);

        console.warn(`[SmartRouter] ${providerId.toUpperCase()} call failed (${statusCode}):`, err.message || err);
        errorsList.push({ provider: providerId, error: err.message || 'API failed' });

        if (statusCode === 429) {
          this.recordRateLimit(providerId);
        } else {
          this.recordError(providerId);
        }

        this.telemetryLogs.unshift({
          provider: providerId,
          model: provider.model,
          latencyMs: latency,
          success: false,
          statusCode,
          isFallback,
          error: err.message || 'API request failed',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // High availability fallback response detailing exact provider error reasons
    const simulatedResponse = this.generateFallbackResponse(userPrompt, systemPrompt, errorsList);
    return {
      text: simulatedResponse,
      telemetry: {
        provider: 'groq',
        providerName: 'Smart AI Router (API Key Diagnostic)',
        modelUsed: GROQ_MODELS[0],
        model: GROQ_MODELS[0],
        latencyMs: 120,
        success: true,
        statusCode: 200,
        isFallback: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Call provider API with intra-provider multi-model fallback.
   * Each provider tries its full model chain before throwing.
   */
  private async callProviderApi(
    providerId: LLMProviderId,
    systemPrompt: string,
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ text: string; model: string }> {
    const apiKeyMap = {
      groq: process.env.GROQ_API_KEY,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };

    const rawKey = apiKeyMap[providerId];
    if (!rawKey || rawKey.includes('your_') || rawKey.includes('placeholder')) {
      throw new Error(`Missing or placeholder API key for ${providerId}`);
    }

    const apiKey = rawKey.trim();

    if (providerId === 'groq') {
      return this.callGroqApi(apiKey, systemPrompt, userPrompt, onChunk);
    }

    if (providerId === 'gemini') {
      return this.callGeminiApi(apiKey, systemPrompt, userPrompt, onChunk);
    }

    if (providerId === 'openrouter') {
      return this.callOpenRouterApi(apiKey, systemPrompt, userPrompt, onChunk);
    }

    throw new Error(`Unsupported provider ${providerId}`);
  }

  /**
   * Groq API — multi-model fallback chain
   */
  private async callGroqApi(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ text: string; model: string }> {
    let lastError: any = null;

    for (const model of GROQ_MODELS) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1500,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || '';
          if (content) {
            if (onChunk) onChunk(content);
            return { text: content, model };
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          const msg = errorData.error?.message || `Groq (${model}) HTTP ${res.status}`;
          lastError = { status: res.status, message: msg };
          
          // If not a rate limit error, this model is genuinely broken — try next
          if (res.status !== 429) {
            console.warn(`[Groq] Model ${model} returned ${res.status}: ${msg}`);
          } else {
            console.warn(`[Groq] Model ${model} rate limited (429), trying next model...`);
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Groq] Model ${model} network error:`, err.message);
      }
    }

    throw lastError || new Error('Groq API call failed across all models');
  }

  /**
   * Gemini API — multi-model fallback chain
   */
  private async callGeminiApi(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ text: string; model: string }> {
    let lastError: any = null;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question:\n${userPrompt}` }]
              }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (content) {
            if (onChunk) onChunk(content);
            return { text: content, model };
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          lastError = { status: res.status, message: errorData.error?.message || `Gemini (${model}) HTTP ${res.status}` };
          
          if (res.status === 429) {
            console.warn(`[Gemini] Model ${model} rate limited (429), trying next model...`);
          } else {
            console.warn(`[Gemini] Model ${model} returned ${res.status}: ${lastError.message}`);
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Model ${model} network error:`, err.message);
      }
    }

    throw lastError || new Error('Gemini API call failed across all models');
  }

  /**
   * OpenRouter API — multi-model fallback chain (free-tier models)
   */
  private async callOpenRouterApi(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ text: string; model: string }> {
    let lastError: any = null;

    for (const model of OPENROUTER_MODELS) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Smart RAG Router',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1500,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || '';
          if (content) {
            if (onChunk) onChunk(content);
            return { text: content, model };
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          lastError = { status: res.status, message: errorData.error?.message || `OpenRouter (${model}) HTTP ${res.status}` };
          
          if (res.status === 429) {
            console.warn(`[OpenRouter] Model ${model} rate limited (429), trying next model...`);
          } else {
            console.warn(`[OpenRouter] Model ${model} returned ${res.status}: ${lastError.message}`);
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[OpenRouter] Model ${model} network error:`, err.message);
      }
    }

    throw lastError || new Error('OpenRouter API call failed across all models');
  }

  private recordSuccess(providerId: LLMProviderId, latencyMs: number) {
    const p = this.providers[providerId];
    if (p) {
      p.totalRequests += 1;
      p.successfulRequests += 1;
      p.consecutiveErrors = 0;
      p.avgLatencyMs = Math.round((p.avgLatencyMs * 0.7) + (latencyMs * 0.3));
      p.lastUsedAt = new Date().toISOString();
    }
  }

  private recordRateLimit(providerId: LLMProviderId) {
    const p = this.providers[providerId];
    if (p) {
      p.totalRequests += 1;
      p.rateLimitHits += 1;
      p.consecutiveErrors += 1;
      const cooldownDate = new Date(Date.now() + 60 * 1000);
      p.cooldownUntil = cooldownDate.toISOString();
    }
  }

  private recordError(providerId: LLMProviderId) {
    const p = this.providers[providerId];
    if (p) {
      p.totalRequests += 1;
      p.consecutiveErrors += 1;
    }
  }

  public getTelemetryLogs(): RouterTelemetry[] {
    return this.telemetryLogs;
  }

  private generateFallbackResponse(
    userPrompt: string,
    systemPrompt: string,
    errors: Array<{ provider: string; error: string }>
  ): string {
    const contextMatch = systemPrompt.match(/Context Documents:\n([\s\S]*?)\n\nInstructions/);
    const context = contextMatch ? contextMatch[1] : '';

    let errorDetails = errors.map(e => `• **${e.provider.toUpperCase()}**: ${e.error}`).join('\n');
    if (!errorDetails) errorDetails = '• All API keys are missing or invalid in `.env.local`';

    if (context && context.trim().length > 10) {
      return `**Retrieved Knowledge Base Context:**\n\n${context.slice(0, 450)}...\n\n---\n⚠️ **Provider Diagnostic Notice**:\n${errorDetails}\n\n*Check your API key in \`.env.local\` to activate live streaming from Groq, Gemini, or OpenRouter.*`;
    }

    return `I received your query: "${userPrompt}".

⚠️ **Smart Router API Key Diagnostic**:
${errorDetails}

**How to Fix**:
1. Check your API key in \`.env.local\` (e.g. \`GROQ_API_KEY\`, \`GEMINI_API_KEY\`, or \`OPENROUTER_API_KEY\`).
2. Restart your dev server (\`npm run dev\`) or update setting keys.
3. Live streaming from Groq, Gemini 2.5/2.0 Flash, and OpenRouter free models will be active!`;
  }
}

export const smartRouter = new SmartAIRouter();
