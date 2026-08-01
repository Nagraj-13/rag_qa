'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, FileText, RefreshCw, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ChatMessage, SourceCitation, RouterStrategy, LLMProviderId } from '@/types/rag';

interface ChatInterfaceProps {
  routerStrategy: RouterStrategy;
  userId?: string;
  onOpenSettings?: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Hello, how can you help my customer support team?",
  "What is our customer support SLA & escalation process?",
  "Summarize our product return & refund guidelines.",
  "What services do we offer for enterprise clients?"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ routerStrategy, userId, onOpenSettings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Hello! I am your AI Knowledge Assistant. Ask me general questions, or upload your customer support manuals, product guides, and FAQs to get instant verified answers with exact source references.',
      createdAt: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const query = questionText || input.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          routerStrategy,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        createdAt: new Date().toISOString(),
        citations: data.citations || [],
        telemetry: data.telemetry,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, an error occurred: ${err.message || 'Unable to complete request'}. Please try again.`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              Smart AI Knowledge Assistant
              <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified Source Answers
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Ask conversational questions or inquire about uploaded company documents</p>
          </div>
        </div>

        {/* System Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 transition-all cursor-pointer"
          title="System Settings"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-indigo-400">System Ready</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20'
                    : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/60 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citations Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-700/50 space-y-2">
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Verified Document Sources ({msg.citations.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cit, idx) => (
                        <button
                          key={cit.id}
                          onClick={() => setActiveCitation(cit)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/50 transition-all text-left"
                        >
                          <span className="font-semibold text-indigo-400">[{idx + 1}]</span>
                          <span className="truncate max-w-[160px]">{cit.fileName}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">{(cit.similarity * 100).toFixed(0)}% Match</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Footer */}
              {msg.telemetry && (
                <div className="flex items-center gap-3 px-1 text-[11px] text-zinc-400">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-300">
                    {msg.telemetry.queryType === 'conversational' ? '💬 General Response' : `📚 Knowledge Verified (${msg.telemetry.retrievedChunkCount} sources)`}
                  </span>
                  <span>•</span>
                  <span>{msg.telemetry.latencyMs}ms response time</span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-zinc-400 text-sm p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800 w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Searching enterprise knowledge base and generating answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Bar */}
      {messages.length < 3 && (
        <div className="px-6 py-2 bg-zinc-950/20 border-t border-zinc-800/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs text-zinc-500 font-medium shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Suggested:
          </span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700/50 hover:border-indigo-500/50 whitespace-nowrap transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 focus-within:border-indigo-500/80 rounded-xl p-2 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a general question or inquire about your uploaded company documents..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                {activeCitation.fileName}
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 bg-zinc-800 rounded-md"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Knowledge Match Accuracy:</span>
                <span className="text-emerald-400 font-mono font-bold">{(activeCitation.similarity * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 text-zinc-200 text-sm leading-relaxed max-h-60 overflow-y-auto font-sans">
                {activeCitation.snippet}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
