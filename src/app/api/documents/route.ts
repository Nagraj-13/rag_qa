import { NextRequest, NextResponse } from 'next/server';
import { DocumentParser } from '@/lib/documents/parser';
import { EmbeddingRouter } from '@/lib/embeddings/embedding-router';
import { getSupabaseClient, localVectorStore } from '@/lib/supabase/client';
import { DocumentItem, DocumentChunk } from '@/types/rag';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const docs: DocumentItem[] = data.map(d => ({
          id: d.id,
          title: d.title,
          fileName: d.file_name,
          fileType: d.file_type,
          fileSize: d.file_size,
          chunkCount: d.chunk_count || 0,
          createdAt: d.created_at,
          isAdmin: d.is_admin,
        }));
        return NextResponse.json({ documents: docs });
      }
    }

    // Fallback local memory documents
    return NextResponse.json({ documents: localVectorStore.getDocuments() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = file.type || 'text/plain';
    const fileSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse raw document text
    const parsed = await DocumentParser.parseFile(buffer, fileName, fileType);
    
    // 2. Chunk text with overlapping window
    const rawChunks = DocumentParser.chunkText(parsed.text);
    
    if (rawChunks.length === 0) {
      return NextResponse.json({ error: 'Document contains no extractable text' }, { status: 400 });
    }

    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowStr = new Date().toISOString();

    const docItem: DocumentItem = {
      id: documentId,
      title: fileName,
      fileName,
      fileType: (fileName.split('.').pop()?.toLowerCase() || 'txt') as any,
      fileSize,
      chunkCount: rawChunks.length,
      createdAt: nowStr,
      isAdmin: false,
    };

    // 3. Generate embeddings for each chunk
    const chunks: DocumentChunk[] = [];
    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      const { embedding } = await EmbeddingRouter.generateEmbedding(chunk.content);
      chunks.push({
        id: `chunk-${documentId}-${i}`,
        documentId,
        content: chunk.content,
        embedding,
        metadata: {
          fileName,
          title: fileName,
          chunkIndex: i,
        },
      });
    }

    // 4. Save into Supabase pgvector or Local Store
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: docErr } = await supabase.from('documents').insert({
          id: documentId,
          title: fileName,
          file_name: fileName,
          file_type: docItem.fileType,
          file_size: fileSize,
          chunk_count: rawChunks.length,
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
        console.warn('Supabase storage failed, using local store:', dbErr);
      }
    }

    localVectorStore.addDocument(docItem, chunks);

    return NextResponse.json({
      success: true,
      document: docItem,
      chunkCount: chunks.length,
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
