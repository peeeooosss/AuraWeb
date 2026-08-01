import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './arenaStyles.css';

import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import { ToastContainer, useToast } from './components/ui/Toast';

import ChatBox from './pages/ChatBox';
import Dashboard from './pages/Dashboard';
import QuizArena from './pages/QuizArena';
import Academy, { LessonDetail } from './pages/Academy';
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import Tournaments from './pages/Tournaments';
import Roadmaps from './pages/Roadmaps';
import Profile from './pages/Profile';
import Upgrade from './pages/Upgrade';

const GREETING_MSG = { id: 'greeting', role: 'ai', text: "Hey! I'm AuraAI. Ask me anything, or tap a suggestion below. ✨" };
const STORAGE_KEY = 'auraai_chat_history';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function ArenaApp() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const { toasts, removeToast } = useToast();

  // ── Shared chat state ──
  const [chatHistory, setChatHistory] = useState(loadFromStorage);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([GREETING_MSG]);
  const [chatOutput, setChatOutput] = useState(null);

  // ── Save chat to history + localStorage ──
  const handleSaveChat = useCallback((msgs, chatId) => {
    try {
      const id = chatId || activeChatId || genId();
      const title = msgs.find(m => m.role === 'user')?.text?.slice(0, 50) || 'New chat';
      const session = { id, title, messages: msgs, createdAt: Date.now() };
      setChatHistory(prev => {
        const updated = [session, ...prev.filter(s => s.id !== id)].slice(0, 30);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
      setActiveChatId(id);
    } catch (e) { console.warn('[handleSaveChat] failed:', e); }
  }, [activeChatId]);

  // ── Load a chat session ──
  const handleLoadChat = useCallback((session) => {
    if (!session) {
      const hasUserMsg = chatMessages.some(m => m.role === 'user');
      if (hasUserMsg && chatMessages.length > 1) {
        handleSaveChat(chatMessages);
      }
      setChatMessages([GREETING_MSG]);
      setActiveChatId(null);
      setChatOutput(null);
      setMobileHistoryOpen(false);
      return;
    }
    setChatMessages(session.messages || []);
    setActiveChatId(session.id);
    setChatOutput(null);
    setMobileHistoryOpen(false);
  }, [chatMessages, handleSaveChat]);

  // ── New chat ──
  const handleNewChat = useCallback(() => {
    const hasUserMsg = chatMessages.some(m => m.role === 'user');
    if (hasUserMsg && chatMessages.length > 1) {
      handleSaveChat(chatMessages);
    }
    setChatMessages([GREETING_MSG]);
    setActiveChatId(null);
    setChatOutput(null);
    setMobileHistoryOpen(false);
  }, [chatMessages, handleSaveChat]);

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 font-body flex flex-col overflow-hidden antialiased">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <TopBar onMenuClick={() => setMobileNavOpen(true)} />

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-white/5 overflow-y-auto">
          <Sidebar
            onLoadChat={handleLoadChat}
            activeChatId={activeChatId}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-grid-pattern relative">
          {/* Under Construction Overlay */}
          <div className="fixed inset-0 z-[100] backdrop-blur-md bg-black/40 pointer-events-none" />
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="font-display text-5xl md:text-7xl font-bold text-gradient-aura tracking-tight select-none">
                ON CONSTRUCTION
              </p>
              <p className="mt-4 text-sm text-zinc-500 font-body select-none">Something awesome is coming soon.</p>
            </div>
          </div>

          <Routes>
            <Route path="/" element={
              <ChatBox
                chatMessages={chatMessages}
                setChatMessages={setChatMessages}
                activeChatId={activeChatId}
                chatOutput={chatOutput}
                setChatOutput={setChatOutput}
                onSaveChat={handleSaveChat}
                onNewChat={handleNewChat}
              />
            } />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quiz" element={<QuizArena />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/academy/:lessonId" element={<LessonDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/roadmaps" element={<Roadmaps />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/upgrade" element={<Upgrade />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-white/10 overflow-y-auto transition-transform duration-300 ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <span className="font-display font-bold">
              Aura<span className="text-gradient-aura">AI</span>
            </span>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <Sidebar
            onNavigate={() => setMobileNavOpen(false)}
            onLoadChat={handleLoadChat}
            activeChatId={activeChatId}
          />
        </aside>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav
        onToggleHistory={() => setMobileHistoryOpen(v => !v)}
        mobileHistoryOpen={mobileHistoryOpen}
      />

      {/* Mobile History Drawer (ChatGPT-style) */}
      {mobileHistoryOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-zinc-950">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="font-display font-semibold text-sm">Chat History</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
              >
                + New Chat
              </button>
              <button
                onClick={() => setMobileHistoryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {chatHistory.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-8">No conversations yet</p>
            )}
            {chatHistory.map((session) => (
              <button
                key={session.id}
                onClick={() => { handleLoadChat(session); setMobileNavOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
                  activeChatId === session.id
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <div className="truncate font-medium">{session.title || 'New chat'}</div>
                <div className="text-2xs text-zinc-600 mt-0.5">
                  {new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Arena() {
  return (
    <BrowserRouter>
      <ArenaApp />
    </BrowserRouter>
  );
}
