-- Supabase PostgreSQL + pgvector Migration Schema (Idempotent: Safe to run multiple times)

-- 1. Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documents metadata table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT,
  chunk_count INT DEFAULT 0,
  category TEXT DEFAULT 'general',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Document RLS policies (Drop existing first to prevent duplicate errors)
DROP POLICY IF EXISTS "Users can read own or admin documents" ON documents;
CREATE POLICY "Users can read own or admin documents" ON documents
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid() OR is_admin = true
  );

DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (
    user_id IS NULL OR user_id = auth.uid()
  );

-- 3. Document chunks & vector embeddings table (768 dimensions for Gemini Embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read chunks for accessible documents" ON document_chunks;
CREATE POLICY "Users can read chunks for accessible documents" ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = document_chunks.document_id 
        AND (d.user_id IS NULL OR d.user_id = auth.uid() OR d.is_admin = true)
    )
  );

-- Index for vector similarity search (HNSW)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 4. Analytics logs table
CREATE TABLE IF NOT EXISTS analytics_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  latency_ms INT NOT NULL,
  status_code INT DEFAULT 200,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  is_fallback BOOLEAN DEFAULT false,
  error_message TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vector Cosine Similarity Search RPC Function with User Isolation
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding)) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE (1 - (dc.embedding <=> query_embedding)) >= match_threshold
    AND (p_user_id IS NULL OR d.user_id = p_user_id OR d.user_id IS NULL OR d.is_admin = true)
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
