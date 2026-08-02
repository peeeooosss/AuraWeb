import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '../arena/arenaStyles.css';
import { supabase } from './lib/supabase';

const ChatBox = lazy(() => import('../arena/pages/ChatBox'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DeveloperPortal = lazy(() => import('./pages/DeveloperPortal'));
const PresentPage = lazy(() => import('./pages/PresentPage'));
const LoginPage = lazy(() => import('./pages/Login'));

const GREETING_MSG = {
  id: 'greeting',
  role: 'ai',
  text: "Welcome to TryAuraAI! Describe the presentation you need and I'll generate it instantly. ✨",
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('tryauraai_chat_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function TryAuraAIApp() {
  const [chatHistory, setChatHistory] = useState(loadFromStorage);
  const [chatMessages, setChatMessages] = useState([GREETING_MSG]);
  const [chatOutput, setChatOutput] = useState(null);
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

  const handleSaveChat = React.useCallback(
    (msgs, chatId) => {
      try {
        const id = chatId || genId();
        const title = msgs.find((m) => m.role === 'user')?.text?.slice(0, 50) || 'New chat';
        const session = { id, title, messages: msgs, createdAt: Date.now() };
        setChatHistory((prev) => {
          const updated = [session, ...prev.filter((s) => s.id !== id)].slice(0, 30);
          try {
            localStorage.setItem('tryauraai_chat_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      } catch {}
    },
    []
  );

  const handleNewChat = React.useCallback(() => {
    handleSaveChat(chatMessages);
    setChatMessages([GREETING_MSG]);
    setChatOutput(null);
  }, [chatMessages, handleSaveChat]);

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 font-body flex flex-col overflow-hidden antialiased">
      {/* Top Bar */}
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-lg">
            TryAura<span className="text-gradient-aura">AI</span>
          </span>
          <span className="text-2xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
            Beta
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          <a href="/present" className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            New Present
          </a>
          <a href="/dashboard" className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            Dashboard
          </a>
          <a href="/developer" className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            API
          </a>
          {user ? (
            <span className="px-3 py-1.5 text-xs text-zinc-500">{user.email?.split('@')[0]}</span>
          ) : (
            <a href="/login" className="px-3 py-1.5 text-xs text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition-colors">
              Sign In
            </a>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <ChatBox
                  chatMessages={chatMessages}
                  setChatMessages={setChatMessages}
                  activeChatId={null}
                  chatOutput={chatOutput}
                  setChatOutput={setChatOutput}
                  onSaveChat={handleSaveChat}
                  onNewChat={handleNewChat}
                />
              }
            />
            <Route path="/present" element={<PresentPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/developer" element={<DeveloperPortal />} />
            <Route path="/login" element={<LoginPage onLogin={() => {}} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="h-8 shrink-0 border-t border-white/5 flex items-center justify-center">
        <p className="text-2xs text-zinc-600">
          Powered by Aura AI — model-routed across cost-efficient LLMs.
        </p>
      </footer>
    </div>
  );
}
