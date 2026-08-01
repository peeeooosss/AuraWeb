import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getSlideTheme, getAllSlideThemeCSS } from '@/shared/brain/slideThemes';
import {
  Send, Paperclip, Image as ImageIcon, FileText, Download,
  X, PanelRightClose, Target, Copy, Check,
  Table as TableIcon, Presentation, Eye, FileCode,
  FileUp, Plus, Sparkles, Lock, ChevronLeft, ChevronRight, Zap,
  Code2, Square,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { chat, chatStream, buildCompactPrompt, injectContext, getMemorySize, canUseFeature, incrementUsage, addTokenUsage } from '@/shared/brain';
import { extractYouTubeTranscript, isYouTubeUrl } from '@/shared/brain/processors/youtube';
import { extractPDFText, isPDFFile } from '@/shared/brain/processors/pdf';
import { isImageFile } from '@/shared/brain/processors/image';
import { extractXLSXData, isXLSXFile } from '@/shared/brain/processors/xlsx';
import { markdownComponents } from '@/shared/brain/formatting.jsx';
import SlideRenderer from '@/arena/components/SlideRenderer';
import OutlineEditor from '@/arena/components/OutlineEditor';

import { exportSlidesToPPTX } from '@/shared/brain/slideExporter';
import PresentationActionBar from '@/arena/components/PresentationActionBar';
import PresentationOverlay from '@/arena/pages/preview/PresentationPreview';
import html2pdf from 'html2pdf.js';

/* ── Constants ─────────────────────────────────────────────────── */
const CHIP_PROMPTS = [
  { text: 'Architect my Capstone Project', icon: Target, type: 'doc' },
  { text: 'Draft Panchayat Notice to Excel', icon: TableIcon, type: 'data' },
  { text: 'Create a PPT on AI in Education', icon: Presentation, type: 'ppt' },
  { text: 'Generate Instagram Content Strategy', icon: ImageIcon, type: 'image' },
  { text: 'Write Python script for data analysis', icon: FileCode, type: 'code' },
];

const QUALITY_LEVELS = [
  { id: 'basic', label: 'Basic', icon: Zap, desc: 'Free tier', locked: false },
  { id: 'high', label: 'High', icon: Sparkles, desc: '₹199/mo', locked: true, plan: 'student' },
  { id: 'max', label: 'MAX', icon: Target, desc: '₹399/mo', locked: true, plan: 'creator' },
];

/* ── Helpers ───────────────────────────────────────────────────── */
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function autoSelectTheme(query) {
  const q = query.toLowerCase();
  if (/student|education|learn|study|school|college|exam|jee|neet|class|chapter|ncert|tuition/.test(q)) return 'glass-dark';
  if (/business|corporate|company|startup|pitch|investor|revenue|market|sales|formal/.test(q)) return 'minimal-light';
  if (/creative|fun|party|design|bold|hackathon|youth|social|marketing|art|music|travel/.test(q)) return 'neo-brutalism';
  return 'glass-dark';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 🌤️';
  if (h < 21) return 'Good evening 🌙';
  return 'Hey night owl 🦉';
}

/* ── Typewriter Hook ───────────────────────────────────────────── */
function useTypewriter(text, speed = 18, enabled = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled || !text) { setDisplayed(text || ''); setDone(true); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayed, done };
}

/* ── Typewriter Message Bubble ─────────────────────────────────── */
function TypewriterMessage({ text, isNew }) {
  const { displayed, done } = useTypewriter(text, 12, isNew);
  if (!isNew) {
    return <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>;
  }
  return (
    <div>
      <ReactMarkdown components={markdownComponents}>{displayed}</ReactMarkdown>
      {!done && <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />}
    </div>
  );
}

/* ── PPT Progress (inline in AI message bubble) ─────────────────── */
function PPTProgressContent({ steps, output, onViewOutput }) {
  return (
    <div>
      <p className="text-sm font-medium mb-2.5" style={{ color: 'var(--aura-text-primary)' }}>
        {output ? '🎨 Presentation ready! ✅' : '🎨 Creating your presentation...'}
      </p>

      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs transition-all duration-300">
            {step.status === 'done' && <span className="text-green-400">✅</span>}
            {step.status === 'active' && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            )}
            {step.status === 'pending' && <span className="text-zinc-600">⏳</span>}
            <span className={
              step.status === 'done' ? 'text-zinc-300' :
              step.status === 'active' ? 'text-cyan-300' : 'text-zinc-600'
            }>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {output && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={onViewOutput}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                     bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950
                     shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
          >
            <Eye size={12} /> View slides
          </button>
          <span className="text-2xs text-zinc-600">or check the Output panel →</span>
        </div>
      )}
    </div>
  );
}

/* ── Output Preview Components ─────────────────────────────────── */

function DocPreview({ content }) {
  return (
    <div className="bg-zinc-50 text-zinc-800 rounded-xl shadow-2xl p-6">
      <div className="flex items-center gap-2 mb-4 text-zinc-400 text-xs">
        <FileText size={13} /> {content.filename || 'Untitled'} — Auto-saved
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 mb-1">{content.title}</h2>
      <p className="text-xs text-zinc-500 mb-4">{content.subtitle}</p>
      <div className="space-y-3 text-sm text-zinc-700 leading-relaxed">
        {content.sections?.map((s, i) => (
          <p key={i}><span className="font-semibold">{s.heading}</span> — {s.body}</p>
        ))}
      </div>
    </div>
  );
}

function SpreadsheetPreview({ content }) {
  return (
    <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 text-xs text-zinc-400">
        <TableIcon size={13} /> {content.filename}
      </div>
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-xs font-mono">
          <tbody>
            <tr className="bg-cyan-500/10 text-cyan-300 font-semibold">
              {content.columns?.map((col, ci) => (
                <td key={ci} className="px-3 py-2 border-r border-b border-white/5 whitespace-nowrap">{col}</td>
              ))}
            </tr>
            {content.rows?.map((row, ri) => (
              <tr key={ri} className="text-zinc-300 even:bg-white/5">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 border-r border-b border-white/5 whitespace-nowrap">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImagePreview({ content }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {content.tiles?.map((t) => (
        <div key={t.label} className="aspect-square rounded-xl relative overflow-hidden group cursor-pointer">
          <div className={`absolute inset-0 bg-gradient-to-br ${t.from} ${t.to} opacity-80 group-hover:scale-105 transition-transform`} />
          <div className="absolute inset-0 flex items-end p-2.5 bg-gradient-to-t from-black/60 to-transparent">
            <span className="text-2xs font-medium text-white">{t.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CodePreview({ content }) {
  return (
    <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 text-xs text-zinc-400">
        <FileCode size={13} /> {content.filename}
        <span className="ml-auto font-mono text-2xs px-1.5 py-0.5 rounded bg-white/5">{content.language}</span>
      </div>
      <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto text-zinc-300">
        <code>{content.code}</code>
      </pre>
    </div>
  );
}

/* ── Syntax Highlighting ─────────────────────────────────────────── */

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g,
      (match) => {
        let cls = 'text-emerald-300';
        if (/:$/.test(match)) {
          cls = 'text-cyan-300';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    )
    .replace(/\b(true|false)\b/g, '<span class="text-purple-300">$1</span>')
    .replace(/\bnull\b/g, '<span class="text-zinc-500">null</span>')
    .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="text-amber-300">$1</span>');
}

/* ── Code View Component ─────────────────────────────────────────── */

function CodeView({ output, onCopy, copied }) {
  const jsonPayload = JSON.stringify(
    {
      type: output.type,
      content: output.content,
    },
    null,
    2
  );

  const highlightedCode = syntaxHighlight(jsonPayload);

  return (
    <div className="h-full flex flex-col">
      {/* Code Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-purple-400" />
          <span className="text-xs font-medium text-zinc-300">JSON Payload</span>
          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
            {output.type}
          </span>
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                   border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 
                   transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy JSON
            </>
          )}
        </button>
      </div>

      {/* Code Block */}
      <div className="flex-1 overflow-auto bg-zinc-900/80 border border-white/5 rounded-xl p-4">
        <pre className="font-mono text-xs leading-relaxed">
          <code
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
}

/* ── Output Panel ──────────────────────────────────────────────── */

function OutputPanel({ output, onClose, onNotify }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [pptExporting, setPptExporting] = useState(false);

  const handleCopy = useCallback(() => {
    if (output?.type === 'code' && output.content?.code) {
      navigator.clipboard.writeText(output.content.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const handleExportPPTX = useCallback(async () => {
    if (!output) return;
    setPptExporting(true);
    try {
      const html = output.content?.html;
      const slidesHtml = output.content?.slidesHtml;
      if (html || slidesHtml) {
        const result = await exportSlidesToPPTX(html || slidesHtml, output.content.theme || 'glass-dark', output.content.filename || 'presentation.pptx');
        if (result?.method === 'native') {
          onNotify?.('Exported as native PPTX — all shapes and text are fully editable in PowerPoint.');
        }
      }
    } catch (err) {
      console.error('PPTX export failed:', err);
      onNotify?.('Export failed. Try again or check if the server is running.');
    } finally {
      setPptExporting(false);
    }
  }, [output, onNotify]);

  const handleDownload = useCallback(async () => {
    if (!output) return;

    if (output.type === 'doc') {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(output.content.title || 'Document', 20, 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(output.content.subtitle || '', 20, 33);
      doc.setTextColor(0);
      let y = 48;
      output.content.sections?.forEach((s) => {
        if (y > 260) { doc.addPage(); y = 25; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(s.heading, 20, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(s.body, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 8;
      });
      doc.save(output.content.filename || 'document.pdf');
    }

    if (output.type === 'data') {
      const ws = XLSX.utils.aoa_to_sheet([output.content.columns || [], ...(output.content.rows || [])]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, output.content.filename || 'spreadsheet.xlsx');
    }

    if (output.type === 'ppt') {
      await handleExportPPTX();
    }

    if (output.type === 'image') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      const colors = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#84CC16'];
      output.content.tiles?.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(col * 400, row * 200, 400, 200);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(t.label || '', col * 400 + 20, row * 200 + 120);
      });
      const link = document.createElement('a');
      link.download = output.content.filename || 'content.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    if (output.type === 'code') {
      const blob = new Blob([output.content.code || ''], { type: 'text/plain' });
      const link = document.createElement('a');
      link.download = output.content.filename || 'script.py';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }, [output, handleExportPPTX]);

  if (!output) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Eye size={28} className="text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-400 mb-1">No output yet</p>
        <p className="text-xs text-zinc-600">Ask AuraAI to generate something and it will appear here</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Toggle and Download */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 shrink-0">
        {/* Left: Type Badge */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-medium text-zinc-300">Output</span>
          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 uppercase">
            {output.type}
          </span>
        </div>

        {/* Center: Tab Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
          <button
            onClick={() => setActiveTab('preview')}
            className={`
              p-1.5 rounded-md transition-all duration-200
              ${activeTab === 'preview'
                ? 'bg-cyan-500/10 text-cyan-300 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }
            `}
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`
              p-1.5 rounded-md transition-all duration-200
              ${activeTab === 'code'
                ? 'bg-purple-500/10 text-purple-300 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }
            `}
          >
            <Code2 size={14} />
          </button>
        </div>

        {/* Right: Download + Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                     bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950
                     shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
          >
            <Download size={12} />
            Download
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
            <PanelRightClose size={16} />
          </button>
        </div>
      </div>

      {/* Content Area with Tab Switching */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'preview' ? (
          <div className="h-full">
            {output.type === 'doc' && <div className="p-4"><DocPreview content={output.content} /></div>}
            {output.type === 'data' && <div className="p-4"><SpreadsheetPreview content={output.content} /></div>}
            {output.type === 'ppt' && (
              <SlideRenderer
                html={output.content.html}
                theme={output.content.theme || 'glass-dark'}
                onExport={handleExportPPTX}
                exporting={pptExporting}
              />
            )}
            {output.type === 'image' && <div className="p-4"><ImagePreview content={output.content} /></div>}
            {output.type === 'code' && <div className="p-4"><CodePreview content={output.content} /></div>}
          </div>
        ) : (
          <div className="h-full p-4">
            <CodeView output={output} onCopy={handleCopy} copied={copied} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Main ChatBox                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

export default function ChatBox({
  chatMessages: propMessages,
  setChatMessages: propSetMessages,
  activeChatId: propActiveChatId,
  chatOutput: propOutput,
  setChatOutput: propSetOutput,
  onSaveChat: propSaveChat,
  onNewChat: propNewChat,
}) {
  // ── Aliases (so internal code keeps using `messages` / `setMessages` / `currentOutput` / `setCurrentOutput`) ──
  const messages = propMessages;
  const setMessages = propSetMessages;
  const currentOutput = propOutput;
  const setCurrentOutput = propSetOutput;

  // ── Local UI state ──
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [quality, setQuality] = useState('basic');

  // ── Track how many AI messages we've already animated (prevents re-animation) ──
  const [loadedMsgCount, setLoadedMsgCount] = useState(0);
  const [newMsgIds, setNewMsgIds] = useState(new Set());
  const [presenting, setPresenting] = useState(null);
  const [pptOutlineData, setPptOutlineData] = useState(null);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  // Tier detection: free_trial if no subscription, otherwise student/creator
  const [tier] = useState(() => {
    try {
      const sub = localStorage.getItem('auraai_subscription');
      if (sub) {
        const { tier: subTier } = JSON.parse(sub);
        if (subTier === 'student' || subTier === 'creator') return subTier;
      }
    } catch {}
    return 'free_trial';
  });

  const SHOW_TOKEN_DASHBOARD = false;

  // ── Chat History (delegates to parent via props — wrapped to never throw) ──
  function saveChatHistory(msgs, chatId) {
    try { propSaveChat(msgs, chatId); } catch (e) { console.warn('[saveChatHistory] failed:', e); }
  }

  // ── Clear newMsgIds when loading a chat (prevents typewriter re-animation) ──
  useEffect(() => {
    setLoadedMsgCount(messages.length);
    setNewMsgIds(new Set());
  }, [propActiveChatId]);

  // ── Stop generation ──
  function stopGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;
    setTyping(false);
  }

  // ── PPT Action Handlers (used by PresentationActionBar) ──
  function handleViewSlides(html, theme) {
    setPresenting({ html, theme });
  }

  function handleNotify(text) {
    const infoId = genId();
    setMessages(m => [...m, { id: infoId, role: 'ai', text }]);
    setNewMsgIds(prev => new Set([...prev, infoId]));
  }

  async function handleExportPPTX(output) {
    const html = output?.content?.html;
    const theme = output?.content?.theme || 'glass-dark';
    const filename = output?.content?.filename || 'presentation.pptx';
    try {
      const result = await exportSlidesToPPTX(html, theme, filename);
      if (result?.method === 'native') {
        handleNotify('Exported as native PPTX — all shapes and text are fully editable in PowerPoint.');
      }
    } catch (err) {
      console.error('PPTX export failed:', err);
      handleNotify('Export failed. Try again or check if the server is running.');
    }
  }

  async function handleExportPDF(output) {
    const html = output?.content?.html;
    if (!html) {
      const errId = genId();
      setMessages(m => [...m, { id: errId, role: 'ai', text: 'No slides to export. Generate a presentation first. 📊' }]);
      setNewMsgIds(prev => new Set([...prev, errId]));
      return;
    }
    const theme = output?.content?.theme || 'glass-dark';
    const filename = output?.content?.filename?.replace('.pptx', '.pdf') || 'presentation.pdf';
    const sections = html.match(/<section[\s\S]*?<\/section>/gi) || [];
    if (sections.length === 0) {
      const errId = genId();
      setMessages(m => [...m, { id: errId, role: 'ai', text: 'No slides found in the output. Try generating again. 📊' }]);
      setNewMsgIds(prev => new Set([...prev, errId]));
      return;
    }

    const allThemeCSS = getAllSlideThemeCSS();
    const SLIDE_W = 960;
    const SLIDE_H = 540;
    const total = sections.length;

    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const { default: h2c } = await import('html2canvas');

      const container = document.createElement('div');
      container.style.cssText = `position:fixed;left:-9999px;top:0;width:${SLIDE_W}px;height:${SLIDE_H}px;overflow:hidden;background:#09090B;`;
      document.body.appendChild(container);

      const styleEl = document.createElement('style');
      styleEl.textContent = allThemeCSS;
      container.appendChild(styleEl);

      let pdfInstance = null;

      for (let i = 0; i < total; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `position:relative;width:${SLIDE_W}px;height:${SLIDE_H}px;overflow:hidden;`;

        const slideContent = document.createElement('div');
        slideContent.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;';
        slideContent.innerHTML = sections[i];

        const slideNum = document.createElement('div');
        slideNum.style.cssText = 'position:absolute;bottom:16px;right:24px;font-family:system-ui,sans-serif;font-size:12px;color:#666;z-index:10;letter-spacing:0.05em;';
        slideNum.textContent = `Slide ${i + 1} / ${total}`;

        wrapper.appendChild(slideContent);
        wrapper.appendChild(slideNum);
        container.appendChild(wrapper);

        await new Promise(r => setTimeout(r, 500));

        const canvas = await h2c(wrapper, {
          width: SLIDE_W,
          height: SLIDE_H,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (!pdfInstance) {
          const { jsPDF } = await import('jspdf');
          pdfInstance = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [SLIDE_W, SLIDE_H],
            hotfixes: ['px_scaling'],
          });
        } else {
          pdfInstance.addPage([SLIDE_W, SLIDE_H], 'landscape');
        }

        pdfInstance.addImage(imgData, 'JPEG', 0, 0, SLIDE_W, SLIDE_H);
        container.removeChild(wrapper);
      }

      if (pdfInstance) {
        pdfInstance.save(filename);
      }

      document.body.removeChild(container);
    } catch (err) {
      console.error('PDF export failed:', err);
      const errId = genId();
      setMessages(m => [...m, { id: errId, role: 'ai', text: 'PDF export failed. Try again?' }]);
      setNewMsgIds(prev => new Set([...prev, errId]));
    }
  }

  // ── PPT Outline Handler — called when AI returns ppt_outline ──
  function handlePPTOutlineGenerated(outlineData) {
    const topic = outlineData.topic || outlineData.content?.topic || 'Presentation';
    const theme = outlineData.theme || outlineData.content?.theme || autoSelectTheme(topic);
    const slides = outlineData.slides || outlineData.content?.slides || [];

    const aiId = genId();
    setMessages(m => [...m, {
      id: aiId,
      role: 'ai',
      text: outlineData.text || `Here's the outline for "${topic}". Edit slides, reorder, or change the theme, then click Generate!`,
      isOutlineMessage: true,
    }]);
    setNewMsgIds(prev => new Set([...prev, aiId]));

    setPptOutlineData({
      topic,
      theme,
      slides: slides.map(s => ({
        title: s.title || '',
        points: Array.isArray(s.points) ? s.points : [],
      })),
    });
  }

  // ── PPT Generate from Outline — called when user clicks Generate in OutlineEditor ──
  async function handlePPTGenerateFromOutline(approvedSlides, selectedTheme) {
    setPptOutlineData(null);

    const topic = approvedSlides[0]?.title || 'Presentation';

    const progressMsgId = genId();
    setMessages(m => [...m, {
      id: progressMsgId,
      role: 'ai',
      text: 'Generating your presentation...',
      isPptProgress: true,
      progressSteps: [
        { label: 'Connecting to AI', status: 'active' },
        { label: 'Writing your slides', status: 'pending' },
        { label: 'Finalizing', status: 'pending' },
      ],
      progressOutput: null,
    }]);
    setNewMsgIds(prev => new Set([...prev, progressMsgId]));

    const outlineText = approvedSlides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.points.map(p => `  - ${p}`).join('\n')}`).join('\n\n');
    const generatePrompt = `Generate a full HTML presentation with this exact outline. Use theme "${selectedTheme}". Create 8-12 slides with absolute positioning, data tables, and bar charts.\n\nOUTLINE:\n${outlineText}`;

    const apiMsgs = buildMessages(generatePrompt);

    let lastLabel = '';
    const onDelta = (deltaText, accumulated) => {
      const sections = (accumulated.match(/<section/g) || []).length;
      const label = sections > 0
        ? `Writing slide ${sections}...`
        : 'Writing your presentation...';
      if (label === lastLabel) return;
      lastLabel = label;
      setMessages(m => m.map(msg => {
        if (msg.id !== progressMsgId) return msg;
        return {
          ...msg,
          progressSteps: [
            { label: 'Connecting to AI', status: 'done' },
            { label, status: 'active' },
            { label: 'Finalizing', status: 'pending' },
          ],
        };
      }));
    };

    try {
      abortRef.current = new AbortController();
      const result = await chatStream(apiMsgs, { tier, isDocument: true, onDelta, signal: abortRef.current.signal });
      setTyping(false);

      if (result.usage) addTokenUsage(result.usage.total_tokens || 0, result.usage.cost || 0);

      if (result.error) {
        setMessages(m => m.filter(msg => msg.id !== progressMsgId));
        const errId = genId();
        setMessages(m => [...m, { id: errId, role: 'ai', text: result.message || 'Generation failed. Try again? 🤔' }]);
        setNewMsgIds(prev => new Set([...prev, errId]));
        return;
      }

      const output = result.data;
      if (output.type === 'ppt' && output.content?.html) {
        incrementUsage(tier, 'docs');
        const themeId = output.content.theme || selectedTheme;
        const slideCount = (output.content.html.match(/<section/g) || []).length || 6;
        const themeMeta = getSlideTheme(themeId);
        const pptContent = {
          html: output.content.html,
          theme: themeId,
          filename: output.content.filename || `${topic.replace(/\W+/g, '-').toLowerCase()}.pptx`,
        };

        setMessages(m => m.map(msg => {
          if (msg.id !== progressMsgId) return msg;
          return {
            ...msg,
            text: 'Presentation ready!',
            progressSteps: [
              { label: 'Connecting to AI', status: 'done' },
              { label: `Wrote ${slideCount} slides · ${themeMeta.name} ${themeMeta.emoji}`, status: 'done' },
              { label: 'Finalizing', status: 'done' },
            ],
            progressOutput: pptContent,
            isPptComplete: true,
          };
        }));
        setNewMsgIds(prev => new Set([...prev, progressMsgId]));

        sessionStorage.setItem('aura_ppt_preview', JSON.stringify({ type: 'ppt', content: pptContent }));
        setCurrentOutput({ type: 'ppt', content: pptContent });
        setPanelOpen(true);
        setMobilePanelOpen(true);
        saveChatHistory([...messages, { id: progressMsgId, role: 'ai', text: 'Presentation ready!' }]);
      } else {
        setMessages(m => m.filter(msg => msg.id !== progressMsgId));
        const errId = genId();
        setMessages(m => [...m, { id: errId, role: 'ai', text: 'The AI returned an unexpected format. Try again? 🤔' }]);
        setNewMsgIds(prev => new Set([...prev, errId]));
      }
    } catch (err) {
      console.error('[PPT generate from outline] failed:', err);
      setTyping(false);
      setMessages(m => m.filter(msg => msg.id !== progressMsgId));
      const errId = genId();
      setMessages(m => [...m, { id: errId, role: 'ai', text: 'Something went wrong. Try again? 🤔' }]);
      setNewMsgIds(prev => new Set([...prev, errId]));
    }
  }



  // ── Scroll ──
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // ── Build API messages ──
  function buildMessages(text) {
    const memorySize = getMemorySize(tier);
    const context = injectContext(text);
    const systemPrompt = buildCompactPrompt('arena', text, context);
    const apiMessages = [{ role: 'system', content: systemPrompt }];
    const history = messages.filter(m => m.text && !m.isConfirm).slice(-memorySize);
    if (history.length > 3) {
      const old = history.slice(0, -3);
      const recent = history.slice(-3);
      const summary = old.map(m => `${m.role === 'user' ? 'U' : 'A'}: ${m.text.substring(0, 80)}`).join('\n');
      apiMessages.push({ role: 'user', content: `[Context summary]\n${summary}` });
      apiMessages.push({ role: 'assistant', content: 'Got it, continuing from earlier. What do you need?' });
      recent.forEach(m => apiMessages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    } else {
      history.forEach(m => apiMessages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    }
    apiMessages.push({ role: 'user', content: text });
    return apiMessages;
  }

  // ── File processing ──
  async function processFile(file, userText) {
    let fileContext = '';
    if (isYouTubeUrl(userText) || isYouTubeUrl(file?.name)) {
      const url = isYouTubeUrl(userText) ? userText : file?.name;
      const transcript = await extractYouTubeTranscript(url);
      if (transcript) fileContext = `\n\nYouTube Video Transcript:\n${transcript.transcript}`;
    } else if (isPDFFile(file)) {
      const { fullText } = await extractPDFText(file);
      fileContext = `\n\nPDF Content:\n${fullText.substring(0, 5000)}`;
    } else if (isImageFile(file)) {
      fileContext = `\n\n[Image uploaded: ${file.name}]`;
    } else if (isXLSXFile(file)) {
      const { sheets } = await extractXLSXData(file);
      fileContext = `\n\nSpreadsheet Data:\n${JSON.stringify(sheets, null, 2).substring(0, 3000)}`;
    }
    return fileContext;
  }

  // ── Send message ──
  async function send(text, { file: sentFile } = {}) {
    const t = (text !== undefined ? text : input).trim();
    const file = sentFile || attachedFile;
    if (!t && !file) return;

    let displayText = t;
    if (file) displayText = t || `Uploaded: ${file.name}`;

    const msgId = genId();
    setMessages(m => [...m, { id: msgId, role: 'user', text: displayText }]);
    setNewMsgIds(prev => new Set([...prev, msgId]));
    setInput('');
    setAttachedFile(null);
    setTyping(true);

    try {
      let fullText = t;

      if (file) {
        const fileContext = await processFile(file, t);
        fullText = t ? `${t}${fileContext}` : `Analyze this file: ${file.name}${fileContext}`;
      }

      if (isYouTubeUrl(fullText)) {
        if (!canUseFeature(tier, 'youtube')) {
          setTyping(false);
          const errId = genId();
          setMessages(m => [...m, { id: errId, role: 'ai', text: "You've hit your daily YouTube limit. Upgrade for more! 🎬" }]);
          setNewMsgIds(prev => new Set([...prev, errId]));
          return;
        }
        const transcript = await extractYouTubeTranscript(fullText);
        if (transcript) {
          fullText = `Summarize this YouTube video:\n\nVideo Title: ${fullText}\n\nTranscript:\n${transcript.transcript}`;
          incrementUsage(tier, 'youtube');
        }
      }

      if (file) {
        const fileType = isPDFFile(file) ? 'pdf' : isImageFile(file) ? 'image' : isXLSXFile(file) ? 'xlsx' : null;
        if (fileType && !canUseFeature(tier, fileType)) {
          setTyping(false);
          const errId = genId();
          setMessages(m => [...m, { id: errId, role: 'ai', text: `You've hit your daily ${fileType.toUpperCase()} limit. Upgrade for more! 📎` }]);
          setNewMsgIds(prev => new Set([...prev, errId]));
          return;
        }
        if (fileType) incrementUsage(tier, fileType);
      }

      const apiMessages = buildMessages(fullText);
      // Detect if this is a document generation request
      const docKeywords = ['ppt', 'presentation', 'pdf', 'document', 'excel', 'spreadsheet', 'xlsx'];
      const isDocRequest = docKeywords.some(kw => fullText.toLowerCase().includes(kw));
      const isPptRequest = /\b(ppt|presentation|slides?|slideshow)\b/i.test(fullText);

      // ── Live progress bubble for PPT requests — driven by real streaming, not fake timers ──
      let progressMsgId = null;
      let lastLabel = '';

      if (isPptRequest) {
        if (!canUseFeature(tier, 'ppt')) {
          setTyping(false);
          const lockId = genId();
          setMessages(m => [...m, { id: lockId, role: 'ai', text: "You've hit your daily PPT limit. Upgrade for more presentations! 📊" }]);
          setNewMsgIds(prev => new Set([...prev, lockId]));
          return;
        }
        incrementUsage(tier, 'ppt');
        setTyping(false);
        progressMsgId = genId();
        setMessages(m => [...m, {
          id: progressMsgId,
          role: 'ai',
          text: 'Creating your presentation...',
          isPptProgress: true,
          progressSteps: [
            { label: 'Connecting to AI', status: 'active' },
            { label: 'Writing your presentation', status: 'pending' },
            { label: 'Finalizing', status: 'pending' },
          ],
          progressOutput: null,
        }]);
        setNewMsgIds(prev => new Set([...prev, progressMsgId]));
      }

      const onDelta = !progressMsgId ? undefined : (deltaText, accumulated) => {
        const sections = (accumulated.match(/<section/g) || []).length;
        const titleMatches = accumulated.match(/"title"\s*:\s*"/g) || [];
        const label = sections > 0
          ? `Writing slide ${sections}...`
          : titleMatches.length > 0
            ? `Writing outline (${titleMatches.length} slide${titleMatches.length > 1 ? 's' : ''})...`
            : 'Writing your presentation...';

        if (label === lastLabel) return;
        lastLabel = label;

        setMessages(m => m.map(msg => {
          if (msg.id !== progressMsgId) return msg;
          return {
            ...msg,
            progressSteps: [
              { label: 'Connecting to AI', status: 'done' },
              { label, status: 'active' },
              { label: 'Finalizing', status: 'pending' },
            ],
          };
        }));
      };

      abortRef.current = new AbortController();
      const result = isDocRequest
        ? await chatStream(apiMessages, { tier, isDocument: true, onDelta, signal: abortRef.current.signal })
        : await chat(apiMessages, { tier, isDocument: isDocRequest });
      setTyping(false);

      if (result.usage) {
        addTokenUsage(result.usage.total_tokens || 0, result.usage.cost || 0);
      }

      if (result.error) {
        if (progressMsgId) setMessages(m => m.filter(msg => msg.id !== progressMsgId));
        const errId = genId();
        setMessages(m => [...m, { id: errId, role: 'ai', text: result.message || 'Something went wrong. Try again? 🤔' }]);
        setNewMsgIds(prev => new Set([...prev, errId]));
        return;
      }

      const output = result.data;

      // ── PPT Outline: Two-step flow — show editor for user to customize ──
      if (output.type === 'ppt_outline' && output.content) {
        if (progressMsgId) setMessages(m => m.filter(msg => msg.id !== progressMsgId));
        handlePPTOutlineGenerated(output);
        saveChatHistory([...messages, { id: msgId, role: 'user', text: displayText }, { id: genId(), role: 'ai', text: output.text || 'Here is your outline!' }]);
        return;
      }

      // ── PPT: Direct HTML generation — progress was tracked live during streaming above ──
      if (output.type === 'ppt' && output.content?.html) {
        if (!canUseFeature(tier, 'docs')) {
          if (progressMsgId) setMessages(m => m.filter(msg => msg.id !== progressMsgId));
          const errId = genId();
          setMessages(m => [...m, { id: errId, role: 'ai', text: "You've hit your daily document limit. Upgrade for more! 📄" }]);
          setNewMsgIds(prev => new Set([...prev, errId]));
          return;
        }
        incrementUsage(tier, 'docs');

        const themeId = output.content.theme || autoSelectTheme(fullText);
        const slideCount = (output.content.html.match(/<section/g) || []).length || 6;
        const themeMeta = getSlideTheme(themeId);

        const pptContent = {
          html: output.content.html,
          theme: themeId,
          filename: output.content.filename || `${(output.content.topic || 'presentation').replace(/\W+/g, '-').toLowerCase()}.pptx`,
        };

        if (progressMsgId) {
          setMessages(m => m.map(msg => {
            if (msg.id !== progressMsgId) return msg;
            return {
              ...msg,
              text: 'Presentation ready!',
              progressSteps: [
                { label: 'Connecting to AI', status: 'done' },
                { label: `Wrote ${slideCount} slides · ${themeMeta.name} ${themeMeta.emoji}`, status: 'done' },
                { label: 'Finalizing', status: 'done' },
              ],
              progressOutput: pptContent,
              isPptComplete: true // Flag for action bar
            };
          }));
        }

        // Store for fullscreen preview
        sessionStorage.setItem('aura_ppt_preview', JSON.stringify({
          type: 'ppt',
          content: pptContent
        }));

        // Open the Output panel so user sees slides immediately
        setCurrentOutput({ type: 'ppt', content: pptContent });
        setPanelOpen(true);
        setMobilePanelOpen(true);

        saveChatHistory([...messages, { id: msgId, role: 'user', text: displayText }, { id: progressMsgId || genId(), role: 'ai', text: 'Presentation ready!' }]);
        return;
      }

      // Unexpected output type after showing a PPT progress bubble — clean it up before falling through.
      if (progressMsgId) {
        setMessages(m => m.filter(msg => msg.id !== progressMsgId));
      }

      // ── Generic confirm (doc, data, code — non-PPT) — auto-generate, no confirmation ──
      if (output.type === 'confirm') {
        if (!canUseFeature(tier, 'docs')) {
          const errId = genId();
          setMessages(m => [...m, { id: errId, role: 'ai', text: "You've hit your daily document limit. Upgrade for more! 📄" }]);
          setNewMsgIds(prev => new Set([...prev, errId]));
          return;
        }
        incrementUsage(tier, 'docs');
        const confirmPrompt = output.prompt || fullText;
        const apiMsgs = buildMessages(confirmPrompt);
        const confirmProgressId = genId();
        setMessages(m => [...m, {
          id: confirmProgressId,
          role: 'ai',
          text: 'Generating...',
          isPptProgress: true,
          progressSteps: [
            { label: 'Connecting to AI', status: 'done' },
            { label: 'Generating your document...', status: 'active' },
            { label: 'Finalizing', status: 'pending' },
          ],
          progressOutput: null,
        }]);
        setNewMsgIds(prev => new Set([...prev, confirmProgressId]));
        const confirmResult = await chatStream(apiMsgs, { tier, isDocument: true });
        if (confirmResult.usage) addTokenUsage(confirmResult.usage.total_tokens || 0, confirmResult.usage.cost || 0);
        if (confirmResult.error) {
          setMessages(m => m.filter(msg => msg.id !== confirmProgressId));
          const errId = genId();
          setMessages(m => [...m, { id: errId, role: 'ai', text: confirmResult.message || 'Generation failed. Try again? 🤔' }]);
          setNewMsgIds(prev => new Set([...prev, errId]));
          return;
        }
        const confirmOut = confirmResult.data;
        if (confirmOut.type && confirmOut.content) {
          const doneId = genId();
          setMessages(m => m.filter(msg => msg.id !== confirmProgressId));
          setMessages(m => [...m, { id: doneId, role: 'ai', text: confirmOut.text || 'Done! Check the Output panel. ✨' }]);
          setNewMsgIds(prev => new Set([...prev, doneId]));
          setCurrentOutput({ type: confirmOut.type, content: confirmOut.content });
          setPanelOpen(true);
          saveChatHistory([...messages, { id: msgId, role: 'user', text: displayText }, { id: doneId, role: 'ai', text: confirmOut.text || 'Done!' }]);
        }
        return;
      }

      // ── Code output — render inline in chat (like ChatGPT / Gemini) ──
      if (output.type === 'code' && output.content?.code) {
        const lang = output.content.language || '';
        const filename = output.content.filename || '';
        const header = filename ? `**${filename}**\n\n` : '';
        const codeText = `${header}\`\`\`${lang}\n${output.content.code}\n\`\`\``;
        const codeId = genId();
        setMessages(m => [...m, { id: codeId, role: 'ai', text: codeText }]);
        setNewMsgIds(prev => new Set([...prev, codeId]));
        saveChatHistory([...messages, { id: msgId, role: 'user', text: displayText }, { id: codeId, role: 'ai', text: codeText }]);
        return;
      }

      // ── Document output (doc, data) ──
      if (output.type && output.content) {
        if (!canUseFeature(tier, 'docs')) {
          const errId = genId();
          setMessages(m => [...m, { id: errId, role: 'ai', text: "You've hit your daily document limit. Upgrade for more! 📄" }]);
          setNewMsgIds(prev => new Set([...prev, errId]));
          return;
        }
        incrementUsage(tier, 'docs');

        const doneId = genId();
        setMessages(m => [...m, { id: doneId, role: 'ai', text: output.text || 'Done! Check the Output panel. ✨' }]);
        setNewMsgIds(prev => new Set([...prev, doneId]));
        setCurrentOutput({ type: output.type, content: output.content });
        setPanelOpen(true);
        saveChatHistory([...messages, { id: msgId, role: 'user', text: displayText }, { id: doneId, role: 'ai', text: output.text || 'Done!' }]);
        return;
      }

      // ── Plain text reply ──
      const replyId = genId();
      const replyText = output.text || "Hmm, not sure what you mean. Can you rephrase? 🤔";
      setMessages(m => [...m, { id: replyId, role: 'ai', text: replyText }]);
      setNewMsgIds(prev => new Set([...prev, replyId]));
      saveChatHistory([...messages, { id: msgId, role: 'user', text: displayText }, { id: replyId, role: 'ai', text: replyText }]);
    } catch (err) {
      console.error('[send] failed:', err);
      setTyping(false);
      const errId = genId();
      setMessages(m => [...m, { id: errId, role: 'ai', text: 'Something went wrong. Try again? 🤔' }]);
      setNewMsgIds(prev => new Set([...prev, errId]));
      try {
        saveChatHistory([...messages, { id: msgId, role: 'user', text: displayText }, { id: errId, role: 'ai', text: 'Something went wrong. Try again? 🤔' }]);
      } catch {}
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    e.target.value = '';
  }

  // ── Render ──
  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* ── Chat Thread ── */}
      <div className={`flex flex-col min-w-0 h-full ${panelOpen ? 'lg:w-[calc(100%-2.5rem-40%)]' : 'w-full'}`}>
        {/* Header */}
        <div className="px-5 lg:px-8 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold">{getGreeting()}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--aura-text-secondary)' }}>What are we building today?</p>
          </div>
          <button
            onClick={propNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
            title="New Chat"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 lg:px-8 py-5 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.isPptProgress ? (
                <div className="msg-bubble glass-panel border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                  <PPTProgressContent
                    steps={m.progressSteps}
                    output={m.progressOutput}
                    onViewOutput={() => handleViewSlides(m.progressOutput.html, m.progressOutput.theme)}
                  />
                  {m.isPptComplete && m.progressOutput && (
                    <PresentationActionBar
                      onView={() => handleViewSlides(m.progressOutput.html, m.progressOutput.theme)}
                      onExportPPTX={() => handleExportPPTX({ content: m.progressOutput })}
                      onExportPDF={() => handleExportPDF({ content: m.progressOutput })}
                    />
                  )}
                </div>
              ) : m.isOutlineMessage && pptOutlineData ? (
                <div className="msg-bubble glass-panel border border-white/10 rounded-2xl rounded-bl-sm px-4 py-4 max-w-[90%]">
                  <TypewriterMessage text={m.text} isNew={newMsgIds.has(m.id)} />
                  <div className="mt-3">
                    <OutlineEditor
                      topic={pptOutlineData.topic}
                      outline={pptOutlineData.slides}
                      theme={pptOutlineData.theme}
                      onGenerate={handlePPTGenerateFromOutline}
                      onCancel={() => setPptOutlineData(null)}
                    />
                  </div>
                </div>
              ) : m.isConfirm ? (
                <div className="glass-panel border border-cyan-500/30 rounded-2xl rounded-bl-sm p-4 max-w-[85%]">
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--aura-text-primary)' }}>{m.text}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!canUseFeature(tier, 'docs')) {
                          const errId = genId();
                          setMessages(msgs => [...msgs, { id: errId, role: 'ai', text: "You've hit your daily document limit. Upgrade for more! 📄" }]);
                          setNewMsgIds(prev => new Set([...prev, errId]));
                          return;
                        }
                        const userId = genId();
                        setMessages(msgs => [...msgs, { id: userId, role: 'user', text: 'Yes, generate it' }]);
                        setNewMsgIds(prev => new Set([...prev, userId]));
                        setTyping(true);
                        const apiMsgs = buildMessages(m.pendingConfirm.prompt);
                        chatStream(apiMsgs, { tier, isDocument: true }).then(async (result) => {
                          setTyping(false);
                          try {
                            if (result.usage) addTokenUsage(result.usage.total_tokens || 0, result.usage.cost || 0);
                          } catch {}
                          if (result.error) {
                            const errId = genId();
                            setMessages(msgs => [...msgs, { id: errId, role: 'ai', text: result.message || 'Generation failed. Try again? 🤔' }]);
                            setNewMsgIds(prev => new Set([...prev, errId]));
                            return;
                          }
                          const out = result.data;
                          if (out.type && out.content) {
                            incrementUsage(tier, 'docs');
                            const doneId = genId();
                            setMessages(msgs => [...msgs, { id: doneId, role: 'ai', text: out.text || 'Done! Check the Output panel. ✨' }]);
                            setNewMsgIds(prev => new Set([...prev, doneId]));
                            setCurrentOutput({ type: out.type, content: out.content });
                            setPanelOpen(true);
                          }
                        });
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all"
                      style={{ background: 'linear-gradient(90deg, var(--aura-cyan), var(--aura-purple))', color: '#05070A' }}
                    >
                      <FileText size={13} /> Yes, generate
                    </button>
                    <button
                      onClick={() => {
                        const uId = genId();
                        const aId = genId();
                        setMessages(msgs => [...msgs, { id: uId, role: 'user', text: 'No, thanks' }, { id: aId, role: 'ai', text: 'No worries! Let me know if you need anything else. 😊' }]);
                        setNewMsgIds(prev => new Set([...prev, uId, aId]));
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-colors"
                    >
                      No, thanks
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`msg-bubble rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[85%] ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-br-sm'
                      : 'glass-panel border border-white/10 rounded-bl-sm'
                  }`}
                  style={m.role === 'user' ? {} : { color: 'var(--aura-text-primary)' }}
                >
                  {m.role === 'ai' ? (
                    <div className="flex flex-col gap-1">
                      <TypewriterMessage text={m.text} isNew={newMsgIds.has(m.id)} />
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="glass-panel border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--aura-text-muted)' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--aura-text-muted)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--aura-text-muted)', animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestion chips */}
        {messages.length <= 1 && (
          <div className="px-5 lg:px-8 pb-3 flex flex-wrap gap-2">
            {CHIP_PROMPTS.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.text}
                  onClick={() => send(chip.text)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-colors"
                  style={{ color: 'var(--aura-text-secondary)' }}
                >
                  <Icon size={13} style={{ color: 'var(--aura-cyan)' }} /> {chip.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Attached file */}
        {attachedFile && (
          <div className="px-5 lg:px-8 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs">
              <FileUp size={13} className="text-cyan-400" />
              <span className="text-cyan-300 truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="ml-auto text-zinc-500 hover:text-zinc-300"><X size={13} /></button>
            </div>
          </div>
        )}

        {/* ── Input Area ── */}
        <div className="p-4 lg:p-5 border-t border-white/5">
          <div className="glass-panel border border-white/10 rounded-2xl p-2.5 focus-within:border-cyan-400/40 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask AuraAI anything — draft, plan, design, analyze..."
              rows={1}
              className="w-full bg-transparent resize-none outline-none text-sm px-2 py-1.5 max-h-24"
              style={{ color: 'var(--aura-text-primary)' }}
            />
            <div className="flex items-center justify-between mt-1 px-1 flex-wrap gap-2">
              {/* Left: file upload */}
              <div className="flex items-center gap-1">
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp" onChange={handleFileSelect} />
                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300" title="Upload file">
                  <Paperclip size={16} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300" title="Upload Image">
                  <ImageIcon size={16} />
                </button>
              </div>

              {/* Center: Quality buttons */}
              <div className="flex items-center gap-1.5">
                {QUALITY_LEVELS.map(q => {
                  const Icon = q.icon;
                  const isActive = quality === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        if (q.locked) {
                          navigate('/upgrade');
                        } else {
                          setQuality(q.id);
                        }
                      }}
                      className={`flex items-center gap-1 text-2xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-white/10 text-white border border-white/20'
                          : q.locked
                            ? 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                      }`}
                    >
                      {q.locked ? <Lock size={10} /> : <Icon size={10} />}
                      {q.label}
                    </button>
                  );
                })}
              </div>

              {/* Right: send / stop */}
              {typing ? (
                <button onClick={stopGeneration} className="p-2 rounded-xl bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 transition-colors" title="Stop generating">
                  <Square size={15} className="text-red-400" />
                </button>
              ) : (
                <button onClick={() => send()} className="p-2 rounded-xl transition-opacity" style={{ background: 'linear-gradient(90deg, var(--aura-cyan), var(--aura-purple))' }}>
                  <Send size={15} className="text-zinc-950" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Output Panel Edge Tab ── */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="hidden lg:flex items-center justify-center w-8 shrink-0 border-y border-white/5 hover:bg-white/5 transition-colors z-10"
        style={{ background: panelOpen ? 'rgba(47,243,224,0.03)' : 'transparent' }}
        title={panelOpen ? 'Close output' : 'Open output'}
      >
        {panelOpen ? <ChevronRight size={14} className="text-zinc-500" /> : <ChevronLeft size={14} className="text-zinc-500" />}
      </button>

      {/* ── Output Panel — Desktop ── */}
      <div className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 overflow-hidden ${panelOpen ? 'lg:w-2/5' : 'w-0'}`}>
        <OutputPanel output={currentOutput} onClose={() => setPanelOpen(false)} onNotify={handleNotify} />
      </div>

      {/* ── Output Panel — Mobile Overlay ── */}
      {mobilePanelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col" style={{ background: 'var(--aura-bg-void)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="font-display font-semibold text-sm">Output</span>
            <button onClick={() => setMobilePanelOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-hidden">
            <OutputPanel output={currentOutput} onClose={() => setMobilePanelOpen(false)} onNotify={handleNotify} />
          </div>
        </div>
      )}

      {/* Token Dashboard — dev only */}
      {SHOW_TOKEN_DASHBOARD && (
        <div className="fixed bottom-20 right-4 z-30 glass-panel border border-cyan-500/20 rounded-xl p-3 text-xs" style={{ background: 'rgba(10,14,20,0.95)' }}>
          <p className="text-cyan-400 font-medium mb-1">Token Stats (dev only)</p>
          <p className="text-zinc-500">Dashboard hidden in production</p>
        </div>
      )}

      {/* Presentation Overlay */}
      {presenting && (
        <PresentationOverlay
          html={presenting.html}
          theme={presenting.theme}
          onClose={() => setPresenting(null)}
        />
      )}
    </div>
  );
}
