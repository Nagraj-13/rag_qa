import { KnowledgeMode, RouterStrategy } from '@/types/rag';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface SystemSettings {
  knowledgeMode: KnowledgeMode;
  routerStrategy: RouterStrategy;
  updatedAt: string;
  updatedBy: string | null;
}

// Global server singleton store
let currentSettings: SystemSettings = {
  knowledgeMode: 'okf',
  routerStrategy: 'smart',
  updatedAt: new Date().toISOString(),
  updatedBy: null,
};

export class SettingsStore {
  public static async getSettings(): Promise<SystemSettings> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase.from('system_settings').select('*').single();
        if (data) {
          currentSettings = {
            knowledgeMode: (data.knowledge_mode as KnowledgeMode) || currentSettings.knowledgeMode,
            routerStrategy: (data.router_strategy as RouterStrategy) || currentSettings.routerStrategy,
            updatedAt: data.updated_at || currentSettings.updatedAt,
            updatedBy: data.updated_by || currentSettings.updatedBy,
          };
        }
      } catch {
        /* use in-memory store */
      }
    }
    return currentSettings;
  }

  public static async updateSettings(
    knowledgeMode?: KnowledgeMode,
    routerStrategy?: RouterStrategy,
    adminEmail?: string
  ): Promise<SystemSettings> {
    if (knowledgeMode && (knowledgeMode === 'okf' || knowledgeMode === 'standard-rag')) {
      currentSettings.knowledgeMode = knowledgeMode;
    }

    if (routerStrategy && ['smart', 'round-robin', 'priority-fallback'].includes(routerStrategy)) {
      currentSettings.routerStrategy = routerStrategy;
    }

    currentSettings.updatedAt = new Date().toISOString();
    currentSettings.updatedBy = adminEmail || null;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'global',
          knowledge_mode: currentSettings.knowledgeMode,
          router_strategy: currentSettings.routerStrategy,
          updated_at: currentSettings.updatedAt,
          updated_by: currentSettings.updatedBy,
        });
      } catch (err) {
        console.warn('Failed to persist settings to Supabase, using memory store:', err);
      }
    }

    return currentSettings;
  }
}
