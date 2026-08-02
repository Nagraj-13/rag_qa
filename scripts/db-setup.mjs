import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env and .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { Client } = pg;

async function setupDatabase() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!dbUrl || dbUrl.includes('your-database-url')) {
    console.error('\n❌ ERROR: DATABASE_URL or POSTGRES_URL is missing in .env or .env.local!');
    console.log('\n👉 How to fix:');
    console.log('1. Go to your Supabase Project Settings -> Database -> Connection string');
    console.log('2. Copy the URI string (e.g. postgresql://postgres.xxxx:yourpassword@aws-0-region.pooler.supabase.com:6543/postgres)');
    console.log('3. Add DATABASE_URL="..." to your .env file');
    console.log('4. Re-run: npm run db:setup\n');
    process.exit(1);
  }

  console.log('⚡ Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📦 Creating vector extension, tables, indexes, and match_documents RPC function...');

    const schemaSql = `
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INT,
        chunk_count INT DEFAULT 0,
        category TEXT DEFAULT 'general',
        user_id UUID,
        is_admin BOOLEAN DEFAULT false,
        is_okf BOOLEAN DEFAULT false,
        okf_content TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_okf BOOLEAN DEFAULT false;
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS okf_content TEXT;

      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY DEFAULT 'global',
        knowledge_mode TEXT DEFAULT 'okf',
        router_strategy TEXT DEFAULT 'smart',
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by TEXT
      );

      CREATE TABLE IF NOT EXISTS chat_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query TEXT NOT NULL,
        provider TEXT NOT NULL,
        model_used TEXT NOT NULL,
        latency_ms INT NOT NULL,
        retrieved_chunk_count INT DEFAULT 0,
        query_type TEXT DEFAULT 'document_rag',
        knowledge_mode TEXT DEFAULT 'okf',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS unanswered_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

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

      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(768),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

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

      CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
      ON document_chunks 
      USING hnsw (embedding vector_cosine_ops);

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
    `;

    await client.query(schemaSql);
    console.log('🎉 SUCCESS! All tables, vector indexes, and match_documents function created automatically!\n');

  } catch (err) {
    console.error('❌ Database migration failed:', err.message);
  } finally {
    await client.end();
  }
}

setupDatabase();
