import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Settings, Crown, LogOut, CreditCard, User, Key, Cpu } from 'lucide-react';
import { signOut, getAccessToken } from '../../lib/auth';

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function getPlanBadgeStyle(plan) {
  switch (plan) {
    case 'basic':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'growth':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'pro':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

export default function Header({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch('/api/v1/limits', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCredits(data);
        }
      } catch {
        // ignore
      }
    };
    if (user) fetchCredits();
  }, [user]);

  const linkClass = (paths) => {
    const active = paths.some(p => location.pathname === p || location.pathname.startsWith(p + '?'));
    return `text-sm font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
      active
        ? 'bg-[#F3F0FF] text-[#7A5AF8]'
        : 'text-[#191919] hover:bg-[#F8F8FA]'
    }`;
  };

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#EDEEEF]">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
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
        </nav>

        {user && (
          <div className="relative flex items-center gap-4">
            <div className="flex items-center gap-3">
              {credits && (
                <Link
                  to="/plans"
                  className="flex flex-col items-end pr-3 py-1.5 text-sm font-medium text-[#191919] hover:bg-[#F8F8FA] transition-colors rounded-lg"
                  title="Credits & Plan"
                >
                  <div className="flex items-center gap-1.5 font-syne font-medium text-[#7A5AF8]">
                    <CreditCard size={14} />
                    <span>
                      {credits.unlimited
                        ? 'Unlimited'
                        : `${formatNumber(credits.creditsBalance || 0)} / ${formatNumber(credits.creditsLimit || 0)}`}
                    </span>
                  </div>
                  {credits.plan && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border ${getPlanBadgeStyle(credits.plan)}`}>
                      {credits.planName || credits.plan}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#F8F8FA] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#7A5AF8] flex items-center justify-center text-white text-xs font-medium">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-[#191919] max-w-[140px] truncate hidden sm:block">
                  {user.email}
                </span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
