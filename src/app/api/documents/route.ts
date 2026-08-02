import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { DocumentParser } from '@/lib/documents/parser';
import { OpenKnowledgeEngine } from '@/lib/wiki/open-knowledge';
import { EmbeddingRouter } from '@/lib/embeddings/embedding-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { DocumentItem, DocumentChunk, DocumentCategory } from '@/types/rag';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const docId = searchParams.get('id');

    const supabase = getSupabaseClient();

    // If docId specified, return document chunks
    if (docId) {
      if (supabase) {
        try {
          const { data: chunkData } = await supabase.from('document_chunks').select('*').eq('document_id', docId);
          if (chunkData) {
            const chunks = chunkData.map(c => ({ id: c.id, content: c.content, metadata: c.metadata }));
            return NextResponse.json({ chunks });
          }
        } catch { /* fallback to local store */ }
      }

      const localChunks = localVectorStore.getChunksByDocumentId(docId);
      return NextResponse.json({ chunks: localChunks });
    }

    if (supabase) {
      try {
        let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
        const { data, error } = await query;
        if (!error && data) {
          const documents: DocumentItem[] = data.map(doc => ({
            id: doc.id,
            title: doc.title,
            fileName: doc.file_name,
            fileType: doc.file_type,
            fileSize: doc.file_size,
            chunkCount: doc.chunk_count,
            category: doc.category || 'general',
            userId: doc.user_id,
            createdAt: doc.created_at,
            isAdmin: doc.is_admin ?? true,
            isOKF: doc.is_okf ?? false,
            okfContent: doc.okf_content || undefined,
          }));

          return NextResponse.json({ documents });
        }
      } catch (dbErr) {
        console.warn('Supabase document list error, using local fallback:', dbErr);
      }
    }

    const docs = localVectorStore.getDocuments(userId);
    return NextResponse.json({ documents: docs });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Fetch current knowledge mode setting (standard-rag vs okf)
    let knowledgeMode = 'standard-rag';
    try {
      const settingsRes = await fetch(new URL('/api/settings', req.url).toString());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        knowledgeMode = settings.knowledgeMode || 'standard-rag';
      }
    } catch { /* default */ }

    // 2. Handle Multipart Form Upload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as DocumentCategory) || 'customer_support';
    const userId = (formData.get('userId') as string) || undefined;
    const relativePath = (formData.get('relativePath') as string) || (file?.name || '');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Preserve folder path (e.g. docs/okf_wiki/customer_support/01_sla.md) if uploaded as folder
    const fileName = relativePath || file.name;
    const fileType = file.type || 'text/plain';
    const fileSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Parse raw document text using DocumentParser (.pdf, .docx, .txt, .md)
    const parsed = await DocumentParser.parseFile(buffer, fileName, fileType);
    
    let processedText = parsed.text;
    let documentTitle = parsed.title || fileName;
    const isOKFMode = knowledgeMode === 'okf';

    // If OKF Mode is enabled in settings, synthesize into OKF Markdown with YAML frontmatter
    if (isOKFMode) {
      const okfResult = OpenKnowledgeEngine.generateOKFSynthesis(parsed.text, fileName, category);
      processedText = okfResult.okfText;
      documentTitle = okfResult.title;
    }

    // 4. Chunk text semantically (~500 tokens / 100 token overlap)
    const rawChunks = DocumentParser.chunkText(processedText);
    
    if (rawChunks.length === 0) {
      return NextResponse.json({ error: 'Document contains no extractable text. Please ensure the file contains valid text or headings.' }, { status: 400 });
    }

    const documentId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    const docItem: DocumentItem = {
      id: documentId,
      title: documentTitle,
      fileName,
      fileType: (fileName.split('.').pop()?.toLowerCase() || 'txt') as any,
      fileSize,
      chunkCount: rawChunks.length,
      category,
      userId,
      createdAt: nowStr,
      isAdmin: true,
      isOKF: isOKFMode,
      okfContent: isOKFMode ? processedText : undefined,
    };

    // 5. Generate 768-dimensional vector embeddings for each chunk
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
          title: documentTitle,
          chunkIndex: i,
          category,
          isOKF: isOKFMode,
        },
      });
    }

    // 6. Save document & vector embeddings into PostgreSQL / pgvector and local store
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: docErr } = await supabase.from('documents').insert({
          id: documentId,
          title: documentTitle,
          file_name: fileName,
          file_type: docItem.fileType,
          file_size: fileSize,
          chunk_count: rawChunks.length,
          category,
          user_id: userId || null,
          is_admin: true,
          is_okf: isOKFMode,
          okf_content: isOKFMode ? processedText : null,
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
        console.warn('Supabase storage error, stored in dynamic local vector store:', dbErr);
      }
    }

    localVectorStore.addDocument(docItem, chunks);

    return NextResponse.json({
      success: true,
      document: docItem,
      chunkCount: chunks.length,
      knowledgeMode,
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
