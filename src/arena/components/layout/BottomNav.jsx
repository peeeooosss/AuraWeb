import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, BookOpen, Swords, Crown, User } from 'lucide-react';

const TABS = [
  { id: 'chatbox', label: 'Home', icon: MessageSquare, to: '/' },
  { id: 'academy', label: 'Learn', icon: BookOpen, to: '/academy' },
  { id: 'quiz', label: 'Quiz', icon: Swords, to: '/quiz' },
  { id: 'leaderboard', label: 'Ranks', icon: Crown, to: '/leaderboard' },
  { id: 'profile', label: 'Profile', icon: User, to: '/profile' },
];

export default function BottomNav({ onToggleHistory, mobileHistoryOpen }) {
  const location = useLocation();

  function isActive(to) {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 glass-panel">
      <nav className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.to);
          const isHome = tab.to === '/';

          // Home tab: tap toggles mobile history drawer
          if (isHome) {
            return (
              <button
                key={tab.id}
                onClick={onToggleHistory}
                className={`
                  flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]
                  ${mobileHistoryOpen ? 'text-cyan-400' : 'text-zinc-500'}
                `}
              >
                <MessageSquare size={20} strokeWidth={mobileHistoryOpen ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${mobileHistoryOpen ? 'text-cyan-300' : ''}`}>
                  Home
                </span>
              </button>
            );
          }

          // Other tabs: normal navigation
          return (
            <Link
              key={tab.id}
              to={tab.to}
              className={`
                flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]
                ${active ? 'text-cyan-400' : 'text-zinc-500'}
              `}
            >
              <tab.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? 'text-cyan-300' : ''}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-cyan-400" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
