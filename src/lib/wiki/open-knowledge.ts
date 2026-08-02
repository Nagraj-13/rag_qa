import { SourceCitation, WebReference } from '@/types/rag';

export class OpenKnowledgeEngine {
  /**
   * Synthesizes raw uploaded document text into strict Open Knowledge Format (OKF) Markdown with YAML frontmatter
   */
  public static generateOKFSynthesis(rawText: string, fileName: string, category: string): { okfText: string; title: string; docId: string; tags: string[] } {
    const cleanTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const docId = `okf-${category}-${Math.random().toString(36).substring(2, 9)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const tags = [category, 'okf-wiki', 'customer-support'];
    const lower = rawText.toLowerCase();
    if (lower.includes('sla')) tags.push('sla');
    if (lower.includes('refund') || lower.includes('billing')) tags.push('refund-policy');
    if (lower.includes('rate limit') || lower.includes('429')) tags.push('rate-limits');
    if (lower.includes('warranty') || lower.includes('return')) tags.push('warranty');

    const frontmatter = `---
title: "${cleanTitle}"
doc_id: "${docId}"
category: "${category}"
version: "2.5"
updated_at: "${nowStr}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
schema_version: "okf-v1.0"
---`;

    const body = `# ${cleanTitle}

## 📖 Executive Summary & Overview
${rawText.slice(0, 350)}...

## 💡 Core Knowledge & Policy Specifications
${rawText}

## 🔗 Open Knowledge Cross-References & Related Wiki Documents
- [Customer Support SLA & Escalation Guidelines](file:///f:/Projects/FreeLance/rag_qa/docs/okf_demo_docs/01_okf_customer_support_sla_and_escalation.md)
- [Subscription Billing & Refund Policy](file:///f:/Projects/FreeLance/rag_qa/docs/okf_demo_docs/02_okf_billing_refund_and_subscription.md)
- [Technical Troubleshooting FAQ](file:///f:/Projects/FreeLance/rag_qa/docs/okf_demo_docs/03_okf_technical_troubleshooting_faq.md)`;

    return {
      okfText: `${frontmatter}\n\n${body}`,
      title: cleanTitle,
      docId,
      tags
    };
  }

  /**
   * Generates relevant Open Knowledge & Web References based on query keywords
   */
  public static getWebReferences(query: string): WebReference[] {
    const q = query.toLowerCase();
    const refs: WebReference[] = [];

    if (q.includes('rate limit') || q.includes('429') || q.includes('groq') || q.includes('gemini') || q.includes('openrouter')) {
      refs.push({
        title: 'IETF RFC 6585 — HTTP 429 Too Many Requests Standard',
        url: 'https://datatracker.ietf.org/doc/html/rfc6585#section-4',
        snippet: 'Standard specification for HTTP 429 Too Many Requests rate-limiting and retry headers.',
        source: 'IETF Standards',
      });
      refs.push({
        title: 'Groq Cloud API Reference & Rate Limits Guide',
        url: 'https://console.groq.com/docs/rate-limits',
        snippet: 'Official Groq API rate limits, tokens per minute (TPM), and request quotas.',
        source: 'Groq Docs',
      });
      refs.push({
        title: 'Google Gemini API Rate Limits & Quotas Documentation',
        url: 'https://ai.google.dev/gemini-api/docs/quota',
        snippet: 'Official Google Gemini 2.5 & 2.0 Flash API rate limit and quota policies.',
        source: 'Google AI Dev',
      });
    }

    if (q.includes('sla') || q.includes('escalation') || q.includes('support') || q.includes('ticket')) {
      refs.push({
        title: 'ITIL v4 Service Level Management & Incident Escalation Framework',
        url: 'https://www.axelos.com/certifications/itil-service-management',
        snippet: 'Global IT service management standards for incident priority classification and escalation ladders.',
        source: 'ITIL Standards',
      });
      refs.push({
        title: 'Customer Service SLA Best Practices (ISO/IEC 20000)',
        url: 'https://www.iso.org/standard/70636.html',
        snippet: 'International standard for IT service management and SLA target definitions.',
        source: 'ISO Standard',
      });
    }

    if (q.includes('refund') || q.includes('billing') || q.includes('plan') || q.includes('subscription') || q.includes('gdpr') || q.includes('soc2')) {
      refs.push({
        title: 'EU Consumer Rights Directive & Digital Software Cancellation Guidelines',
        url: 'https://ec.europa.eu/info/law/law-topic/consumer-protection-law/consumer-contract-law/consumer-rights-directive_en',
        snippet: 'European Union statutory consumer guidelines on digital software refunds and cancellations.',
        source: 'EU Law',
      });
      refs.push({
        title: 'SOC 2 & GDPR Data Retention & Erasure Standards',
        url: 'https://gdpr.eu/article-17-right-to-be-forgotten/',
        snippet: 'Standard compliance framework for user data deletion and vector store scrubbing post-cancellation.',
        source: 'GDPR Org',
      });
    }

    if (q.includes('vector') || q.includes('pgvector') || q.includes('embedding') || q.includes('supabase') || q.includes('rag')) {
      refs.push({
        title: 'OpenAI Embeddings & Vector Search Architecture Guide',
        url: 'https://platform.openai.com/docs/guides/embeddings',
        snippet: 'Fundamentals of vector similarity search, cosine distance, and embedding models.',
        source: 'OpenAI Docs',
      });
      refs.push({
        title: 'Supabase pgvector Extension & Cosine Similarity RPCs',
        url: 'https://supabase.com/docs/guides/database/extensions/pgvector',
        snippet: 'Official Supabase guide for storing vectors and executing HNSW & IVFFlat similarity matches.',
        source: 'Supabase Docs',
      });
    }

    if (q.includes('return') || q.includes('warranty') || q.includes('hardware') || q.includes('rma')) {
      refs.push({
        title: 'FTC Magnuson-Moss Warranty Act & Consumer Electronics Returns',
        url: 'https://www.ftc.gov/business-guidance/resources/businesspersons-guide-federal-warranty-law',
        snippet: 'Federal guidelines on limited hardware warranties, return windows, and RMA compliance.',
        source: 'FTC Gov',
      });
    }

    if (refs.length === 0) {
      refs.push({
        title: 'Retrieval-Augmented Generation (RAG) Architecture Overview',
        url: 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation',
        snippet: 'Wikipedia reference on Retrieval-Augmented Generation (RAG) and open knowledge synthesis.',
        source: 'Wikipedia',
      });
      refs.push({
        title: 'W3C Open Knowledge & Web Architecture Standards',
        url: 'https://www.w3.org/TR/webarch/',
        snippet: 'W3C recommendations for open knowledge structuring and interlinked web resources.',
        source: 'W3C Org',
      });
    }

    return refs;
  }

  /**
   * Formats response into strict LLM Wiki / Open Knowledge Format (OKF)
   */
  public static formatOpenKnowledgeWiki(
    answer: string,
    query: string,
    citations: SourceCitation[] = []
  ): { formattedAnswer: string; webReferences: WebReference[] } {
    const webRefs = this.getWebReferences(query);

    let wikiFormatted = answer;

    if (!wikiFormatted.includes('### 📖') && !wikiFormatted.includes('# ')) {
      wikiFormatted = `### 📖 Summary & Definition\n${wikiFormatted}`;
    }

    if (!wikiFormatted.includes('### 🌐 Open Knowledge & Web References') && webRefs.length > 0) {
      const webSection = `\n\n---\n### 🌐 Open Knowledge & Web References (Internet Standards & External Docs)\n` +
        webRefs.map(r => `• 🔗 [**${r.title}**](${r.url}) — *${r.snippet}* (${r.source})`).join('\n');

      wikiFormatted += webSection;
    }

    return { formattedAnswer: wikiFormatted, webReferences: webRefs };
  }
}
