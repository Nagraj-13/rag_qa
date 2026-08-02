import { NextRequest, NextResponse } from 'next/server';
import { SettingsStore } from '@/lib/settings/store';

export async function GET() {
  try {
    const settings = await SettingsStore.getSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { knowledgeMode, routerStrategy, adminEmail } = body;

    const updated = await SettingsStore.updateSettings(knowledgeMode, routerStrategy, adminEmail);

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
