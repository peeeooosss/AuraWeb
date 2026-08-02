import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Crown, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAccessToken } from '../lib/auth';

const MODELS = {
  fast: {
    name: 'Haiku / Flash',
    description: 'Fast, cost-efficient models for simple tasks',
    creditMultiplier: 1,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    colorBg: 'bg-blue-50',
    icon: <Zap size={18} className="text-blue-500" />,
  },
  balanced: {
    name: 'Sonnet / GPT-4o',
    description: 'Balanced performance and quality',
    creditMultiplier: 1.5,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    colorBg: 'bg-cyan-50',
    icon: <Cpu size={18} className="text-cyan-500" />,
  },
  reasoning: {
    name: 'Reasoning / Kimi',
    description: 'Advanced reasoning and math',
    creditMultiplier: 2,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    colorBg: 'bg-purple-50',
    icon: <Crown size={18} className="text-purple-500" />,
  },
};

export default function ModelsPage() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch('/api/v1/limits', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setCredits(await res.json());
      } catch {
        // ignore
      }
    };
    fetchCredits();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl hover:bg-[#F8F8FA] text-[#667085] mb-4 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="19 12H5"></polyline><polyline points="12 19l-7-7"></polyline><polyline points="12 5v14"></polyline></svg>
          </button>
        </div>

        <h1 className="font-syne text-2xl font-bold text-[#101323] mb-2">AI Models</h1>
        <p className="text-sm text-[#808080] mb-8">
          Arena uses credit-based billing. Credits are consumed per presentation based on the model tier selected.
        </p>

        <div className="grid gap-4 mb-8">
          {Object.entries(MODELS).map(([id, model]) => (
            <div key={id} className={`rounded-xl border p-5 ${model.color}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${model.colorBg} flex items-center justify-center shrink-0`}>
                  {model.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-syne text-lg font-semibold text-[#191919]">{model.name}</h3>
                  <p className="text-sm text-[#667085] my-1">{model.description}</p>
                  <p className="text-xs text-[#808080]">
                    Credit multiplier: <span className="font-mono font-medium">{model.creditMultiplier}x</span>
                    {' '}· Base cost 10-20 credits
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {credits && (
          <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6">
            <h3 className="font-syne font-semibold text-sm text-[#191919] mb-3">Your Credits</h3>
            <p className="text-sm text-[#667085]">
              {credits.unlimited
                ? 'You have unlimited credits'
                : `${credits.creditsBalance || 0} credits available`}
            </p>
            {!credits.unlimited && (
              <Link to="/plans" className="inline-flex items-center gap-1 text-sm text-[#7A5AF8] hover:underline mt-2">
                <Zap size={14} />
                Get more credits
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
