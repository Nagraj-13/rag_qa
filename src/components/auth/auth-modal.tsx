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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
            <ShieldCheck className="w-5 h-5" />
            Secure Account Access
          </div>
          <p className="text-xs text-zinc-400">
            {isSignUp ? 'Create an account to manage your personal knowledge base and get instant AI answers.' : 'Sign in to access your saved documents, chat history, and AI assistant.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="text-xs">Processing...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="pt-2 text-center text-xs text-zinc-400">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null); setEmail(''); setPassword(''); }}
                className="text-indigo-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setIsSignUp(true); setError(null); setMessage(null); setEmail(''); setPassword(''); }}
                className="text-indigo-400 hover:underline font-semibold"
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
