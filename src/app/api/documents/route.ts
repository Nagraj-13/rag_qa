import { NextRequest, NextResponse } from 'next/server';
import { DocumentParser } from '@/lib/documents/parser';
import { EmbeddingRouter } from '@/lib/embeddings/embedding-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { DocumentItem, DocumentChunk, DocumentCategory } from '@/types/rag';
import { OpenKnowledgeEngine } from '@/lib/wiki/open-knowledge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
      
      if (userId) {
        query = query.or(`user_id.eq.${userId},is_admin.eq.true,user_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data) {
        const docs: DocumentItem[] = data.map(d => ({
          id: d.id,
          title: d.title,
          fileName: d.file_name,
          fileType: d.file_type,
          fileSize: d.file_size,
          chunkCount: d.chunk_count || 0,
          category: d.category || 'general',
          userId: d.user_id,
          createdAt: d.created_at,
          isAdmin: d.is_admin,
          isOKF: true,
        }));
        return NextResponse.json({ documents: docs });
      }
    }

    // Fallback local memory storage
    return NextResponse.json({ documents: localVectorStore.getDocuments(userId || undefined) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle JSON Demo Bundle Import
    if (contentType.includes('application/json')) {
      const jsonBody = await req.json().catch(() => ({}));
      if (jsonBody.action === 'import_demo_rag') {
        const ragDemoDocs = [
          {
            title: 'Customer Support SLA & Incident Escalation Policy',
            fileName: 'docs/rag_sample_word_docs/01_Customer_Support_SLA_and_Escalation.docx',
            category: 'customer_support' as DocumentCategory,
            chunks: [
              `Priority 1 (P1 Critical Outage): System down for all users. Initial response under 15 minutes, resolution under 2 hours. Coverage: 24/7 Phone & Slack Connect.`,
              `Priority 2 (P2 Major Degraded Service): Severe latency (>2000ms) or single provider failover. Initial response under 1 hour, resolution under 6 hours.`,
              `Multi-Tiered Incident Escalation Ladder: Level 1 (Tier 1 Support Specialist) -> Level 2 (Tier 2 Systems Engineer) -> Level 3 (Tier 3 AI Solutions Architect) -> Level 4 (VP of Customer Operations: executive-escalations@antigravity.ai).`
            ]
          },
          {
            title: 'Subscription Billing, Payment, Refund & Data Retention Policy',
            fileName: 'docs/rag_sample_word_docs/02_Billing_Refund_and_Subscription_Policy.docx',
            category: 'customer_support' as DocumentCategory,
            chunks: [
              `Subscription Plans: Developer Starter ($29/mo), Pro Team ($149/mo), Enterprise Custom (Custom SLA & dedicated router).`,
              `30-Day Money-Back Guarantee: All new subscriptions qualify for a 100% full money-back refund within 30 calendar days if technical issues occur or uptime < 99.0%.`,
              `Cancellation & GDPR / SOC 2 Data Purge: Grace Period (Days 0-30). Permanent Purge (Day 30): All uploaded documents, text chunks, vector embeddings, and logs are unrecoverably deleted.`
            ]
          },
          {
            title: 'Account Security, Access Control & Privacy Policy',
            fileName: 'docs/rag_sample_word_docs/03_Account_Security_and_Privacy_Policy.docx',
            category: 'customer_support' as DocumentCategory,
            chunks: [
              `Role-Based Access Control (RBAC): Customer role is restricted to support chat. Admin role has exclusive access to document management, analytics, and system settings.`,
              `Authentication Security: Multi-Factor Authentication (MFA) mandatory for admin accounts. Enterprise SAML 2.0 / OAuth 2.0 SSO support (Okta, Azure AD, Google Workspace). Password lockout after 5 failed attempts.`,
              `Data Encryption & Tenant Isolation: Data in transit encrypted via TLS 1.3. Vector embeddings at rest encrypted via AES-256 GCM. Multi-tenant database isolation enforced via PostgreSQL Row Level Security (RLS).`
            ]
          },
          {
            title: 'Product Return, Hardware Warranty & RMA Guidelines',
            fileName: 'docs/rag_sample_word_docs/04_Product_Return_Warranty_and_RMA_Guide.docx',
            category: 'customer_support' as DocumentCategory,
            chunks: [
              `30-Day Return Window: Customers may return unopened, undamaged, or defective hardware items within 30 days of delivery for a 100% full refund or direct unit replacement.`,
              `1-Year Limited Hardware Warranty: Covers manufacturing defects (motherboard failure, power supply, component faults) for 12 months from delivery date under the FTC Magnuson-Moss Act.`,
              `RMA Steps: Request RMA via rma@antigravity.ai. Receive prepaid shipping label within 4 hours. Replacement dispatches via 2-day air upon carrier scan.`
            ]
          },
          {
            title: 'Customer Technical Support & Troubleshooting Manual',
            fileName: 'docs/rag_sample_word_docs/05_Customer_Troubleshooting_and_FAQ_Manual.docx',
            category: 'tech_specs' as DocumentCategory,
            chunks: [
              `Password Reset: Click 'Forgot Password' on the login screen, enter email, and follow the link sent to your inbox within 15 minutes.`,
              `Account Lockout: Accounts auto-lock for 15 minutes after 5 consecutive failed login attempts, or unlock via instant email link.`,
              `Latency & Connection Troubleshooting: Latency spikes >2000ms trigger automatic failovers. If slow responses persist past 5 minutes, clear browser cache or test on an alternate network.`
            ]
          }
        ];

        const importedDocs: DocumentItem[] = [];
        for (const doc of ragDemoDocs) {
          const docId = `doc-rag-${Math.random().toString(36).substring(2, 9)}`;
          const nowStr = new Date().toISOString();

          const item: DocumentItem = {
            id: docId,
            title: doc.title,
            fileName: doc.fileName,
            fileType: 'docx',
            fileSize: 37500,
            chunkCount: doc.chunks.length,
            category: doc.category,
            createdAt: nowStr,
            isAdmin: true,
            isOKF: false,
          };

          const chunks: DocumentChunk[] = doc.chunks.map((content, idx) => ({
            id: `${docId}-chk-${idx}`,
            documentId: docId,
            content,
            metadata: {
              fileName: doc.fileName,
              title: doc.title,
              chunkIndex: idx,
              category: doc.category,
              isOKF: false,
            },
          }));

          localVectorStore.addDocument(item, chunks);
          importedDocs.push(item);
        }

        return NextResponse.json({ success: true, count: importedDocs.length, documents: importedDocs });
      }

      if (jsonBody.action === 'import_demo_okf') {
        const demoDocs = [
          {
            title: 'Master Knowledge Base Index (INDEX.md)',
            fileName: 'docs/okf_wiki/INDEX.md',
            category: 'general' as DocumentCategory,
            okfContent: `---
title: "Open Knowledge Base — Master Wiki Index"
doc_id: "okf-index-master"
category: "master_index"
version: "2.5"
updated_at: "${new Date().toISOString().split('T')[0]}"
tags: ["index", "master-wiki", "customer-support", "okf-schema"]
entities: ["Tier 1 Specialist", "Tier 2 Engineer", "Billing Team", "Compliance Officer", "Smart Router"]
schema_version: "okf-v1.0"
---
# 📚 Open Knowledge Base — Master Wiki Index
## 📖 Executive Summary
Master directory and category index for Antigravity Enterprise Customer Support Open Knowledge Format (OKF) Wiki.
## 📂 Wiki Directory Structure & Category Map
docs/okf_wiki/
├── INDEX.md (Master Knowledge Base Index)
├── customer_support/01_sla_and_escalation.md
├── billing/02_refund_and_subscription.md
├── technical/03_troubleshooting_faq.md
└── returns/04_warranty_and_rma.md`,
            chunks: [
              `Master Wiki Directory Structure: docs/okf_wiki/INDEX.md maps all categories: customer_support, billing, technical, returns.`,
              `Category Map & Entities: Tier 1 Specialist, Tier 2 Engineer, Support Director, Billing Team, Compliance Officer, Smart Router.`
            ]
          },
          {
            title: 'Customer Support SLA & Escalation Policy',
            fileName: 'docs/okf_wiki/customer_support/01_sla_and_escalation.md',
            category: 'customer_support' as DocumentCategory,
            okfContent: `---
title: "Customer Support SLA & Escalation Policy"
doc_id: "okf-cs-sla-01"
category: "customer_support"
version: "2.5"
updated_at: "${new Date().toISOString().split('T')[0]}"
tags: ["sla", "escalation", "support", "p1-outage"]
schema_version: "okf-v1.0"
---
# Customer Support SLA & Escalation Policy
## 📖 Executive Summary
Antigravity Enterprise provides 24/7 technical support and incident management.
## 💡 Core Knowledge & Policy Specifications
- Priority 1 (P1 - Critical Outage): System down for all users. Initial response < 15 mins, resolution < 2 hours. Coverage: 24/7 Phone & Slack.
- Priority 2 (P2 - Major Degraded Service): Core features impacted, severe latency (>2000ms). Initial response < 1 hour, resolution < 6 hours.
- Priority 3 (P3 - Minor Issue): Individual user access issues. Initial response < 4 business hours. Mon-Fri 8 AM - 8 PM EST.`,
            chunks: [
              `P1 Critical Outage: System down for all users. Initial response under 15 minutes, resolution under 2 hours. 24/7 Phone & Slack.`,
              `P2 Major Degraded Service: Severe latency or single LLM provider rate limit. Response under 1 hour, resolution under 6 hours.`,
              `Incident Escalation Matrix: Level 1 (Tier 1 Specialist) -> Level 2 (Tier 2 Engineer) -> Level 3 (Tier 3 AI Architect) -> Executive Escalation: Support Director (support-escalations@antigravity.ai).`
            ]
          },
          {
            title: 'Subscription Billing, Refund & Cancellation Policy',
            fileName: 'docs/okf_wiki/billing/02_refund_and_subscription.md',
            category: 'customer_support' as DocumentCategory,
            okfContent: `---
title: "Subscription Billing, Refund & Cancellation Policy"
doc_id: "okf-cs-billing-02"
category: "customer_support"
version: "2.5"
updated_at: "${new Date().toISOString().split('T')[0]}"
tags: ["billing", "refund", "subscription", "gdpr", "soc2"]
schema_version: "okf-v1.0"
---
# Subscription Billing, Refund & Cancellation Policy
## 📖 Executive Summary
Comprehensive policy outlining subscription tiers, 30-day money-back guarantee, and data retention rules.
## 💡 Core Knowledge & Policy Specifications
- Subscription Plans: Developer Starter ($29/mo), Pro Team ($149/mo), Enterprise Custom.
- 30-Day Money-Back Guarantee: 100% full refund within 30 days if technical issues remain unresolved or uptime < 99.0%.
- Cancellation: Cancel anytime via portal. Data & embeddings permanently purged 30 days post-cancellation per GDPR/SOC2.`,
            chunks: [
              `Subscription Plans: Developer Starter ($29/mo), Pro Team ($149/mo), Enterprise Custom (Custom SLA & dedicated router).`,
              `30-Day Refund Guarantee: 100% full refund within 30 days of initial purchase if unresolved technical issues occur.`,
              `Data Retention & GDPR Purge: Uploaded documents and vector embeddings are permanently scrubbed 30 days after subscription cancellation.`
            ]
          },
          {
            title: 'Technical Support & Troubleshooting FAQ',
            fileName: 'docs/okf_wiki/technical/03_troubleshooting_faq.md',
            category: 'tech_specs' as DocumentCategory,
            okfContent: `---
title: "Technical Support & Troubleshooting FAQ"
doc_id: "okf-cs-tech-03"
category: "tech_specs"
version: "2.5"
updated_at: "${new Date().toISOString().split('T')[0]}"
tags: ["faq", "troubleshooting", "rate-limit", "429-failover"]
schema_version: "okf-v1.0"
---
# Technical Support & Troubleshooting FAQ
## 📖 Executive Summary
Technical guidance for Smart AI Router multi-model failovers and Open Knowledge Format.
## 💡 Core Knowledge & Technical Specifications
- HTTP 429 Rate Limit Failover: Switches models automatically on 429 rate limit (llama-3.3-70b -> llama-4-scout -> qwen3-32b).
- OKF Document Ingestion: Formats raw documents into Markdown with YAML frontmatter upon upload.`,
            chunks: [
              `HTTP 429 Rate Limit Failover: Smart Router switches models on rate limit (llama-3.3-70b -> llama-4-scout -> qwen3-32b) with 60s cooldown.`,
              `OKF Document Ingestion: All uploaded files (.pdf, .docx, .txt, .md) are parsed and converted into Open Knowledge Format (OKF) Markdown.`
            ]
          },
          {
            title: 'Product Return & Warranty Guidelines',
            fileName: 'docs/okf_wiki/returns/04_warranty_and_rma.md',
            category: 'customer_support' as DocumentCategory,
            okfContent: `---
title: "Product Return & Warranty Guidelines"
doc_id: "okf-cs-returns-04"
category: "customer_support"
version: "2.5"
updated_at: "${new Date().toISOString().split('T')[0]}"
tags: ["return", "warranty", "hardware", "rma", "ftc-compliance"]
schema_version: "okf-v1.0"
---
# Product Return & Warranty Guidelines
## 📖 Executive Summary
Hardware return policy and 1-year limited warranty coverage under the FTC Magnuson-Moss Warranty Act.
## 💡 Core Knowledge & Technical Specifications
- 30-Day Return Window: Unopened or defective hardware can be returned within 30 days for a full refund.
- 1-Year Limited Warranty: Covers manufacturer hardware defects for 12 months.`,
            chunks: [
              `30-Day Return Window: Unopened or defective hardware can be returned within 30 days for a full refund or free replacement.`,
              `1-Year Limited Warranty & RMA: Covers manufacturer defects for 12 months. Contact support to obtain an RMA shipping label.`
            ]
          }
        ];

        const importedDocs: DocumentItem[] = [];
        for (const doc of demoDocs) {
          const docId = `doc-okf-${Math.random().toString(36).substring(2, 9)}`;
          const nowStr = new Date().toISOString();

          const item: DocumentItem = {
            id: docId,
            title: doc.title,
            fileName: doc.fileName,
            fileType: 'md',
            fileSize: 2048,
            chunkCount: doc.chunks.length,
            category: doc.category,
            createdAt: nowStr,
            isAdmin: true,
            isOKF: true,
            okfContent: doc.okfContent,
          };

          const chunks: DocumentChunk[] = doc.chunks.map((content, idx) => ({
            id: `${docId}-chk-${idx}`,
            documentId: docId,
            content,
            metadata: {
              fileName: doc.fileName,
              title: doc.title,
              chunkIndex: idx,
              category: doc.category,
            },
          }));

          localVectorStore.addDocument(item, chunks);
          importedDocs.push(item);
        }

        return NextResponse.json({ success: true, count: importedDocs.length, documents: importedDocs });
      }
    }

    // Handle Multipart Form Upload & OKF Conversion
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as DocumentCategory) || 'general';
    const userId = (formData.get('userId') as string) || undefined;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = file.type || 'text/plain';
    const fileSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse raw text
    const parsed = await DocumentParser.parseFile(buffer, fileName, fileType);
    
    // 2. Synthesize into Open Knowledge Format (OKF) Markdown with YAML frontmatter
    const { okfText, title: okfTitle } = OpenKnowledgeEngine.generateOKFSynthesis(parsed.text, fileName, category);

    // 3. Chunk OKF text
    const rawChunks = DocumentParser.chunkText(okfText);
    
    if (rawChunks.length === 0) {
      return NextResponse.json({ error: 'Document contains no extractable text' }, { status: 400 });
    }

    const documentId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    const docItem: DocumentItem = {
      id: documentId,
      title: okfTitle,
      fileName,
      fileType: (fileName.split('.').pop()?.toLowerCase() || 'txt') as any,
      fileSize,
      chunkCount: rawChunks.length,
      category,
      userId,
      createdAt: nowStr,
      isAdmin: false,
      isOKF: true,
      okfContent: okfText,
    };

    // 4. Generate embeddings
    const chunks: DocumentChunk[] = [];
    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      const { embedding } = await EmbeddingRouter.generateEmbedding(chunk.content);
      chunks.push({
        id: crypto.randomUUID(),
        documentId,
        content: chunk.content,
        embedding,
        metadata: {
          fileName,
          title: okfTitle,
          chunkIndex: i,
          category,
          isOKF: true,
        },
      });
    }

    // 5. Save to database or local vector store
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: docErr } = await supabase.from('documents').insert({
          id: documentId,
          title: okfTitle,
          file_name: fileName,
          file_type: docItem.fileType,
          file_size: fileSize,
          chunk_count: rawChunks.length,
          category,
          user_id: userId || null,
          created_at: nowStr,
        });

        if (!docErr) {
          const chunkInserts = chunks.map(c => ({
            id: c.id,
            document_id: documentId,
            content: c.content,
            embedding: c.embedding,
            metadata: c.metadata,
          }));

          await supabase.from('document_chunks').insert(chunkInserts);
        }
      } catch (dbErr) {
        console.warn('Supabase storage failed, using dynamic local store:', dbErr);
      }
    }

    localVectorStore.addDocument(docItem, chunks);

    return NextResponse.json({
      success: true,
      document: docItem,
      chunkCount: chunks.length,
      isOKF: true,
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('documents').delete().eq('id', id);
    }

    localVectorStore.deleteDocument(id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
