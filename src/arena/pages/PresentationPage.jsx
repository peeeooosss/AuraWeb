import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Download, FileText, Loader, AlertCircle, ChevronLeft, ChevronRight,
  Play, X, Sparkles, MessageSquare, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import SlideRenderer from '../components/SlideRenderer';
import { exportSlides, triggerDownload } from '../lib/exportClient.jsx';
import { authFetch } from '../lib/api';
import { getAccessToken } from '../lib/auth';

function FullscreenPresenter({ slides, currentIndex, onClose }) {
  const [idx, setIdx] = useState(currentIndex);
  const [showNotes, setShowNotes] = useState(false);
  const slide = slides[idx];
  const speakerNote = slide?.speaker_note || '';

  const goNext = useCallback(() => { if (idx < slides.length - 1) setIdx(idx + 1); }, [idx, slides.length]);
  const goPrev = useCallback(() => { if (idx > 0) setIdx(idx - 1); }, [idx]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 'Escape') onClose();
      if (e.key === 'n' || e.key === 'N') setShowNotes((v) => !v);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-black/50 backdrop-blur">
        <span className="text-xs text-gray-400">
          Slide {idx + 1} of {slides.length}
        </span>
        <div className="flex items-center gap-3">
          {speakerNote && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-1.5 rounded-lg transition-colors ${showNotes ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
              title="Toggle speaker notes (N)"
            >
              <MessageSquare size={16} />
            </button>
          )}
          <span className="text-xs text-gray-500">
            ← → arrow keys &nbsp;|&nbsp; N notes &nbsp;|&nbsp; Esc to exit
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <SlideRenderer slide={slide} index={idx} total={slides.length} />
        </div>
      </div>

      {showNotes && speakerNote && (
        <div className="px-6 py-4 bg-gray-900 border-t border-gray-700">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm text-gray-300 leading-relaxed font-medium">Speaker Notes</p>
            <p className="text-sm text-gray-400 leading-relaxed mt-1">{speakerNote}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 py-4 px-6 bg-black/50 backdrop-blur">
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === idx ? 'bg-purple-500' : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={idx === slides.length - 1}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function StreamingSkeleton() {
  return (
    <div className="w-full aspect-[16/9] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
      <Loader size={32} className="text-purple-300 animate-spin" />
    </div>
  );
}

function ThumbnailSkeleton() {
  return (
    <div className="w-full rounded-xl overflow-hidden border-2 border-transparent">
      <div style={{ aspectRatio: '16/9' }} className="bg-gray-100 animate-pulse flex items-center justify-center">
        <Loader size={14} className="text-purple-300 animate-spin" />
      </div>
    </div>
  );
}

export default function PresentationPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const shouldStream = searchParams.get('stream') === 'true';

  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [streaming, setStreaming] = useState(false);

  const completedRef = useRef(false);
  const totalSlidesRef = useRef(0);
  const autoAdvanceRef = useRef(true);

  useEffect(() => {
    if (!id) { setError('No presentation ID'); setLoading(false); return; }
    completedRef.current = false;

    if (!shouldStream) {
      authFetch(`/api/v1/ppt/presentation/${id}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
        .then(data => { setPresentation(data); setLoading(false); })
        .catch(() => { setError('Failed to load presentation'); setLoading(false); });
      return;
    }

    const MAX_RETRIES = 3;
    const CONNECT_TIMEOUT_MS = 15000;
    let retryCount = 0;
    let isClosed = false;
    let connectionTimer = null;
    let retryTimer = null;
    let es = null;
    let cancelled = false;

    const clearTimers = () => {
      if (connectionTimer) { clearTimeout(connectionTimer); connectionTimer = null; }
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    };

    const closeES = () => { try { es?.close(); } catch {} es = null; };

    const scheduleRetry = (reason) => {
      if (isClosed || cancelled) return;
      if (retryCount >= MAX_RETRIES) {
        setStreaming(false);
        setLoading(false);
        setError(`Stream failed after ${MAX_RETRIES} attempts. Check your connection and try again.`);
        toast.error('Stream failed', { description: reason || 'Could not connect to the server.' });
        return;
      }
      retryCount++;
      closeES();
      clearTimers();
      setStreamStatus(`Reconnecting (attempt ${retryCount}/${MAX_RETRIES})...`);
      retryTimer = setTimeout(() => {
        if (!isClosed && !cancelled) openStream();
      }, 1000 * retryCount);
    };

    const openStream = async () => {
      closeES();
      clearTimers();

      let streamUrl;
      try {
        const token = await getAccessToken();
        streamUrl = token
          ? `/api/v1/ppt/presentation/stream/${id}?token=${encodeURIComponent(token)}`
          : `/api/v1/ppt/presentation/stream/${id}`;
      } catch {
        setStreaming(false);
        setError('Authentication failed. Please sign in again.');
        return;
      }

      es = new EventSource(streamUrl);

      connectionTimer = setTimeout(() => {
        closeES();
        scheduleRetry('connection timeout');
      }, CONNECT_TIMEOUT_MS);

      es.addEventListener('response', (event) => {
        if (isClosed || cancelled || completedRef.current) return;

        if (connectionTimer) { clearTimeout(connectionTimer); connectionTimer = null; }

        let d;
        try { d = JSON.parse(event.data); } catch { return; }

        if (d.type === 'status') {
          setStreamStatus(d.status);
        } else if (d.type === 'chunk') {
          const slide = d.chunk;
          if (slide && typeof slide.index === 'number') {
            setPresentation(prev => {
              const existing = [...(prev?.slides || [])];
              while (existing.length <= slide.index) existing.push(null);
              existing[slide.index] = slide;
              return {
                ...(prev || {}),
                id: prev?.id || id,
                title: prev?.title || '',
                slides: existing.filter(Boolean),
              };
            });
            setStreamStatus(`Generating slide ${slide.index + 1}...`);
            if (autoAdvanceRef.current) {
              setCurrentSlide(slide.index);
            }
          }
        } else if (d.type === 'complete') {
          if (d.presentation) {
            isClosed = true;
            completedRef.current = true;
            totalSlidesRef.current = d.presentation.slides?.length || 0;
            setPresentation(d.presentation);
            setStreaming(false);
            setStreamStatus('');
            setLoading(false);
            window.dispatchEvent(new CustomEvent('credits:updated'));
            closeES();
            clearTimers();
            retryCount = 0;
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('stream');
              url.searchParams.delete('type');
              window.history.replaceState({}, '', url.toString());
            } catch {}
          }
        } else if (d.type === 'closing') {
          if (d.presentation) {
            isClosed = true;
            completedRef.current = true;
            totalSlidesRef.current = d.presentation.slides?.length || 0;
            setPresentation(d.presentation);
            setStreaming(false);
            setStreamStatus('');
            setLoading(false);
            window.dispatchEvent(new CustomEvent('credits:updated'));
            closeES();
            clearTimers();
            retryCount = 0;
          }
        } else if (d.type === 'error') {
          if (retryCount > 0 && !isClosed) {
            closeES();
            scheduleRetry(d.detail || 'server error');
          } else {
            isClosed = true;
            completedRef.current = true;
            setError(d.detail || 'Stream error');
            setStreaming(false);
            setLoading(false);
            closeES();
            clearTimers();
            toast.error('Generation failed', { description: d.detail || 'The server encountered an error.' });
          }
        }
      });

      es.onerror = () => {
        if (isClosed || cancelled) return;
        closeES();
        clearTimers();
        scheduleRetry('connection lost');
      };
    };

    setStreamStatus('Connecting...');
    setStreaming(true);
    setLoading(false);
    openStream();

    return () => {
      cancelled = true;
      isClosed = true;
      closeES();
      clearTimers();
    };
  }, [id, shouldStream]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [presentation?.id]);

  const handleDownload = useCallback(async (format) => {
    if (!id || !presentation?.slides?.length) return;
    setExporting(true);
    try {
      const blob = await exportSlides({
        slides: presentation.slides,
        format,
        onProgress: (current, total) => setStreamStatus(`Rendering slide ${current + 1} of ${total}...`),
      });
      triggerDownload(blob, `presentation.${format}`);
    } catch (e) {
      setStreamStatus('');
      console.error('Export failed:', e);
    } finally {
      setStreamStatus('');
      setExporting(false);
    }
  }, [id, presentation]);

  if (error) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--p-bg-section)]">
        <div className="bg-white border border-red-200 rounded-2xl px-8 py-10 shadow-lg flex flex-col items-center max-w-md mx-auto text-center">
          <AlertCircle size={40} className="text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-[#101323] mb-2">Generation failed</h2>
          <p className="text-sm text-[#808080] mb-6">{error}</p>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-full text-sm font-medium text-[#808080] border border-[#EDEEEF] hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              to={`/outline?id=${id}`}
              className="px-4 py-2 rounded-full text-sm font-medium text-[#808080] border border-[#EDEEEF] hover:bg-gray-50 transition-colors"
            >
              Edit Outline
            </Link>
            <button
              onClick={() => {
                setError(null);
                setStreamStatus('');
                window.location.reload();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !streaming) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4 bg-[var(--p-bg-section)]">
        <Loader size={32} className="text-purple-400 animate-spin" />
        <p className="text-sm text-[#808080]">Loading presentation...</p>
      </div>
    );
  }

  const slides = presentation?.slides || [];
  const totalExpected = totalSlidesRef.current || (shouldStream ? (presentation?.n_slides || 0) : 0);
  const cleanTitle = (presentation?.title || 'Untitled').replace(/^[,\s]+/, '').substring(0, 60);
  const currentSlideData = slides[currentSlide];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {fullscreen && currentSlideData && (
        <FullscreenPresenter
          slides={slides}
          currentIndex={currentSlide}
          onClose={() => setFullscreen(false)}
        />
      )}

      {/* Streaming status bar */}
      {streaming && streamStatus && (
        <div className="shrink-0 border-b border-purple-100 bg-purple-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-6 py-2">
            <Loader size={14} className="text-purple-500 animate-spin shrink-0" />
            <span className="text-xs text-purple-700 font-medium truncate">{streamStatus}</span>
            <div className="flex-1 h-1 rounded-full bg-purple-100 overflow-hidden ml-2">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 animate-pulse" style={{ width: totalExpected ? `${(slides.length / totalExpected) * 100}%` : '30%' }} />
            </div>
            <span className="text-xs text-purple-500 tabular-nums shrink-0">
              {slides.length}/{totalExpected || '?'}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--p-border)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-sm text-[var(--p-text-muted)] hover:text-purple-600 truncate max-w-[200px]">
            {cleanTitle}
          </Link>
          <span className="text-xs text-[var(--p-text-muted)] bg-gray-100 rounded-full px-2 py-0.5">
            {slides.length} slides
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/outline?id=${id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--p-text-secondary)] border border-[var(--p-border)] hover:bg-gray-50"
          >
            <FileText size={12} /> Edit Outline
          </Link>
          <Link
            to={`/editor?id=${id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100"
          >
            <Sparkles size={12} /> Edit Slides
          </Link>
          <button
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--p-text-secondary)] border border-[var(--p-border)] hover:bg-gray-50"
          >
            <Play size={12} /> Present
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            disabled={exporting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--p-text-secondary)] border border-[var(--p-border)] hover:bg-gray-50 disabled:opacity-50"
          >
            <Download size={12} /> PDF
          </button>
          <button
            onClick={() => handleDownload('pptx')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {exporting ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
            PPTX
          </button>
        </div>
      </div>

      {/* Main: Slide canvas + thumbnails */}
      <div className="flex-1 flex min-h-0">
        {/* Slide viewport */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--p-bg-section)] min-w-0">
          <div className="w-full max-w-4xl">
            {currentSlideData ? (
              <SlideRenderer
                slide={currentSlideData}
                index={currentSlide}
                total={slides.length}
              />
            ) : (
              <StreamingSkeleton />
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => { autoAdvanceRef.current = false; setCurrentSlide(i => Math.max(0, i - 1)); }}
              disabled={currentSlide === 0}
              className="p-2 rounded-full border border-[var(--p-border)] bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-[var(--p-text-muted)] tabular-nums min-w-[60px] text-center">
              {currentSlide + 1} / {slides.length || 1}
            </span>
            <button
              onClick={() => { autoAdvanceRef.current = false; setCurrentSlide(i => Math.min(slides.length - 1, i + 1)); }}
              disabled={currentSlide >= slides.length - 1}
              className="p-2 rounded-full border border-[var(--p-border)] bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="w-56 shrink-0 border-l border-[var(--p-border)] bg-[var(--p-bg-card)] overflow-y-auto p-3 space-y-2 p-scrollbar">
          {slides.map((slide, i) => (
            <button
              key={slide?.id || i}
              onClick={() => { autoAdvanceRef.current = false; setCurrentSlide(i); }}
              className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all ${
                i === currentSlide
                  ? 'border-purple-500 shadow-md shadow-purple-500/10'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div style={{ aspectRatio: '16/9', fontSize: 6, lineHeight: 1.3 }}>
                <SlideRenderer slide={slide} index={i} total={slides.length} compact />
              </div>
            </button>
          ))}
          {/* Skeleton placeholders for upcoming slides during streaming */}
          {streaming && totalExpected > slides.length && Array.from({ length: Math.min(totalExpected - slides.length, 8) }, (_, i) => (
            <ThumbnailSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
