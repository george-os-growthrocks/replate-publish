import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ExternalLink, CheckSquare, Square } from 'lucide-react';

interface VisualContentBriefProps {
  content: string;
}

export function VisualContentBrief({ content }: VisualContentBriefProps) {
  return (
    <div className="prose prose-slate dark:prose-invert prose-headings:text-foreground max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Headings with beautiful styling
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-foreground mb-6 mt-8 pb-3 border-b-2 border-gradient-to-r from-purple-500 to-pink-500">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = String(children);
            // Detect emoji at start to apply special styling
            const hasEmoji = /^[📊🎯📋⚠️📈🚨💡📞]/.test(text);
            
            return (
              <h2 className={`text-2xl font-bold mb-4 mt-8 flex items-center gap-2 ${
                hasEmoji ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {children}
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-3 mt-6">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-2 mt-4">
              {children}
            </h4>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="text-foreground/80 leading-relaxed mb-4">
              {children}
            </p>
          ),
          
          // Links - clickable with icon
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-500/30 hover:decoration-blue-400 transition-colors inline-flex items-center gap-1 font-medium"
            >
              {children}
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-none space-y-2 mb-4 ml-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 ml-2 text-foreground/80">
              {children}
            </ol>
          ),
          li: ({ children }) => {
            const text = String(children);
            
            // Check if it's a checkbox item
            if (text.includes('[ ]') || text.includes('[x]') || text.includes('[X]')) {
              const isChecked = text.includes('[x]') || text.includes('[X]');
              const cleanText = text.replace(/\[[ xX]\]\s*/, '');
              
              return (
                <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-colors">
                  {isChecked ? (
                    <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={isChecked ? 'text-muted-foreground line-through' : 'text-foreground/80'}>
                    {cleanText}
                  </span>
                </li>
              );
            }
            
            // Regular list item
            return (
              <li className="flex items-start gap-2 text-foreground/80">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span>{children}</span>
              </li>
            );
          },
          
          // Strong/Bold text
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">
              {children}
            </strong>
          ),
          
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-blue-600 dark:text-blue-300">
              {children}
            </em>
          ),
          
          // Code blocks
          code: ({ inline, children }: any) => {
            if (inline) {
              return (
                <code className="px-2 py-1 rounded bg-muted text-pink-600 dark:text-pink-400 font-mono text-sm border border-border">
                  {children}
                </code>
              );
            }
            return (
              <code className="block px-4 py-3 rounded-lg bg-muted text-green-600 dark:text-green-400 font-mono text-sm overflow-x-auto border border-border mb-4">
                {children}
              </code>
            );
          },
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-500/5 rounded-r-lg">
              <div className="text-purple-700 dark:text-purple-200">
                {children}
              </div>
            </blockquote>
          ),
          
          // Horizontal rules
          hr: () => (
            <hr className="border-t-2 border-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 my-8" />
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse bg-slate-900/50 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-900/30">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-purple-700 dark:text-purple-300 border-b border-purple-500/30">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-foreground/80 border-b border-border">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

