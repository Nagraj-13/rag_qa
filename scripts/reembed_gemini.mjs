import { createClient } from '@supabase/supabase-js';

globalThis.WebSocket = class DummyWS {};

const supabaseUrl = '';
const serviceKey = '';
const geminiKey = '';

const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function embedGemini(text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: { parts: [{ text: text.replace(/\n/g, ' ').trim() }] },
      outputDimensionality: 768
    })
  });
  const data = await res.json();
  if (!data.embedding?.values) {
    throw new Error('Gemini embed error: ' + JSON.stringify(data));
  }
  return data.embedding.values;
}

async function reembedAll() {
  const { data: chunks, error } = await client.from('document_chunks').select('id, content');
  if (error) {
    console.error('Fetch chunks error:', error);
    return;
  }
  console.log(`Fetched ${chunks.length} chunks to re-embed...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`Embedding chunk ${i + 1}/${chunks.length}... `);
    const emb = await embedGemini(chunk.content);
    const { error: updateErr } = await client
      .from('document_chunks')
      .update({ embedding: JSON.stringify(emb) })
      .eq('id', chunk.id);
    if (updateErr) {
      console.log('Error:', updateErr);
    } else {
      console.log('Done.');
    }
  }

  console.log('Testing RPC match with Gemini query...');
  const queryEmb = await embedGemini('How do I return a product or get an RMA?');
  const { data: matches, error: matchErr } = await client.rpc('match_documents', {
    query_embedding: queryEmb,
    match_threshold: 0.1,
    match_count: 5
  });

  if (matchErr) {
    console.error('Match error:', matchErr);
  } else {
    console.log('Matched count:', matches.length);
    matches.forEach((m, idx) => {
      console.log(`[${idx + 1}] sim: ${m.similarity.toFixed(4)} | preview: ${m.content.slice(0, 70)}...`);
    });
  }
}

reembedAll().catch(console.error);
