import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';

const LANG_LABELS = {
  javascript: 'JavaScript', js: 'JavaScript', jsx: 'JSX',
  typescript: 'TypeScript', ts: 'TypeScript', tsx: 'TSX',
  python: 'Python', py: 'Python',
  html: 'HTML', markup: 'HTML',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash', shell: 'Bash', sh: 'Bash',
  java: 'Java',
  c: 'C', cpp: 'C++', 'c++': 'C++',
  sql: 'SQL',
  markdown: 'Markdown', md: 'Markdown',
};

function normalizeLang(lang) {
  if (!lang) return null;
  const l = lang.toLowerCase().replace('language-', '').trim();
  if (['js', 'javascript'].includes(l)) return 'javascript';
  if (['ts', 'typescript'].includes(l)) return 'typescript';
  if (['py', 'python'].includes(l)) return 'python';
  if (['sh', 'shell', 'bash', 'zsh'].includes(l)) return 'bash';
  if (['html', 'htm', 'markup', 'xml'].includes(l)) return 'markup';
  if (['c++', 'cpp', 'cxx'].includes(l)) return 'cpp';
  if (['md', 'markdown'].includes(l)) return 'markdown';
  if (['csharp', 'cs', 'c#'].includes(l)) return 'csharp';
  if (l === 'tsx') return 'tsx';
  if (l === 'jsx') return 'jsx';
  if (l === 'json') return 'json';
  if (l === 'css') return 'css';
  if (l === 'sql') return 'sql';
  if (l === 'java') return 'java';
  if (l === 'c') return 'c';
  return l;
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const codeText = typeof children?.props?.children === 'string'
    ? children.props.children
    : Array.isArray(children?.props?.children)
      ? children.props.children.join('')
      : '';

  const langClass = children?.props?.className || '';
  const rawLang = langClass.replace('language-', '').trim();
  const lang = normalizeLang(rawLang);
  const label = LANG_LABELS[rawLang] || LANG_LABELS[lang] || (lang ? lang.toUpperCase() : null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [codeText, lang]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = codeText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative group mb-3">
      <div className="flex items-center justify-between px-4 py-2 rounded-t-xl bg-zinc-950/80 border border-b-0 border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          {label && <><FileCode size={12} /> <span>{label}</span></>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto bg-zinc-900/80 border border-white/5 rounded-b-xl text-zinc-300" style={{ marginTop: 0 }}>
        <code ref={codeRef} className={langClass}>{codeText}</code>
      </pre>
    </div>
  );
}

export const markdownComponents = {
  h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-white">{children}</h3>,
  p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-400 mb-3">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <table className="w-full border-collapse mb-3 text-sm">{children}</table>
  ),
  th: ({ children }) => (
    <th className="border border-white/10 px-3 py-2 bg-white/5 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-white/10 px-3 py-2">{children}</td>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
      {children}
    </a>
  ),
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return <code className={className} {...props}>{children}</code>;
    }
    return (
      <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
};
