'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Database, BarChart3, Settings, Sparkles, User, LogIn, LogOut, Home as HomeIcon, Lock } from 'lucide-react';
import { LandingPage } from '@/components/landing/landing-page';
import { ChatInterface } from '@/components/chat/chat-interface';
import { DocumentManager } from '@/components/documents/document-manager';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
import { RouterConfigModal } from '@/components/settings/router-config-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { getCurrentUser, signOutUser, UserProfile } from '@/lib/supabase/auth';
import { RouterStrategy } from '@/types/rag';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'documents' | 'analytics'>('home');
  const [strategy, setStrategy] = useState<RouterStrategy>('smart');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<'chat' | 'documents' | 'analytics' | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) {
        setUser(u);
        setActiveTab('chat');
      }
    });
  }, []);

  const handleTabClick = (tab: 'home' | 'chat' | 'documents' | 'analytics') => {
    if (tab === 'home') {
      setActiveTab('home');
      return;
    }

    // Require Auth for workspace tabs (Chat, Documents, Analytics)
    if (!user) {
      setPendingTab(tab);
      setIsAuthOpen(true);
      return;
    }

    setActiveTab(tab);
  };

  const handleAuthSuccess = (u: UserProfile) => {
    setUser(u);
    setIsAuthOpen(false);
    
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    } else {
      setActiveTab('chat');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Title */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Antigravity RAG
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Enterprise AI
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">Smart Enterprise Knowledge Assistant</p>
            </div>
          </button>

          {/* Tab Navigation Controls with Strict Auth Checks */}
          <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => handleTabClick('home')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              Home
            </button>

            <button
              onClick={() => handleTabClick('chat')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Assistant
              {!user && <Lock className="w-3 h-3 text-zinc-500 ml-0.5" />}
            </button>

            <button
              onClick={() => handleTabClick('documents')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'documents'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Knowledge Base
              {!user && <Lock className="w-3 h-3 text-zinc-500 ml-0.5" />}
            </button>

            <button
              onClick={() => handleTabClick('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Admin Analytics
              {!user && <Lock className="w-3 h-3 text-zinc-500 ml-0.5" />}
            </button>
          </nav>

          {/* Settings & Auth Button */}
          <div className="flex items-center gap-3">
            
            {user ? (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[120px] text-zinc-200 font-medium">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="ml-1 p-1 hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm"
              title="Settings Menu"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main View Area with Strict Auth Route Guards */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'home' && (
          <LandingPage
            onStartChat={() => handleTabClick('chat')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenDocuments={() => handleTabClick('documents')}
            isAuthenticated={!!user}
          />
        )}

        {/* Protected Application Workspaces (Require Auth) */}
        {user ? (
          <>
            {activeTab === 'chat' && (
              <ChatInterface
                routerStrategy={strategy}
                userId={user.id}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
            {activeTab === 'documents' && <DocumentManager userId={user.id} />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
          </>
        ) : (
          activeTab !== 'home' && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 max-w-md mx-auto">
              <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Authentication Required</h3>
              <p className="text-xs text-zinc-400">Please sign in to access your Chat Assistant, Knowledge Base, and Admin Analytics.</p>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In / Create Account
              </button>
            </div>
          )
        )}
      </main>

      {/* Settings Modal */}
      <RouterConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        strategy={strategy}
        onStrategyChange={setStrategy}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingTab(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}
