# Technical Support & Troubleshooting FAQ

## 1. Frequently Asked Technical Questions

### Q1: How does the Smart AI Router handle HTTP 429 Rate Limits?
When Groq, Gemini, or OpenRouter models encounter an HTTP 429 (Rate Limit / Quota Exceeded) status code:
1. The Smart Router puts that specific model on a 60-second cooldown status.
2. It instantly switches to the next operational model within the provider chain (e.g. `llama-3.3-70b` ➔ `llama-4-scout` ➔ `qwen3-32b`).
3. If all models of a provider are rate-limited, it fails over to the next provider in the chain (Groq ➔ Gemini ➔ OpenRouter).

### Q2: Why are some user queries categorized as "conversational" instead of searching vector documents?
General greetings (e.g., "Hello", "How are you?", "Who created you?") do not require vector database lookup. The assistant detects conversational intent and answers directly via the Smart Router to eliminate latency and save database search calls.

### Q3: What document file formats and maximum sizes are supported?
- Supported formats: `.pdf`, `.docx`, `.txt`, `.md`.
- Maximum file size per upload: 25 MB per document.
- Maximum recommended text chunks per document: 500 chunks.

### Q4: How do I configure my environment API keys in `.env.local`?
Add the following keys to your project root `.env.local` file:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 2. Common Troubleshooting Steps

### Error: "Missing or placeholder API key for provider"
- **Cause**: The API key in `.env.local` is empty, contains default placeholders, or has not been loaded.
- **Solution**: Update `.env.local` with your actual API key and restart your Next.js development server (`npm run dev`).

### Error: "Supabase match_documents RPC error"
- **Cause**: Supabase pgvector extension is not enabled, or `match_documents` function was not registered.
- **Solution**: The application automatically fails over to the high-speed local memory vector store, ensuring continuous search functionality without crash.
