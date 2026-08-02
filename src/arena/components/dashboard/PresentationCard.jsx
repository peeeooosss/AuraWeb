import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, EllipsisVertical, Loader2, Trash, AlertTriangle } from 'lucide-react';
import { authFetch } from '../../lib/api';

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PresentationCard({ presentation, viewMode = 'grid', onDeleted, onDuplicated }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const title = (presentation.title || '').replace(/^[,\s]+/, '').substring(0, 80);
  const slideCount = presentation.slides?.length || presentation.n_slides || 0;
  const isList = viewMode === 'list';

  const handleOpen = (e) => {
    e.preventDefault();
    navigate(`/presentation?id=${presentation.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleted?.(presentation.id);
      setShowDelete(false);
      toast.success('Presentation deleted');
    } catch (e) {
      toast.error(e.message || 'Failed to delete presentation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const res = await authFetch(`/api/v1/ppt/presentation/${presentation.id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to duplicate presentation');
      const dup = await res.json();
      onDuplicated?.(dup);
    } catch (e) {
      toast.error(e.message || 'Failed to duplicate presentation');
    } finally {
      setIsDuplicating(false);
      setMenuOpen(false);
    }
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="group relative cursor-pointer rounded-[12px] border border-[#EDEEEF] bg-[#F8FBFB] p-0 shadow-none transition-all duration-300 hover:shadow-md overflow-hidden flex flex-col"
      >
        <div className={`relative z-40 flex flex-1 ${isList ? 'min-h-[122px] flex-row' : 'flex-col'}`}>
          <img
            src="/arena/card_bg.svg"
            alt=""
            className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
          />

          <div className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white/90 ${
            isList ? 'm-3 w-[170px] shrink-0 aspect-video' : 'mx-5 mt-4 aspect-video scale-[0.75]'
          }`}>
            <img
              src={presentation.thumbnail_url || '/arena/create_presentation.png'}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/arena/create_presentation.png'; }}
            />
          </div>

          <span className="absolute top-1 right-3 z-40 text-xs font-medium text-gray-500 bg-white/80 rounded-full px-2 py-0.5">
            {slideCount}
          </span>

          <div className={`z-40 flex bg-white px-5 py-3 ${
            isList ? 'min-w-0 flex-1 items-center border-l border-[#EDEEEF]' : 'relative mt-auto w-full border-t border-[#EDEEEF]'
          }`}>
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <div className="text-sm text-[#191919] font-semibold overflow-hidden line-clamp-1 font-syne">
                  {title || 'Untitled'}
                </div>
                <p className="text-[#808080] text-sm font-syne">
                  {formatDate(presentation.created_at)}
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="w-6 h-6 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <EllipsisVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-8 w-[180px] rounded-xl bg-white shadow-xl border border-gray-100 py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleDuplicate}
                      disabled={isDuplicating}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm text-[#191919] hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span>{isDuplicating ? 'Duplicating...' : 'Duplicate'}</span>
                      {isDuplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => { setShowDelete(true); setMenuOpen(false); }}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <span>Delete</span>
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); if (!isDeleting) setShowDelete(false); }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative w-[360px] rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center p-6 pb-4 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#191919]">Delete Presentation?</h3>
              <p className="text-sm leading-relaxed text-gray-500">
                You are about to delete <span className="font-medium text-gray-700">&ldquo;{title}&rdquo;</span>.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setShowDelete(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-2 border-l border-gray-100 px-4 py-3.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
