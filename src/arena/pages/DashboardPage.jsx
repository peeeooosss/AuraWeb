import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import PresentationGrid from '../components/dashboard/PresentationGrid';
import { usePresentations } from '../hooks/useApi';
import { supabase } from '../lib/auth';

function FloatingCards() {
  return (
    <div className="pointer-events-none absolute right-[14px] top-[-36px] z-0 h-[64px] w-[158px] group-hover/action:*:transform">
      <div
        className="absolute aspect-[16/9] h-[46px] w-[82px] rounded-[4.5px] bg-cover bg-center bg-no-repeat shadow-[0_8px_18px_rgba(16,24,40,0.18)] transition-all duration-500 left-0 top-0 group-hover/action:-translate_x_2 group-hover/action:-rotate_3"
        style={{ backgroundImage: 'url(/arena/create_presentation_card_3.png)' }}
      />
      <div
        className="absolute aspect-[16/9] h-[46px] w-[82px] rounded-[4.5px] bg-cover bg-center bg-no-repeat shadow-[0_8px_18px_rgba(16,24,40,0.18)] transition-all duration-500 left-[39px] top-1 z-10 group-hover/action:-translate_y_1 group-hover/action:scale-105"
        style={{ backgroundImage: 'url(/arena/create_presentation_card_2.png)' }}
      />
      <div
        className="absolute aspect-[16/9] h-[46px] w-[82px] rounded-[4.5px] bg-cover bg-center bg-no-repeat shadow-[0_8px_18px_rgba(16,24,40,0.18)] transition-all duration-500 left-[76px] top-0 group-hover/action:translate_x_2 group-hover/action:rotate_3"
        style={{ backgroundImage: 'url(/arena/create_presentation_card_1.png)' }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { decks, loading, removeDeck, addDeck } = usePresentations();
  const [viewMode, setViewMode] = useState('grid');
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const sortedDecks = useMemo(() =>
    [...decks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  [decks]);

  const handleDeckRemoved = useCallback((id) => {
    return removeDeck(id);
  }, [removeDeck]);

  const handleDeckDuplicated = useCallback(async (presentation) => {
    if (!presentation?.id) return;
    addDeck(presentation);
    toast.success('Presentation duplicated');
  }, [addDeck]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full pb-10 bg-white">
      {/* Actions */}
      <section className="relative z-10 overflow-visible pb-0 pl-3 pr-3 pt-[17px] sm:pl-6 sm:pr-[9px]">
        <h2 className="w-full font-syne text-[16px] font-medium leading-normal text-[#191919]">
          Actions
        </h2>
        <div className="mt-[18px] flex flex-wrap items-start gap-4">
          <Link
            to="/create"
            className="group/action relative z-50 block w-[304.5px] max-w-full cursor-pointer overflow-visible rounded-[10.8px] bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#7A5AF8] focus-visible:ring-offset-4"
          >
            <FloatingCards />
            <img
              src="/arena/create_presentation_bg.png"
              alt=""
              className="relative z-10 h-[90px] w-[304.5px] max-w-full rounded-[10.8px] bg-white object-cover"
            />
            <span className="absolute inset-0 z-20 flex items-center justify-center text-center font-syne text-sm font-medium text-[#191919]">
              Create Presentation
            </span>
          </Link>
        </div>
      </section>

      {/* Decks */}
      <section className="relative z-10 mt-[46px] pl-3 pr-3 sm:pl-6 sm:pr-[9px]">
        <div className="mb-[14px] flex items-center justify-between gap-4">
          <h2 className="font-syne text-[16px] font-medium leading-normal text-[#191919]">
            Decks
          </h2>
          <div className="flex items-center gap-[17px]">
            <div className="flex items-center rounded-[4px] border border-[#EDEEEF] p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center rounded px-2 py-1 transition-colors ${
                  viewMode === 'grid' ? 'bg-[#F6F6F9]' : 'hover:bg-[#FAFAFC]'
                }`}
              >
                <img src="/arena/dashboard-body/grid.svg" alt="" className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center rounded px-2 py-1 transition-colors ${
                  viewMode === 'list' ? 'bg-[#F6F6F9]' : 'hover:bg-[#FAFAFC]'
                }`}
              >
                <img src="/arena/dashboard-body/list.svg" alt="" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <PresentationGrid
          presentations={sortedDecks}
          viewMode={viewMode}
          isLoading={loading}
          error={null}
          onPresentationDeleted={handleDeckRemoved}
          onPresentationDuplicated={handleDeckDuplicated}
        />
      </section>
    </div>
  );
}
