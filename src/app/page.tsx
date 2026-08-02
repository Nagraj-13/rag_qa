'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Shield, Headphones, LogIn, LogOut, Home as HomeIcon, Settings } from 'lucide-react';
import { LandingPage } from '@/components/landing/landing-page';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AdminPanel } from '@/components/admin/admin-panel';
import { AuthModal } from '@/components/auth/auth-modal';
import { getCurrentUser, signOutUser, UserProfile } from '@/lib/supabase/auth';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'admin'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) setUser(u);
    });
  }, []);

  const isAdmin = user?.role === 'admin';

  const handleAuthSuccess = (u: UserProfile) => {
    setUser(u);
    setIsAuthOpen(false);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden linear-grid">
      
      {/* Ambient Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] linear-spotlight pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/[0.08] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md group-hover:shadow-indigo-500/20 transition-all">
              <Headphones className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">
                Support Center
              </h1>
              <p className="text-[11px] text-zinc-500">We're here to help</p>
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-1 bg-[#09090b]/80 p-1 rounded-xl border border-white/[0.08] text-xs backdrop-blur-md">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <HomeIcon className="w-3.5 h-3.5" />
              Home
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Support Chat
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </nav>

          {/* User Controls */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2 bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate max-w-[130px] text-[11px] text-zinc-300">{user.email}</span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    admin
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="ml-1 p-1 hover:text-rose-400 text-zinc-500 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full z-10">
        {activeTab === 'home' && (
          <LandingPage
            onStartChat={() => setActiveTab('chat')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenDocuments={() => setActiveTab('admin')}
            isAuthenticated={!!user}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'chat' && (
          <ChatInterface userId={user?.id} />
        )}

        {activeTab === 'admin' && isAdmin && user && (
          <AdminPanel userId={user.id} adminEmail={user.email} />
        )}

        {activeTab === 'admin' && !isAdmin && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 linear-card p-8 max-w-md mx-auto my-12">
            <div className="p-3 rounded-full bg-zinc-900 border border-white/10 text-rose-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">Admin Access Required</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Only administrators can access document management, analytics, and system settings.
            </p>
            {!user && (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In as Admin
              </button>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}
