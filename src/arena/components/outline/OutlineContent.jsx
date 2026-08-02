import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import OutlineItem from './OutlineItem';

function ShimmerItem() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-[12px] border border-[#EDEEEF] bg-white animate-pulse">
      <div className="w-4 h-4 mt-1 rounded bg-gray-200" />
      <div className="w-16 h-5 rounded-full bg-gray-200 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function OutlineContent({
  outlines, isStreaming, isComplete,
  onDragEnd, onAddSlide, onUpdateSlide, onDeleteSlide,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const sortedIds = useMemo(() =>
    outlines.map((o) => o._key || `outline-${outlines.indexOf(o)}`),
  [outlines]);

  const isReady = !isStreaming && isComplete && outlines.length > 0;

  if (isStreaming && outlines.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => <ShimmerItem key={i} />)}
      </div>
    );
  }

  if (!isStreaming && outlines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {isReady ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
            {outlines.map((outline, i) => (
              <OutlineItem
                key={outline._key || `outline-${i}`}
                id={outline._key || `outline-${i}`}
                index={i}
                content={outline.content}
                isStreaming={false}
                isActive={false}
                onChange={onUpdateSlide}
                onDelete={onDeleteSlide}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        outlines.map((outline, i) => (
          <OutlineItem
            key={outline._key || `outline-${i}`}
            id={outline._key || `outline-${i}`}
            index={i}
            content={outline.content}
            isStreaming={true}
            isActive={i === outlines.length - 1}
            onChange={onUpdateSlide}
            onDelete={onDeleteSlide}
          />
        ))
      )}

      {!isStreaming && (
        <button
          onClick={onAddSlide}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-[#EDEEEF] text-sm text-[#808080] hover:border-[#7A5AF8]/30 hover:text-[#7A5AF8] hover:bg-[#F3F0FF]/30 transition-colors"
        >
          <Plus size={14} /> Add New Slide
        </button>
      )}
    </div>
  );
}
