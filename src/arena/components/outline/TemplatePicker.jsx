import React, { useState, useEffect } from 'react';
import { Loader2, Grid3X3, CheckCircle2 } from 'lucide-react';
import { authFetch } from '../../lib/api';

function TemplateCard({ template, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(template)}
      className={`group relative rounded-2xl border-2 transition-all overflow-hidden text-left ${
        isSelected
          ? 'border-[#7A5AF8] ring-2 ring-[#7A5AF8]/20 shadow-[0_8px_22px_rgba(81,70,229,0.12)]'
          : 'border-[#EDEEEF] hover:border-[#CFC7FF] hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-[#7A5AF8] flex items-center justify-center">
          <CheckCircle2 size={14} className="text-white" />
        </div>
      )}
      <div className="aspect-video bg-gradient-to-br from-[#F3F0FF] to-[#EEF2FF] flex items-center justify-center relative overflow-hidden">
        {template.thumbnail && (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center">
            <span className="font-syne font-bold text-xl text-[#7A5AF8]">{template.name[0]}</span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-white">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">{template.name}</h4>
        <p className="text-xs text-[#808080] mt-1 line-clamp-2">{template.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-[#808080] flex items-center gap-1">
            <Grid3X3 size={10} /> {template.layout_count} layouts
          </span>
        </div>
      </div>
    </button>
  );
}

function ShimmerCard() {
  return (
    <div className="rounded-2xl border border-[#EDEEEF] overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-4 bg-white space-y-2">
        <div className="h-3.5 w-20 rounded bg-gray-200" />
        <div className="h-2.5 w-full rounded bg-gray-100" />
        <div className="h-2.5 w-16 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function TemplatePicker({ onSelect, selectedId }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/v1/ppt/template/all')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setTemplates(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="font-syne text-[28px] font-bold text-[#101323] mb-2">
          Select a Template
        </h1>
        <p className="text-sm text-[#808080] max-w-md mx-auto">
          Choose a design template. Your AI-generated outline will use this style.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }, (_, i) => <ShimmerCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              isSelected={selectedId === t.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
