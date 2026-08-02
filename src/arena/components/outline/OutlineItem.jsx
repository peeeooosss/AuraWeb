import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';

export default function OutlineItem({ id, index, content, isStreaming, isActive, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content || '');
  const textareaRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: isStreaming });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  useEffect(() => {
    setEditValue(content || '');
  }, [content]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    onChange?.(index, editValue);
    setEditing(false);
  };

  const handleClick = () => {
    if (!isStreaming) {
      setEditValue(content || '');
      setEditing(true);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 p-4 rounded-[12px] border bg-white transition-all ${
        isActive
          ? 'border-[#CFC7FF] shadow-[0_8px_22px_rgba(81,70,229,0.12)]'
          : 'border-[#EDEEEF] hover:border-[#E1E1E5] hover:shadow-sm'
      }`}
    >
      {!isStreaming && (
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-1 text-gray-400 hover:text-[#7A5AF8] cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical size={16} />
        </button>
      )}

      <span className="shrink-0 mt-1 px-2 py-0.5 rounded-full bg-[#F3F0FF] text-[10px] font-syne font-medium text-[#7A5AF8]">
        Slide {index + 1}
      </span>

      <div className="flex-1 min-w-0" onClick={handleClick}>
        {isStreaming && isActive ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{content || ''}</ReactMarkdown>
            <span className="inline-block w-1.5 h-4 bg-[#7A5AF8] animate-pulse ml-0.5 align-middle" />
          </div>
        ) : editing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setEditing(false); setEditValue(content || ''); }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
            }}
            rows={Math.max(3, (editValue || '').split('\n').length)}
            className="w-full text-sm text-[#191919] bg-transparent border-none outline-none resize-none p-0 font-body leading-relaxed"
            autoFocus
          />
        ) : (
          <div className="prose prose-sm max-w-none text-[#191919] cursor-text">
            <ReactMarkdown>{content || 'Empty slide...'}</ReactMarkdown>
          </div>
        )}
      </div>

      {!isStreaming && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(index); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
