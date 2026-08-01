'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Database, RefreshCw, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { DocumentItem } from '@/types/rag';

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
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
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setUploadStatus(`Parsing ${file.name} & generating vector embeddings...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus(`Successfully processed! Created ${data.chunkCount} vector chunks.`);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and its vector embeddings?')) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      }
    } catch (err: any) {
      alert('Failed to delete document');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Upload Zone */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-400" />
          Document Knowledge Base Ingestion
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Upload PDF, DOCX, or TXT files. Documents will be parsed, chunked, and embedded into Supabase pgvector.
        </p>

        <div className="relative border-2 border-dashed border-zinc-700/80 hover:border-indigo-500/80 rounded-xl p-8 text-center transition-all bg-zinc-950/40">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Click to browse or drag and drop your document here
              </p>
              <p className="text-xs text-zinc-500 mt-1">Supports PDF, DOCX, TXT (Max 25MB)</p>
            </div>
          </div>
        </div>

        {/* Upload feedback */}
        {uploading && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Indexed Knowledge Documents ({documents.length})
          </h3>
          <button
            onClick={fetchDocuments}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-500 text-xs">Loading vector database documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">No documents uploaded yet. Upload a PDF or TXT above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">File Type</th>
                  <th className="py-3 px-4">Vector Chunks</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.fileName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <Layers className="w-3 h-3" />
                        {doc.chunkCount} chunks
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                        title="Delete Document"
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

    </div>
  );
};
