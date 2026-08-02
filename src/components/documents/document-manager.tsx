'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Database, RefreshCw, AlertCircle, Layers, Tag, BookOpen, Sparkles, X, Eye, HelpCircle, FileCheck } from 'lucide-react';
import { DocumentItem, DocumentCategory, KnowledgeMode } from '@/types/rag';

interface DocumentManagerProps {
  userId?: string;
  knowledgeMode?: KnowledgeMode;
}

const OKF_SCHEMA_DEMO = `===================================================================
📂 OPEN KNOWLEDGE FORMAT (OKF) — MASTER WIKI DIRECTORY STRUCTURE
===================================================================

docs/okf_wiki/
├── INDEX.md (Master Knowledge Base Index & Entity Directory)
├── customer_support/
│   └── 01_sla_and_escalation.md (SLA, Response Times & Escalation Ladder)
├── billing/
│   └── 02_refund_and_subscription.md (30-Day Guarantee, Plans & GDPR Purge)
├── technical/
│   └── 03_troubleshooting_faq.md (HTTP 429 Failover, Router & Vector Limits)
└── returns/
    └── 04_warranty_and_rma.md (Hardware Warranty, Return Windows & RMA)


===================================================================
📄 1. MASTER WIKI INDEX FILE: docs/okf_wiki/INDEX.md
===================================================================
---
title: "Open Knowledge Base — Master Wiki Index"
doc_id: "okf-index-master"
category: "master_index"
version: "2.5"
updated_at: "2026-08-02"
tags: ["index", "master-wiki", "customer-support", "okf-schema"]
entities: ["Tier 1 Specialist", "Tier 2 Engineer", "Billing Team", "Compliance Officer", "Smart Router"]
schema_version: "okf-v1.0"
---

# 📚 Open Knowledge Base — Master Wiki Index

## 📖 Executive Summary
Master directory and category index for Antigravity Enterprise Customer Support Open Knowledge Format (OKF) Wiki.

## 📂 Category Directory Map
- customer_support/ — SLA, Response Times & Escalation Matrix
- billing/ — Subscription Plans, Refunds & Data Purge Rules
- technical/ — Router 429 Failovers & Vector Database Limits
- returns/ — Warranty Terms & RMA Procedures

## 💡 Wiki Category Index & Cross-References
- [Customer Support SLA & Escalation](file:///f:/Projects/FreeLance/rag_qa/docs/okf_wiki/customer_support/01_sla_and_escalation.md)
- [Subscription Billing & Refund Policy](file:///f:/Projects/FreeLance/rag_qa/docs/okf_wiki/billing/02_refund_and_subscription.md)
- [Technical Support FAQ](file:///f:/Projects/FreeLance/rag_qa/docs/okf_wiki/technical/03_troubleshooting_faq.md)
- [Product Returns & Warranty](file:///f:/Projects/FreeLance/rag_qa/docs/okf_wiki/returns/04_warranty_and_rma.md)


===================================================================
📄 2. SAMPLE WIKI ENTRY FILE: docs/okf_wiki/customer_support/01_sla_and_escalation.md
===================================================================
---
title: "Customer Support SLA & Incident Escalation Policy"
doc_id: "okf-cs-sla-01"
category: "customer_support"
version: "2.5"
updated_at: "2026-08-02"
tags: ["sla", "escalation", "support", "incidents", "p1-outage"]
entities: ["Tier 1 Specialist", "Tier 2 Engineer", "Support Director"]
schema_version: "okf-v1.0"
---

# Customer Support SLA & Incident Escalation Policy

## 📖 Executive Summary
Antigravity Enterprise provides 24/7 technical support and incident management for high-availability knowledge base systems.

## 💡 Core Knowledge & Policy Specifications
- Priority 1 (P1 - Critical Outage): System down for all users. Initial response under 15 minutes, target resolution under 2 hours. Coverage: 24/7 Phone & Slack Connect.
- Priority 2 (P2 - Major Degraded Service): Severe latency or single LLM provider outage. Initial response under 1 hour, target resolution under 6 hours. Coverage: 24/7 Email & Slack.
- Priority 3 (P3 - Minor Issue): Individual user access issues. Initial response under 4 business hours. Coverage: Mon-Fri 8 AM - 8 PM EST.

## 🔍 Incident Escalation Matrix
1. Level 1: Tier 1 Support Specialist (Initial triage & log collection)
2. Level 2: Tier 2 Systems & RAG Engineer (Model router & pgvector debugging)
3. Level 3: Tier 3 Lead AI Architect (Core API & RPC fix)
4. Executive: Support Director (support-escalations@antigravity.ai)

## 🔗 Cross-References & Related Wiki Documents
- [Master Wiki Index](file:///f:/Projects/FreeLance/rag_qa/docs/okf_wiki/INDEX.md)
- [Subscription Billing & Refund Policy](file:///f:/Projects/FreeLance/rag_qa/docs/okf_wiki/billing/02_refund_and_subscription.md)
- [Technical Troubleshooting FAQ](file:///f:/Projects/FreeLance/rag_qa/docs/okf_wiki/technical/03_troubleshooting_faq.md)`;

export const DocumentManager: React.FC<DocumentManagerProps> = ({ userId, knowledgeMode: propKnowledgeMode }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>('customer_support');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingOKFDoc, setViewingOKFDoc] = useState<DocumentItem | null>(null);
  const [showDemoSchema, setShowDemoSchema] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeKnowledgeMode, setActiveKnowledgeMode] = useState<KnowledgeMode>(propKnowledgeMode || 'okf');

  useEffect(() => {
    if (propKnowledgeMode) {
      setActiveKnowledgeMode(propKnowledgeMode);
    } else {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.knowledgeMode) setActiveKnowledgeMode(data.knowledgeMode);
        })
        .catch(() => {});
    }
  }, [propKnowledgeMode]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url = userId ? `/api/documents?userId=${userId}` : '/api/documents';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const uploadSingleFile = async (file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (userId) formData.append('userId', userId);

    const res = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Failed to upload ${file.name}`);
    return true;
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const total = files.length;
    setUploadProgress({ current: 0, total });

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadStatus(`Processing ${file.name} (${i + 1}/${total})...`);
        setUploadProgress({ current: i + 1, total });
        await uploadSingleFile(file);
      }

      setUploadStatus(`Successfully uploaded ${total} document${total > 1 ? 's' : ''}!`);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleImportDemoRAG = async () => {
    setUploading(true);
    setError(null);
    setUploadStatus('Importing sample Word (.docx) customer support documents...');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_demo_rag' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import demo Word documents');
      }

      setUploadStatus(`Imported ${data.count} sample Word (.docx) customer support documents!`);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to import demo Word documents');
    } finally {
      setUploading(false);
    }
  };

  const handleImportDemoOKF = async () => {
    setUploading(true);
    setError(null);
    setUploadStatus('Importing predefined Demo OKF Customer Support bundle...');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_demo_okf' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import demo documents');
      }

      setUploadStatus(`Imported ${data.count} demo OKF documents!`);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to import demo documents');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and its vector embeddings?')) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      }
    } catch (err: any) {
      alert('Failed to delete document');
    }
  };

  const getCategoryBadge = (cat?: DocumentCategory) => {
    const labels: Record<DocumentCategory, { name: string; style: string }> = {
      customer_support: { name: 'Support', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      product_guide: { name: 'Product', style: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
      faq: { name: 'FAQ', style: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
      tech_specs: { name: 'Technical', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      general: { name: 'General', style: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
    };

    const target = labels[cat || 'general'] || labels.general;

    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono tracking-tight border ${target.style}`}>
        {target.name}
      </span>
    );
  };

  const isOKFMode = activeKnowledgeMode === 'okf';

  return (
    <div className="space-y-6">
      
      {/* Active Knowledge Mode Status Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0e0e11] border border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400">Current Mode:</span>
          {isOKFMode ? (
            <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> OKF / LLM Wiki Ingestion
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Standard RAG Ingestion
            </span>
          )}
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">
          {isOKFMode ? 'Documents auto-converted to YAML frontmatter wiki' : 'Direct vector chunk indexing'}
        </span>
      </div>

      {/* Upload Section */}
      <div className="linear-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              {isOKFMode ? 'Upload & Synthesize OKF Knowledge Bundles' : 'Upload Vector RAG Documents'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isOKFMode
                ? 'Upload support files or load pre-compiled OKF bundles to synthesize structured wiki Markdown with YAML frontmatter.'
                : 'Upload support documents (SLA, privacy policy, refund policy, FAQs) for direct vector retrieval.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOKFMode && (
              <>
                <button
                  onClick={() => setShowDemoSchema(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#141417] hover:bg-zinc-800 text-zinc-300 border border-white/[0.1] font-mono text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Inspect OKF Demo Format
                </button>

                <button
                  onClick={handleImportDemoOKF}
                  disabled={uploading}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Demo OKF Bundle
                </button>
              </>
            )}

            <div className="flex items-center gap-1.5 bg-[#121215] p-1.5 rounded-lg border border-white/[0.08] text-xs font-mono">
              <Tag className="w-3.5 h-3.5 text-indigo-400 ml-1" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="customer_support" className="bg-[#09090b]">Support Docs</option>
                <option value="product_guide" className="bg-[#09090b]">Product Guide</option>
                <option value="faq" className="bg-[#09090b]">FAQ</option>
                <option value="tech_specs" className="bg-[#09090b]">Technical</option>
                <option value="general" className="bg-[#09090b]">General</option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-File Dropzone */}
        <div className="relative border border-dashed border-white/20 hover:border-indigo-500/60 rounded-xl p-8 text-center transition-all bg-[#09090b]/60 group">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) handleFileUpload(files);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                Drop files here or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-zinc-500 font-mono mt-1">
                {isOKFMode
                  ? 'PDF, DOCX, TXT, MD — Auto-converted to OKF Markdown with YAML Frontmatter'
                  : 'PDF, DOCX, TXT, MD — Parsed and indexed into pgvector chunks'}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{uploadStatus}</span>
            </div>
            {uploadProgress && (
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="linear-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            {isOKFMode ? 'Open Knowledge Base Repository' : 'Vector Database Storage'} ({documents.length} documents)
          </h3>
          <button
            onClick={fetchDocuments}
            className="px-2.5 py-1 rounded-md bg-[#141417] hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-500 text-xs font-mono">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs space-y-2 font-mono">
            <p>No documents uploaded yet.</p>
            {isOKFMode && (
              <button
                onClick={handleImportDemoOKF}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Demo OKF Customer Support Bundle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Document</th>
                  {isOKFMode && <th className="py-3 px-4">Format</th>}
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.fileName}</span>
                    </td>
                    {isOKFMode && (
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1 w-fit">
                          <BookOpen className="w-3 h-3" /> OKF Format
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      {getCategoryBadge(doc.category)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <Layers className="w-3 h-3" />
                        {doc.chunkCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {isOKFMode && doc.okfContent && (
                        <button
                          onClick={() => setViewingOKFDoc(doc)}
                          className="px-2 py-1 rounded-md bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-white/10 text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" /> View OKF
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OKF Demo Format Schema Modal */}
      {showDemoSchema && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-white/10 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-tight">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span>Open Knowledge Format (OKF) — Demo Schema Specification</span>
              </div>
              <button
                onClick={() => setShowDemoSchema(false)}
                className="p-1 rounded-md bg-[#121215] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed shrink-0">
              OKF bundles use strict YAML frontmatter for metadata, entities, and cross-references, followed by structured Markdown wiki sections.
            </p>

            <div className="flex-1 overflow-y-auto bg-[#050505] p-4 rounded-lg border border-white/[0.08] font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {OKF_SCHEMA_DEMO}
            </div>

            <div className="flex justify-end shrink-0 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setShowDemoSchema(false)}
                className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer"
              >
                Close Schema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Content Modal */}
      {viewingOKFDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-white/10 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-tight">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{viewingOKFDoc.fileName} — OKF Markdown</span>
              </div>
              <button
                onClick={() => setViewingOKFDoc(null)}
                className="p-1 rounded-md bg-[#121215] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#050505] p-4 rounded-lg border border-white/[0.08] font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {viewingOKFDoc.okfContent}
            </div>

            <div className="flex justify-end shrink-0 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setViewingOKFDoc(null)}
                className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
