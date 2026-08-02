---
title: "Technical Support & Troubleshooting FAQ"
doc_id: "okf-cs-tech-03"
category: "tech_specs"
version: "2.5"
updated_at: "2026-08-01"
tags: ["faq", "troubleshooting", "rate-limit", "429-failover", "api-keys"]
entities: ["Smart Router", "Groq Engine", "Gemini Engine", "OpenRouter Engine"]
schema_version: "okf-v1.0"
---

# Technical Support & Troubleshooting FAQ

## 📖 Executive Summary
Technical guidance for Smart AI Router multi-model failovers, rate-limit recovery, and vector database troubleshooting.

## 💡 Core Knowledge & Technical Specifications
- **HTTP 429 Rate Limit Failover**: When any model (Groq, Gemini, OpenRouter) returns an HTTP 429 status code, the router puts that model on a 60-second cooldown and automatically switches to the next operational model.
- **Document Ingestion Limits**: Supports `.pdf`, `.docx`, `.txt`, `.md` up to 25MB. Upon upload, documents are parsed and converted into Open Knowledge Format (OKF) Markdown with YAML frontmatter.
- **API Key Configuration**: Place `GROQ_API_KEY`, `GEMINI_API_KEY`, and `OPENROUTER_API_KEY` in `.env.local` for automatic key rotation.

## 🔗 Cross-References & Related Wiki Documents
- [Customer Support SLA & Escalation Policy](file:///f:/Projects/FreeLance/rag_qa/docs/okf_demo_docs/01_okf_customer_support_sla_and_escalation.md)
- [Subscription Billing & Refund Policy](file:///f:/Projects/FreeLance/rag_qa/docs/okf_demo_docs/02_okf_billing_refund_and_subscription.md)
