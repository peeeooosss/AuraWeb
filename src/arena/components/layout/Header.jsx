import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Settings, Crown, LogOut } from 'lucide-react';
import { signOut } from '../../lib/auth';

export default function Header({ user }) {
  const location = useLocation();

  const linkClass = (paths) => {
    const active = paths.some(p => location.pathname === p || location.pathname.startsWith(p + '?'));
    return `text-sm font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
      active
        ? 'bg-[#F3F0FF] text-[#7A5AF8]'
        : 'text-[#191919] hover:bg-[#F8F8FA]'
    }`;
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#EDEEEF]">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-[#7A5AF8] rounded-full p-1 flex items-center justify-center">
            <img src="/arena/logo-with-bg.png" alt="Arena" className="h-[32px] object-contain" />
          </div>
          <span className="font-syne font-bold text-lg text-[#101323]">
            Arena
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link to="/dashboard" className={linkClass(['/dashboard'])}>
            Dashboard
          </Link>
          <Link to="/create" className={linkClass(['/create'])}>
            <Sparkles size={14} /> Create
          </Link>
          <Link to="/templates" className={linkClass(['/templates'])}>
            Templates
          </Link>
          <Link to="/plans" className={linkClass(['/plans'])}>
            <Crown size={14} /> Plans
          </Link>
          <Link to="/settings" className={linkClass(['/settings'])}>
            <Settings size={14} />
          </Link>
        </nav>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#667085] max-w-[160px] truncate">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full text-[#191919] hover:bg-[#F8F8FA] transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
