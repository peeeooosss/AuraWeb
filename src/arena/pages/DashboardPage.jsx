import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Loader2, Crown } from 'lucide-react';
import PresentationGrid from '../components/dashboard/PresentationGrid';
import { usePresentations } from '../hooks/useApi';
import { createBlank } from '../lib/api';
import { getAccessToken } from '../lib/auth';

function FloatingCards() {
  return (
    <div className="pointer-events-none absolute right-[14px] top-[-36px] z-0 h-[64px] w-[158px] group-hover/action:*:transform">
      <div
        className="absolute aspect-[16/9] h-[46px] w-[82px] rounded-[4.5px] bg-cover bg-center bg-no-repeat shadow-[0_8px_18px_rgba(16,24,40,0.18)] transition-all duration-500 left-0 top-0 group-hover/action:-translate-x-2 group-hover/action:-rotate-3"
        style={{ backgroundImage: 'url(/arena/create_presentation_card_3.png)' }}
      />
      <div
        className="absolute aspect-[16/9] h-[46px] w-[82px] rounded-[4.5px] bg-cover bg-center bg-no-repeat shadow-[0_8px_18px_rgba(16,24,40,0.18)] transition-all duration-500 left-[39px] top-1 z-10 group-hover/action:-translate-y-1 group-hover/action:scale-105"
        style={{ backgroundImage: 'url(/arena/create_presentation_card_2.png)' }}
      />
      <div
        className="absolute aspect-[16/9] h-[46px] w-[82px] rounded-[4.5px] bg-cover bg-center bg-no-repeat shadow-[0_8px_18px_rgba(16,24,40,0.18)] transition-all duration-500 left-[76px] top-0 group-hover/action:translate-x-2 group-hover/action:rotate-3"
        style={{ backgroundImage: 'url(/arena/create_presentation_card_1.png)' }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { decks, loading, removeDeck, addDeck } = usePresentations();
  const [viewMode, setViewMode] = useState('grid');
  const [creatingBlank, setCreatingBlank] = useState(false);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch('/api/v1/limits', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setQuota(await res.json());
      } catch {
        // ignore quota errors
      }
    })();
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

  const createBlank = async () => {
    setCreatingBlank(true);
    try {
      const created = await createBlank({});
      if (created?.id) {
        addDeck(created);
        toast.success('Blank presentation created');
        navigate(`/presentation?id=${created.id}`);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to create blank presentation');
    } finally {
      setCreatingBlank(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full pb-10 bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 ml-7 mr-[9px] flex h-[105px] items-center justify-between border-b border-[#EDEEEF] bg-white px-1 max-lg:h-auto max-lg:min-h-[105px] max-lg:flex-col max-lg:items-start max-lg:gap-4 max-lg:py-5">
        <div className="flex w-[504px] max-w-full shrink-0 items-center gap-3.5 max-xl:w-auto">
          <h1 className="whitespace-nowrap font-syne text-[22px] font-medium leading-normal tracking-[-0.66px] text-[#101323]">
            Dashboard
          </h1>
        </div>
        <div className="max-w-full overflow-x-auto lg:overflow-visible">
          <div className="flex h-[42px] w-max max-w-none items-center gap-3 rounded-full pl-3">
            <div className="flex h-[42px] items-center gap-[18px] rounded-[32px] border border-[#EDEEEF] bg-white px-3 py-1">
              <Link
                to="/settings"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full h-[26px] px-2 text-[#191919] transition-colors hover:bg-[#F8F8FA]"
              >
                <span className="font-syne text-sm font-medium">Settings</span>
              </Link>
              <span className="relative h-5 w-px shrink-0 bg-[#EDEEEF]" />
              <Link
                to="/templates"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full h-[26px] px-2 text-[#191919] transition-colors hover:bg-[#F8F8FA]"
              >
                <span className="font-syne text-sm font-medium">Templates</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Plan status */}
      {quota && (
        <section className="relative z-10 pl-3 pr-3 pt-[17px] sm:pl-6 sm:pr-[9px]">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F3F0FF] bg-[linear-gradient(135deg,#FAFAFF_0%,#F3F0FF_100%)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A5AF8]">
                <Crown size={16} className="text-white" />
              </div>
              <div>
                <p className="font-syne text-sm font-medium text-[#191919]">
                  {quota.planName} plan
                </p>
                <p className="text-xs text-[#667085]">
                  {quota.unlimited
                    ? 'Unlimited presentations'
                    : `${quota.remaining} of ${quota.pptLimit} presentations left this month`}
                </p>
              </div>
            </div>
            <Link
              to="/plans"
              className="rounded-full bg-[#7A5AF8] px-4 py-2 text-sm font-medium text-white hover:bg-[#6B48EE] transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </section>
      )}

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

          <button
            onClick={createBlank}
            disabled={creatingBlank}
            className="group relative z-50 flex h-[90px] w-[304.5px] max-w-full items-center overflow-hidden rounded-[10.8px] border border-[#EDEEEF] bg-[linear-gradient(135deg,#FAFAFF_0%,#F3F0FF_100%)] px-5 text-left outline-none transition hover:border-[#CFC7FF] hover:shadow-[0_8px_22px_rgba(81,70,229,0.12)] focus-visible:ring-2 focus-visible:ring-[#7A5AF8] focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="font-syne text-sm font-medium text-[#191919]">
              {creatingBlank ? 'Creating...' : 'Blank Presentation'}
            </span>
            <span className="ml-auto flex aspect-video w-[112px] items-center justify-center rounded-[6px] border border-[#DDD9F8] bg-white shadow-[0_6px_14px_rgba(16,24,40,0.12)] transition-transform group-hover:-translate-y-0.5">
              {creatingBlank ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#7A5AF8]" />
              ) : (
                <Plus className="h-5 w-5 text-[#7A5AF8]" />
              )}
            </span>
          </button>
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
