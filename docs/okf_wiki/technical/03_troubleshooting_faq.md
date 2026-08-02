---
title: "Technical Support, Troubleshooting & Frequently Asked Questions (FAQ)"
doc_id: "okf-cs-tech-03"
category: "technical"
version: "3.0"
updated_at: "2026-08-02"
tags: ["faq", "troubleshooting", "rate-limit", "429-failover", "api-keys", "smart-router", "embedding", "pgvector"]
entities: ["Smart Router", "Groq Cloud Engine", "Google Gemini Engine", "OpenRouter Engine", "Embedding Router", "pgvector"]
schema_version: "okf-v1.0"
---

# Technical Support, Troubleshooting & Frequently Asked Questions (FAQ)

## 📖 Executive Summary

This document provides step-by-step troubleshooting guidance for the Antigravity RAG platform, covering Smart AI Router failover behavior, LLM provider rate limiting, embedding pipeline issues, document ingestion errors, and vector database (pgvector) performance tuning.

---

## 💡 Smart Router & LLM Provider Troubleshooting

### Q1: Why am I getting "HTTP 429 Rate Limit" errors?

**Root Cause**: Your free-tier API quota for one or more LLM providers (Groq, Gemini, or OpenRouter) has been temporarily exhausted.

**How the System Handles It**:
1. The Smart Router automatically detects any `429` or `quota exceeded` response.
2. The rate-limited model is placed on a **2-hour cooldown** and removed from the active rotation.
3. The router immediately fails over to the next healthy provider in the priority chain:
   - **Priority 1**: Groq Cloud (Llama 3.3 70B — sub-300ms latency)
   - **Priority 2**: OpenRouter Free Tier (DeepSeek R1, Gemini Flash, Qwen, Mistral)
   - **Priority 3**: Google Gemini (2.0 Flash / Flash Lite)

**User Action Required**: None. The failover is fully automatic. If all 3 providers are exhausted simultaneously, the system returns a cached knowledge base response.

### Q2: How do I configure my API keys?

Add the following to your `.env` or `.env.local` file:

```env
# Groq Cloud (Free: 14,400 RPD / 100k TPM on Llama 3.3 70B)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Google Gemini (Free: 15 RPM on Flash models)
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here

# OpenRouter (Free tier models available with API key)
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
```

**Where to get free API keys**:
- **Groq**: https://console.groq.com/keys (instant approval, generous free tier)
- **Gemini**: https://aistudio.google.com/apikey (Google AI Studio)
- **OpenRouter**: https://openrouter.ai/keys (sign up, many free models)

### Q3: Why are responses slow (>3 seconds)?

**Possible Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Primary provider (Groq) rate limited → falling back to slower provider | Wait for cooldown to expire (2 hours), or add a second Groq key |
| Large document context (many chunks retrieved) | Reduce `match_count` in similarity search or upload fewer/smaller documents |
| Network latency to LLM provider | Check your internet connection; consider a VPN closer to the provider's region |
| Gemini free tier has 0 quota remaining | The router will skip Gemini automatically; no action needed |

### Q4: What LLM models are available on the free tier?

| Provider | Model | Free Tier Limit | Avg Latency |
|----------|-------|----------------|-------------|
| **Groq Cloud** | `llama-3.3-70b-versatile` | 14,400 req/day, 100k tokens/min | ~180ms |
| **Groq Cloud** | `llama-3.1-8b-instant` | 14,400 req/day, 100k tokens/min | ~120ms |
| **OpenRouter** | `deepseek/deepseek-r1-distill-llama-70b:free` | Rate limited (shared) | ~800ms |
| **OpenRouter** | `google/gemini-2.0-flash-exp:free` | Rate limited (shared) | ~600ms |
| **OpenRouter** | `meta-llama/llama-3.1-8b-instruct:free` | Rate limited (shared) | ~400ms |
| **Google Gemini** | `gemini-2.0-flash` | 15 RPM, 1M tokens/day | ~500ms |

---

## 📄 Document Ingestion & Processing FAQ

### Q5: What file types can I upload?

| Format | Max Size | Processing Engine |
|--------|----------|-------------------|
| **PDF** (`.pdf`) | 25 MB | `pdf-parse` library |
| **Word** (`.docx`) | 25 MB | `mammoth` library |
| **Plain Text** (`.txt`) | 10 MB | Direct UTF-8 read |
| **Markdown** (`.md`) | 10 MB | Direct UTF-8 read with YAML frontmatter parsing |

### Q6: How are documents chunked for RAG retrieval?

Documents are processed through a **Recursive Character Text Splitter**:
- **Chunk Size**: 800 characters
- **Chunk Overlap**: 150 characters (ensures context continuity across chunk boundaries)
- **Separator Hierarchy**: Splits on `\n\n` (paragraphs) → `\n` (lines) → `. ` (sentences) → ` ` (words)

### Q7: My uploaded document shows 0 chunks. What happened?

**Possible Causes**:
1. **Empty or corrupt file**: The file contains no extractable text (e.g., scanned image PDF without OCR).
2. **Encoding issue**: File uses a non-UTF-8 encoding. Re-save as UTF-8.
3. **Embedding failure**: All embedding providers failed. Check API keys in Settings.

**Fix**: Re-upload the document. If the issue persists, contact `support@antigravity.ai` with the file attached.

---

## 🗄️ Vector Database (pgvector) FAQ

### Q8: How does similarity search work?

Antigravity uses **pgvector** with **cosine distance** (`<=>` operator) for vector similarity search:
1. User's question is converted to a 768-dimensional embedding vector.
2. The `match_documents` PostgreSQL RPC function compares this vector against all stored document chunk embeddings.
3. Top 5 most similar chunks (above the similarity threshold) are retrieved and passed as context to the LLM.

### Q9: Can I self-host the database?

Yes. You need:
1. **PostgreSQL 15+** with the `pgvector` extension installed.
2. Run the `scripts/db-setup.mjs` script to create all required tables, indexes, and RPC functions.
3. Set `DATABASE_URL` in your `.env` file to point to your self-hosted instance.

---

## 🔗 Cross-References & Related Wiki Documents

- [Master Wiki Index](../INDEX.md)
- [Customer Support SLA & Escalation Policy](../customer_support/01_sla_and_escalation.md)
- [Subscription Billing & Refund Policy](../billing/02_refund_and_subscription.md)
- [Product Return & Warranty Guidelines](../returns/04_warranty_and_rma.md)
