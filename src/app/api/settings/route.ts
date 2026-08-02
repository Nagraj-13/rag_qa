import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeMode, RouterStrategy } from '@/types/rag';

/**
 * In-memory system settings store.
 * In production, persist to a `system_settings` table in Supabase.
 */
interface SystemSettings {
  knowledgeMode: KnowledgeMode;
  routerStrategy: RouterStrategy;
  updatedAt: string;
  updatedBy: string | null;
}

let systemSettings: SystemSettings = {
  knowledgeMode: 'okf',
  routerStrategy: 'smart',
  updatedAt: new Date().toISOString(),
  updatedBy: null,
};

export async function GET() {
  return NextResponse.json(systemSettings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { knowledgeMode, routerStrategy, adminEmail } = body;

    if (knowledgeMode && (knowledgeMode === 'okf' || knowledgeMode === 'standard-rag')) {
      systemSettings.knowledgeMode = knowledgeMode;
    }

    if (routerStrategy && ['smart', 'round-robin', 'priority-fallback'].includes(routerStrategy)) {
      systemSettings.routerStrategy = routerStrategy;
    }

    systemSettings.updatedAt = new Date().toISOString();
    systemSettings.updatedBy = adminEmail || null;

    return NextResponse.json({ success: true, settings: systemSettings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
