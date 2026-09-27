# 🚀  Enterprise AI-Powered RAG Knowledge Platform

<div align="center">

**Production-grade Retrieval-Augmented Generation (RAG) platform with Smart Multi-LLM Router, Open Knowledge Format (OKF) Wiki Engine, and real-time Admin Analytics.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-316192?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 📸 Application Showcase & User Flow

<table>
  <tr>
    <td align="center"><strong>🏠 1. Landing Page & Hero Section</strong></td>
    <td align="center"><strong>💬 2. Interactive AI Chat & Source Citations</strong></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/01_landing_page.png" alt="Landing Page" width="450"/></td>
    <td><img src="docs/screenshots/02_chat_interface.png" alt="Chat Interface" width="450"/></td>
  </tr>
  <tr>
    <td align="center"><strong>📚 3. Document Repository & OKF Ingestion</strong></td>
    <td align="center"><strong>📊 4. Live Telemetry & Analytics Dashboard</strong></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/03_knowledge_base.png" alt="Knowledge Base" width="450"/></td>
    <td><img src="docs/screenshots/04_admin_analytics.png" alt="Admin Analytics" width="450"/></td>
  </tr>
  <tr>
    <td align="center" colspan="2"><strong>⚙️ 5. Multi-LLM Router Configuration & System Settings</strong></td>
  </tr>
  <tr>
    <td align="center" colspan="2"><img src="docs/screenshots/05_settings_page.png" alt="System Settings" width="600"/></td>
  </tr>
</table>

> 💡 **Regenerate Screenshots**: Run `node scripts/take-screenshots.mjs` with the server running on `http://localhost:3000`.

---

## 🌟 Key Features

### 🤖 Smart AI Multi-LLM Router
- **3 Free-Tier Providers**: Dynamic load balancer routing queries across **Groq Cloud** (Llama 3.3 70B, sub-300ms latency), **OpenRouter** (DeepSeek R1, Gemini Flash, Qwen 2.5 Coder, Mistral), and **Google Gemini** (2.0 Flash).
- **Automatic 429 Failover**: When any provider hits rate limits or quota caps, the router applies a **2-hour cooldown** and instantly switches to the next healthy provider.
- **Multiple Routing Strategies**: Smart Mode (latency + health optimized), Round-Robin, and Priority Fallback.
- **Strict 2.5-Second Timeout**: `AbortSignal.timeout(2500)` per API fetch prevents network hangs and guarantees overall response delivery under 2–3 seconds.

### 📚 Open Knowledge Format (OKF) Wiki Engine
- **Structured Knowledge Base**: Standardized Markdown documents enriched with YAML frontmatter (title, category, tags, entities, cross-references).
- **Executive Summary Formatting**: AI answers are automatically synthesized into 3 Wiki sections:
  1. `### 📖 Executive Summary & Overview` (Direct concise answer)
  2. `### 💡 Core Specifications & Key Policy Rules` (Structured bullet points, SLAs, pricing)
  3. `### 🛠️ Actionable Next Steps` (Clear user resolution steps)
- **Entity Cross-Referencing**: Automatic extraction of entities and wiki links (`[DocTitle](./relative_path.md)`).

### 🔍 Multi-Tier Embedding Router
- **Priority 1**: Groq Cloud Embeddings
- **Priority 2**: Google Gemini Embeddings (`text-embedding-004` — 768 dimensions)
- **Priority 3**: Local Deterministic Unit-Vector Embedder (100% offline fallback ensuring the ingestion pipeline never crashes)

### 🗄️ Supabase PostgreSQL + pgvector
- **Cosine Similarity Search**: HNSW-indexed vector search utilizing the `<=>` cosine distance operator.
- **`match_documents` RPC**: High-performance PostgreSQL stored procedure for sub-50ms vector queries.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js 18+** (recommended: Node.js 20 or 22)
- Free [Supabase](https://supabase.com) account (PostgreSQL + pgvector)
- Free API Keys: [Groq Cloud](https://console.groq.com), [OpenRouter](https://openrouter.ai), or [Google AI Studio](https://aistudio.google.com)

### 1. Installation

```bash
git clone https://github.com/your-username/rag_qa.git
cd rag_qa
npm install
```

### 2. Configure Environment Variables

Create `.env` in the root directory:

```env
# ── Database (Supabase PostgreSQL + pgvector) ──
DATABASE_URL=postgresql://postgres.xxxx:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# ── Admin Credentials ──
ADMIN_EMAIL=admin@email.com
ADMIN_PASSWORD=admin123

# ── LLM Provider API Keys (Free Tier) ──
GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=AIzaSy_your_gemini_key
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
```

### 3. Initialize Database & Seed Admin

```bash
# Run database schema migration (creates pgvector extension, tables, RPC functions)
npm run db:setup

# Seed admin account
npm run seed:admin
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📥 Admin Panel Document Upload Guide (OKF vs RAG Formats)

To manage documents, sign in as Admin (`admin@email.com` / `admin123`), click **Admin** in the header, and open the **Documents** tab.

```
                  ┌──────────────────────────────────────────────────┐
                  │                 Admin Panel                      │
                  │ [ Documents ]   [ Analytics ]   [ Settings ]    │
                  └────────────────────────┬─────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
        📁 Standard RAG Mode                           📖 OKF Wiki Mode
  (PDF, DOCX, TXT - Unstructured)             (Markdown + YAML Frontmatter)
  - Recursive 800-char chunking               - Metadata & entity extraction
  - 150-char overlap                           - Structural header chunking
  - 768d vector embedding                      - Executive Summary synthesis
  - Cosine similarity search                   - Direct wiki cross-linking
```

### Standard RAG Format Ingestion
1. In the Document Manager header, select **Standard RAG Mode**.
2. **Supported Extensions**: `.pdf`, `.docx`, `.txt`.
3. **Ingestion Process**:
   - Text is parsed using `pdf-parse` or `mammoth`.
   - The file is split into **800-character overlapping chunks** (150-char overlap).
   - Each chunk is embedded into a **768-dimensional vector** via the Embedding Router.
   - Embeddings and metadata are inserted into Supabase PostgreSQL `document_chunks`.

### Open Knowledge Format (OKF) Ingestion
1. Select **OKF / LLM Wiki Ingestion** mode.
2. **Supported Extensions**: `.md` (Markdown files containing YAML frontmatter).
3. **Batch Folder Upload**: Click **Upload OKF Folder** to select an entire folder tree containing an `INDEX.md` file and subdirectories.
4. **Ingestion Process**:
   - Frontmatter is parsed to extract metadata (`title`, `doc_id`, `category`, `tags`, `entities`).
   - The document body is split by Markdown headers (`###`).
   - The Wiki Engine indexes cross-references to enable direct wiki citations in AI responses.

---

## ✍️ How to Write Custom Open Knowledge Format (OKF) Files

The **Open Knowledge Format (OKF)** is a structured document standard designed specifically for RAG and LLM Wiki architectures. It combines standard Markdown with a mandatory YAML frontmatter block.

### 📂 OKF Folder Structure

When creating a custom OKF Knowledge Base, organize your markdown files into a clean directory tree rooted by a master `INDEX.md` file:

```
my_custom_okf_wiki/
├── INDEX.md                                    # Master Knowledge Base Index (REQUIRED)
├── customer_support/
│   └── 01_sla_and_escalation.md                # SLAs, response times & escalation policy
├── billing/
│   └── 02_refund_and_subscription.md           # Subscription plans, refunds & compliance
├── technical/
│   └── 03_troubleshooting_faq.md               # Rate limits, router failover & API keys
├── returns/
│   └── 04_warranty_and_rma.md                  # Hardware warranty & RMA procedures
├── security/
│   └── 05_account_security_and_privacy.md      # Authentication, 2FA, RBAC & encryption
└── products/
    └── 06_products_and_services.md             # Platform catalog & professional services
```

---

### 📄 Master `INDEX.md` File Template

Every OKF folder must contain a master `INDEX.md` file at the root. The `INDEX.md` serves as the primary map for the RAG engine to discover entity cross-references and document relationships.

```markdown
---
title: "Open Knowledge Base — Master Wiki Index"
doc_id: "okf-index-master"
category: "master_index"
version: "1.0"
updated_at: "2026-08-02"
tags: ["index", "master-wiki", "customer-support", "okf-schema", "knowledge-base"]
entities: ["Support Team", "Billing Team", "Engineering Team", "Security Team", "Logistics Team"]
schema_version: "okf-v1.0"
---

# 📚 Open Knowledge Base — Master Wiki Index

## 📖 Executive Summary
Master directory and category index for our Enterprise Customer Support Open Knowledge Format (OKF) Wiki. This index powers the AI Chat Assistant with structured, source-cited responses across customer support, billing, technical troubleshooting, product returns, account security, and product documentation.

---

## 📂 Wiki Directory Structure & Category Map

```
docs/okf_wiki/
├── INDEX.md                                    (Master Knowledge Base Index)
├── customer_support/
│   └── 01_sla_and_escalation.md                (SLA, Response Times & Escalation Matrix)
├── billing/
│   └── 02_refund_and_subscription.md           (30-Day Guarantee, Plans, GDPR & Compliance)
├── technical/
│   └── 03_troubleshooting_faq.md               (HTTP 429 Failover, Router & Technical FAQ)
├── returns/
│   └── 04_warranty_and_rma.md                  (Hardware Warranty, Return Windows & RMA Process)
├── security/
│   └── 05_account_security_and_privacy.md      (Auth, 2FA, Encryption & Access Control)
└── products/
    └── 06_products_and_services.md             (Platform Features, Services & Contact Info)
```

---

## 💡 Wiki Documents & Entity Cross-References

### 1. Customer Support & SLAs
- 📄 [01_sla_and_escalation.md](customer_support/01_sla_and_escalation.md)
  - **Entities**: Tier 1 Support Specialist, Tier 2 Support Engineer, Tier 3 AI Architect
  - **Topics**: P1–P4 Response Times, 99.95% Uptime SLA, Escalation Matrix, PIR Process

### 2. Billing & Subscription Policies
- 📄 [02_refund_and_subscription.md](billing/02_refund_and_subscription.md)
  - **Entities**: Billing Team, Compliance Officer, Account Manager
  - **Topics**: 30-Day Refund Guarantee, Pricing Tiers, GDPR/SOC2 Compliance, Data Erasure

### 3. Technical Support & FAQ
- 📄 [03_troubleshooting_faq.md](technical/03_troubleshooting_faq.md)
  - **Entities**: Smart Router, Groq Engine, Gemini Engine, OpenRouter Engine
  - **Topics**: HTTP 429 Failover, API Keys, Model Latency, Document Ingestion, pgvector

### 4. Warranty & Returns
- 📄 [04_warranty_and_rma.md](returns/04_warranty_and_rma.md)
  - **Entities**: RMA Department, Logistics Coordinator, QA Inspection Team
  - **Topics**: 30-Day Returns, 1-Year Limited Warranty, RMA Process, Shipping Regions

### 5. Account Security & Privacy
- 📄 [05_account_security_and_privacy.md](security/05_account_security_and_privacy.md)
  - **Entities**: Security Operations Team, Data Protection Officer, IAM Team
  - **Topics**: AES-256 Encryption, TLS 1.3, 2FA/TOTP, SSO/SAML, RBAC Roles, Audit Logs

### 6. Products & Services Catalog
- 📄 [06_products_and_services.md](products/06_products_and_services.md)
  - **Entities**: Product Team, Engineering Team, Customer Success Manager
  - **Topics**: RAG Engine, Smart Router, Chat Assistant, Admin Dashboard, Contact Directory
```

---

### Custom OKF Examples for Real-World Use Cases

<details>
<summary><strong>Example 1: E-Commerce Return & Replacement Policy</strong></summary>

```markdown
---
title: "Custom E-Commerce Return & Hardware Replacement Policy"
doc_id: "okf-returns-custom-01"
category: "returns"
version: "2.0"
updated_at: "2026-08-02"
tags: ["return-policy", "hardware-warranty", "rma-process", "restocking-fee"]
entities: ["Returns Department", "QA Inspection Team", "Logistics Coordinator"]
schema_version: "okf-v1.0"
---

# Custom E-Commerce Return & Hardware Replacement Policy

## 📖 Executive Summary & Overview
Customers receive a **30-day money-back guarantee** on all unopened or defective hardware items. Returns initiated within 30 days of delivery receive 100% full refunds back to the original payment method.

## 💡 Core Specifications & Key Policy Rules
- **Unopened Items**: 100% refund within 30 days of delivery.
- **Defective Hardware**: Free replacement unit shipped via 2-Day Express at no extra charge.
- **Opened Non-Defective Items**: Subject to a 15% restocking fee.
- **Warranty Duration**: 1-year limited manufacturer warranty covering power supply and mainboard defects.

## 🛠️ Actionable Next Steps
1. Contact returns support at `returns@yourcompany.com` with your Order ID.
2. Receive a prepaid shipping label and RMA authorization number within 24 hours.
3. Drop off the packaged item at any FedEx location.

## 🔗 Cross-References & Related Wiki Documents
- [Master Wiki Index](../INDEX.md)
- [Customer Support SLA](../customer_support/01_sla_and_escalation.md)
```

</details>

<details>
<summary><strong>Example 2: SaaS Subscription Pricing & Billing Guide</strong></summary>

```markdown
---
title: "SaaS Subscription Pricing & Billing Policy"
doc_id: "okf-billing-saas-02"
category: "billing"
version: "3.0"
updated_at: "2026-08-02"
tags: ["billing", "pricing-tiers", "refund-policy", "gdpr", "cancellation"]
entities: ["Billing Team", "Compliance Director", "Account Manager"]
schema_version: "okf-v1.0"
---

# SaaS Subscription Pricing & Billing Policy

## 📖 Executive Summary & Overview
We offer 3 subscription tiers: Starter ($29/mo), Pro ($149/mo), and Enterprise Custom. All paid plans include a **30-day unconditional refund window** and comply with GDPR and SOC2 standards.

## 💡 Core Specifications & Key Policy Rules
- **Starter Plan ($29/mo)**: Up to 50 documents, 10,000 queries/month.
- **Pro Team Plan ($149/mo)**: Up to 500 documents, 100,000 queries/month, multi-LLM router access.
- **Enterprise Plan**: Unlimited documents, 99.95% SLA guarantee, dedicated model router.
- **Annual Discount**: 2 months free when billed annually (save 17%).

## 🛠️ Actionable Next Steps
1. Manage or upgrade your plan in **Admin Panel → Settings**.
2. For billing inquiries or refund requests, email `billing@yourcompany.com`.

## 🔗 Cross-References & Related Wiki Documents
- [Master Wiki Index](../INDEX.md)
- [Security & Privacy Policy](../security/05_account_security_and_privacy.md)
```

</details>

---

## 🔬 Deep Dive: How the RAG & OKF Engine Works

```
                                  USER QUERY
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    Embedding Generation       │
                      │ 768-dim Query Vector Creation │
                      └───────────────┬───────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │     pgvector Cosine Search    │
                      │ match_documents(threshold=0.05│
                      │             count=5)          │
                      └───────────────┬───────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    Context Assembly & Prompt  │
                      │ Mode Check: OKF vs Standard   │
                      └───────────────┬───────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    Smart Router Execution     │
                      │ Groq (180ms) -> OpenRouter -> │
                      │ Gemini (2.5s Timeout per Call)│
                      └───────────────┬───────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │  Citation & Telemetry Render  │
                      │ Source Badges + Latency Telem │
                      └───────────────────────────────┘
```

### RAG Retrieval Pipeline Comparison

| Component | Standard RAG Mode | OKF Wiki Engine Mode |
|-----------|-------------------|----------------------|
| **Input Format** | PDF, DOCX, TXT | Markdown (`.md`) with YAML frontmatter |
| **Chunking Strategy** | Fixed 800-char sliding window (150-char overlap) | Header-aware semantic splitting (`###` sections) |
| **Metadata Tracked** | `fileName`, `fileType`, `fileSize`, `userId` | `title`, `doc_id`, `category`, `tags`, `entities` |
| **System Prompt** | Direct QA assistant prompt | Chief Knowledge Architect OKF prompt |
| **Output Structure** | Free-form Markdown response | 3-Section Wiki Layout (Summary, Specs, Next Steps) |
| **Citations** | Source document name & snippet | Interactive Wiki Citation Pills & Cross-Links |

---

## 📋 Repository Structure

```
rag_qa/
├── docs/
│   ├── okf_wiki/                    # Open Knowledge Format Wiki Repository
│   │   ├── INDEX.md                 # Master Wiki Index
│   │   ├── customer_support/        # SLA & Escalation Policy
│   │   ├── billing/                 # Subscription & Refund Policy
│   │   ├── technical/               # Troubleshooting FAQ
│   │   ├── returns/                 # Warranty & RMA Guide
│   │   ├── security/               # Security & Privacy Policy
│   │   └── products/               # Product Catalog & Services
│   ├── rag_sample_word_docs/        # Sample DOCX files for testing
│   └── screenshots/                 # 5 High-resolution application screenshots
├── scripts/
│   ├── db-setup.mjs                 # Database schema setup script
│   ├── seed-admin.mjs               # Admin user seeder script
│   └── take-screenshots.mjs         # Puppeteer automated screenshot pipeline
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main application & tab switcher
│   │   └── api/
│   │       ├── chat/route.ts        # RAG Chat endpoint (OKF + Standard modes)
│   │       ├── documents/route.ts   # Document CRUD endpoint
│   │       ├── upload/route.ts      # Multi-format document parser & embedder
│   │       ├── analytics/route.ts   # Real-time analytics telemetry endpoint
│   │       └── settings/route.ts    # System settings endpoint
│   ├── components/
│   │   ├── chat/                    # Interactive chat components
│   │   ├── documents/               # Document manager & inspector
│   │   ├── admin/                   # Analytics dashboard & telemetry
│   │   └── settings/                # Smart Router config modal
│   └── lib/
│       ├── router/smart-router.ts   # Smart AI Multi-LLM Router
│       ├── embeddings/              # Multi-tier Embedding Router
│       ├── wiki/open-knowledge.ts   # OKF Wiki Engine
│       └── supabase/                # Supabase client & authentication
├── supabase/
│   └── schema.sql                   # Supabase PostgreSQL schema with pgvector
├── .env.example                     # Environment template
├── package.json
└── README.md
```

---

## 📄 License

MIT License. Developed for Production Enterprise RAG & Knowledge Systems.

<div align="center">

**Built with ❤️ by Antigravity Technologies**

[Master Wiki Index](docs/okf_wiki/INDEX.md) · [Customer Support SLA](docs/okf_wiki/customer_support/01_sla_and_escalation.md) · [Billing Policy](docs/okf_wiki/billing/02_refund_and_subscription.md)

</div>
