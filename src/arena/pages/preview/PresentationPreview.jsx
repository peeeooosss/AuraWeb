import { useEffect, useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { getAllSlideThemeCSS } from '@/shared/brain/slideThemes';
import { Play, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PresentationOverlay({ html, theme = 'glass-dark', onClose }) {
  const [slides, setSlides] = useState([]);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const uiTimeout = useRef(null);

  useEffect(() => {
    if (!html) return;
    const themeCSS = getAllSlideThemeCSS();
    const sections = html.match(/<section[\s\S]*?<\/section>/gi) || [];
    const parsed = sections.map(s => {
      return DOMPurify.sanitize(`<style>${themeCSS}</style>${s}`, { ADD_TAGS: ['style'] });
    });
    setSlides(parsed);
    setStarted(false);
    setCurrent(0);
  }, [html, theme]);

  const total = slides.length;

  const resetUIHide = useCallback(() => {
    setShowUI(true);
    clearTimeout(uiTimeout.current);
    if (started) {
      uiTimeout.current = setTimeout(() => setShowUI(false), 3000);
    }
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const handleKey = (e) => {
      resetUIHide();
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          setCurrent(c => Math.min(total - 1, c + 1));
          break;
        case 'ArrowLeft':
        case 'Backspace':
          e.preventDefault();
          setCurrent(c => Math.max(0, c - 1));
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, total, onClose, resetUIHide]);

  useEffect(() => {
    if (started) resetUIHide();
    return () => clearTimeout(uiTimeout.current);
  }, [started, current, resetUIHide]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!html || slides.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">No slides to display</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center gap-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2 font-display">Ready to Present</h1>
          <p className="text-zinc-400 text-sm">{total} slides · {theme} theme</p>
        </div>
        <button
          onClick={() => setStarted(true)}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 font-semibold text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all hover:scale-105"
        >
          <Play size={20} fill="currentColor" />
          Start Presentation
        </button>
        <p className="text-zinc-600 text-xs mt-2">
          Arrow keys to navigate · <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono text-xs">Esc</kbd> to exit
        </p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col select-none"
      onMouseMove={resetUIHide}
      onClick={(e) => {
        resetUIHide();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width * 0.4) {
          setCurrent(c => Math.max(0, c - 1));
        } else if (x > rect.width * 0.6) {
          setCurrent(c => Math.min(total - 1, c + 1));
        }
      }}
    >
      {/* Slide */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <div className="relative w-full h-full">
          <div
            key={current}
            className="absolute inset-0"
            dangerouslySetInnerHTML={{ __html: slides[current] }}
          />
        </div>
      </div>

      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 z-20 ${
          showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-xs text-white/50 font-mono">
          {current + 1} / {total}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Bottom bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 z-20 ${
          showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent(c => Math.max(0, c - 1)); }}
          disabled={current === 0}
          className="flex items-center gap-1 text-xs text-white/50 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-200 ${
                i === current ? 'bg-cyan-400 w-4' : 'bg-white/20 w-1'
              }`}
            />
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent(c => Math.min(total - 1, c + 1)); }}
          disabled={current === total - 1}
          className="flex items-center gap-1 text-xs text-white/50 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
