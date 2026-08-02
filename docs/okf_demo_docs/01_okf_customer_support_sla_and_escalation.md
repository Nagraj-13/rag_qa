---
title: "Customer Support SLA & Incident Escalation Policy"
doc_id: "okf-cs-sla-01"
category: "customer_support"
version: "2.5"
updated_at: "2026-08-01"
tags: ["sla", "escalation", "support", "incidents", "p1-outage"]
entities: ["Tier 1 Specialist", "Tier 2 Engineer", "Support Director"]
schema_version: "okf-v1.0"
---

# Customer Support SLA & Incident Escalation Policy

## 📖 Executive Summary
Antigravity Enterprise provides 24/7 technical support and incident management for high-availability knowledge base systems.

## 💡 Core Knowledge & Policy Specifications
- **Priority 1 (P1 - Critical Outage)**: System down or RAG service unresponsive for all users. Initial response under 15 minutes, target resolution under 2 hours. Coverage: 24/7 Phone & Slack Connect.
- **Priority 2 (P2 - Major Degraded Service)**: Severe latency or single LLM provider outage. Initial response under 1 hour, target resolution under 6 hours. Coverage: 24/7 Email & Slack.
- **Priority 3 (P3 - Minor Issue)**: Individual user access or minor UI issues. Initial response under 4 business hours. Coverage: Mon-Fri, 8 AM - 8 PM EST.

## 🔍 Incident Escalation Matrix
1. **Level 1**: Tier 1 Support Specialist (Initial triage & log collection).
2. **Level 2**: Tier 2 Systems & RAG Engineer (Model router & pgvector debugging).
3. **Level 3**: Tier 3 Lead AI Architect (Core API & RPC fix).
4. **Executive**: Support Director (`support-escalations@antigravity.ai`).

## 🔗 Cross-References & Related Wiki Documents
- [Billing & Refund Policy](file:///f:/Projects/FreeLance/rag_qa/docs/okf_demo_docs/02_okf_billing_refund_and_subscription.md)
- [Technical Troubleshooting FAQ](file:///f:/Projects/FreeLance/rag_qa/docs/okf_demo_docs/03_okf_technical_troubleshooting_faq.md)
