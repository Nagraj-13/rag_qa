'use client';

import React, { useState, useEffect } from 'react';
import { Database, BarChart3, Settings, Shield } from 'lucide-react';
import { DocumentManager } from '@/components/documents/document-manager';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { RouterConfigPanel } from '@/components/settings/router-config-modal';
import { KnowledgeMode } from '@/types/rag';

interface AdminPanelProps {
  userId: string;
  adminEmail: string;
}

type AdminTab = 'documents' | 'analytics' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ userId, adminEmail }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('documents');
  const [knowledgeMode, setKnowledgeMode] = useState<KnowledgeMode>('okf');

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.knowledgeMode) setKnowledgeMode(data.knowledgeMode);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
  }, [activeTab]);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'documents', label: 'Documents', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Admin Panel</h2>
            <p className="text-[11px] text-zinc-400">Manage support documents, analytics, and system settings</p>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded-xl border border-white/[0.08] text-xs w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'documents' && <DocumentManager userId={userId} knowledgeMode={knowledgeMode} />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'settings' && <RouterConfigPanel adminEmail={adminEmail} onSettingsSaved={fetchSettings} />}
    </div>
  );
};
