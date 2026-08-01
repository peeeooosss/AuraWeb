import React, { useState } from 'react';
import { Crown, Medal, TrendingUp, TrendingDown } from 'lucide-react';
import { LEADERBOARD_DATA, MOCK_USER } from '../data/mockUser';
import Tabs from '../components/ui/Tabs';

const TABS = [
  { id: 'global', label: 'Global' },
  { id: 'regional', label: 'Regional' },
  { id: 'friends', label: 'Friends' },
  { id: 'category', label: 'By Subject' },
];

const TIME_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('global');
  const [timeFilter, setTimeFilter] = useState('all');
  const user = MOCK_USER;

  const podium = LEADERBOARD_DATA.slice(0, 3);
  const rest = LEADERBOARD_DATA.slice(3);
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const heights = ['h-28', 'h-36', 'h-24'];
  const medalColors = ['text-zinc-300', 'text-amber-400', 'text-orange-400'];
  const medalGradients = ['from-zinc-300/20 to-zinc-400/10', 'from-amber-400/20 to-amber-500/10', 'from-orange-400/20 to-orange-500/10'];

  const userRank = LEADERBOARD_DATA.find(d => d.you);

  return (
    <div className="max-w-4xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
              <Crown size={20} className="text-amber-400" />
            </div>
            Leaderboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Top performers across the Arena.</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${timeFilter === f.id ? 'bg-white/10 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 items-end px-4">
        {podiumOrder.map((idx, pos) => {
          const p = podium[idx];
          return (
            <div key={p.rank} className="flex flex-col items-center">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-sm font-bold text-zinc-950 mb-2 border-2 border-white/10">
                {p.avatar}
              </div>
              <p className="text-xs lg:text-sm font-semibold text-center truncate max-w-full">{p.name}</p>
              <p className="text-2xs font-mono text-zinc-500 mb-2">{p.score.toLocaleString()} pts</p>
              <div className={`w-full ${heights[pos]} rounded-t-xl glass-panel border border-white/10 bg-gradient-to-b ${medalGradients[pos]} flex flex-col items-center justify-start pt-3 gap-1`}>
                <Medal size={18} className={medalColors[pos]} />
                <span className="font-display font-bold text-base lg:text-lg">#{p.rank}</span>
                <span className="text-3xs font-mono text-emerald-300 text-center px-2 leading-tight">{p.prizes}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranking Table */}
      <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_80px_120px] gap-3 px-4 py-2.5 text-3xs font-mono uppercase tracking-wider text-zinc-600 border-b border-white/5">
          <span>#</span>
          <span>Student</span>
          <span className="text-right">Score</span>
          <span className="text-right">Reward</span>
        </div>
        {rest.map(r => (
          <div
            key={r.rank}
            className={`grid grid-cols-[40px_1fr_80px_120px] gap-3 px-4 py-3 items-center text-sm border-b border-white/5 last:border-0 transition-colors
              ${r.you ? 'bg-violet-500/5 border-l-2 border-l-violet-400' : 'hover:bg-white/[0.02]'}
            `}
          >
            <span className="font-mono text-zinc-500 text-xs">{r.rank}</span>
            <span className={`flex items-center gap-2.5 truncate ${r.you ? 'text-violet-300 font-medium' : 'text-zinc-300'}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-3xs font-bold text-zinc-950 shrink-0">
                {r.avatar}
              </div>
              <span className="truncate text-xs">{r.name}</span>
              {r.you && <span className="text-2xs text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">(You)</span>}
            </span>
            <span className="font-mono text-zinc-400 text-xs text-right">{r.score.toLocaleString()}</span>
            <span className="text-emerald-300 text-2xs text-right truncate">{r.prizes}</span>
          </div>
        ))}
      </div>

      {/* Your Rank */}
      {userRank && (
        <div className="glass-panel border border-violet-400/30 rounded-2xl p-4 glow-violet-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-sm font-bold text-zinc-950">
              {userRank.avatar}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-200">{userRank.name} (You)</p>
              <p className="text-xs text-zinc-500">Rank #{userRank.rank} · {userRank.score.toLocaleString()} pts</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-emerald-300">{userRank.prizes}</p>
              <p className="text-2xs text-zinc-600 flex items-center gap-1 justify-end mt-0.5">
                <TrendingUp size={10} className="text-emerald-400" /> +3 this week
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
