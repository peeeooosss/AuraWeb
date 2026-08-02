import { ChevronRight, Loader2 } from 'lucide-react';

export default function GenerateButton({ onGenerate, isStreaming, isGenerating, hasTemplate, hasOutlines }) {
  const disabled = isStreaming || isGenerating || !hasTemplate || !hasOutlines;

  let text = 'Select a Template';
  if (isStreaming) text = 'Writing your outline...';
  else if (isGenerating) text = 'Generating slides...';
  else if (hasTemplate && hasOutlines) text = 'Continue → Generate Slides';
  else if (hasTemplate && !hasOutlines) text = 'Waiting for outline...';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#EDEEEF] py-4 z-40">
      <div className="flex justify-center">
        <button
          onClick={onGenerate}
          disabled={disabled}
          className="flex items-center gap-1.5 px-6 py-3 rounded-[58px] font-syne text-sm font-semibold text-[#101323] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            background: 'linear-gradient(270deg, #D5CAFC 2.4%, #E3D2EB 27.88%, #F4DCD3 69.23%, #FDE4C2 100%)',
          }}
        >
          {(isStreaming || isGenerating) && <Loader2 size={14} className="animate-spin" />}
          {text}
          {!disabled && !isStreaming && !isGenerating && <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}
