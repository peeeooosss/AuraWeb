import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from './components/layout/Header';
import { getSession, onAuthStateChange } from './lib/auth';
import './styles/arena.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));
const OutlinePage = lazy(() => import('./pages/OutlinePage'));
const PresentationPage = lazy(() => import('./pages/PresentationPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UpgradePage = lazy(() => import('./pages/Upgrade'));
const LoginPage = lazy(() => import('./pages/Login'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RequireAuth({ user, loading, children }) {
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function ArenaApp() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.session?.user || null);
      setAuthLoading(false);
    });
    const sub = onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      sub.unsubscribe();
    };
  }, []);

  const authRequiredRoutes = [
    '/dashboard', '/create', '/outline', '/presentation', '/editor',
    '/templates', '/settings', '/profile', '/api-keys', '/models', '/plans',
  ];
  const isProtected = authRequiredRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + '/'));
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-white text-[#101323] font-body antialiased">
      {!isLogin && isProtected && <Header user={user} />}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/plans"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <UpgradePage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Navigate to="/dashboard" replace />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/create"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <CreatePage />
                </RequireAuth>
              }
            />
            <Route
              path="/outline"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <OutlinePage />
                </RequireAuth>
              }
            />
            <Route
              path="/presentation"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <PresentationPage />
                </RequireAuth>
              }
            />
            <Route
              path="/editor"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <EditorPage />
                </RequireAuth>
              }
            />
            <Route
              path="/templates"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <TemplatesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <SettingsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/api-keys"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <APIKeysPage />
                </RequireAuth>
              }
            />
            <Route
              path="/models"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <ModelsPage />
                </RequireAuth>
              }
            />
            <Route
              path="*"
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Navigate to="/dashboard" replace />
                </RequireAuth>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
