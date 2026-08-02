import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';

export function useOutlineManagement(outlines, setOutlines, maxSlides = 50) {
  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    setOutlines(prev => {
      const oldIdx = prev.findIndex((_, i) => (_.key || i) === active.id);
      const newIdx = prev.findIndex((_, i) => (_.key || i) === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, [setOutlines]);

  const handleAddSlide = useCallback(() => {
    setOutlines(prev => {
      if (prev.length >= maxSlides) {
        toast.error(`Maximum ${maxSlides} slides allowed`);
        return prev;
      }
      return [...prev, { key: `slide-${Date.now()}`, content: 'New slide', title: '' }];
    });
  }, [setOutlines, maxSlides]);

  const handleUpdateSlide = useCallback((idx, content) => {
    setOutlines(prev => prev.map((s, i) => i === idx ? { ...s, content } : s));
  }, [setOutlines]);

  const handleDeleteSlide = useCallback((idx) => {
    setOutlines(prev => prev.filter((_, i) => i !== idx));
  }, [setOutlines]);

  return { handleDragEnd, handleAddSlide, handleUpdateSlide, handleDeleteSlide };
}
