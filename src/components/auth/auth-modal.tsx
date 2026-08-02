'use client';

import React, { useState } from 'react';
import { LogIn, UserPlus, X, Mail, Lock, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, UserProfile } from '@/lib/supabase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const res = await signUpWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          setMessage('Account created successfully!');
          onAuthSuccess(res.user);
          onClose();
        } else {
          setMessage('Registration complete! Check your email to confirm your account.');
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else if (res.user) {
          onAuthSuccess(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#09090b] border border-white/10 rounded-xl max-w-md w-full p-6 space-y-5 shadow-[0_0_50px_-10px_rgba(0,0,0,0.9)] relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md bg-[#121215] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-semibold text-sm tracking-tight">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{isSignUp ? 'Create Enterprise Account' : 'Sign In to Workspace'}</span>
          </div>
          <p className="text-xs text-zinc-400">
            {isSignUp ? 'Create an account to manage your document knowledge base and assistant.' : 'Sign in to access your saved document knowledge base and chat telemetry.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#121215] border border-white/[0.08] focus:border-indigo-500/80 rounded-lg pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121215] border border-white/[0.08] focus:border-indigo-500/80 rounded-lg pl-9 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {loading ? (
              <span className="text-xs font-mono">Authenticating...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="pt-2 text-center text-xs text-zinc-400">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null); setEmail(''); setPassword(''); }}
                className="text-white hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setIsSignUp(true); setError(null); setMessage(null); setEmail(''); setPassword(''); }}
                className="text-white hover:underline font-semibold cursor-pointer"
              >
                Create Account
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
