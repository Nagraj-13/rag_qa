'use client';

import React from 'react';
import { MessageSquare, ArrowRight, Shield, Clock, CheckCircle2, HeadphonesIcon, FileText, Zap } from 'lucide-react';

interface LandingPageProps {
  onStartChat: () => void;
  onOpenAuth: () => void;
  onOpenDocuments: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartChat,
  onOpenAuth,
  onOpenDocuments,
  isAuthenticated,
  isAdmin,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-20 py-8">
      
      {/* Hero */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-8">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-zinc-300 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Available 24/7</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
          How can we help <br />
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            you today?
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Get instant answers about billing, refunds, account access, product support, returns, and more. Our AI assistant is here to help.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={onStartChat}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Start a Conversation
            <ArrowRight className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={onOpenDocuments}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#121215] text-zinc-200 hover:text-white font-medium text-sm border border-white/[0.1] hover:border-white/20 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              Admin Panel
            </button>
          )}

          {!isAuthenticated && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#121215] text-zinc-200 hover:text-white font-medium text-sm border border-white/[0.1] hover:border-white/20 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="linear-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Instant Answers</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Get accurate answers in seconds, powered by your company's actual support documents and policies.
          </p>
        </div>

        <div className="linear-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">24/7 Availability</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            No wait times. Get help anytime, day or night, without waiting for a human agent.
          </p>
        </div>

        <div className="linear-card p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Verified Responses</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every answer is backed by your company's official documents — no hallucinations or guesswork.
          </p>
        </div>
      </section>

      {/* Common Topics */}
      <section className="text-center space-y-6">
        <h2 className="text-lg font-semibold text-white tracking-tight">Common Support Topics</h2>
        <div className="flex flex-wrap justify-center gap-2.5">
          {[
            'Billing & Invoices',
            'Refund Policy',
            'Account Access',
            'Product Returns',
            'Subscription Plans',
            'Technical Support',
            'Warranty Claims',
            'Privacy Policy',
          ].map((topic) => (
            <button
              key={topic}
              onClick={onStartChat}
              className="px-4 py-2 rounded-full bg-[#121215] text-zinc-300 hover:text-white text-xs border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

    </div>
  );
};
