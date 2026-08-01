import React, { useState } from 'react';
import { Trophy, Clock, Users, Zap, ChevronRight, Crown } from 'lucide-react';
import { ACTIVE_TOURNAMENTS, UPCOMING_TOURNAMENTS, PAST_TOURNAMENTS } from '../data/tournaments';
import Tabs from '../components/ui/Tabs';

const TABS = [
  { id: 'active', label: 'Active', count: ACTIVE_TOURNAMENTS.length },
  { id: 'upcoming', label: 'Upcoming', count: UPCOMING_TOURNAMENTS.length },
  { id: 'past', label: 'Past' },
];

export default function Tournaments() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="max-w-5xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
            <Trophy size={20} className="text-amber-400" />
          </div>
          Tournaments
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Compete in weekly tournaments and win prizes.</p>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'active' && (
        <div className="space-y-3">
          {ACTIVE_TOURNAMENTS.map(t => (
            <div key={t.id} className="glass-panel border border-cyan-400/20 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xs font-mono font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">LIVE</span>
                      <span className="text-2xs font-mono text-zinc-500">{t.subject} · {t.difficulty}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold">{t.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-emerald-300">{t.prizePool}</p>
                    <p className="text-2xs text-zinc-500">Prize Pool</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400 mb-4">
                  <span className="flex items-center gap-1"><Clock size={13} /> Ends in {t.endsIn}</span>
                  <span className="flex items-center gap-1"><Users size={13} /> {t.participants}/{t.maxParticipants}</span>
                  <span className="flex items-center gap-1"><Zap size={13} /> {t.questions} Qs · {Math.floor(t.timeLimit / 60)}m</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 font-semibold text-sm hover:opacity-90">
                    <Trophy size={15} /> Join Tournament
                  </button>
                  <button className="px-4 py-2.5 rounded-xl glass-panel border border-white/10 text-zinc-300 text-sm hover:bg-white/5">
                    Rules
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {UPCOMING_TOURNAMENTS.map(t => (
            <div key={t.id} className="glass-panel border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <span className="text-2xs font-mono text-zinc-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{t.subject} · {t.difficulty}</span>
                  <h3 className="font-display text-lg font-bold mt-2">{t.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-emerald-300">{t.prizePool}</p>
                  <p className="text-2xs text-zinc-500">Prize Pool</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400 mb-4">
                <span className="flex items-center gap-1"><Clock size={13} /> Starts {new Date(t.startDate).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="flex items-center gap-1"><Users size={13} /> {t.maxParticipants} max</span>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-400/30 text-violet-300 text-sm font-medium hover:bg-violet-500/10 transition-colors">
                Register Now
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="space-y-3">
          {PAST_TOURNAMENTS.map(t => (
            <div key={t.id} className="glass-panel border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <span className="text-2xs font-mono text-zinc-500">{t.subject} · {t.difficulty} · {t.date}</span>
                  <h3 className="font-display text-lg font-bold mt-1">{t.name}</h3>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300">
                    <Crown size={13} /> Winner: {t.winner.name}
                  </div>
                  <p className="text-2xs text-zinc-500">{t.winner.score}/{t.questions} in {t.winner.time}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><Users size={13} /> {t.totalParticipants} participated</span>
                  {t.yourRank && (
                    <span className="flex items-center gap-1 text-violet-300">Your rank: #{t.yourRank}</span>
                  )}
                </div>
                {t.yourRank && (
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                    +{t.yourScore * 5} XP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
