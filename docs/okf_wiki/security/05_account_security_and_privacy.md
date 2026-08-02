---
title: "Account Security, Data Privacy & Access Control Policy"
doc_id: "okf-cs-security-05"
category: "security"
version: "3.0"
updated_at: "2026-08-02"
tags: ["security", "privacy", "authentication", "2fa", "sso", "encryption", "access-control", "gdpr"]
entities: ["Security Operations Team", "Data Protection Officer", "Identity & Access Management Team"]
schema_version: "okf-v1.0"
---

# Account Security, Data Privacy & Access Control Policy

## 📖 Executive Summary

Antigravity Technologies employs enterprise-grade security controls including **AES-256 encryption at rest**, **TLS 1.3 encryption in transit**, **role-based access control (RBAC)**, **two-factor authentication (2FA)**, and **SOC 2 Type II certified** infrastructure. This document outlines security practices, account recovery procedures, and privacy controls available to all customers.

---

## 💡 Authentication & Access Control

### Supported Authentication Methods

| Method | Availability | Description |
|--------|-------------|-------------|
| **Email + Password** | All plans | Standard email/password login with bcrypt hashing |
| **Two-Factor Authentication (2FA)** | All plans | TOTP-based (Google Authenticator, Authy) |
| **SSO / SAML 2.0** | Enterprise only | Okta, Azure AD, Google Workspace integration |
| **API Key Authentication** | Pro + Enterprise | For programmatic API access |

### Password Requirements

- **Minimum length**: 12 characters
- **Complexity**: Must include uppercase, lowercase, number, and special character
- **Rotation**: Recommended every 90 days (enforced for Enterprise via policy)
- **Breach Detection**: Passwords are checked against the HaveIBeenPwned database at sign-up

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| **Admin** | Full access: upload docs, manage users, view analytics, configure settings, delete data |
| **Editor** | Upload and manage documents, use chat, view own analytics |
| **Viewer** | Read-only: use chat, view documents (no upload/delete) |
| **API User** | Programmatic access via API key (scoped to assigned permissions) |

---

## 🔐 Data Encryption & Storage Security

### Encryption Standards

| Layer | Standard | Details |
|-------|----------|---------|
| **Data at Rest** | AES-256 | All documents, embeddings, and chat logs encrypted in PostgreSQL |
| **Data in Transit** | TLS 1.3 | All API communications encrypted end-to-end |
| **Backup Encryption** | AES-256-GCM | Daily encrypted backups with 30-day retention |
| **API Keys** | SHA-256 hash | API keys are hashed before storage; plaintext never stored |

### Data Residency

| Plan | Primary Region | Backup Region |
|------|---------------|---------------|
| **Developer / Pro** | US-East (AWS us-east-1) | US-West (AWS us-west-2) |
| **Enterprise** | Customer's choice (US, EU, APAC) | Secondary region within same geography |

---

## 🔑 Account Recovery & Lockout Policy

### Password Reset

1. Click **"Forgot Password"** on the login page.
2. Enter your registered email address.
3. Receive a **one-time password reset link** (valid for 1 hour).
4. Set a new password meeting complexity requirements.

### Account Lockout

| Trigger | Action | Recovery |
|---------|--------|----------|
| **5 failed login attempts** | Account locked for 15 minutes | Wait or reset password |
| **10 failed attempts** | Account locked for 1 hour + email alert sent | Contact support or reset password |
| **Suspicious login from new location** | Email verification challenge triggered | Verify via email link |

### 2FA Recovery

If you lose access to your 2FA device:
1. Use one of your **backup recovery codes** (generated at 2FA setup — store securely!).
2. If no recovery codes available, email `security@antigravity.ai` with government-issued photo ID for manual identity verification (processed within 1 business day).

---

## 📊 Audit Logging & Monitoring

All account activities are logged with immutable audit trails:

- **Login events**: Timestamp, IP address, device fingerprint, success/failure
- **Document operations**: Upload, delete, download — with user attribution
- **Settings changes**: Plan upgrades, API key generation, role changes
- **Admin actions**: User management, data export, analytics access

Enterprise customers can export audit logs via **Settings → Security → Audit Log Export** (CSV/JSON format).

---

## 🔗 Cross-References & Related Wiki Documents

- [Master Wiki Index](../INDEX.md)
- [Customer Support SLA & Escalation Policy](../customer_support/01_sla_and_escalation.md)
- [Subscription Billing & Refund Policy](../billing/02_refund_and_subscription.md)
- [Technical Troubleshooting & FAQ](../technical/03_troubleshooting_faq.md)
