import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

import './tablely/index.css';
import './arena/arenaStyles.css';

const TablelyApp = lazy(() => import('./tablely/App'));
const TryAuraAIApp = lazy(() => import('./tryauraai/App'));
const ArenaApp = lazy(() => import('./arena/App'));
const DirectoryHome = lazy(() => import('./pages/DirectoryHome'));

function detectSubdomain() {
  const host = window.location.hostname;
  const isSubdomain = host.split('.').length > 2;
  if (host.includes('tablely') || host.includes('resto')) return 'tablely';
  if (host.startsWith('arena.')) return 'arena';
  if (isSubdomain && (host.includes('tryauraai') || host.includes('workspace'))) return 'tryauraai';
  if (host.includes('career')) return 'career';
  if (host.includes('coach')) return 'coach';
  return 'main';
}

function FullScreenLoader() {
  return (
    <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

const subdomain = detectSubdomain();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<FullScreenLoader />}>
        <BrowserRouter>
          <Routes>
            {subdomain === 'tablely' ? (
              <Route path="/*" element={
                <div id="tablely-root">
                  <TablelyApp />
                </div>
              } />
            ) : subdomain === 'arena' ? (
              <Route path="/*" element={<ArenaApp />} />
            ) : subdomain === 'tryauraai' ? (
              <Route path="/*" element={<TryAuraAIApp />} />
            ) : (
              <Route path="/*" element={<DirectoryHome />} />
            )}
          </Routes>
        </BrowserRouter>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
