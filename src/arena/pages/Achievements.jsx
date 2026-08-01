import React, { useState } from 'react';
import { Medal, Flame, Clock, Target, Star, Zap } from 'lucide-react';
import { BADGES, BADGE_RARITIES, BADGE_CATEGORIES } from '../data/badges';
import { MOCK_USER } from '../data/mockUser';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';

export default function Achievements() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const user = MOCK_USER;

  const unlockedIds = new Set(user.badges.map(b => b.id));
  const filtered = activeCategory === 'all' ? BADGES : BADGES.filter(b => b.category === activeCategory);
  const totalUnlocked = user.badges.length;
  const totalXpFromBadges = user.badges.reduce((sum, b) => {
    const badge = BADGES.find(bb => bb.id === b.id);
    return sum + (badge?.xpReward || 0);
  }, 0);

  const tabs = BADGE_CATEGORIES.map(c => ({ id: c.id, label: c.label }));

  // Streak calendar data
  const streakDays = user.streakData.filter(d => d.active).length;

  return (
    <div className="max-w-5xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
            <Medal size={20} className="text-amber-400" />
          </div>
          Achievements
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Your badge collection, streaks, and XP history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel border border-white/5 rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-amber-300">{totalUnlocked}</p>
          <p className="text-2xs text-zinc-500 mt-1">Badges Earned</p>
        </div>
        <div className="glass-panel border border-white/5 rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-orange-300">{user.streak}</p>
          <p className="text-2xs text-zinc-500 mt-1">Current Streak</p>
        </div>
        <div className="glass-panel border border-white/5 rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-violet-300">{totalXpFromBadges}</p>
          <p className="text-2xs text-zinc-500 mt-1">XP from Badges</p>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="glass-panel border border-white/5 rounded-2xl p-5">
        <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <Flame size={15} className="text-orange-400" /> Streak Calendar
        </h3>
        <div className="flex gap-[3px] flex-wrap">
          {user.streakData.map((d, i) => (
            <div
              key={i}
              title={`${d.date}: ${d.active ? 'Active' : 'Inactive'}`}
              className={`w-4 h-4 rounded-[3px] transition-colors ${
                d.active ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-white/5 hover:bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className="text-2xs text-zinc-600 mt-2">{streakDays} active days in the last 2 weeks</p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeCategory} onChange={setActiveCategory} />

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(badge => {
          const unlocked = unlockedIds.has(badge.id);
          const unlockData = user.badges.find(b => b.id === badge.id);
          const rarity = BADGE_RARITIES[badge.rarity];
          const Icon = badge.icon;

          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`glass-panel border rounded-2xl p-4 text-left transition-all hover:bg-white/[0.04]
                ${unlocked ? `${rarity.border} hover:bg-white/[0.06]` : 'border-white/5 opacity-60 hover:opacity-80'}
              `}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3
                ${unlocked ? `${rarity.bg} ${rarity.border} border` : 'bg-zinc-500/5 border border-zinc-500/20'}
              `}>
                <Icon size={20} className={unlocked ? rarity.color : 'text-zinc-600'} />
              </div>
              <h4 className={`font-display font-semibold text-sm ${unlocked ? 'text-zinc-200' : 'text-zinc-500'}`}>
                {badge.name}
              </h4>
              <p className="text-2xs text-zinc-600 mt-0.5 line-clamp-2">{badge.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-2xs font-mono px-1.5 py-0.5 rounded-full border ${rarity.bg} ${rarity.border} ${rarity.color}`}>
                  {rarity.label}
                </span>
                {unlocked ? (
                  <span className="text-2xs text-emerald-400 font-mono">✓ Earned</span>
                ) : (
                  <span className="text-2xs text-zinc-600 font-mono">+{badge.xpReward} XP</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      <Modal isOpen={!!selectedBadge} onClose={() => setSelectedBadge(null)} title={selectedBadge?.name}>
        {selectedBadge && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${BADGE_RARITIES[selectedBadge.rarity].bg} ${BADGE_RARITIES[selectedBadge.rarity].border} border`}>
                {React.createElement(selectedBadge.icon, { size: 28, className: BADGE_RARITIES[selectedBadge.rarity].color })}
              </div>
              <div>
                <p className="text-sm text-zinc-300">{selectedBadge.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${BADGE_RARITIES[selectedBadge.rarity].bg} ${BADGE_RARITIES[selectedBadge.rarity].border} ${BADGE_RARITIES[selectedBadge.rarity].color}`}>
                    {BADGE_RARITIES[selectedBadge.rarity].label}
                  </span>
                  <span className="text-xs font-mono text-amber-300">+{selectedBadge.xpReward} XP</span>
                </div>
              </div>
            </div>
            <div className="glass-panel border border-white/5 rounded-xl p-4">
              <p className="text-2xs font-mono text-zinc-500 mb-1">HOW TO UNLOCK</p>
              <p className="text-sm text-zinc-300">{selectedBadge.requirement}</p>
            </div>
            {unlockedIds.has(selectedBadge.id) && (
              <div className="glass-panel border border-emerald-400/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Star size={14} className="text-emerald-400" fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-300">Earned!</p>
                  <p className="text-2xs text-zinc-500">{user.badges.find(b => b.id === selectedBadge.id)?.unlockedAt}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
