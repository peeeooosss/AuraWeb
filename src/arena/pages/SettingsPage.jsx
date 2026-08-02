import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function SettingsPage() {
  const [ollamaStatus, setOllamaStatus] = useState(null);

  useEffect(() => {
    fetch('http://localhost:11434/api/tags')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setOllamaStatus({ online: true, models: d.models?.map(m => m.name) || [] }))
      .catch(() => setOllamaStatus({ online: false, models: [] }));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-syne text-[22px] font-medium text-[#101323] mb-1">Settings</h1>
      <p className="text-sm text-[#808080] mb-8">Configure your AI provider.</p>

      <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F3F0FF] flex items-center justify-center">
            <span className="font-syne font-bold text-sm text-[#7A5AF8]">AI</span>
          </div>
          <div>
            <h3 className="font-syne font-semibold text-sm text-[#191919]">AI Provider</h3>
            <p className="text-xs text-[#808080]">Local Ollama inference</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#FAFBFC] border border-[#EDEEEF] p-4 space-y-2">
          <div className="flex items-center gap-2">
            {ollamaStatus?.online ? (
              <Wifi size={14} className="text-green-500" />
            ) : ollamaStatus === null ? (
              <div className="w-3.5 h-3.5 border-2 border-[#808080]/30 border-t-transparent rounded-full animate-spin" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
            <span className="text-sm font-medium text-[#191919]">
              Ollama {ollamaStatus?.online ? 'Connected' : ollamaStatus === null ? 'Checking...' : 'Offline'}
            </span>
          </div>

          {ollamaStatus?.online && ollamaStatus.models.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-6">
              {ollamaStatus.models.map(m => (
                <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3F0FF] text-[#7A5AF8] font-mono">
                  {m}
                </span>
              ))}
            </div>
          )}

          {!ollamaStatus?.online && ollamaStatus !== null && (
            <p className="text-xs text-red-600 pl-6">
              Ollama not running. Start with <code className="bg-red-50 px-1 rounded text-xs">ollama serve</code>
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#F3F0FF] border border-[#DDD9F8]">
            <p className="text-xs text-[#7A5AF8] font-medium mb-0.5">LLM</p>
            <p className="text-sm font-semibold text-[#191919]">Ollama</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F3F0FF] border border-[#DDD9F8]">
            <p className="text-xs text-[#7A5AF8] font-medium mb-0.5">Model</p>
            <p className="text-sm font-semibold text-[#191919]">llama3.2:3b</p>
          </div>
        </div>
      </div>
    </div>
  );
}
