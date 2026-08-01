import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

import './tablely/index.css';
import './arena/arenaStyles.css';

const Arena = lazy(() => import('./arena/index'));
const TablelyApp = lazy(() => import('./tablely/App'));
const DirectoryHome = lazy(() => import('./pages/DirectoryHome'));

function detectSubdomain() {
  const host = window.location.hostname;
  if (host.includes('tablely') || host.includes('resto')) return 'tablely';
  if (host.includes('arena')) return 'arena';
  if (host.includes('career')) return 'career';
  if (host.includes('coach')) return 'coach';
  if (host.includes('workspace')) return 'workspace';
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
        {subdomain === 'tablely' ? (
          <BrowserRouter>
            <div id="tablely-root">
              <TablelyApp />
            </div>
          </BrowserRouter>
        ) : subdomain === 'arena' ? (
          <Arena />
        ) : (
          <DirectoryHome />
        )}
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
