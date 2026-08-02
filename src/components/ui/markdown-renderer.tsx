'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content leading-relaxed text-xs sm:text-sm text-zinc-200 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-3 mb-1.5 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-indigo-300 tracking-tight mt-3 mb-1 font-mono uppercase">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-zinc-200 mt-2 mb-1">
              {children}
            </h4>
          ),
          // Use div instead of paragraph p to prevent HTML hydration errors when nested block elements (div, pre, code blocks) exist
          p: ({ children }) => (
            <div className="my-1.5 leading-relaxed text-zinc-300">
              {children}
            </div>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1 pl-4 list-disc marker:text-indigo-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1 pl-4 list-decimal marker:text-indigo-400 font-mono text-xs">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          pre: ({ children }) => (
            <div className="my-3 rounded-lg bg-[#050505] border border-white/10 overflow-hidden font-mono text-xs shadow-inner">
              <div className="px-3 py-1 bg-[#121215] border-b border-white/[0.08] text-[10px] text-zinc-400 font-mono uppercase">
                Code Snippet
              </div>
              <div className="p-3.5 overflow-x-auto text-zinc-200 leading-relaxed font-mono whitespace-pre">
                {children}
              </div>
            </div>
          ),
          code({ node, inline, className: codeClassName, children, ...props }: any) {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 font-mono text-[11px]" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="font-mono text-xs text-zinc-200" {...props}>
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-0.5"
            >
              {children}
              <ExternalLink className="w-3 h-3 inline-block shrink-0" />
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="pl-3 py-1 my-2 border-l-2 border-indigo-500/80 text-zinc-400 text-xs italic bg-indigo-500/5 rounded-r">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-white/[0.08]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
