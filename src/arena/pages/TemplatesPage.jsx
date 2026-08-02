import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Grid3X3, Sparkles } from 'lucide-react';
import { authFetch } from '../lib/api';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState({ default: [], custom: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('default');

  useEffect(() => {
    authFetch('/api/v1/ppt/template/all')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const items = data.items || [];
        setTemplates({
          default: items.filter(t => t.is_default),
          custom: items.filter(t => !t.is_default),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const display = tab === 'default' ? templates.default : templates.custom;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#7A5AF8]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne text-[28px] font-bold text-[#101323]">Templates</h1>
          <p className="text-sm text-[#808080] mt-1">
            {templates.default.length} built-in templates to start your presentation.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 p-1 rounded-[40px] bg-white border border-[#EDEEEF] w-fit">
        <button
          onClick={() => setTab('default')}
          className={`px-5 py-1.5 rounded-[40px] text-sm font-medium font-syne transition-all ${
            tab === 'default' ? 'bg-[#F6F6F9] text-[#191919]' : 'text-[#808080] hover:text-[#191919]'
          }`}
        >
          Default
        </button>
        <button
          onClick={() => setTab('custom')}
          className={`px-5 py-1.5 rounded-[40px] text-sm font-medium font-syne transition-all ${
            tab === 'custom' ? 'bg-[#F6F6F9] text-[#191919]' : 'text-[#808080] hover:text-[#191919]'
          }`}
        >
          Custom{templates.custom.length > 0 && ` (${templates.custom.length})`}
        </button>
      </div>

      {display.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#F3F0FF] flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-[#7A5AF8]" />
          </div>
          <h3 className="font-syne text-lg font-semibold text-[#191919] mb-1">
            {tab === 'default' ? 'Loading templates...' : 'No custom templates yet'}
          </h3>
          <p className="text-sm text-[#808080]">
            {tab === 'default' ? 'Please wait...' : 'Save presentations as templates to reuse layouts.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {display.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/create?template=${t.id}`)}
              className="group rounded-2xl border border-[#EDEEEF] bg-white hover:border-[#CFC7FF] hover:shadow-[0_8px_22px_rgba(81,70,229,0.12)] transition-all overflow-hidden cursor-pointer"
            >
              <div className="aspect-video bg-gradient-to-br from-[#F3F0FF] to-[#EEF2FF] overflow-hidden relative flex items-center justify-center">
                {t.thumbnail && (
                  <img
                    src={t.thumbnail}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/90 shadow-sm backdrop-blur flex items-center justify-center">
                    <span className="font-syne font-bold text-xl text-[#7A5AF8]">{t.name[0]}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-syne font-semibold text-sm text-[#191919]">{t.name}</h4>
                <p className="text-xs text-[#808080] mt-1 line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-[#808080] flex items-center gap-1">
                    <Grid3X3 size={10} /> {t.layout_count} layouts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
