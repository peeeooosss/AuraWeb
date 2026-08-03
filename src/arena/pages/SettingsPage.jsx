import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, Plus, Trash, Eye, EyeOff, Loader2, CreditCard, Shield, Zap, Settings as SettingsIcon, User, Key, Crown, Receipt, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { authFetch } from '../lib/api';
import { useCredits } from '../hooks/useApi';


const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'models', label: 'Models', icon: Zap },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'plans', label: 'Plans', icon: Crown },
  { id: 'billing', label: 'Billing', icon: Receipt },
];

function TabButton({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-[#F3F0FF] text-[#7A5AF8]'
          : 'text-[#667085] hover:bg-[#F8F8FA]'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function ProfileTab({ user }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await authFetch('/api/v1/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#F3F0FF] flex items-center justify-center">
          <span className="font-syne font-bold text-2xl text-[#7A5AF8]">
            {localStorage.getItem('user_email')?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <h3 className="font-syne text-lg font-semibold text-[#191919]">{localStorage.getItem('user_email') || 'user@arena.ai'}</h3>
          <p className="text-sm text-[#667085]">Manage your profile</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">Display Name</h4>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-[#EDEEEF] bg-white text-sm text-[#191919] placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8]"
            placeholder="Enter your display name"
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="pt-4 border-t border-[#EDEEEF]">
          <h4 className="font-syne font-semibold text-sm text-[#191919] mb-3">Email</h4>
          <p className="text-sm text-[#667085">{localStorage.getItem('user_email') || 'user@arena.ai'}</p>
          <p className="text-xs text-[#808080] mt-1">Email changes require verification. Contact support to update.</p>
        </div>

        <div className="pt-4 border-t border-[#EDEEEF]">
          <h4 className="font-syne font-semibold text-sm text-[#191919] mb-3">Password</h4>
          <button className="px-4 py-2 rounded-lg border border-[#EDEEEF] bg-white text-sm font-medium text-[#191919] hover:bg-[#F8F8FA] transition-colors">
            Change Password
          </button>
          <p className="text-xs text-[#808080] mt-1">You'll receive an email to reset your password.</p>
        </div>
      </div>
    </div>
  );
}

function ModelsTab() {
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [provider, setProvider] = useState('openrouter');
  const [model, setModel] = useState('deepseek/deepseek-v4-pro');

  useEffect(() => {
    fetch('http://localhost:11434/api/tags')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setOllamaStatus({ online: true, models: d.models?.map(m => m.name) || [] }))
      .catch(() => setOllamaStatus({ online: false, models: [] }));
  }, []);

  const providers = [
    { id: 'openrouter', name: 'OpenRouter', description: 'Access 100+ models via OpenRouter API', models: ['deepseek/deepseek-v4-pro', 'deepseek/deepseek-v4-flash', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro'] },
    { id: 'ollama', name: 'Ollama (Local)', description: 'Run models locally with Ollama', models: ollamaStatus?.models || [] },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">AI Provider</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                provider === p.id
                  ? 'border-[#7A5AF8] bg-[#F3F0FF]'
                  : 'border-[#EDEEEF] bg-white hover:border-[#DDD9F8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-syne font-semibold text-sm text-[#191919]">{p.name}</h5>
                  <p className="text-xs text-[#667085] mt-0.5">{p.description}</p>
                </div>
                {provider === p.id && (
                  <div className="w-5 h-5 rounded-full bg-[#7A5AF8] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">Model Selection</h4>
        <p className="text-xs text-[#808080]">Select the model to use for generation</p>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-[#EDEEEF] bg-white text-sm text-[#191919] focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8]"
        >
          {providers.find(p => p.id === provider)?.models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <p className="text-xs text-[#808080]">Model changes take effect on next generation</p>
      </div>

      <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">Ollama Local</h4>
        <div className="flex items-center gap-2">
          {ollamaStatus?.online ? (
            <Wifi size={14} className="text-green-500" />
          ) : ollamaStatus === null ? (
            <div className="w-3.5 h-3.5 border-2 border-[#808080]/30 border-t-transparent rounded-full animate-spin" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
          <span className="text-sm font-medium text-[#191919]">
            Ollama {ollamaStatus?.online ? 'Connected' : ollamaStatus === null ? 'Checking...' : 'Offline'}
          </span>
        </div>

        {ollamaStatus?.online && ollamaStatus.models.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ollamaStatus.models.map(m => (
              <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3F0FF] text-[#7A5AF8] font-mono">
                {m}
              </span>
            ))}
          </div>
        )}

        {!ollamaStatus?.online && ollamaStatus !== null && (
          <p className="text-xs text-red-600">
            Ollama not running. Start with <code className="bg-red-50 px-1 rounded text-xs">ollama serve</code>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#F3F0FF] border border-[#DDD9F8]">
            <p className="text-xs text-[#7A5AF8] font-medium mb-0.5">LLM</p>
            <p className="text-sm font-semibold text-[#191919]">{provider === 'openrouter' ? 'OpenRouter' : 'Ollama'}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F3F0FF] border border-[#DDD9F8]">
            <p className="text-xs text-[#7A5AF8] font-medium mb-0.5">Model</p>
            <p className="text-sm font-semibold text-[#191919]">{model}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authFetch('/api/v1/keys').then(r => r.json());
      setKeys(data.items || []);
    } catch (e) {
      console.error('Failed to load API keys:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      await authFetch('/api/v1/keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      toast.success('API key created');
      setNewKeyName('');
      loadKeys();
    } catch (e) {
      toast.error(e.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await authFetch(`/api/v1/keys/${id}`, { method: 'DELETE' });
      toast.success('API key revoked');
      loadKeys();
    } catch (e) {
      toast.error(e.message || 'Failed to revoke API key');
    }
  };

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">API Keys</h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., 'Production API')"
            className="px-3 py-1.5 rounded-lg border border-[#EDEEEF] bg-white text-sm text-[#191919] placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8] w-48"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="px-3 py-1.5 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-[#808080]">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-[#EDEEEF] bg-white p-8 text-center">
          <Key className="w-10 h-10 mx-auto text-[#808080] mb-3" />
          <h4 className="font-syne font-semibold text-sm text-[#191919] mb-1">No API Keys</h4>
          <p className="text-sm text-[#808080] mb-4">Create an API key to access the API programmatically</p>
          <button
            onClick={() => setNewKeyName('My API Key')}
            className="px-4 py-2 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors"
          >
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#EDEEEF] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EDEEEF] bg-[#FAFBFC]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Prefix</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(key => (
                  <tr key={key.id} className="border-b border-[#EDEEEF] hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-[#191919">{key.name}</div>
                      <div className="text-xs text-[#808080] mt-0.5">{key.key_prefix}••••••••</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#667085] font-mono">{key.key_prefix}</td>
                    <td className="px-4 py-3 text-sm text-[#667085]">
                      {new Date(key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(key.key_prefix + '••••••••')}
                          className="p-1.5 hover:bg-[#F8F8FA] rounded-lg text-[#667085] transition-colors"
                          title="Copy prefix"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          title="Revoke"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PlansTab({ credits }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-syne font-semibold text-sm text-[#191919]">Current Plan</h4>
            <p className="text-xs text-[#808080]">Your current subscription</p>
          </div>
          <Link to="/plans" className="px-4 py-2 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors">
            View Plans
          </Link>
        </div>

        <div className="rounded-xl bg-[linear-gradient(135deg,#FAFAFF_0%,#F3F0FF_100%)] border border-[#F3F0FF] p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A5AF8]">
              <Crown size={16} className="text-white" />
            </div>
            <div>
              <p className="font-syne font-semibold text-sm text-[#191919]">
                {credits?.planName || 'Free'} Plan
              </p>
              <p className="text-xs text-[#667085]">
                {credits?.unlimited
                  ? 'Unlimited presentations'
                  : `${credits?.creditsBalance || 0} / ${credits?.creditsLimit || 0} credits this month`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 p-3 rounded-xl bg-white border border-[#EDEEEF] text-center">
              <p className="text-xs text-[#808080] mb-0.5">Credits Used</p>
              <p className="font-syne font-bold text-lg text-[#191919]">
                {credits?.unlimited ? '∞' : (credits?.creditsLimit || 0) - (credits?.creditsBalance || 0)}
              </p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-white border border-[#EDEEEF] text-center">
              <p className="text-xs text-[#808080] mb-0.5">Credits Remaining</p>
              <p className="font-syne font-bold text-lg text-[#7A5AF8]">
                {credits?.unlimited ? '∞' : credits?.creditsBalance || 0}
              </p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-white border border-[#EDEEEF] text-center">
              <p className="text-xs text-[#808080] mb-0.5">Reset Date</p>
              <p className="font-syne font-bold text-lg text-[#191919]">
                {credits?.rolloverExpiry
                  ? new Date(credits.rolloverExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Monthly'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">Usage This Month</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-[#F3F0FF] border border-[#DDD9F8] text-center">
            <p className="text-xs text-[#7A5AF8] font-medium mb-0.5">Presentations Generated</p>
            <p className="font-syne font-bold text-2xl text-[#191919]">0</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F3F0FF] border border-[#DDD9F8] text-center">
            <p className="text-xs text-[#7A5AF8] font-medium mb-0.5">Credits Used</p>
            <p className="font-syne font-bold text-2xl text-[#191919]">0</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F3F0FF] border border-[#DDD9F8] text-center">
            <p className="text-xs text-[#7A5AF8] font-medium mb-0.5">API Calls</p>
            <p className="font-syne font-bold text-2xl text-[#191919]">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingTab() {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pm, inv] = await Promise.all([
          authFetch('/api/v1/billing/payment-method').then(r => r.json()).catch(() => null),
          authFetch('/api/v1/billing/invoices').then(r => r.json()).catch(() => ({ items: [] })),
        ]);
        setPaymentMethod(pm);
        setInvoices(inv.items || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddPayment = () => {
    toast.info('Redirecting to Stripe portal...');
    window.open('/api/v1/billing/portal', '_blank');
  };

  if (loading) return <div className="flex items-center justify-center py-8 text-[#808080]">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
        <h4 className="font-syne font-semibold text-sm text-[#191919]">Payment Method</h4>
        {paymentMethod ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFBFC] border border-[#EDEEEF]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F3F0FF] flex items-center justify-center">
                <CreditCard size={18} className="text-[#7A5AF8]" />
              </div>
              <div>
                <p className="font-medium text-sm text-[#191919]">•••• {paymentMethod.last4 || '****'}</p>
                <p className="text-xs text-[#808080">{paymentMethod.brand} • Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}</p>
              </div>
            </div>
            <button
              onClick={handleAddPayment}
              className="px-3 py-1.5 rounded-lg border border-[#EDEEEF] bg-white text-sm font-medium text-[#191919] hover:bg-[#F8F8FA] transition-colors"
            >
              Update
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#FAFBFC] border border-[#EDEEEF] text-center">
            <CreditCard className="w-10 h-10 mx-auto text-[#808080] mb-3" />
            <p className="text-sm text-[#667085] mb-3">No payment method added</p>
            <button onClick={handleAddPayment} className="px-4 py-2 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors">
              Add Payment Method
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#EDEEEF] bg-white overflow-hidden">
        <div className="p-4 border-b border-[#EDEEEF] flex items-center justify-between">
          <h4 className="font-syne font-semibold text-sm text-[#191919]">Invoice History</h4>
          <a href="/api/v1/billing/portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#7A5AF8] hover:underline">
            <ExternalLink className="h-3 w-3" />
            Manage in Stripe
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EDEEEF] bg-[#FAFBFC]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Invoice</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#808080]">No invoices yet</td>
                </tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="border-b border-[#EDEEEF] hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3 text-sm text-[#667085]">
                    {new Date(inv.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#191919">{inv.number || inv.id}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-[#191919]">${(inv.amount_paid / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                      inv.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={inv.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#7A5AF8] hover:underline flex items-center justify-end gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user] = useState({ email: localStorage.getItem('user_email') || 'user@arena.ai', name: localStorage.getItem('user_name') });
  const { credits } = useCredits();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <section className="mt-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-syne text-[22px] font-medium text-[#101323]">Settings</h1>
            <p className="text-sm text-[#808080] mt-1">Manage your account, AI models, API keys, and billing</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#EDEEEF] bg-white overflow-hidden">
          <div className="border-b border-[#EDEEEF] p-4 overflow-x-auto">
            <nav className="flex gap-1 min-w-max" role="tablist">
              {TABS.map(tab => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  label={tab.label}
                  icon={tab.icon}
                />
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && <ProfileTab user={null} />}
            {activeTab === 'models' && <ModelsTab />}
            {activeTab === 'api-keys' && <ApiKeysTab />}
            {activeTab === 'plans' && <PlansTab credits={credits} />}
            {activeTab === 'billing' && <BillingTab />}
          </div>
        </div>
      </section>
    </div>
  );
}