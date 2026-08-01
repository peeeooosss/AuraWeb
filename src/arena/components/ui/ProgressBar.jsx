import React from 'react';

export function LinearProgress({ value = 0, max = 100, color = 'gradient', size = 'md', showLabel = false, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const colorMap = {
    gradient: 'bg-gradient-to-r from-amber-400 via-amber-500 to-cyan-400',
    cyan: 'bg-cyan-400',
    violet: 'bg-violet-400',
    amber: 'bg-amber-400',
    green: 'bg-emerald-400',
    rose: 'bg-rose-400',
  };

  const sizeMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500 font-mono">{value} / {max}</span>
          <span className="text-xs text-zinc-500 font-mono">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-white/5 border border-white/5 overflow-hidden ${sizeMap[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorMap[color] || colorMap.gradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CircularProgress({ value = 0, max = 100, size = 80, strokeWidth = 6, color = '#2FF3E0', trackColor = 'rgba(255,255,255,0.06)', label, sublabel, className = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && <span className="font-display font-bold text-zinc-100" style={{ fontSize: size * 0.2 }}>{label}</span>}
          {sublabel && <span className="text-2xs text-zinc-500 font-mono" style={{ fontSize: size * 0.12 }}>{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
