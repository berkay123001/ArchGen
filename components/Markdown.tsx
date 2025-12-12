
import React from 'react';

// Helper to parse inline styles: `code`, **bold**, *italic*
const parseInline = (text: string): React.ReactNode[] => {
  // Split by code blocks first to prevent parsing inside code
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 text-xs font-mono border border-slate-700">{part.slice(1, -1)}</code>;
    }
    // Parse bold **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, j) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return <strong key={`${i}-${j}`} className="font-bold text-blue-200">{bPart.slice(2, -2)}</strong>;
      }
      // Parse italic *text*
      const italicParts = bPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((iPart, k) => {
         if (iPart.startsWith('*') && iPart.endsWith('*')) {
           return <em key={`${i}-${j}-${k}`} className="italic text-slate-400">{iPart.slice(1, -1)}</em>;
         }
         return iPart;
      });
    });
  });
};

interface MarkdownProps {
  content: string;
  className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className = "" }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  
  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Code Block Toggle
    if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
            // End of block
            elements.push(
                <div key={`code-${i}`} className="bg-[#0d1117] border border-slate-700 rounded-lg p-4 my-3 overflow-x-auto shadow-sm">
                    <pre className="font-mono text-xs text-blue-300 leading-relaxed">{codeBlockContent.join('\n')}</pre>
                </div>
            );
            codeBlockContent = [];
            inCodeBlock = false;
        } else {
            // Start of block
            inCodeBlock = true;
        }
        return;
    }

    if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
    }

    if (!trimmed) {
        elements.push(<div key={i} className="h-3" />);
        return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-md font-bold text-blue-300 mt-6 mb-2 flex items-center gap-2"><span className="w-1 h-4 bg-blue-500 rounded-full"></span>{parseInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold text-white mt-8 mb-4 border-b border-slate-700/50 pb-2">{parseInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4">{parseInline(trimmed.slice(2))}</h1>);
    } 
    // Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-3 ml-1 my-1.5 group">
          <span className="text-blue-500 mt-2 text-[6px] flex-shrink-0 group-hover:scale-125 transition-transform">●</span>
          <span className="text-slate-300 leading-relaxed text-sm">{parseInline(trimmed.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
       const [num, ...rest] = trimmed.split('.');
       elements.push(
        <div key={i} className="flex gap-2 ml-1 my-1.5">
          <span className="text-blue-400 font-mono text-sm font-bold min-w-[20px]">{num}.</span>
          <span className="text-slate-300 leading-relaxed text-sm">{parseInline(rest.join('.').trim())}</span>
        </div>
       );
    }
    // Blockquotes
    else if (trimmed.startsWith('> ')) {
        elements.push(
            <blockquote key={i} className="border-l-4 border-blue-500/50 pl-4 py-2 my-4 text-slate-400 italic bg-slate-800/30 rounded-r-lg">
                {parseInline(trimmed.slice(2))}
            </blockquote>
        );
    }
    // Paragraph
    else {
      elements.push(<p key={i} className="text-slate-300 my-1.5 leading-relaxed text-sm">{parseInline(line)}</p>);
    }
  });
  
  // Close open code block if exists
  if (inCodeBlock && codeBlockContent.length > 0) {
      elements.push(
        <div key={`code-end`} className="bg-[#0d1117] border border-slate-700 rounded-lg p-4 my-3 overflow-x-auto shadow-sm">
            <pre className="font-mono text-xs text-blue-300 leading-relaxed">{codeBlockContent.join('\n')}</pre>
        </div>
    );
  }

  return <div className={`markdown-content ${className}`}>{elements}</div>;
};
