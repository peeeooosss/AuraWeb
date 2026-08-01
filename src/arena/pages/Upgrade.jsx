import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Zap, Crown, Sparkles, ChevronDown, ArrowLeft, Brain, Image as ImageIcon, Download, Mic, Youtube, FileText, BarChart3 } from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Start free — no card needed',
    price: 0,
    period: '',
    gradient: 'from-zinc-700 to-zinc-800',
    border: 'border-white/10',
    iconBg: 'bg-zinc-500/10 border-zinc-400/20',
    icon: <Zap size={20} className="text-zinc-400" />,
    models: [
      { name: 'Gemma 4 26B', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20' },
      { name: 'Nemotron Ultra', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20' },
      { name: 'LLaMA 3.3', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20' },
    ],
    modelNote: 'Great for simple queries & quick answers',
    features: [
      { text: '1 PPT, 1 PDF, 1 Excel per day', included: true, icon: <FileText size={13} /> },
      { text: 'Basic AI chat (free models)', included: true, icon: <Brain size={13} /> },
      { text: 'Simple quizzes', included: true, icon: <BarChart3 size={13} /> },
      { text: 'AI image generation', included: false, icon: <ImageIcon size={13} /> },
      { text: 'PPT generation', included: false, icon: <FileText size={13} /> },
      { text: 'YouTube summary', included: false, icon: <Youtube size={13} /> },
      { text: 'Voice input', included: false, icon: <Mic size={13} /> },
      { text: 'Downloads (PPTX/PDF)', included: false, icon: <Download size={13} /> },
    ],
  },
  {
    id: 'high',
    name: 'High',
    tagline: 'For serious students',
    price: 199,
    period: '/month',
    gradient: 'from-cyan-500 to-cyan-600',
    border: 'border-cyan-400/30',
    iconBg: 'bg-cyan-500/10 border-cyan-400/20',
    icon: <Sparkles size={20} className="text-cyan-400" />,
    popular: true,
    models: [
      { name: 'DeepSeek V4 Flash', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
      { name: 'GPT-4o-mini', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    ],
    modelNote: 'Same models as ChatGPT Plus — 10× cheaper',
    features: [
      { text: '5 PPT / 10 PDF / 10 Excel per day', included: true, icon: <FileText size={13} /> },
      { text: 'Paid AI models (DeepSeek + GPT-4o-mini)', included: true, icon: <Brain size={13} /> },
      { text: '5 AI images per day', included: true, icon: <ImageIcon size={13} /> },
      { text: '3 YouTube summaries per day', included: true, icon: <Youtube size={13} /> },
      { text: 'Voice input', included: true, icon: <Mic size={13} /> },
      { text: 'All downloads (PPTX/PDF)', included: true, icon: <Download size={13} /> },
      { text: 'Full quizzes + leaderboard', included: true, icon: <BarChart3 size={13} /> },
      { text: 'Priority queue', included: false, icon: <Zap size={13} /> },
    ],
  },
  {
    id: 'max',
    name: 'MAX',
    tagline: 'For power creators',
    price: 399,
    period: '/month',
    gradient: 'from-violet-500 to-fuchsia-500',
    border: 'border-violet-400/30',
    iconBg: 'bg-violet-500/10 border-violet-400/20',
    icon: <Crown size={20} className="text-violet-400" />,
    badge: 'Save ₹2,800/mo',
    models: [
      { name: 'Claude Sonnet 5', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
      { name: 'GPT-4o', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
      { name: 'DeepSeek Chat', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
    ],
    modelNote: 'Premium reasoning — models that cost $20/mo elsewhere',
    features: [
      { text: '10 PPT / 20 PDF / 20 Excel per day', included: true, icon: <FileText size={13} /> },
      { text: 'Premium AI models (Claude + GPT-4o)', included: true, icon: <Brain size={13} /> },
      { text: '10 AI images per day', included: true, icon: <ImageIcon size={13} /> },
      { text: '5 YouTube summaries per day', included: true, icon: <Youtube size={13} /> },
      { text: 'Voice input', included: true, icon: <Mic size={13} /> },
      { text: 'All downloads (PPTX/PDF)', included: true, icon: <Download size={13} /> },
      { text: 'Full quizzes + leaderboard', included: true, icon: <BarChart3 size={13} /> },
      { text: 'Priority queue + early access', included: true, icon: <Zap size={13} /> },
    ],
  },
];

const FAQ = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and you\'ll be charged a prorated amount.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'The Basic plan is free forever with no credit card required. Paid plans start immediately upon subscription.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We support UPI, credit/debit cards, net banking, and wallets through RazorPay — India\'s most trusted payment gateway.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Cancel anytime from your profile settings. You\'ll retain access until the end of your billing period.',
  },
];

function ComingSoonModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative glass-panel border border-cyan-400/20 rounded-2xl p-8 max-w-sm w-full text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-400 flex items-center justify-center mx-auto">
          <Sparkles size={24} className="text-zinc-950" />
        </div>
        <h3 className="font-display text-xl font-bold">Coming Soon!</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          RazorPay integration is being set up. You'll be able to subscribe directly from this page very soon.
        </p>
        <p className="text-xs text-zinc-500">
          For now, your current plan remains <span className="text-cyan-400 font-semibold">Basic (Free)</span>.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-display text-sm font-semibold pr-4">{item.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function Upgrade() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const currentPlan = 'basic';

  return (
    <div className="max-w-5xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Choose Your Plan</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Unlock the full power of AuraAI</p>
        </div>
      </div>

      {/* Savings Banner */}
      <div className="relative rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-zinc-900/60 to-violet-500/5 p-5 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs font-mono text-cyan-400 tracking-wider mb-1">YOU'RE GETTING</p>
          <h2 className="font-display text-xl font-bold mb-1">
            $40/mo of AI for just ₹399
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
            ChatGPT Plus costs $20/mo. Claude Pro costs $20/mo. That's ₹3,200/mo combined.
            AuraAI MAX gives you <span className="text-cyan-300 font-semibold">both</span> — plus document generation, image creation, and more — for ₹399.
          </p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.popular
                  ? 'border-cyan-400/30 bg-gradient-to-br from-cyan-500/5 via-zinc-900/60 to-violet-500/5'
                  : `glass-panel ${plan.border}`
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950">
                  Most Popular
                </span>
              )}
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white">
                  {plan.badge}
                </span>
              )}

              {/* Icon + Name */}
              <div className={`w-10 h-10 rounded-xl ${plan.iconBg} border flex items-center justify-center mb-4`}>
                {plan.icon}
              </div>
              <h3 className="font-display text-lg font-bold">{plan.name}</h3>
              <p className="text-xs text-zinc-500 mb-3">{plan.tagline}</p>

              {/* Price */}
              <div className="mb-4">
                {plan.price === 0 ? (
                  <span className="font-display text-3xl font-bold">Free</span>
                ) : (
                  <span className="font-display text-3xl font-bold">
                    ₹{plan.price}
                    <span className="text-sm text-zinc-500 font-normal">{plan.period}</span>
                  </span>
                )}
              </div>

              {/* Models */}
              <div className="mb-4 p-3 rounded-xl bg-white/3 border border-white/5">
                <p className="text-[10px] font-mono text-zinc-500 tracking-wider mb-2">AI MODELS INCLUDED</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {plan.models.map((m) => (
                    <span key={m.name} className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${m.color}`}>
                      {m.name}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 italic">{plan.modelNote}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    {f.included ? (
                      <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <X size={14} className="shrink-0 mt-0.5 text-zinc-600" />
                    )}
                    <span className={f.included ? 'text-zinc-300' : 'text-zinc-600'}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-zinc-500 cursor-default">
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => setShowComingSoon(true)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950'
                      : 'bg-gradient-to-r from-violet-400 to-fuchsia-400 text-zinc-950'
                  }`}
                >
                  Subscribe
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Model Comparison Section */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold">What Models Power Your Plan?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Free Models */}
          <div className="glass-panel border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center">
                <Zap size={14} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-semibold">Free Models</p>
                <p className="text-[10px] text-zinc-500">Basic (Free)</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Gemma 4 26B — Fast, lightweight', 'Nemotron Ultra — Strong reasoning', 'LLaMA 3.3 70B — General purpose'].map((m) => (
                <div key={m} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-1 h-1 rounded-full bg-zinc-500" />
                  {m}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-3 italic">Good for simple queries, quick answers</p>
          </div>

          {/* Paid Models */}
          <div className="glass-panel border border-cyan-400/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                <Sparkles size={14} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-cyan-300">Paid Models</p>
                <p className="text-[10px] text-zinc-500">High (₹199)</p>
              </div>
            </div>
            <div className="space-y-2">
              {['DeepSeek V4 Flash — Ultra-fast documents', 'GPT-4o-mini — Smart, versatile', '+ All free models included'].map((m) => (
                <div key={m} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  {m}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-cyan-500/70 mt-3 italic">Same models powering ChatGPT Plus</p>
          </div>

          {/* Premium Models */}
          <div className="glass-panel border border-violet-400/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
                <Crown size={14} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-300">Premium Models</p>
                <p className="text-[10px] text-zinc-500">MAX (₹399)</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Claude Sonnet 5 — Elite reasoning', 'GPT-4o — Most capable model', 'DeepSeek Chat — Advanced coding', '+ All paid + free models'].map((m) => (
                <div key={m} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="w-1 h-1 rounded-full bg-violet-400" />
                  {m}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-violet-500/70 mt-3 italic">Models that cost $20/mo each elsewhere</p>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-display font-semibold text-sm">Feature Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-zinc-500 font-medium text-xs">Feature</th>
                <th className="text-center px-4 py-3 text-zinc-500 font-medium text-xs">Basic</th>
                <th className="text-center px-4 py-3 text-cyan-400 font-medium text-xs">High ₹199</th>
                <th className="text-center px-4 py-3 text-violet-400 font-medium text-xs">MAX ₹399</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'AI Models', basic: 'Free only', high: '+ DeepSeek, GPT-4o-mini', max: '+ Claude, GPT-4o' },
                { feature: 'PPT Slides/Day', basic: '1', high: '5', max: '10' },
                { feature: 'PDF/Day', basic: '1', high: '10', max: '20' },
                { feature: 'Excel/Day', basic: '1', high: '10', max: '20' },
                { feature: 'Total Documents/Day', basic: '3', high: '20', max: '50' },
                { feature: 'AI Images/Day', basic: '—', high: '5', max: '10' },
                { feature: 'YouTube Summary', basic: '—', high: '3/day', max: '5/day' },
                { feature: 'Voice Input', basic: '—', high: '✓', max: '✓' },
                { feature: 'Downloads (PPTX/PDF)', basic: '—', high: '✓', max: '✓' },
                { feature: 'Quizzes', basic: 'Basic', high: 'Full + Leaderboard', max: 'Full + Leaderboard' },
                { feature: 'Priority Queue', basic: '—', high: '—', max: '✓' },
                { feature: 'Early Access Features', basic: '—', high: '—', max: '✓' },
              ].map((row) => (
                <tr key={row.feature} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-zinc-300">{row.feature}</td>
                  <td className="text-center px-4 py-3 text-zinc-500 text-xs">{row.basic}</td>
                  <td className="text-center px-4 py-3 text-zinc-300 text-xs">{row.high}</td>
                  <td className="text-center px-4 py-3 text-zinc-300 text-xs">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <FAQItem key={item.q} item={item} />
          ))}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && <ComingSoonModal onClose={() => setShowComingSoon(false)} />}
    </div>
  );
}
