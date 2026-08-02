---
title: "Antigravity Products, Platform Features & Service Catalog"
doc_id: "okf-cs-products-06"
category: "products"
version: "3.0"
updated_at: "2026-08-02"
tags: ["products", "features", "services", "platform", "rag", "ai-assistant", "knowledge-base"]
entities: ["Product Team", "Engineering Team", "Customer Success Manager", "Solutions Architect"]
schema_version: "okf-v1.0"
---

# Antigravity Products, Platform Features & Service Catalog

## 📖 Executive Summary

Antigravity Technologies offers an enterprise-grade **AI-Powered Knowledge Management & Customer Support Platform** built on Retrieval-Augmented Generation (RAG) technology. Our platform enables organizations to upload internal documents, automatically index them into a searchable vector knowledge base, and deploy an intelligent AI assistant that answers employee and customer queries with source-cited, factually grounded responses.

---

## 💡 Core Platform Products

### 1. Antigravity RAG Knowledge Engine

The core product — a production-grade RAG pipeline that transforms unstructured documents into an intelligent, searchable AI knowledge base.

**Key Capabilities**:
- **Multi-Format Document Ingestion**: Upload PDF, DOCX, TXT, and Markdown files up to 25 MB each
- **Automatic Text Chunking**: Recursive character text splitting (800-char chunks, 150-char overlap) for optimal retrieval
- **Vector Embedding & Indexing**: Documents are embedded into 768-dimensional vectors and stored in PostgreSQL with pgvector for blazing-fast cosine similarity search
- **Open Knowledge Format (OKF)**: Proprietary structured Markdown format with YAML frontmatter for enterprise wiki-style knowledge organization
- **Real-Time Similarity Search**: Sub-50ms vector similarity queries using HNSW indexing

### 2. Smart AI Multi-LLM Router

An intelligent, fault-tolerant LLM orchestration layer that routes queries across multiple AI providers for maximum uptime and minimum latency.

**Key Capabilities**:
- **3 LLM Providers**: Groq Cloud (Llama 3.3 70B), Google Gemini (2.0 Flash), OpenRouter (DeepSeek R1, Mistral, Qwen)
- **Automatic Failover**: If a provider returns HTTP 429 (rate limit) or fails, the router instantly switches to the next healthy provider
- **2-Hour Cooldown**: Rate-limited providers are automatically placed on a 2-hour cooldown
- **Sub-300ms Latency**: Groq Cloud primary provider delivers responses in under 300 milliseconds
- **Routing Strategies**: Smart (latency + health optimized), Round-Robin, Priority Fallback

### 3. AI Chat Assistant

A beautiful, modern chat interface where users can ask questions and receive instant, source-cited answers from the knowledge base.

**Key Capabilities**:
- **Structured OKF Responses**: Answers formatted with Executive Summary, Key Specifications, and Actionable Next Steps
- **Source Citations**: Every answer includes clickable citation badges showing the exact document chunks used
- **LLM Telemetry**: Real-time badge showing which provider, model, and latency served each response
- **Suggested Prompts**: Pre-built prompt suggestions for common queries
- **Markdown Rendering**: Rich formatting with tables, code blocks, bullet points, and headers

### 4. Admin Analytics Dashboard

Real-time operational intelligence for monitoring platform health, query patterns, and knowledge gaps.

**Key Capabilities**:
- **Live Query Metrics**: Total queries, average response latency, document count, vector chunk count
- **Provider Health Monitoring**: Real-time status badges for each LLM provider
- **Unanswered Questions**: Automatic logging of queries that found no matching knowledge base chunks
- **Usage Trends**: Historical query volume and latency trends

### 5. Document Management System

A full-featured admin interface for managing the knowledge base lifecycle.

**Key Capabilities**:
- **Drag & Drop Upload**: Upload multiple documents simultaneously
- **OKF Detection**: Automatic detection of Open Knowledge Format documents with YAML frontmatter
- **Category Tagging**: Organize documents by category (customer support, billing, technical, returns)
- **Chunk Inspector**: View individual text chunks and their embedding status
- **Bulk Operations**: Delete multiple documents and their associated vector chunks

---

## 🏗️ Professional Services

### Implementation & Onboarding

| Service | Included In | Description |
|---------|------------|-------------|
| **Self-Service Setup** | All plans | Documentation, setup guides, and community support |
| **Guided Onboarding** | Pro + Enterprise | 1-hour video call with Solutions Architect for initial setup |
| **Custom Integration** | Enterprise only | API integration with existing CRM, helpdesk, or internal tools |
| **Data Migration** | Enterprise only | Migration of existing knowledge base from Confluence, Notion, SharePoint |
| **Custom Model Training** | Enterprise only | Fine-tuning of embedding models on customer-specific terminology |

### Training & Enablement

| Program | Format | Duration | Price |
|---------|--------|----------|-------|
| **Admin Training** | Live video workshop | 2 hours | Included (Pro + Enterprise) |
| **Advanced RAG Workshop** | In-person or virtual | Full day | $1,500 per session |
| **Custom Documentation** | Tailored user guides | 1–2 weeks | Custom quote |

---

## 📞 Contact Information

| Department | Email | Phone |
|-----------|-------|-------|
| **Sales & Pricing** | sales@antigravity.ai | +1 (888) 555-ANTI ext. 100 |
| **Technical Support** | support@antigravity.ai | +1 (888) 555-ANTI ext. 200 |
| **Billing & Accounts** | billing@antigravity.ai | +1 (888) 555-ANTI ext. 300 |
| **Enterprise Partnerships** | enterprise@antigravity.ai | Direct line assigned |
| **Security & Privacy** | security@antigravity.ai | — |
| **Press & Media** | press@antigravity.ai | — |

---

## 🔗 Cross-References & Related Wiki Documents

- [Master Wiki Index](../INDEX.md)
- [Customer Support SLA & Escalation Policy](../customer_support/01_sla_and_escalation.md)
- [Subscription Billing & Refund Policy](../billing/02_refund_and_subscription.md)
- [Technical Troubleshooting & FAQ](../technical/03_troubleshooting_faq.md)
- [Account Security & Privacy Policy](../security/05_account_security_and_privacy.md)
