import React, { useState, useEffect, useCallback } from 'react';
import {
  Key, Copy, Check, Trash2, Plus, AlertTriangle, Zap, BarChart3,
  LogOut, Wallet, CreditCard, RefreshCw, Loader2, DollarSign,
  Cpu, MessageSquare, Presentation, BookOpen, ClipboardList,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const API_BASE = '';

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) { existing.onload = () => resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.head.appendChild(script);
  });
}

async function apiFetch(path, opts = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-zinc-500' }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

export default function DeveloperPortal() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState({ total: 0, thisMonth: 0, today: 0, cost: 0, tokens: { input: 0, output: 0 } });
  const [revoking, setRevoking] = useState(null);
  const [showTopUp, setShowTopUp] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('starter');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const fetchKeys = useCallback(async () => {
    try {
      const data = await apiFetch('/api/v1/keys');
      setKeys(data.keys || []);
    } catch {}
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const data = await apiFetch('/api/v1/usage?days=30');
      setUsage(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (session) { fetchKeys(); fetchUsage(); }
  }, [session, fetchKeys, fetchUsage]);

  const handleCreateKey = useCallback(async () => {
    setCreatingKey(true);
    try {
      const data = await apiFetch('/api/v1/keys', {
        method: 'POST',
        body: JSON.stringify({ keyName: keyName || 'API Key', plan: selectedPlan }),
      });
      setNewKey(data.key);
      setKeyName('');
      await fetchKeys();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingKey(false);
    }
  }, [keyName, selectedPlan, fetchKeys]);

  const handleRevoke = useCallback(async (id) => {
    setRevoking(id);
    try {
      await apiFetch(`/api/v1/keys/${id}`, { method: 'DELETE' });
      await fetchKeys();
    } catch (err) {
      alert(err.message);
    } finally {
      setRevoking(null);
    }
  }, [fetchKeys]);

  const handleCopy = useCallback(async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = newKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [newKey]);

  const handleTopUp = useCallback(async (keyId) => {
    setTopUpLoading(true);
    try {
      await loadRazorpayScript();
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        alert('Payment gateway not configured. Contact support.');
        setTopUpLoading(false);
        return;
      }

      const orderData = await apiFetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: topUpAmount, receipt: `topup_${Date.now()}` }),
      });

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(topUpAmount * 100),
        currency: 'INR',
        name: 'TryAuraAI',
        description: `Wallet Top-up ₹${topUpAmount}`,
        order_id: orderData.razorpay_order_id,
        handler: async (response) => {
          try {
            await apiFetch('/api/payments/verify', {
              method: 'POST',
              body: JSON.stringify(response),
            });
            await apiFetch('/api/v1/wallet/topup', {
              method: 'POST',
              body: JSON.stringify({ key_id: keyId, amount: topUpAmount }),
            });
            await fetchKeys();
            setShowTopUp(null);
          } catch (err) {
            alert('Payment verified but top-up failed: ' + err.message);
          }
        },
        modal: { ondismiss: () => {} },
        theme: { color: '#1a1a1a' },
      });
      rzp.on('payment.failed', (response) => {
        alert(response?.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      alert(err.message);
    } finally {
      setTopUpLoading(false);
    }
  }, [topUpAmount, fetchKeys]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setKeys([]);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
          <Key size={24} className="text-zinc-500" />
        </div>
        <h1 className="font-display text-2xl font-bold">Developer API</h1>
        <p className="mt-3 text-sm text-zinc-500">
          Sign in to generate API keys, monitor usage, and manage your wallet.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 mt-6 text-sm font-medium px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Developer API</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Manage keys, monitor usage, and top up your wallet. Use your key with{' '}
            <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 text-xs">
              Authorization: Bearer aurai_live_...
            </code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{session.user.email}</span>
          <button onClick={handleLogout} className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* New Key Reveal */}
      {newKey && (
        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Save this key — it won't be shown again!</p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-amber-500/20 bg-zinc-900 px-4 py-3 font-mono text-sm text-amber-200 break-all">{newKey}</code>
                <button onClick={handleCopy} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 hover:bg-amber-500/10 transition-colors">
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-amber-400" />}
                </button>
              </div>
              <p className="mt-3 text-xs text-zinc-500">This key has full access to the API. Treat it like a password.</p>
              <button onClick={() => setNewKey(null)} className="mt-4 text-xs font-medium px-4 py-2 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors">
                I've saved it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className="mb-10">
        <h2 className="font-display text-lg font-semibold mb-4">Usage (Last 30 Days)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BarChart3} label="Requests" value={usage.total} sub={`${usage.thisMonth} this month`} />
          <StatCard icon={Cpu} label="Input Tokens" value={usage.tokens?.input?.toLocaleString() || '0'} sub="All time" color="text-cyan-400" />
          <StatCard icon={MessageSquare} label="Output Tokens" value={usage.tokens?.output?.toLocaleString() || '0'} sub="All time" color="text-purple-400" />
          <StatCard icon={DollarSign} label="Total Spent" value={`₹${Number(usage.cost || 0).toFixed(2)}`} sub="All time" color="text-amber-400" />
        </div>
      </div>

      {/* API Keys */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">API Keys</h2>
          <button
            onClick={() => setKeyName(''), setSelectedPlan('starter')}
            className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
          >
            <Plus size={12} /> New Key
          </button>
        </div>

        {/* Create Key Form */}
        {keyName !== '' || creatingKey ? (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key name (e.g. My App)"
                className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
              />
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
              >
                <option value="starter">Starter (50 req/day)</option>
                <option value="growth">Growth (200 req/day)</option>
                <option value="enterprise">Enterprise (unlimited)</option>
              </select>
              <button
                onClick={handleCreateKey}
                disabled={creatingKey}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creatingKey ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                Generate
              </button>
            </div>
          </div>
        ) : null}

        {/* Key List */}
        {keys.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
              <Key size={20} className="text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400 mb-4">No API keys yet. Generate one to start using the API.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div key={k.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Key size={14} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        <code className="text-zinc-300">{k.key_prefix}...</code>
                        <span className="ml-2 text-xs text-zinc-500">{k.key_name}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-600">
                          {k.plan} · {k.rate_limit ? `${k.rate_limit}/day` : 'unlimited'}
                        </span>
                        <span className="text-xs text-zinc-600">
                          Balance: <span className={`font-medium ${Number(k.balance) < 10 ? 'text-red-400' : 'text-green-400'}`}>₹{Number(k.balance || 0).toFixed(2)}</span>
                        </span>
                        {k.last_used_at && (
                          <span className="text-xs text-zinc-600">
                            Last used {new Date(k.last_used_at).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTopUp(k.id)}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-500/20 text-green-400 hover:bg-green-500/10 transition-colors"
                    >
                      <Wallet size={12} /> Top Up
                    </button>
                    <button
                      onClick={() => handleRevoke(k.id)}
                      disabled={revoking === k.id}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {revoking === k.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTopUp(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold mb-4">Top Up Wallet</h3>
            <p className="text-xs text-zinc-500 mb-4">Add INR credits to this API key. Each request deducts tokens based on usage.</p>
            <div className="flex gap-2 mb-4">
              {[100, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${topUpAmount === amt ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'border border-white/10 text-zinc-400 hover:text-white'}`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={10}
              max={50000}
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-500/50 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowTopUp(null)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleTopUp(showTopUp)}
                disabled={topUpLoading || topUpAmount < 10}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {topUpLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                Pay ₹{topUpAmount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold mb-4">Quick Start</h2>
        <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-5">
          <p className="text-xs text-zinc-500 mb-3">Generate content with a single API call:</p>
          <pre className="rounded-lg bg-zinc-950 p-4 overflow-x-auto">
            <code className="text-xs text-zinc-300 font-mono">
{`curl -X POST https://arena.tryauraai.in/api/v1/ai/generate \\
  -H "Authorization: Bearer aurai_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Explain photosynthesis to Grade 7 students",
    "systemPrompt": "You are an expert science teacher.",
    "model": "claude-sonnet-5"
  }'`}
            </code>
          </pre>
          <p className="mt-4 text-xs text-zinc-500 mb-2">Available models (marketing names):</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300">claude-haiku (fast, cheap)</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300">claude-sonnet-5 (default)</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300">claude-sonnet-5-reasoning (premium)</span>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Pricing: token-based, deducted from your wallet. Docs: <code className="text-cyan-400">arena.tryauraai.in/api/v1/ai/*</code>
          </p>
        </div>
      </div>
    </div>
  );
}
