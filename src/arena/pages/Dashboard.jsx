import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Swords, BookOpen, Map, Trophy, Clock, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { MOCK_USER, DAILY_CHALLENGE } from '../data/mockUser';

export default function Dashboard() {
  const user = MOCK_USER;
  const daily = DAILY_CHALLENGE;
  const completedLessons = Object.values(user.lessonProgress).filter(l => l.completed).length;

  return (
    <div className="max-w-6xl mx-auto p-5 lg:p-8 space-y-6 pb-24 lg:pb-8">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">
            Good evening, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Keep the momentum going. You're doing great.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock size={14} />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel border border-white/5 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-400/20 flex items-center justify-center">
              <Flame size={18} className="text-orange-400 animate-flame" fill="currentColor" />
            </div>
            <div>
              <p className="text-2xs font-mono text-zinc-500">STREAK</p>
              <p className="font-display text-xl font-bold text-orange-300">{user.streak} Days</p>
            </div>
          </div>
          <p className="text-2xs text-zinc-600 mt-2">Longest: {user.longestStreak} days</p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-violet-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
              <Zap size={18} className="text-violet-400" />
            </div>
            <div>
              <p className="text-2xs font-mono text-zinc-500">LEVEL</p>
              <p className="font-display text-xl font-bold text-violet-300">Lvl {user.level}</p>
            </div>
          </div>
          <p className="text-2xs text-zinc-600 mt-2">{user.xpToNextLevel - user.xp} XP to next level</p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
              <Swords size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-2xs font-mono text-zinc-500">QUIZZES</p>
              <p className="font-display text-xl font-bold text-cyan-300">{user.totalQuizzes}</p>
            </div>
          </div>
          <p className="text-2xs text-zinc-600 mt-2">Avg: {user.avgScore}%</p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xs font-mono text-zinc-500">RANK</p>
              <p className="font-display text-xl font-bold text-emerald-300">#{LEADERBOARD_RANK}</p>
            </div>
          </div>
          <p className="text-2xs text-zinc-600 mt-2">Up 3 this week</p>
        </div>
      </div>

      {/* XP Progress */}
      <div className="glass-panel border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm">Level Progress</h3>
          <span className="text-xs font-mono text-zinc-500">{user.xp} / {user.xpToNextLevel} XP</span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 transition-all duration-1000"
            style={{ width: `${(user.xp / user.xpToNextLevel) * 100}%` }}
          />
        </div>
        <p className="text-2xs text-zinc-600 mt-2">{user.xpToNextLevel - user.xp} XP to Level {user.level + 1}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Daily Challenge */}
        <div className="lg:col-span-2">
          <div className="relative rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-zinc-900/60 to-violet-500/5 p-6 overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-violet-400/10 rounded-full blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 text-2xs font-mono font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-full mb-3">
                <Zap size={12} /> DAILY CHALLENGE
              </span>
              <h2 className="font-display text-xl lg:text-2xl font-bold mb-2">{daily.title}</h2>
              <p className="text-sm text-zinc-400 mb-4">
                {daily.questions} questions · {daily.difficulty} · {daily.xpReward} XP
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to="/quiz"
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 hover:opacity-90 transition-opacity"
                >
                  <Swords size={15} /> Start Challenge
                </Link>
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock size={13} /> Expires tonight
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <TrendingUp size={13} /> {daily.participantsToday} joined today
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-sm text-zinc-300">Quick Actions</h3>
          <Link to="/quiz" className="flex items-center gap-3 glass-panel border border-white/5 rounded-xl px-4 py-3.5 hover:border-cyan-400/30 hover:bg-cyan-500/5 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
              <Swords size={16} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 group-hover:text-cyan-200">Start Quiz</p>
              <p className="text-2xs text-zinc-600">Test your knowledge</p>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-cyan-400" />
          </Link>
          <Link to="/academy" className="flex items-center gap-3 glass-panel border border-white/5 rounded-xl px-4 py-3.5 hover:border-violet-400/30 hover:bg-violet-500/5 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 group-hover:text-violet-200">Continue Lessons</p>
              <p className="text-2xs text-zinc-600">{completedLessons} completed</p>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-violet-400" />
          </Link>
          <Link to="/roadmaps" className="flex items-center gap-3 glass-panel border border-white/5 rounded-xl px-4 py-3.5 hover:border-amber-400/30 hover:bg-amber-500/5 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center shrink-0">
              <Map size={16} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 group-hover:text-amber-200">View Roadmap</p>
              <p className="text-2xs text-zinc-600">Your career path</p>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-amber-400" />
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-display font-semibold text-sm text-zinc-300 mb-3 flex items-center gap-2">
          <Clock size={15} className="text-zinc-500" /> Recent Quizzes
        </h3>
        <div className="space-y-2">
          {user.quizHistory.slice(0, 4).map((quiz, i) => (
            <div key={quiz.id} className="flex items-center gap-3 glass-panel border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono
                ${quiz.score >= 9 ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                  : quiz.score >= 7 ? 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-300'
                  : 'bg-amber-500/15 border border-amber-400/30 text-amber-300'
                }`}
              >
                {quiz.score}/{quiz.total}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">
                  <span className="font-semibold">{quiz.subject}</span> · {quiz.difficulty}
                </p>
                <p className="text-2xs text-zinc-600">{quiz.date}</p>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-full px-2 py-0.5 shrink-0">
                +{quiz.xpEarned} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LEADERBOARD_RANK = 5;
