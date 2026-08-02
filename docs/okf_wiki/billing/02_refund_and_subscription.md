---
title: "Subscription Billing, Refund & Cancellation Policy"
doc_id: "okf-cs-billing-02"
category: "billing"
version: "3.0"
updated_at: "2026-08-02"
tags: ["billing", "refund", "subscription", "pricing", "gdpr", "soc2", "cancellation", "payment"]
entities: ["Billing Team", "Compliance Officer", "Account Manager", "Finance Department"]
schema_version: "okf-v1.0"
---

# Subscription Billing, Refund & Cancellation Policy

## 📖 Executive Summary

Antigravity Technologies offers transparent, usage-based subscription plans with a **30-day unconditional money-back guarantee** on all tiers. We accept Visa, Mastercard, American Express, and wire transfer (Enterprise only). All billing, refund, and data handling processes comply with **GDPR (EU)**, **SOC 2 Type II**, and **CCPA (California)** regulations.

---

## 💡 Subscription Plans & Pricing

### Current Plan Tiers (Effective August 2026)

| Feature | Developer ($29/mo) | Pro Team ($149/mo) | Enterprise (Custom) |
|---------|--------------------|--------------------|---------------------|
| **Uploaded Documents** | Up to 50 | Up to 500 | Unlimited |
| **RAG Queries / Month** | 10,000 | 100,000 | Unlimited |
| **LLM Providers** | Groq + OpenRouter | Groq + Gemini + OpenRouter | All + Dedicated Router |
| **Embedding Model** | Shared (Groq) | Shared (Gemini + Groq) | Dedicated Instance |
| **Support Level** | Email (P3/P4) | Email + Slack (P2–P4) | 24/7 Phone + Slack + PagerDuty (P1–P4) |
| **SLA Uptime** | 99.5% (best effort) | 99.9% | 99.95% with credits |
| **Data Retention** | 30 days post-cancel | 60 days post-cancel | Custom (up to 1 year) |
| **SSO / SAML** | ❌ | ❌ | ✅ |
| **Dedicated Account Manager** | ❌ | ❌ | ✅ |

### Annual Billing Discount
- **Developer Annual**: $290/year (save $58 — 2 months free)
- **Pro Team Annual**: $1,490/year (save $298 — 2 months free)
- **Enterprise Annual**: Custom negotiated pricing

---

## 💰 Refund Policy

### 30-Day Unconditional Money-Back Guarantee

All new subscriptions (Developer, Pro Team, and Enterprise) are covered by a **30-day unconditional refund guarantee**:

- **Eligibility**: Refund request must be submitted within **30 calendar days** of the initial charge date.
- **Refund Amount**: 100% of the subscription fee paid (no pro-rating for partial months).
- **Processing Time**: Refunds are processed to the original payment method within **3–5 business days**.
- **How to Request**: Email `billing@antigravity.ai` with your account email and order/invoice ID.

### Refund Exceptions

The following are **not eligible** for refund:
- Subscriptions renewed after the initial 30-day period.
- Add-on purchases (extra storage, dedicated model router) after activation.
- Enterprise contracts with custom negotiated terms (governed by individual MSA).

### Partial Refund (Pro-Rated)

For annual subscriptions cancelled after the 30-day guarantee period, a **pro-rated refund** for unused full months is available upon request. A 10% early termination fee applies.

---

## 🔄 Cancellation & Account Closure

### How to Cancel

1. **Self-Service**: Navigate to **Settings → Subscription → Cancel Plan** in the admin dashboard.
2. **Email Support**: Send cancellation request to `billing@antigravity.ai`.
3. **Enterprise Customers**: Contact your dedicated Account Manager or email `enterprise-support@antigravity.ai`.

### What Happens After Cancellation

| Timeline | Action |
|----------|--------|
| **Immediately** | Auto-renewal is stopped; no further charges |
| **Until billing period ends** | Full access to all features continues |
| **Billing period ends** | Account switches to read-only mode (can export data) |
| **30 days post-expiry (Developer/Pro)** | All uploaded documents, vector embeddings, chat history, and analytics data are permanently purged |
| **60 days post-expiry (Enterprise)** | Data purge (unless custom retention agreement exists) |

---

## 🔒 Data Privacy & Compliance

### Regulatory Compliance

| Standard | Status | Certification |
|----------|--------|--------------|
| **GDPR (EU)** | ✅ Compliant | Data Processing Agreement (DPA) available on request |
| **SOC 2 Type II** | ✅ Certified | Annual audit by independent auditor |
| **CCPA (California)** | ✅ Compliant | Privacy policy updated quarterly |
| **HIPAA** | 🔄 In Progress | BAA available for Enterprise Healthcare customers (Q4 2026) |

### Right to Data Portability

Customers may export all uploaded documents, chat transcripts, and analytics data at any time via **Settings → Data Export**. Exports are delivered as a ZIP archive containing:
- Original uploaded files (PDF, DOCX, TXT, MD)
- Chat history in JSON format
- Analytics summary in CSV format

### Right to Erasure (GDPR Article 17)

Upon written request to `privacy@antigravity.ai`, all personal data, uploaded documents, vector embeddings, and chat logs will be permanently deleted within **14 business days**. Confirmation of deletion is provided via email.

---

## 🔗 Cross-References & Related Wiki Documents

- [Master Wiki Index](../INDEX.md)
- [Customer Support SLA & Escalation Policy](../customer_support/01_sla_and_escalation.md)
- [Technical Troubleshooting & FAQ](../technical/03_troubleshooting_faq.md)
- [Product Return & Warranty Guidelines](../returns/04_warranty_and_rma.md)
