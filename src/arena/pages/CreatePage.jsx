import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, FileUp, X, Loader2 } from 'lucide-react';
import { useGenerateFlow } from '../hooks/useGenerateFlow';
import { authFetch } from '../lib/api';
import GenerationOverlay from '../components/GenerationOverlay';

const LANGUAGE_OPTIONS = [
  'Auto-detect', 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Russian', 'Japanese', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Korean', 'Hindi',
  'Arabic', 'Bengali', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Malay', 'Tamil',
  'Telugu', 'Marathi', 'Urdu', 'Polish', 'Ukrainian', 'Czech', 'Swedish', 'Norwegian',
  'Danish', 'Finnish', 'Greek', 'Hungarian', 'Romanian', 'Bulgarian', 'Croatian', 'Serbian',
  'Slovak', 'Slovenian', 'Hebrew', 'Persian', 'Swahili', 'Filipino', 'Afrikaans',
];

const TONE_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'academic', label: 'Academic' },
  { id: 'persuasive', label: 'Persuasive' },
  { id: 'humorous', label: 'Humorous' },
];

const VERBOSITY_OPTIONS = [
  { id: 'standard', label: 'Standard' },
  { id: 'concise', label: 'Concise' },
  { id: 'text-heavy', label: 'Text Heavy' },
];

const TEMPLATES = [
  { id: 'general', name: 'General' },
  { id: 'modern', name: 'Modern' },
  { id: 'executive', name: 'Executive' },
  { id: 'momentum', name: 'Momentum' },
  { id: 'dynamic', name: 'Dynamic' },
  { id: 'standard', name: 'Standard' },
];

export default function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { generate, generating, step, status, chunks, error } = useGenerateFlow();

  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState([]);
  const [slideCount, setSlideCount] = useState(8);
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('default');
  const [verbosity, setVerbosity] = useState('standard');
  const [template, setTemplate] = useState('general');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [webSearch, setWebSearch] = useState(true);

  const handleGenerate = async () => {
    if (!prompt.trim() && files.length === 0) return;
    const result = await generate({
      content: prompt,
      n_slides: slideCount,
      language,
      template,
      tone,
      verbosity,
      instructions,
      web_search: webSearch,
    });
    if (result?.id) {
      // Upload any attached files
      if (files.length > 0) {
        try {
          const formData = new FormData();
          formData.append('presentation_id', result.id);
          files.forEach((f) => formData.append('files', f));
          await authFetch('/api/v1/ppt/files/upload', {
            method: 'POST',
            body: formData,
          });
        } catch {
          // file upload is best-effort
        }
      }
      navigate(`/outline?id=${result.id}`);
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      {generating && (
        <GenerationOverlay
          step={step}
          status={status}
          chunks={chunks}
          estimatedSeconds={30}
        />
      )}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
      <div className="rounded-2xl mt-8">
        {/* Config row */}
        <div className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-[#EDEEEF]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-[#808080]">
              <span className="px-2.5 py-1 rounded-full bg-[#F6F6F9] font-medium text-[#191919]">
                {slideCount} slides
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F6F6F9] font-medium text-[#191919]">
                {language}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F6F6F9] font-medium text-[#191919] capitalize">
                {tone}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Slides */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#808080]">Slides</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="1" max="30"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-20 accent-[#7A5AF8]"
                />
                <span className="text-xs font-semibold w-6 text-[#191919]">{slideCount}</span>
              </div>
            </div>

            {/* Language */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs rounded-lg border border-[#EDEEEF] px-2 py-1.5 text-[#191919] bg-white"
            >
              {LANGUAGE_OPTIONS.map(l => <option key={l}>{l}</option>)}
            </select>

            {/* Template */}
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="text-xs rounded-lg border border-[#EDEEEF] px-2 py-1.5 text-[#191919] bg-white capitalize"
            >
              {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#7A5AF8] hover:underline"
            >
              {showAdvanced ? 'Less' : 'Advanced'}
            </button>
          </div>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="px-4 py-3 border-b border-[#EDEEEF] space-y-3 bg-[#FAFBFC]">
            <div>
              <label className="text-xs font-medium text-[#191919] mb-1.5 block">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {TONE_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      tone === t.id ? 'bg-[#7A5AF8] text-white' : 'bg-white border border-[#EDEEEF] text-[#191919] hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#191919] mb-1.5 block">Verbosity</label>
              <div className="flex flex-wrap gap-1.5">
                {VERBOSITY_OPTIONS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVerbosity(v.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      verbosity === v.id ? 'bg-[#7A5AF8] text-white' : 'bg-white border border-[#EDEEEF] text-[#191919] hover:bg-gray-50'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#191919] mb-1.5 block">Web Research</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWebSearch(!webSearch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    webSearch ? 'bg-[#7A5AF8]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      webSearch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-[#808080]">
                  Search the web for real facts and data
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#191919] mb-1.5 block">Custom Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Specific points to include, style preferences..."
                rows={3}
                className="w-full rounded-xl border border-[#EDEEEF] px-3 py-2 text-sm text-[#191919] placeholder:text-[#808080] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8]"
              />
            </div>
          </div>
        )}

        {/* Prompt input */}
        <div className="p-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the presentation you want to create... e.g., 'The future of AI in healthcare: breakthroughs, applications, and ethical considerations'"
              rows={5}
              className="w-full rounded-2xl border border-[#EDEEEF] bg-white px-5 py-4 text-sm text-[#191919] placeholder:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8] font-syne"
              autoFocus
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="px-4 pb-2">
          <h3 className="mb-2 text-sm font-medium text-[#333333]">Attachments (optional)</h3>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F0FF] text-xs text-[#7A5AF8]">
                  <FileUp size={12} />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[#EDEEEF] bg-[#FAFBFC] py-6 cursor-pointer hover:border-[#7A5AF8]/30 hover:bg-[#F3F0FF]/30 transition-colors">
            <FileUp size={16} className="text-[#808080]" />
            <span className="text-sm text-[#808080]">Click to upload documents</span>
            <input
              type="file"
              className="hidden"
              multiple
              accept=".txt,.md,.doc,.docx,.pdf"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Submit */}
        <div className="p-4">
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || (!prompt.trim() && files.length === 0)}
            style={{
              background: 'linear-gradient(270deg, #D5CAFC 2.4%, #E3D2EB 27.88%, #F4DCD3 69.23%, #FDE4C2 100%)',
            }}
            className="ml-auto mr-0 flex w-fit items-center justify-center rounded-[28px] px-4 py-3 font-syne text-xs font-semibold text-[#101323] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
