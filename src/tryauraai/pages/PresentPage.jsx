import React, { useState } from 'react';
import { Presentation, Download, Loader2, Check, ArrowRight, Sparkles } from 'lucide-react';
import { generatePresentation, downloadPresentation } from '../../shared/brain/presentonClient';

const TEMPLATES = [
  { id: 'general', name: 'General', desc: 'Business & education' },
  { id: 'modern', name: 'Modern', desc: 'Startup pitch' },
  { id: 'executive', name: 'Executive', desc: 'Leadership decks' },
  { id: 'dynamic', name: 'Dynamic', desc: 'Creative visual' },
  { id: 'standard', name: 'Standard', desc: 'Professional' },
];

const TONES = ['default', 'professional', 'casual', 'educational', 'sales_pitch'];

export default function PresentPage() {
  const [topic, setTopic] = useState('');
  const [nSlides, setNSlides] = useState(8);
  const [template, setTemplate] = useState('general');
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await generatePresentation({
        content: topic.trim(),
        nSlides,
        language: 'English',
        template,
        tone,
        exportAs: 'pptx',
      });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Generation failed. Is the Presenton service running?');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.presentation_id) return;
    setDownloading(true);
    try {
      await downloadPresentation(result.presentation_id, 'pptx');
    } catch (err) {
      setError('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Sparkles size={12} className="text-cyan-400" />
          <span className="text-xs font-medium text-cyan-400">New Presentation</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Generate a Presentation</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Describe your topic and let AI build the slides — powered by local Ollama.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Topic</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The Future of AI in Healthcare, Quarterly Sales Report 2026, Introduction to Quantum Computing..."
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-colors resize-none"
            disabled={generating}
          />
        </div>

        {/* Settings Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Slides</label>
            <select
              value={nSlides}
              onChange={(e) => setNSlides(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50"
              disabled={generating}
            >
              {[3, 5, 6, 8, 10, 12, 15].map((n) => (
                <option key={n} value={n}>{n} slides</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50"
              disabled={generating}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50"
              disabled={generating}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Visual */}
        <div className="flex gap-2 flex-wrap">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                template === t.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/[0.02] text-zinc-500 border border-white/5 hover:border-white/10'
              }`}
              disabled={generating}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={generating || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating presentation...
            </>
          ) : (
            <>
              <Presentation size={16} />
              Generate {nSlides}-slide Presentation
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Make sure the Docker stack is running: <code className="text-zinc-500">docker compose up -d</code>
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={14} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-300">Presentation ready!</p>
              <p className="text-xs text-zinc-500 font-mono">{result.presentation_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-40"
            >
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Download PPTX
            </button>
            {result.edit_path && (
              <a
                href={`http://localhost:5001${result.edit_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline"
              >
                Edit in Presenton →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
