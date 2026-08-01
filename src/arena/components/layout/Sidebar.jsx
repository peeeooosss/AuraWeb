import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare, BookOpen, Map, Swords, Trophy,
  Crown, Medal, User, MessageCircle, Send, Code,
  Plus, Trash2, Clock,
} from 'lucide-react';

const NAV = [
  {
    zone: null,
    items: [
      { id: 'chatbox', label: 'ChatBox', icon: MessageSquare, to: '/', primary: true },
    ],
  },
  {
    zone: 'LEARN',
    items: [
      { id: 'academy', label: 'AI Academy', icon: BookOpen, to: '/academy' },
      { id: 'roadmaps', label: 'Career Roadmaps', icon: Map, to: '/roadmaps' },
    ],
  },
  {
    zone: 'COMPETE',
    items: [
      { id: 'quiz', label: 'Quiz Arena', icon: Swords, to: '/quiz' },
      { id: 'tournaments', label: 'Tournaments', icon: Trophy, to: '/tournaments' },
      { id: 'leaderboard', label: 'Leaderboard', icon: Crown, to: '/leaderboard' },
    ],
  },
  {
    zone: 'PROGRESS',
    items: [
      { id: 'achievements', label: 'Achievements', icon: Medal, to: '/achievements' },
      { id: 'profile', label: 'Profile', icon: User, to: '/profile' },
    ],
  },
];

const INTEGRATIONS = [
  { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageCircle },
  { id: 'telegram', label: 'Telegram Bot', icon: Send },
  { id: 'api', label: 'API Access', icon: Code },
];

const STORAGE_KEY = 'auraai_chat_history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {}
}

export default function Sidebar({ onNavigate, onLoadChat, activeChatId }) {
  const location = useLocation();
  const [sessions, setSessions] = useState(loadHistory);

  useEffect(() => {
    setSessions(loadHistory());
  }, [location.pathname]);

  function isActive(to) {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  function deleteSession(id, e) {
    e.preventDefault();
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveHistory(updated);
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  return (
    <nav className="flex flex-col gap-4 p-3">
      {NAV.map((zone) => (
        <div key={zone.zone ?? 'primary'}>
          {zone.zone && (
            <p className="px-3 mb-2 text-3xs font-mono font-semibold tracking-widest text-zinc-600">{zone.zone}</p>
          )}
          <div className="flex flex-col gap-0.5">
            {zone.items.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={onNavigate}
                  className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${active && item.primary
                      ? 'text-white glow-cyan-sm'
                      : active
                        ? 'bg-gradient-to-r from-cyan-500/10 to-violet-500/5 text-white'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                    }
                  `}
                  style={active && item.primary ? {
                    background: 'linear-gradient(90deg, rgba(47,243,224,0.15), rgba(177,78,255,0.05))',
                  } : {}}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-cyan-400 glow-cyan-sm" />
                  )}
                  <Icon
                    size={17}
                    className={active ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'}
                  />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* CHAT HISTORY */}
      <div>
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-3xs font-mono font-semibold tracking-widest text-zinc-600">CHAT HISTORY</p>
          <button
            onClick={() => onLoadChat && onLoadChat(null)}
            className="p-1 rounded-md hover:bg-white/5 text-zinc-600 hover:text-cyan-400 transition-colors"
            title="New Chat"
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
          {sessions.length === 0 && (
            <p className="px-3 py-2 text-2xs text-zinc-700">No chats yet</p>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onLoadChat && onLoadChat(session)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-left ${
                activeChatId === session.id
                  ? 'bg-white/5 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Clock size={12} className="shrink-0 text-zinc-600" />
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{session.title || 'New chat'}</div>
                <div className="text-2xs text-zinc-700">{formatTime(session.createdAt)}</div>
              </div>
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-zinc-600 hover:text-red-400 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* CONNECT — Integrations (no toggles, no prices) */}
      <div>
        <p className="px-3 mb-2 text-3xs font-mono font-semibold tracking-widest text-zinc-600">CONNECT</p>
        <div className="flex flex-col gap-0.5">
          {INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5 cursor-pointer"
              >
                <Icon size={17} className="text-zinc-500" />
                <span className="font-medium text-zinc-400">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
