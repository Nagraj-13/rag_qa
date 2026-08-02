---
title: "Enterprise Customer Support — Service Level Agreement (SLA) & Incident Escalation Policy"
doc_id: "okf-cs-sla-01"
category: "customer_support"
version: "3.0"
updated_at: "2026-08-02"
tags: ["sla", "escalation", "support", "incidents", "p1-outage", "response-time", "24/7-coverage"]
entities: ["Tier 1 Support Specialist", "Tier 2 Support Engineer", "Tier 3 AI Solutions Architect", "VP Customer Operations", "Technical Account Manager"]
schema_version: "okf-v1.0"
---

# Enterprise Customer Support — Service Level Agreement (SLA) & Incident Escalation Policy

## 📖 Executive Summary

Antigravity Technologies Inc. ("Antigravity") guarantees **99.95% system uptime** across all production RAG knowledge base environments, backed by structured, tiered incident response workflows, 24/7 on-call engineering rotations, and contractual SLA credits for qualified downtime events. This policy applies to all Enterprise, Pro Team, and Developer plan customers effective August 2026.

---

## 💡 Core Service Level Targets

### Uptime Guarantee

| Plan Tier | Guaranteed Uptime | Monthly Credit if Breached |
|-----------|-------------------|---------------------------|
| **Enterprise Custom** | 99.95% (≤ 21.9 min downtime/month) | 10% monthly fee credit per 0.1% below target |
| **Pro Team ($149/mo)** | 99.9% (≤ 43.8 min downtime/month) | 5% monthly fee credit |
| **Developer ($29/mo)** | 99.5% (best effort) | No contractual credit |

**Exclusions**: Scheduled maintenance windows (Saturdays 2:00–4:00 AM UTC), third-party provider outages (Groq, Google Gemini, OpenRouter), and force majeure events.

### Priority-Based Response & Resolution Targets

| Priority | Definition | First Response | Target Resolution | Coverage Window |
|----------|-----------|----------------|-------------------|-----------------|
| **P1 — Critical Outage** | RAG service fully down for all users; data loss risk; security breach | **≤ 15 minutes** | **≤ 2 hours** | 24/7/365 — Phone, Slack Connect, PagerDuty |
| **P2 — Major Degradation** | Severe latency (>5s response), single LLM provider chain failure, partial data retrieval failure | **≤ 1 hour** | **≤ 6 hours** | 24/7 — Email, Slack, Ticketing Portal |
| **P3 — Minor Issue** | Individual user login failure, UI rendering glitch, non-blocking cosmetic bug | **≤ 4 business hours** | **≤ 2 business days** | Mon–Fri, 8:00 AM – 8:00 PM EST |
| **P4 — Feature Request / Enhancement** | New feature suggestion, UX improvement, documentation correction | **≤ 2 business days** | Roadmap review cycle | Mon–Fri, 9:00 AM – 5:00 PM EST |

---

## 🔍 Incident Escalation Matrix

### Escalation Levels

| Level | Role | Responsibility | Auto-Escalation Trigger |
|-------|------|---------------|------------------------|
| **L1** | Tier 1 Support Specialist | Initial triage, log collection, known-issue matching against OKF Wiki | Unresolved after 30 minutes (P1) or 2 hours (P2) |
| **L2** | Tier 2 Support Engineer | Deep diagnostics: Smart Router health checks, pgvector query analysis, embedding pipeline debugging | Unresolved after 1 hour (P1) or 4 hours (P2) |
| **L3** | Tier 3 AI Solutions Architect | Root cause analysis: LLM provider API debugging, vector index corruption repair, schema migration | Unresolved after 2 hours (P1) |
| **L4 — Executive** | VP of Customer Operations | Executive incident commander; customer communication; SLA credit authorization | Any P1 exceeding 4 hours |

### Escalation Contact Directory

| Level | Contact Method | Address |
|-------|---------------|---------|
| L1 General Support | Support Portal | https://support.antigravity.ai |
| L1 Email | Email | support@antigravity.ai |
| L2 Engineering | Slack Connect | #antigravity-engineering |
| L3 Architecture | PagerDuty On-Call | oncall-arch@antigravity.ai |
| L4 Executive | Direct Phone | +1 (888) 555-ANTI ext. 100 |

---

## 📋 Incident Lifecycle & Communication Protocol

### Incident Stages

1. **Detection & Acknowledgment**: Automated monitoring (Datadog, PagerDuty) triggers alert → L1 acknowledges within response SLA.
2. **Triage & Classification**: L1 assigns priority (P1–P4), creates incident ticket, notifies affected customers.
3. **Investigation & Diagnosis**: Assigned engineer runs diagnostics: Smart Router telemetry logs, pgvector query latency, embedding pipeline health.
4. **Resolution & Recovery**: Fix deployed; service restored; customer notified with root cause summary.
5. **Post-Incident Review (PIR)**: Blameless retrospective within 48 hours. PIR report shared with affected Enterprise customers within 5 business days.

### Customer Communication Cadence (P1 Incidents)

- **Every 30 minutes**: Status update posted to Slack Connect and Status Page.
- **Resolution**: Full summary email within 2 hours of service restoration.
- **PIR Delivery**: Detailed root cause analysis report within 5 business days.

---

## 🔗 Cross-References & Related Wiki Documents

- [Master Wiki Index](./INDEX.md)
- [Subscription Billing & Refund Policy](../billing/02_refund_and_subscription.md)
- [Technical Troubleshooting & FAQ](../technical/03_troubleshooting_faq.md)
- [Product Return & Warranty Guidelines](../returns/04_warranty_and_rma.md)
