import React from 'react';

const SIZE_MAP = {
  sm: 'w-8 h-8 text-2xs',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-sm',
  xl: 'w-20 h-20 text-base',
};

const GRADIENTS = [
  'from-cyan-400 to-violet-500',
  'from-violet-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-cyan-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-indigo-500',
];

function getGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function Avatar({ name = '??', initials, size = 'md', online, className = '' }) {
  const displayInitials = initials || name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const gradient = getGradient(name);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className={`
        rounded-full bg-gradient-to-br ${gradient}
        flex items-center justify-center font-bold text-zinc-950
        border-2 border-white/10
        ${SIZE_MAP[size] || SIZE_MAP.md}
      `}>
        {displayInitials}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950
          ${online ? 'bg-emerald-400' : 'bg-zinc-600'}
        `} />
      )}
    </div>
  );
}
