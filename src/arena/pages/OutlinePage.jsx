import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import TemplatePicker from '../components/outline/TemplatePicker';
import OutlineContent from '../components/outline/OutlineContent';
import GenerateButton from '../components/outline/GenerateButton';
import ChatPanel from '../components/outline/ChatPanel';
import GenerationOverlay from '../components/GenerationOverlay';
import { useOutlineStreaming } from '../hooks/useOutlineStreaming';
import { useOutlineManagement } from '../hooks/useOutlineManagement';
import { useGenerateFromOutline } from '../hooks/useGenerateFromOutline';
import { authFetch } from '../lib/api';

export default function OutlinePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');

  const [stage, setStage] = useState('template'); // 'template' | 'outline'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [title, setTitle] = useState('');

  // SSE streaming — only enabled after template is selected
  const { outlines, setOutlines, status, isStreaming, isComplete, streamError, reset } = useOutlineStreaming(
    id,
    stage === 'outline' && !!selectedTemplate,
  );

  const { handleDragEnd, handleAddSlide, handleUpdateSlide, handleDeleteSlide } = useOutlineManagement(outlines, setOutlines);
  const { generate, loading: generating, error: genError, step: genStep } = useGenerateFromOutline();

  // Load presentation title
  useEffect(() => {
    if (!id) return;
    authFetch(`/api/v1/ppt/presentation/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setTitle(d.title || ''))
      .catch(() => {});
  }, [id]);

  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplate(template.id);
    setStage('outline');
  }, []);

  const handleGoBack = useCallback(() => {
    reset();
    setStage('template');
    setSelectedTemplate(null);
  }, [reset]);

  const handleGenerate = useCallback(async () => {
    await generate({
      presentationId: id,
      outlines,
      template: selectedTemplate,
    });
  }, [id, outlines, selectedTemplate, generate]);

  const handleRefreshOutlines = useCallback((newOutlines) => {
    setOutlines(newOutlines);
  }, [setOutlines]);

  if (!id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles size={32} className="text-[#808080]/40 mx-auto mb-4" />
          <p className="text-sm text-[#808080]">No presentation ID found.</p>
          <button onClick={() => navigate('/create')} className="mt-3 text-sm text-[#7A5AF8] hover:underline">
            Create a new presentation
          </button>
        </div>
      </div>
    );
  }

  // Map useGenerateFromOutline steps to overlay steps
  const overlayStepMap = {
    saving: 'outlining',
    preparing: 'streaming',
    navigating: 'done',
  };
  const overlayStep = genStep ? (overlayStepMap[genStep] || 'outlining') : null;
  const overlayStatus = genStep === 'preparing'
    ? 'Preparing your slides...'
    : genStep === 'navigating'
      ? 'Almost there!'
      : 'Saving outline...';

  if (stage === 'template') {
    return (
      <div className="min-h-screen bg-white">
        {generating && (
          <GenerationOverlay
            step={overlayStep}
            status={overlayStatus}
            estimatedSeconds={45}
          />
        )}
        <TemplatePicker
          onSelect={handleTemplateSelect}
          selectedId={null}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {generating && (
        <GenerationOverlay
          step={overlayStep}
          status={overlayStatus}
          estimatedSeconds={45}
        />
      )}
      {/* Main Content */}
      <div className="flex-1 min-w-0 pb-24">
        {/* Outline content */}
        <div className="max-w-4xl mx-auto px-6 py-6">
          {streamError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {streamError}
            </div>
          )}
          {genError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {genError}
            </div>
          )}
          <OutlineContent
            outlines={outlines}
            isStreaming={isStreaming}
            isComplete={isComplete}
            onDragEnd={handleDragEnd}
            onAddSlide={handleAddSlide}
            onUpdateSlide={handleUpdateSlide}
            onDeleteSlide={handleDeleteSlide}
          />
        </div>
      </div>

      {/* Chat Panel Sidebar */}
      <div className="hidden xl:block w-[369px] shrink-0 border-l border-[#EDEEEF] h-screen sticky top-0">
        <ChatPanel
          presentationId={id}
          outlines={outlines}
          onRefreshOutlines={handleRefreshOutlines}
          disabled={isStreaming}
        />
      </div>

      {/* Generate Button (fixed bottom) */}
      <GenerateButton
        onGenerate={handleGenerate}
        isStreaming={isStreaming}
        isGenerating={generating}
        hasTemplate={!!selectedTemplate}
        hasOutlines={outlines.length > 0}
      />
    </div>
  );
}
