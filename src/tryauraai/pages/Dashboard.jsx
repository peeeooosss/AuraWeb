import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Presentation, Code, Users, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Presentations', value: '--', icon: Presentation, desc: 'Generated this month' },
    { label: 'API Calls', value: '--', icon: Code, desc: 'Last 30 days' },
    { label: 'Downloads', value: '--', icon: ArrowUpRight, desc: 'Total PPTX/PDF exports' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-500">Your TryAuraAI activity overview.</p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <s.icon size={14} className="text-cyan-400" />
              </div>
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
            <p className="font-display text-2xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-600">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/"
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Presentation size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">New Presentation</p>
              <p className="text-xs text-zinc-500">Generate a slide deck from a prompt</p>
            </div>
          </Link>
          <Link
            to="/developer"
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Code size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">API Keys</p>
              <p className="text-xs text-zinc-500">Manage your developer API keys</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
