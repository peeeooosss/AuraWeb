import React from 'react';
import { Type, Image, Square, Circle, Trash2, Move, Palette } from 'lucide-react';

const COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#8B5CF6'];
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];

export default function EditorToolbar({ onAddText, onAddImage, onAddRect, selectedElement, onUpdateElement, onDeleteElement }) {
  const [colorOpen, setColorOpen] = React.useState(false);
  const [sizeOpen, setSizeOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-1 p-2 rounded-2xl bg-white border border-gray-200 shadow-lg">
      <button
        onClick={onAddText}
        className="p-2 rounded-xl hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors"
        title="Add Text"
      >
        <Type size={16} />
      </button>
      <button
        onClick={onAddImage}
        className="p-2 rounded-xl hover:bg-cyan-50 text-gray-500 hover:text-cyan-600 transition-colors"
        title="Add Image"
      >
        <Image size={16} />
      </button>
      <button
        onClick={onAddRect}
        className="p-2 rounded-xl hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
        title="Add Shape"
      >
        <Square size={16} />
      </button>

      {selectedElement && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-1" />

          <div className="relative">
            <button
              onClick={() => setColorOpen(!colorOpen)}
              className="p-2 rounded-xl hover:bg-purple-50 text-gray-500 transition-colors"
              title="Color"
            >
              <Palette size={14} style={{ color: selectedElement.fill || '#7C3AED' }} />
            </button>
            {colorOpen && (
              <div className="absolute top-full left-0 mt-2 p-2 rounded-xl bg-white border border-gray-200 shadow-xl flex gap-1.5 z-50" onMouseLeave={() => setColorOpen(false)}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { onUpdateElement(selectedElement.id, { fill: c }); setColorOpen(false); }}
                    className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setSizeOpen(!sizeOpen)}
              className="px-2 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100"
              title="Font Size"
            >
              {selectedElement.fontSize || 16}px
            </button>
            {sizeOpen && (
              <div className="absolute top-full left-0 mt-2 p-2 rounded-xl bg-white border border-gray-200 shadow-xl grid grid-cols-4 gap-1 z-50" onMouseLeave={() => setSizeOpen(false)}>
                {FONT_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => { onUpdateElement(selectedElement.id, { fontSize: s }); setSizeOpen(false); }}
                    className={`w-10 h-7 rounded-lg text-xs font-medium transition-colors ${
                      selectedElement.fontSize === s ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}
