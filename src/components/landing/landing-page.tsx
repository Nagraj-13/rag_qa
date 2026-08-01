'use client';

import React from 'react';
import { Sparkles, MessageSquare, Database, ShieldCheck, ArrowRight, UploadCloud, Activity, Zap, CheckCircle2, Search, FileCheck, Layers } from 'lucide-react';

interface LandingPageProps {
  onStartChat: () => void;
  onOpenAuth: () => void;
  onOpenDocuments: () => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartChat,
  onOpenAuth,
  onOpenDocuments,
  isAuthenticated,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Enterprise Knowledge Intelligence Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Instant, Accurate Answers from <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
            Your Entire Knowledge Base
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Upload your customer support manuals, product guides, and FAQs. Get instant AI answers backed by exact source citations and guaranteed 24/7 availability.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onStartChat}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105"
          >
            <MessageSquare className="w-4 h-4" />
            Start Asking Questions
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isAuthenticated ? (
            <button
              onClick={onOpenAuth}
              className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Sign In / Create Account
            </button>
          ) : (
            <button
              onClick={onOpenDocuments}
              className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              Upload Company Documents
            </button>
          )}
        </div>
      </section>

      {/* Product Benefits Showcase Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 hover:border-indigo-500/50 transition-all space-y-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">Guaranteed 24/7 Uptime</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Automatic multi-engine failover ensures your customer support and internal teams never experience rate limits or AI outages.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 hover:border-indigo-500/50 transition-all space-y-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">Verified Source Citations</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Trust every response. Every AI answer includes clickable document source badges so users can verify exact snippets and pages.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 hover:border-indigo-500/50 transition-all space-y-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">Centralized Knowledge Hub</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Organize customer support guides, FAQs, technical manuals, and product documentation into one searchable workspace.
          </p>
        </div>

      </section>

      {/* Customer & Team Value Banner */}
      <section className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Supercharge Your Customer Support & Product Teams
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl">
            Empower your users with instant self-service answers and enable support agents to resolve complex customer tickets in seconds.
          </p>
        </div>

        <button
          onClick={onStartChat}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 whitespace-nowrap transition-all"
        >
          Try Assistant Now
        </button>
      </section>

    </div>
  );
};
