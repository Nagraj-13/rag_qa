'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, RefreshCw, HelpCircle, Headphones, X } from 'lucide-react';
import { ChatMessage, SourceCitation } from '@/types/rag';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

interface ChatInterfaceProps {
  userId?: string;
}

const SUGGESTED_QUESTIONS = [
  "What is your refund policy?",
  "How do I contact support?",
  "What are your support hours?",
  "How do I return a product?",
  "What subscription plans are available?",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hi there! 👋 I'm your support assistant. I can help you with questions about billing, refunds, account access, product support, returns, and more.\n\nHow can I help you today?",
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
        body: JSON.stringify({ message: query, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        createdAt: new Date().toISOString(),
        citations: data.citations || [],
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, something went wrong. Please try again or contact our support team directly.`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-3xl mx-auto linear-card overflow-hidden shadow-[0_0_50px_-15px_rgba(0,0,0,0.8)] border border-white/[0.08]">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-md">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <Headphones className="w-4.5 h-4.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Customer Support
          </h2>
          <p className="text-[11px] text-zinc-400">
            Ask us anything about our products, billing, or services
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-[#111114] text-zinc-200 border border-white/[0.08] rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}

                {/* Source Citations (simplified) */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
                    <div className="text-[10px] text-zinc-400 mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Sources
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cit, idx) => (
                        <button
                          key={cit.id}
                          onClick={() => setActiveCitation(cit)}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] cursor-pointer transition-colors"
                        >
                          {cit.fileName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-zinc-600 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-zinc-400 text-xs p-3 bg-[#111114] rounded-xl border border-white/[0.08] w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Finding the best answer for you...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length < 3 && (
        <div className="px-4 py-2 bg-[#09090b]/80 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-zinc-500 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Suggestions:
          </span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs text-zinc-300 hover:text-white bg-[#141417] hover:bg-zinc-800 px-3 py-1 rounded-full border border-white/[0.08] hover:border-white/20 whitespace-nowrap transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/[0.08] bg-[#09090b]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-[#121215] border border-white/[0.1] focus-within:border-indigo-500/60 rounded-xl p-1.5 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Send
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-white/10 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <FileText className="w-4 h-4 text-indigo-400" />
                {activeCitation.fileName}
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="p-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bg-[#121215] p-4 rounded-lg border border-white/[0.08] text-zinc-300 text-sm leading-relaxed max-h-60 overflow-y-auto">
              {activeCitation.snippet}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
