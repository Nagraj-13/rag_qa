---
title: "Subscription Billing, Payment, Refund & Data Retention Policy"
doc_id: "cs-billing-policy-v2"
category: "customer_support"
version: "2.5"
updated_at: "2026-08-02"
tags: ["billing", "refund-policy", "subscription-plans", "data-retention", "gdpr", "soc2"]
entities: ["Billing Team", "Compliance Officer", "Account Operations"]
schema_version: "okf-v1.0"
---

# Subscription Billing, Payment, Refund & Data Retention Policy

## 📖 Executive Summary
Clear transparent rules governing subscription tiers, 30-day money-back refund guarantees, payment methods, tax compliance, and automated data purging post-cancellation in compliance with GDPR Article 17 and SOC 2 Type II standards.

---

## 💡 Subscription Plan Tiers

| Plan Tier | Monthly Price | Annual Discount Price | Document Ingestion Limit | Included RAG Queries | Support Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Developer / Starter** | $29 / month | $24 / month ($288 billed annually) | Up to 50 Documents (25MB each) | 10,000 queries / mo | Standard Email Support |
| **Pro Team** | $149 / month | $119 / month ($1,428 billed annually) | Up to 500 Documents (100MB each) | 100,000 queries / mo | Priority Email & Slack Support |
| **Enterprise Custom** | Custom Quote | Custom Quote | Unlimited Documents | Unlimited queries | 24/7 Phone, Slack & Dedicated Router |

---

## 💳 Payment Methods & Invoicing
- **Accepted Payments**: All major credit cards (Visa, MasterCard, American Express, Discover), ACH Bank Transfer, and Wire Transfer for annual Enterprise plans.
- **Billing Cycle**: Subscriptions renew automatically on the same calendar day each month or year based on initial signup date.
- **Tax Compliance**: Automatic calculation of applicable State Sales Tax, VAT, or GST based on customer billing location.

---

## 🔄 30-Day Money-Back Refund Guarantee
We stand by our technology. All new subscriptions qualify for a **100% full refund within 30 days** of initial purchase under the following conditions:

1. Customer experiences unresolved technical issues or system uptime drops below our guaranteed 99.95% SLA.
2. Refund request is submitted within 30 calendar days of account creation via the Billing Portal or by emailing `billing@antigravity.ai`.
3. Refunds are processed back to the original payment method within 3 to 5 business days.

---

## 🗑️ Cancellation & Automated Data Purging (GDPR / SOC 2)
- **Cancellation**: Customers may cancel their subscription anytime via Account Settings -> Subscription -> Cancel Plan. Access remains active through the end of the current paid billing period.
- **Data Purge Timeline**:
  - **Days 0–30 post-cancellation**: Account enters Grace Period. Uploaded documents and vector store embeddings remain securely archived for easy restoration.
  - **Day 30 post-cancellation**: In accordance with GDPR Article 17 (Right to Erasure) and SOC 2 compliance, all uploaded document files, parsed text chunks, vector embeddings, and telemetry logs are **permanently and unrecoverably purged** from primary storage and database backups.

---

## 🔗 Related Customer Support Documents
- [Service Level Agreement (SLA) & Incident Escalation Policy](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/01_service_level_agreement_and_incident_escalation.md)
- [Account Security & Privacy Policy](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/03_account_security_and_privacy_policy.md)
- [Product Return & Warranty Guidelines](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/04_product_return_warranty_and_rma_guide.md)
