---
title: "Account Security, Access Control & Privacy Policy"
doc_id: "cs-security-privacy-v2"
category: "customer_support"
version: "2.5"
updated_at: "2026-08-02"
tags: ["security", "privacy", "rbac", "mfa", "encryption", "gdpr", "soc2"]
entities: ["Security Team", "Data Protection Officer", "Compliance Auditor"]
schema_version: "okf-v1.0"
---

# Account Security, Access Control & Privacy Policy

## 📖 Executive Summary
Industry-grade security frameworks protecting enterprise customer data through end-to-end encryption, Role-Based Access Control (RBAC), Multi-Factor Authentication (MFA), and zero-trust database isolation.

---

## 🔐 Account Security & Authentication

### 1. Role-Based Access Control (RBAC)
- **Customer User Role**: Public or authenticated users restricted exclusively to sending support queries to the chatbot interface. Cannot view system telemetry, raw vector embeddings, or admin settings.
- **Admin Role**: Designated platform administrators with exclusive privileges to manage knowledge base documents, configure LLM router strategies, toggle OKF/RAG modes, and view telemetry analytics.

### 2. Multi-Factor Authentication (MFA) & Single Sign-On (SSO)
- All admin accounts require mandatory MFA (TOTP / Authenticator App or Security Keys).
- Enterprise tier supports SAML 2.0 / OAuth 2.0 Single Sign-On integration with Okta, Azure AD, Ping Identity, and Google Workspace.

### 3. Password Security & Account Recovery
- Minimum password length of 10 characters with upper/lowercase, number, and special character enforcement.
- Account lockout after 5 consecutive failed login attempts to prevent brute-force attacks. Lockout lasts 15 minutes or until unlocked via email verification.

---

## 🛡️ Data Encryption & Privacy Controls

- **Encryption in Transit**: All API requests, database queries, and LLM router communication are secured via TLS 1.3 protocol with ECDHE key exchange.
- **Encryption at Rest**: Uploaded documents, database tables, pgvector embeddings, and secret API keys are encrypted at rest using AES-256 GCM encryption.
- **Data Isolation**: Multi-tenant database schemas utilize Row Level Security (RLS) policies in PostgreSQL, guaranteeing strict tenant boundary isolation.

---

## 🔗 Related Customer Support Documents
- [Service Level Agreement (SLA) & Incident Escalation Policy](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/01_service_level_agreement_and_incident_escalation.md)
- [Subscription Billing, Refund & Data Retention Policy](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/02_billing_refund_and_subscription_policy.md)
- [Product Return & Warranty Guidelines](file:///f:/Projects/FreeLance/rag_qa/docs/customer_support/04_product_return_warranty_and_rma_guide.md)
