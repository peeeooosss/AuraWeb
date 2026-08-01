import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, ChevronDown, Bell, User, Settings, Crown, LogOut } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { MOCK_USER } from '../../data/mockUser';

export default function TopBar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const user = MOCK_USER;
  const location = useLocation();

  useEffect(() => {
    function close(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const menuItems = [
    { label: 'Profile', icon: User, to: '/profile' },
    { label: 'Settings', icon: Settings, to: '#' },
    { label: 'Upgrade to Pro', icon: Crown, to: '#', accent: true },
    { label: 'Log out', icon: LogOut, to: '#' },
  ];

  const notifications = [
    { id: 1, text: 'You earned the "On Fire" badge! 7-day streak reached.', time: '2m ago', read: false },
    { id: 2, text: 'Priya Sharma challenged you to an ADRE quiz!', time: '15m ago', read: false },
    { id: 3, text: 'New tournament: NEET Biology Marathon starts tomorrow.', time: '1h ago', read: true },
    { id: 4, text: 'Weekly leaderboard: You moved up 3 ranks!', time: '3h ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="shrink-0 border-b border-white/5 glass-panel z-30">
      <header className="h-16 flex items-center px-4 lg:px-6 gap-3 lg:gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 text-zinc-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-display font-bold text-zinc-950 text-sm">A</div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
            Aura<span className="text-gradient-aura">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/20">
            <Flame size={16} className="text-orange-400 animate-flame" fill="currentColor" />
            <span className="font-mono text-sm font-semibold text-orange-300">{user.streak} Days</span>
          </div>
          <div className="flex items-center gap-3 min-w-[200px]">
            <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">Lvl {user.level} · {user.rank}</span>
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 transition-all duration-1000"
                style={{ width: `${(user.xp / user.xpToNextLevel) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">{user.xp}/{user.xpToNextLevel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 lg:gap-3 ml-auto md:ml-0">
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="relative p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 glass-panel border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-sm font-semibold text-zinc-200">Notifications</p>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className={`px-3 py-2.5 rounded-lg text-sm hover:bg-white/5 ${!n.read ? 'bg-cyan-500/5' : ''}`}>
                    <p className="text-zinc-300 text-xs leading-relaxed">{n.text}</p>
                    <p className="text-2xs text-zinc-600 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen(o => !o)} className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/5 border border-white/5">
              <Avatar name={user.name} initials={user.avatar} size="sm" />
              <ChevronDown size={14} className="text-zinc-400 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 glass-panel border border-white/10 rounded-xl shadow-2xl p-1.5 z-50">
                <div className="px-3 py-2.5 border-b border-white/5 mb-1">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                {menuItems.map(item => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setProfileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors ${item.accent ? 'text-violet-300' : 'text-zinc-300'}`}
                  >
                    <item.icon size={15} /> {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="md:hidden flex items-center gap-4 px-4 py-2 border-t border-white/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-1.5 text-xs text-orange-300 shrink-0">
          <Flame size={13} className="text-orange-400" /> {user.streak} Days
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">Lvl {user.level} · {user.xp}/{user.xpToNextLevel} XP</div>
      </div>
    </div>
  );
}
