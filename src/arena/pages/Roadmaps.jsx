import React, { useState } from 'react';
import { Map, Check, Circle, Lock, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import { CAREER_ROADMAPS } from '../data/roadmaps';

export default function Roadmaps() {
  const [activeRoadmap, setActiveRoadmap] = useState(null);

  if (activeRoadmap) {
    return <RoadmapDetail roadmap={activeRoadmap} onBack={() => setActiveRoadmap(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
            <Map size={20} className="text-amber-400" />
          </div>
          Career Roadmaps
        </h1>
        <p className="text-sm text-zinc-500 mt-1">AI-generated personalized career paths for your goals.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CAREER_ROADMAPS.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveRoadmap(r)}
            className="glass-panel border border-white/5 rounded-2xl p-5 text-left hover:border-white/15 hover:bg-white/[0.04] transition-all group"
          >
            <div className="text-3xl mb-3">{r.icon}</div>
            <h3 className="font-display font-bold text-base group-hover:text-cyan-200 transition-colors">{r.title}</h3>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{r.description}</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-2xs text-zinc-600">
                <Clock size={11} /> {r.estimatedTime}
              </div>
              <span className={`text-2xs font-mono px-2 py-0.5 rounded-full border
                ${r.difficulty === 'Advanced' ? 'bg-red-500/10 border-red-400/30 text-red-300' :
                  r.difficulty === 'Intermediate' ? 'bg-amber-500/10 border-amber-400/30 text-amber-300' :
                  'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'}
              `}>
                {r.difficulty}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoadmapDetail({ roadmap, onBack }) {
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const totalSteps = roadmap.steps.length;
  const completedCount = completedSteps.size;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  function toggleStep(idx) {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="max-w-4xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <button onClick={onBack} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        ← Back to Roadmaps
      </button>

      <div className="flex items-start gap-4">
        <div className="text-4xl">{roadmap.icon}</div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">{roadmap.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">{roadmap.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={13} /> {roadmap.estimatedTime}</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full border
              ${roadmap.difficulty === 'Advanced' ? 'bg-red-500/10 border-red-400/30 text-red-300' :
                roadmap.difficulty === 'Intermediate' ? 'bg-amber-500/10 border-amber-400/30 text-amber-300' :
                'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'}
            `}>
              {roadmap.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-panel border border-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-500">Progress</span>
          <span className="text-xs font-mono text-zinc-400">{completedCount}/{totalSteps} steps ({progressPct}%)</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 space-y-4">
        <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-400/50 via-violet-400/50 to-zinc-700/50" />

        {roadmap.steps.map((step, i) => {
          const completed = completedSteps.has(i);
          const isNext = !completed && !completedSteps.has(i - 1) && i === 0 || (completedSteps.has(i - 1) && !completed);

          return (
            <div key={i} className="relative">
              {/* Dot */}
              <div className={`absolute -left-8 top-5 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10
                ${completed ? 'bg-emerald-500 border-emerald-400' :
                  isNext ? 'bg-cyan-500/20 border-cyan-400 animate-pulse-glow' :
                  'bg-zinc-800 border-zinc-600'}
              `}>
                {completed ? <Check size={12} className="text-white" /> :
                 isNext ? <Circle size={10} className="text-cyan-400" fill="currentColor" /> :
                 <Lock size={10} className="text-zinc-600" />}
              </div>

              <div className={`glass-panel border rounded-xl p-4 transition-all
                ${completed ? 'border-emerald-400/20 bg-emerald-500/5' :
                  isNext ? 'border-cyan-400/20 bg-cyan-500/5' :
                  'border-white/5 opacity-60'}
              `}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {step.milestone && <span className="text-2xs font-mono text-amber-300 bg-amber-500/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">MILESTONE</span>}
                      <h3 className={`font-display font-semibold text-sm ${completed ? 'text-emerald-200' : isNext ? 'text-cyan-200' : 'text-zinc-400'}`}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{step.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xs text-zinc-600 flex items-center gap-1"><Clock size={10} /> {step.estimatedTime}</span>
                    </div>
                    {step.resources.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {step.resources.map((r, ri) => (
                          <p key={ri} className="text-2xs text-zinc-500 flex items-center gap-1">
                            <ExternalLink size={9} /> {r}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleStep(i)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-2xs font-medium border transition-colors
                      ${completed ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20' :
                        'border-white/10 text-zinc-400 hover:bg-white/5'}
                    `}
                  >
                    {completed ? '✓ Done' : 'Mark Done'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
