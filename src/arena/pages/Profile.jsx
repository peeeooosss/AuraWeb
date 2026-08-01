import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, Crown, Bell, Shield, Calendar, Mail, Edit3 } from 'lucide-react';
import { MOCK_USER } from '../data/mockUser';
import Avatar from '../components/ui/Avatar';

export default function Profile() {
  const user = MOCK_USER;
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="glass-panel border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-5 flex-wrap">
          <Avatar name={user.name} initials={user.avatar} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl font-bold">{user.name}</h1>
              <span className="text-2xs font-mono text-violet-300 bg-violet-500/10 border border-violet-400/20 px-2 py-0.5 rounded-full">Lvl {user.level}</span>
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-2">
              <Mail size={13} /> {user.email}
            </p>
            <p className="text-xs text-zinc-600 flex items-center gap-1.5 mt-1">
              <Calendar size={12} /> Joined {new Date(user.joinDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5">
            <Edit3 size={13} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total XP', value: user.xp.toLocaleString(), color: 'text-amber-300' },
          { label: 'Quizzes Done', value: user.totalQuizzes, color: 'text-cyan-300' },
          { label: 'Avg Score', value: `${user.avgScore}%`, color: 'text-emerald-300' },
          { label: 'Best Streak', value: `${user.longestStreak} days`, color: 'text-orange-300' },
        ].map(s => (
          <div key={s.label} className="glass-panel border border-white/5 rounded-2xl p-4 text-center">
            <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-2xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section Nav */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
              ${activeSection === s.id ? 'bg-white/10 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            <s.icon size={13} /> {s.label}
          </button>
        ))}
      </div>

      {/* Subscription */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="glass-panel border border-white/5 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Subscription</h3>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-200">{user.subscription.plan}</p>
                <p className="text-xs text-zinc-500">Renews {new Date(user.subscription.renewalDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400">₹{user.subscription.price}/mo</span>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-400/30 text-violet-300 hover:bg-violet-500/20">
                  Upgrade
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel border border-white/5 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Favorite Subject</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-lg">📋</div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">{user.favoriteSubject}</p>
                <p className="text-xs text-zinc-500">Most quizzes taken in this subject</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'subscription' && (
        <div className="space-y-3">
          <div className="glass-panel border border-cyan-400/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm">Current Plan: {user.subscription.plan}</h3>
              <span className="text-sm font-mono text-zinc-400">₹{user.subscription.price}/mo</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${((30 - user.subscription.daysRemaining) / 30) * 100}%` }} />
            </div>
            <p className="text-xs text-zinc-500">{user.subscription.daysRemaining} days until renewal</p>
          </div>

          {[
            { name: 'Student Base', price: 199, features: ['5 PPT / 10 PDF / day', 'AI Chat + Paid Models', '5 Images/day', 'Voice Input'] },
            { name: 'Creator Pro', price: 399, features: ['10 PPT / 20 PDF / day', 'Premium AI Models', '10 Images/day', 'Priority Queue'] },
          ].map(plan => (
            <div key={plan.name} className={`glass-panel rounded-2xl p-5 border ${plan.name === user.subscription.plan ? 'border-cyan-400/30' : 'border-white/5'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-semibold text-sm">{plan.name}</h4>
                <span className="font-display text-lg font-bold">₹{plan.price}<span className="text-xs text-zinc-500 font-normal">/mo</span></span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="text-xs text-zinc-400 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" /> {f}
                  </li>
                ))}
              </ul>
              {plan.name === user.subscription.plan ? (
                <button disabled className="w-full py-2 rounded-xl text-xs font-semibold transition-colors bg-white/5 text-zinc-500 cursor-default">
                  Current Plan
                </button>
              ) : (
                <Link to="/upgrade" className="block w-full py-2 rounded-xl text-xs font-semibold transition-colors bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 hover:opacity-90 text-center">
                  Upgrade
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="glass-panel border border-white/5 rounded-2xl p-5 space-y-4">
          {[
            { label: 'Quiz reminders', desc: 'Daily reminder to maintain your streak', on: true },
            { label: 'Tournament alerts', desc: 'Notifications when new tournaments start', on: true },
            { label: 'Leaderboard changes', desc: 'When your rank changes', on: false },
            { label: 'New lessons', desc: 'When new content is added to the Academy', on: true },
            { label: 'Achievement unlocked', desc: 'When you earn a new badge', on: true },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-zinc-200">{n.label}</p>
                <p className="text-2xs text-zinc-500">{n.desc}</p>
              </div>
              <button className={`w-10 h-5.5 rounded-full relative transition-colors ${n.on ? 'bg-cyan-400' : 'bg-zinc-700'}`}>
                <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all ${n.on ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'privacy' && (
        <div className="glass-panel border border-white/5 rounded-2xl p-5 space-y-4">
          {[
            { label: 'Profile visibility', desc: 'Show your profile on the leaderboard', on: true },
            { label: 'Show quiz scores', desc: 'Others can see your quiz results', on: true },
            { label: 'Allow challenges', desc: 'Others can challenge you to quizzes', on: true },
            { label: 'Show streak', desc: 'Display your streak on your profile', on: false },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-zinc-200">{n.label}</p>
                <p className="text-2xs text-zinc-500">{n.desc}</p>
              </div>
              <button className={`w-10 h-5.5 rounded-full relative transition-colors ${n.on ? 'bg-cyan-400' : 'bg-zinc-700'}`}>
                <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all ${n.on ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
