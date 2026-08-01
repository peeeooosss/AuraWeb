import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getAllSlideThemeCSS } from '@/shared/brain/slideThemes';

/**
 * SlideRenderer — Renders AI-generated HTML slides in the OutputPanel.
 * Props:
 *   html: string — full HTML with <section data-theme="..."> elements
 *   theme: string — theme id for header display
 *   onExport: () => void
 *   exporting: boolean
 */
export default function SlideRenderer({ html, theme = 'glass-dark', onExport, exporting }) {
  const [current, setCurrent] = useState(0);
  const slideRef = useRef(null);
  const themeCSS = getAllSlideThemeCSS();

  useEffect(() => {
    setCurrent(0);
  }, [html, theme]);

  if (!html) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        No slides to display
      </div>
    );
  }

  // Parse sections from HTML
  const sections = html.match(/<section[\s\S]*?<\/section>/gi) || [];
  const total = sections.length;

  if (total === 0) {
    // Fallback: render the entire HTML as one slide
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">Presentation</span>
          </div>
          <button
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                     bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950
                     shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            {exporting ? 'Exporting...' : 'Download PPTX'}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-[640px]">
            <div
              ref={slideRef}
              className="relative w-full rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/5"
              style={{ aspectRatio: '16/9' }}
            >
              <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
              <div
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = sections[current] || '';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-300 capitalize">{theme} theme</span>
          <span className="text-2xs text-zinc-600">·</span>
          <span className="text-2xs text-zinc-500">{total} slides</span>
        </div>
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                   bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950
                   shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={12} />
          {exporting ? 'Exporting...' : 'Download PPTX'}
        </button>
      </div>

      {/* Slide Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-[640px]">
          <div
            ref={slideRef}
            className="relative w-full rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/5"
            style={{ aspectRatio: '16/9' }}
          >
            <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
            <div
              dangerouslySetInnerHTML={{ __html: currentSection }}
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 shrink-0">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} /> Prev
        </button>

        <div className="flex items-center gap-1.5">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === current
                  ? 'bg-cyan-400 w-5'
                  : 'bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent(Math.min(total - 1, current + 1))}
          disabled={current === total - 1}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
