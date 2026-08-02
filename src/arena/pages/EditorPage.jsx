import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader, Play, Download, Save } from 'lucide-react';
import KonvaCanvas from '../components/editor/KonvaCanvas';
import EditorToolbar from '../components/editor/EditorToolbar';
import { authFetch } from '../lib/api';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function slideToElements(slide) {
  const els = [];
  let y = 40;

  const title = slide.content?.title_header?.header_title || slide.title || '';
  if (title) {
    els.push({
      id: genId(),
      type: 'text',
      x: 80,
      y,
      width: 800,
      height: 60,
      text: title.replace(/^[,\s]+/, ''),
      fontSize: 36,
      fontFamily: '"Syne", sans-serif',
      fontStyle: 'bold',
      fill: '#101323',
    });
    y += 80;
  }

  const bullets = slide.content?.list_of_number_bullet_point_item?.grid_1 ||
                  slide.content?.list_of_bullet_points?.grid_1 || [];
  bullets.forEach((b, i) => {
    els.push({
      id: genId(),
      type: 'text',
      x: 80,
      y: y + i * 48,
      width: 800,
      height: 42,
      text: (b.item_heading || b.heading || '') + (b.item_body || b.body ? '\n' + (b.item_body || b.body) : ''),
      fontSize: 16,
      fontFamily: '"Inter", sans-serif',
      fontStyle: 'normal',
      fill: '#374151',
    });
  });

  return els;
}

export default function EditorPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/v1/ppt/presentation/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setPresentation(data);
        const slides = data.slides || [];
        if (slides.length > 0) {
          setElements(slideToElements(slides[0]));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSlideChange = useCallback((idx) => {
    setCurrentSlide(idx);
    setSelectedId(null);
    const slides = presentation?.slides || [];
    if (slides[idx]) {
      setElements(slideToElements(slides[idx]));
    }
  }, [presentation]);

  const handleAddText = useCallback(() => {
    const newEl = {
      id: genId(),
      type: 'text',
      x: 200,
      y: 200,
      width: 400,
      height: 50,
      text: 'New text',
      fontSize: 20,
      fontFamily: '"Inter", sans-serif',
      fill: '#101323',
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  }, []);

  const handleAddImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const newEl = {
          id: genId(),
          type: 'image',
          x: 200,
          y: 150,
          width: 300,
          height: 200,
          src: reader.result,
        };
        setElements(prev => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  const handleAddRect = useCallback(() => {
    const newEl = {
      id: genId(),
      type: 'rect',
      x: 200,
      y: 200,
      width: 200,
      height: 150,
      fill: '#F5F3FF',
      stroke: '#7C3AED',
      strokeWidth: 1.5,
      cornerRadius: 12,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  }, []);

  const handleUpdateElement = useCallback((elId, updates) => {
    setElements(prev => prev.map(e => e.id === elId ? { ...e, ...updates } : e));
  }, []);

  const handleDeleteElement = useCallback((elId) => {
    setElements(prev => prev.filter(e => e.id !== elId));
    setSelectedId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      const slideData = {
        title: elements.find(e => e.type === 'text' && e.fontSize > 24)?.text || '',
        content: elements.filter(e => e.type === 'text').map(e => e.text).join('\n'),
        elements: elements,
      };
      await authFetch(`/api/v1/ppt/slide/edit`, {
        method: 'POST',
        body: JSON.stringify({
          presentation_id: id,
          slide_index: currentSlide,
          ...slideData,
        }),
      });
    } catch {} finally {
      setSaving(false);
    }
  }, [id, elements, currentSlide]);

  const selectedElement = elements.find(e => e.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader size={32} className="text-purple-500 animate-spin" />
      </div>
    );
  }

  const slides = presentation?.slides || [];
  const total = slides.length;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--p-border)] bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/presentation?id=${id}`} className="text-sm text-[var(--p-text-muted)] hover:text-purple-600">
            ← Back
          </Link>
          <span className="text-xs text-[var(--p-text-muted)]">
            Slide {currentSlide + 1} of {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs tabular-nums w-10 text-center">{currentSlide + 1}</span>
          <button
            onClick={() => handleSlideChange(Math.min(total - 1, currentSlide + 1))}
            disabled={currentSlide === total - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <EditorToolbar
            onAddText={handleAddText}
            onAddImage={handleAddImage}
            onAddRect={handleAddRect}
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <KonvaCanvas
          elements={elements}
          selectedId={selectedId}
          onSelectElement={setSelectedId}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
        />
      </div>

      {/* Slide thumbnails bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-[var(--p-border)] bg-white overflow-x-auto shrink-0">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => handleSlideChange(i)}
            className={`shrink-0 w-24 h-14 rounded-lg border-2 text-xs font-medium transition-all flex items-center justify-center ${
              i === currentSlide
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
