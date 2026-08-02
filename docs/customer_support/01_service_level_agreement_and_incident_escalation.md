---
title: "Enterprise Customer Support Service Level Agreement (SLA) & Incident Escalation Policy"
doc_id: "cs-sla-enterprise-v2"
category: "customer_support"
version: "2.5"
updated_at: "2026-08-02"
tags: ["sla", "incident-management", "escalation-matrix", "uptime-guarantee", "customer-support"]
entities: ["Tier 1 Specialist", "Tier 2 Support Engineer", "Tier 3 AI Solutions Architect", "VP of Customer Operations"]
schema_version: "okf-v1.0"
---

# Enterprise Customer Support Service Level Agreement (SLA) & Incident Escalation Policy

## 📖 Executive Summary
Antigravity Enterprise provides industry-standard technical support, 99.95% system availability guarantees, and structured incident escalation workflows for high-concurrency enterprise applications and RAG knowledge systems.

---

## 💡 Service Level Agreement (SLA) Priority Tiers

| Priority Level | Description & Impact | Initial Response Time | Resolution Target | Support Coverage Hours | Support Channels |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1 - Critical Outage** | Complete core service downtime, vector database failure, or security breach affecting all users. | **< 15 minutes** | **< 2 hours** | 24 / 7 / 365 | Dedicated Slack Connect, Phone, Priority Email |
| **P2 - Major Degradation** | Significant latency (>2000ms), single LLM router failover event, or partial API feature outage. | **< 1 hour** | **< 6 hours** | 24 / 7 / 365 | Slack Connect & Email |
| **P3 - Moderate Issue** | Non-critical bug, single user access permission issue, or minor document ingestion error. | **< 4 business hours** | **< 24 hours** | Mon–Fri, 8 AM–8 PM EST | Portal Ticket & Email |
| **P4 - Low / Feature Request** | General questions, documentation clarification, or enhancement requests. | **< 8 business hours** | Scheduled Release | Mon–Fri, 8 AM–8 PM EST | Portal Ticket |

---

## 🔍 Incident Escalation Matrix

If an incident is not resolved within the target timeframe specified in the SLA, it automatically escalates through the following organizational hierarchy:

1. **Level 1 Triage — Tier 1 Support Specialist**:
   - Collects diagnostic logs, error codes, HTTP status codes, and reproduction steps.
   - Executes initial troubleshooting procedures and vector database connectivity checks.

2. **Level 2 Technical Resolution — Tier 2 Support & Systems Engineer**:
   - Engaged if issue remains unresolved after 30 minutes (P1) or 2 hours (P2).
   - Inspects PostgreSQL / pgvector connection pools, LLM router model health, and rate-limit cooldown timers.

3. **Level 3 Engineering — Tier 3 AI Solutions Architect**:
   - Engaged if issue remains unresolved after 1 hour (P1) or 4 hours (P2).
   - Applies hotfixes, database migrations, RPC query optimizations, or model provider overrides.

4. **Level 4 Executive Escalation — VP of Customer Operations**:
   - Direct executive notification for unresolved P1 critical outages past 90 minutes.
   - Contact: `executive-escalations@antigravity.ai` | Direct Phone: `+1 (800) 555-0199`.

---

## 🛡️ Service Uptime Credit Policy
If monthly system availability drops below our guaranteed **99.95%** uptime commitment, customers on Pro and Enterprise tiers are eligible for service credits applied to their subsequent billing cycle:

- **99.0% – 99.94% Uptime**: 10% monthly subscription credit
- **95.0% – 98.99% Uptime**: 25% monthly subscription credit
- **< 95.0% Uptime**: 50% monthly subscription credit

---

## 🔗 Related Customer Support Documents
- [Billing, Refund & Subscription Policy](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/02_billing_refund_and_subscription_policy.md)
- [Account Security & Privacy Policy](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/03_account_security_and_privacy_policy.md)
- [Product Return & Warranty Guidelines](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/04_product_return_warranty_and_rma_guide.md)
