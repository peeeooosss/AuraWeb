import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Tabs({ tabs, active, onChange, className = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  function scroll(dir) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 150, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 z-10 w-7 h-7 rounded-full glass-panel border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-1 overflow-x-auto scrollbar-hide py-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium
                transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              {tab.icon && <tab.icon size={13} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-2xs font-mono ml-0.5 ${isActive ? 'text-cyan-400' : 'text-zinc-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 z-10 w-7 h-7 rounded-full glass-panel border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
