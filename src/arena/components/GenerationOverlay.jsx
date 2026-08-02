import React from 'react';
import { Loader2, Sparkles, FileText, Palette, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 'creating', label: 'Creating presentation', icon: FileText },
  { id: 'outlining', label: 'Writing outline', icon: Sparkles },
  { id: 'streaming', label: 'Generating content', icon: Palette },
  { id: 'done', label: 'Ready!', icon: CheckCircle2 },
];

export default function GenerationOverlay({ step, status, chunks, estimatedSeconds }) {
  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
        {/* Animated icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D5CAFC] via-[#E3D2EB] to-[#FDE4C2] flex items-center justify-center shadow-lg">
            <Sparkles size={32} className="text-[#7A5AF8]" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#7A5AF8] flex items-center justify-center">
            <Loader2 size={12} className="text-white animate-spin" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="font-syne text-xl font-bold text-[#101323] mb-1">
            {step === 'done' ? 'Almost there!' : 'Creating your presentation'}
          </h2>
          <p className="text-sm text-[#808080]">
            {status || 'This may take 30–60 seconds'}
          </p>
        </div>

        {/* Progress steps */}
        <div className="w-full space-y-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < stepIndex;
            const isActive = i === stepIndex;
            const isPending = i > stepIndex;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#F3F0FF]' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-green-100 text-green-600'
                      : isActive
                        ? 'bg-[#7A5AF8] text-white'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} />
                  ) : isActive ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isDone
                      ? 'text-green-600'
                      : isActive
                        ? 'text-[#7A5AF8]'
                        : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7A5AF8] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7A5AF8] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7A5AF8] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live preview of chunks */}
        {chunks && (
          <div className="w-full rounded-xl bg-[#FAFBFC] border border-[#EDEEEF] p-4 text-left">
            <p className="text-[10px] font-mono text-[#808080] mb-2">Live preview</p>
            <p className="text-xs text-[#333] font-mono leading-relaxed max-h-24 overflow-hidden">
              {chunks.slice(-200)}
              <span className="inline-block w-1 h-3 bg-[#7A5AF8] animate-pulse ml-0.5" />
            </p>
          </div>
        )}

        {/* Estimated time */}
        <p className="text-[11px] text-[#808080]">
          Estimated: ~{estimatedSeconds || 45}s remaining
        </p>
      </div>
    </div>
  );
}
