# Multi-Provider Smart RAG Application

A production-grade, highly available **Retrieval-Augmented Generation (RAG)** platform powered by **Next.js 15**, **Supabase PostgreSQL + pgvector**, a **Smart AI Multi-LLM Router** (Groq, Google Gemini, OpenRouter), multi-tier **Embedding Fallbacks**, and **Document Management** (PDF, DOCX, TXT).

---

## 🌟 Key Features

- **Smart AI Multi-LLM Router**:
  - **Dynamic Provider Selection**: Intelligently routes queries across **Groq (Llama 3.3 70B)**, **Google Gemini 2.0 Flash**, and **OpenRouter (DeepSeek R1 / Mistral)** based on health, latency, and cost.
  - **Automatic 429 Failover**: When an API returns a rate limit (429) or fails, the router triggers a 60-second cooldown and automatically falls back to the next available provider.
  - **Multiple Routing Modes**: Switch seamlessly between **Smart AI Mode** and **Round-Robin Mode**.
- **Multi-Tier Embedding Router**:
  - Priority 1: **Google Gemini Embeddings** (`text-embedding-004` - 768d).
  - Priority 2: **OpenAI-Compatible Embeddings** (`text-embedding-3-small` - 768d).
  - Priority 3: **Local Deterministic Unit Vector Embedder** (guarantees local offline fallback so indexing pipeline never breaks).
- **Supabase PostgreSQL + pgvector**:
  - Vector similarity search using cosine distance (`<=>`) with HNSW indexing and `match_documents` plpgsql RPC function.
- **Document Processing Pipeline**:
  - Parses `.pdf` (via `pdf-parse`), `.docx` (via `mammoth`), `.txt`, and `.md` files.
  - Overlapping Recursive Character Text Chunking (800 character window, 150 character overlap).
- **Modern AI SDK UI & Source Citations**:
  - Interactive streaming chat interface with source citation pills, telemetry badges (showing which LLM responded + latency in ms), suggested prompts, and vector chunk drawers.
- **Admin Analytics Dashboard**:
  - Real-time LLM provider health monitoring, average RAG latency, request distribution, and an unanswered query review queue.

---

## 🏗️ Architecture

```text
                    Next.js 15 Frontend (AI SDK UI)
                                  │
                                  ▼
                     Next.js API Route Handlers
                     /api/chat   /api/documents
                                  │
          ┌───────────────────────┴──────────────────────┐
          │                                              │
          ▼                                              ▼
   Smart AI LLM Router                           Document Pipeline
          │                                      (PDF, DOCX, TXT)
          ▼                                              │
  ┌──────────────┬───────────────┬─────────────┐         ▼
  │              │               │             │  Embedding Router
 Groq         Gemini        OpenRouter       │  (Gemini -> Local)
  │              │               │             │         │
  └──────────────┴───────┬───────┴─────────────┘         ▼
                         ▼                      Supabase PostgreSQL
                  Final Response                   + pgvector
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| ----- | ---------- |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Glassmorphism UI |
| **Backend** | Next.js App Router API Routes (`/api/...`) |
| **Database & Vectors** | Supabase PostgreSQL + `pgvector` extension |
| **LLM Router** | Groq, Gemini 2.0 Flash, OpenRouter (Round Robin + Smart Quota Router) |
| **Embeddings** | Gemini Embedding (`text-embedding-004`) + Local Deterministic Fallback |
| **Document Processing** | `pdf-parse`, `mammoth`, Recursive Text Chunker |

---

## 🚀 Step-by-Step Setup & How to Run

### Step 1: Clone & Install Dependencies

Ensure you have **Node.js 18+** installed.

```bash
# Install dependencies
npm install
```

---

### Step 2: Set Up Database (Supabase pgvector)

1. Go to your [Supabase Dashboard](https://database.new) and create a new PostgreSQL project.
2. In the Supabase dashboard, open the **SQL Editor**.
3. Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.

This script will:
- Enable the `vector` extension.
- Create the `documents`, `document_chunks`, and `analytics_logs` tables.
- Create the `match_documents` plpgsql function for similarity search.

---

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory (or copy `.env.example`):

```bash
cp .env.example .env.local
```

Add your credentials to `.env.local`:

```env
# Supabase PostgreSQL + pgvector
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# LLM Providers (Smart Router Multi-Provider Failover)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-v1-...

# OpenAI-Compatible Embedding Fallback (Optional)
OPENAI_API_KEY=sk-...
```

> **Note**: If API keys or Supabase credentials are missing, the application automatically uses an **in-memory vector fallback** and **simulated multi-provider responses**, so it works 100% out of the box for testing and demos!

---

### Step 4: Run the Development Server

Start the local server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 5: Production Build & Deployment

To verify and run an optimized production build:

```bash
# Build the production bundle
npm run build

# Start production server
npm run start
```

---

## 🧪 Testing & Verification Guide

1. **Upload Documents**:
   - Go to the **Knowledge Base** tab.
   - Drag & drop a `.pdf`, `.docx`, or `.txt` file.
   - Verify that the text is extracted, chunked, and vector embedded into Supabase `document_chunks`.

2. **Test RAG Chat**:
   - Switch to the **Chat Assistant** tab.
   - Ask a question related to your uploaded documents.
   - Click on the **Source Citation** badges to view the exact vector chunk content retrieved from `pgvector`.
   - Observe the **LLM Telemetry Badge** (showing provider used, e.g., `GROQ`, `GEMINI`, `OPENROUTER` and latency in ms).

3. **Test Router Auto-Failover**:
   - In the Chat view header, toggle between **⚡ Smart Router** and **🔄 Round Robin**.
   - If a provider hits a 429 rate limit or is missing an API key, notice how the router seamlessly fails over to the next operational provider without returning an error to the user.

4. **Review Admin Analytics**:
   - Go to the **Admin Analytics** tab.
   - View real-time provider health badges, average RAG latency, and unanswered question logs.

---

## 📄 License

MIT License. Developed for Advanced Agentic RAG Systems.
