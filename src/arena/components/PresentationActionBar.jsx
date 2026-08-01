import React from 'react';
import { Presentation, FileUp, Eye } from 'lucide-react';

export default function PresentationActionBar({ onView, onExportPPTX, onExportPDF }) {
  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
      <button
        onClick={onView}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                 bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950
                 shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
      >
        <Eye size={12} /> Fullscreen
      </button>
      <button 
        onClick={onExportPPTX}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
      >
        <Presentation size={12} /> PPTX
      </button>
      <button 
        onClick={onExportPDF}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg 
                 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
      >
        <FileUp size={12} /> PDF
      </button>
    </div>
  );
}
