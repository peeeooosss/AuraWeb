import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  GripVertical, Plus, X, ChevronDown, Sparkles, Trash2, Eye,
} from 'lucide-react';
import { getSlideThemeList } from '@/shared/brain/slideThemes';

const THEMES = getSlideThemeList();

/* ── Single Slide Card ──────────────────────────────────────────── */
function SlideCard({ slide, index, onUpdate, onRemove, canRemove }) {
  const [title, setTitle] = useState(slide.title);
  const [points, setPoints] = useState(slide.points || []);

  function handleTitleChange(e) {
    setTitle(e.target.value);
    onUpdate({ ...slide, title: e.target.value, points });
  }

  function handlePointChange(i, value) {
    const updated = [...points];
    updated[i] = value;
    setPoints(updated);
    onUpdate({ ...slide, title, points: updated });
  }

  function addPoint() {
    const updated = [...points, ''];
    setPoints(updated);
    onUpdate({ ...slide, title, points: updated });
  }

  function removePoint(i) {
    const updated = points.filter((_, j) => j !== i);
    setPoints(updated);
    onUpdate({ ...slide, title, points: updated });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="glass-panel border border-white/10 rounded-xl overflow-hidden"
    >
      {/* Drag handle + slide number */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors drag-handle">
          <GripVertical size={14} />
        </div>
        <span className="text-2xs font-mono text-zinc-600">Slide {index + 1}</span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="ml-auto p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Title input */}
      <div className="px-3 pt-2.5 pb-1">
        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Slide title..."
          className="w-full bg-transparent text-sm font-semibold text-zinc-200 outline-none placeholder:text-zinc-700"
        />
      </div>

      {/* Bullet points */}
      <div className="px-3 pb-2.5 space-y-1">
        {points.map((point, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <span className="text-2xs text-zinc-600 mt-0.5 w-3 text-center">•</span>
            <input
              value={point}
              onChange={(e) => handlePointChange(i, e.target.value)}
              placeholder="Bullet point..."
              className="flex-1 bg-transparent text-xs text-zinc-400 outline-none placeholder:text-zinc-700"
            />
            <button
              onClick={() => removePoint(i)}
              className="p-0.5 rounded text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          onClick={addPoint}
          className="flex items-center gap-1 text-2xs text-zinc-600 hover:text-cyan-400 transition-colors mt-1 ml-3"
        >
          <Plus size={10} /> Add bullet
        </button>
      </div>
    </motion.div>
  );
}

/* ── Theme Picker Dropdown ──────────────────────────────────────── */
function ThemePickerInline({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = THEMES.find(t => t.id === value) || THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-cyan-400/30 transition-colors"
      >
        <span>{current.emoji}</span>
        <span className="text-zinc-300">{current.name}</span>
        <ChevronDown size={12} className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 z-50 w-56 glass-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50"
            >
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onChange(t.id); setOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition-colors ${
                    t.id === value
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <div>
                    <div className="text-xs font-medium">{t.name}</div>
                    <div className="text-2xs text-zinc-600">{t.desc}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Outline Editor ────────────────────────────────────────── */
export default function OutlineEditor({ topic, outline, theme, onGenerate, onCancel }) {
  const [slides, setSlides] = useState(
    Array.isArray(outline) 
      ? outline.map(s => ({
          title: typeof s?.title === 'string' ? s.title : '',
          points: Array.isArray(s?.points) 
            ? s.points.filter(p => typeof p === 'string') 
            : ['']
        }))
      : []
  );
  const [selectedTheme, setSelectedTheme] = useState(theme || 'glass-dark');

  function updateSlide(index, updated) {
    const next = [...slides];
    next[index] = updated;
    setSlides(next);
  }

  function removeSlide(index) {
    setSlides(slides.filter((_, i) => i !== index));
  }

  function addSlide() {
    setSlides([...slides, { title: '', points: [''] }]);
  }

  function handleGenerate() {
    const cleaned = slides
      .filter(s => s.title.trim())
      .map(s => ({
        title: s.title.trim(),
        points: s.points.filter(p => p.trim()),
      }));
    if (cleaned.length < 2) return;
    onGenerate(cleaned, selectedTheme);
  }

  const validSlideCount = slides.filter(s => s.title.trim()).length;

  return (
    <div className="w-full max-w-[520px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">📋</span>
        <span className="text-sm font-medium text-zinc-300">
          Outline for "{topic}"
        </span>
      </div>

      {/* Slide list with drag-to-reorder */}
      <Reorder.Group
        axis="y"
        values={slides}
        onReorder={setSlides}
        className="space-y-2"
      >
        <AnimatePresence initial={false}>
          {slides.map((slide, i) => (
            <Reorder.Item
              key={slide.title || `slide-${i}`}
              value={slide}
              className="list-none"
              dragListener={true}
              dragConstraints={{ left: 0, right: 0 }}
              whileDrag={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 50 }}
            >
              <SlideCard
                slide={slide}
                index={i}
                onUpdate={(updated) => updateSlide(i, updated)}
                onRemove={removeSlide}
                canRemove={slides.length > 2}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add slide */}
      <button
        onClick={addSlide}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-cyan-400 transition-colors mt-3 ml-1"
      >
        <Plus size={12} /> Add slide
      </button>

      {/* Theme Picker + Generate */}
      <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
        <ThemePickerInline value={selectedTheme} onChange={setSelectedTheme} />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={validSlideCount < 2}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg 
                     bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950
                     shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow
                     disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={12} />
            Generate {validSlideCount || ''} slides
          </button>
        </div>
      </div>
    </div>
  );
}