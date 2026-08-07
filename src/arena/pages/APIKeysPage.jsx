import React, { useState, useEffect, useCallback } from 'react';
import { Key, Copy, Plus, Trash2, Loader2, Wallet, ChevronDown, Check, Pencil, ToggleLeft, ToggleRight, History, EyeOff, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, getApiKeys, createApiKey, deleteApiKey, updateApiKey, getUsageSummary, createWalletTopupOrder, verifyWalletTopup, getWalletTopupHistory, getUsageLogs } from '../lib/api';

function TabButton({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#F3F0FF] text-[#7A5AF8]' : 'text-[#667085] hover:bg-[#F8F8FA]'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// --- Secret Key Reveal Modal ---
function SecretKeyModal({ secretKey, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(secretKey);
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-[#EDEEEF] shadow-xl p-8 max-w-lg w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-syne text-lg font-bold text-[#191919]">Your API Key</h2>
            <p className="text-xs text-[#808080]">Save it now — it won't be shown again</p>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="bg-[#FAFBFC] border border-[#EDEEEF] rounded-lg p-4 font-mono text-sm text-[#191919] break-all select-all">
            {secretKey}
          </div>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded-lg bg-white border border-[#EDEEEF] hover:bg-[#F3F0FF] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#667085]" />}
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-xs text-amber-800">
          <strong>Important:</strong> Store this key securely. For security, we only store a hash — the full key cannot be recovered. You'll need to create a new key if you lose this one.
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors"
        >
          I've saved my key
        </button>
      </div>
    </div>
  );
}

// --- API Keys Tab ---
function APIKeysTab({ keys, loading, handleCreateKey, handleRevoke, handleUpdate, creating, keyName, setKeyName, copyToClipboard }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6">
        <h2 className="font-syne text-sm font-semibold text-[#191919] mb-4">Create New API Key</h2>
        <div className="flex gap-3 max-w-md">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="e.g. Client Production Key"
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#EDEEEF] bg-white text-sm text-[#191919] placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8]"
          />
          <button
            onClick={handleCreateKey}
            disabled={creating || !keyName.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors disabled:opacity-50 flex items-center justify-center min-w-[44px]"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EDEEEF] bg-white overflow-hidden">
        <div className="p-4 border-b border-[#EDEEEF] font-semibold text-sm text-[#191919]">Your Keys ({keys.length})</div>
        {loading ? (
          <div className="p-8 text-center text-[#808080]"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-[#808080]">No API Keys created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EDEEEF] bg-[#FAFBFC]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Prefix</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Balance</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Last Used</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(key => (
                  <tr key={key.id} className="border-b border-[#EDEEEF] hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3 text-sm text-[#191919] font-medium">
                      {key.isEditing ? (
                        <input
                          type="text" defaultValue={key.key_name}
                          onBlur={(e) => { handleUpdate(key.id, { key_name: e.target.value }, key); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { handleUpdate(key.id, { key_name: e.target.value }, key); } }}
                          className="w-full px-2 py-1 border border-[#7A5AF8] rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          {key.key_name}
                          <button onClick={() => { const newKeys = keys.map(k => k.id === key.id ? {...k, isEditing: true} : k); setKeyName(''); }} className="text-[#808080] hover:text-[#7A5AF8]">
                            <Pencil size={12} />
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#667085]">{key.key_prefix || ''}</td>
                    <td className="px-4 py-3 text-sm text-[#191919] font-medium">${Number(key.balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {key.active !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#808080]">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleUpdate(key.id, { active: !key.active }, key)}
                          className={`p-1.5 rounded-lg transition-colors ${key.active !== false ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={key.active !== false ? 'Disable key' : 'Enable key'}
                        >
                          {key.active !== false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Permanently revoke "${key.key_name}"? This cannot be undone.`)) handleRevoke(key.id); }}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="Revoke key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Wallet Tab ---
function WalletTab({ keys, handleTopup }) {
  const [amount, setAmount] = useState('5');
  const [selectedKey, setSelectedKey] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingHistory(true);
      try {
        const { topups } = await getWalletTopupHistory();
        setHistory(topups || []);
      } catch { /* non-critical */ }
      setLoadingHistory(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6">
        <h2 className="font-syne text-sm font-semibold text-[#191919] mb-1">Top Up Wallet</h2>
        <p className="text-xs text-[#808080] mb-4">Add funds to an API key for pay-per-use billing. Minimum $5.00.</p>
        <div className="grid gap-4 max-w-lg">
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className="w-full p-2.5 rounded-lg border border-[#EDEEEF] text-sm bg-white">
            <option value="">Select an API Key</option>
            {keys.filter(k => k.active !== false).map(k => (
              <option key={k.id} value={k.id}>{k.key_name} (${Number(k.balance).toFixed(2)})</option>
            ))}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#808080]">$</span>
            <input
              type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              min="5" step="0.5"
              className="w-full pl-8 p-2.5 rounded-lg border border-[#EDEEEF] text-sm"
              placeholder="5.00"
            />
          </div>
          <button
            onClick={() => handleTopup(selectedKey, Number(amount))}
            disabled={!selectedKey || Number(amount) < 5}
            className="w-full bg-[#7A5AF8] text-white p-2.5 rounded-lg font-medium text-sm hover:bg-[#6B48EE] transition-colors disabled:opacity-50"
          >
            Top Up via Razorpay
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EDEEEF] bg-white overflow-hidden">
        <div className="p-4 border-b border-[#EDEEEF] font-semibold text-sm text-[#191919] flex items-center gap-2">
          <History size={14} className="text-[#808080]" />
          Top-Up History
        </div>
        {loadingHistory ? (
          <div className="p-8 text-center text-[#808080]"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-[#808080] text-sm">No top-ups yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EDEEEF] bg-[#FAFBFC]">
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#808080]">Key</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#808080]">Amount</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#808080]">Status</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#808080]">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id} className="border-b border-[#EDEEEF]">
                    <td className="px-4 py-2 text-sm text-[#191919]">{t.key_name || '—'}</td>
                    <td className="px-4 py-2 text-sm text-[#191919] font-medium">${Number(t.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      {t.status === 'completed' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">Completed</span>
                      ) : t.status === 'pending' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Pending</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">{t.status || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-[#808080]">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Usage Tab ---
function UsageTab({ keys }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyId, setSelectedKeyId] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getUsageLogs({ apiKeyId: selectedKeyId || undefined, days: 30, limit: 100 });
        setLogs(data.logs || []);
      } catch { /* non-critical */ }
      setLoading(false);
    })();
  }, [selectedKeyId]);

  const totalCost = logs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
  const totalCalls = logs.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#EDEEEF] bg-white p-4">
          <p className="text-xs text-[#808080] mb-1">Total Calls (30d)</p>
          <p className="font-syne text-2xl font-bold text-[#191919]">{totalCalls}</p>
        </div>
        <div className="rounded-2xl border border-[#EDEEEF] bg-white p-4">
          <p className="text-xs text-[#808080] mb-1">Total Cost (30d)</p>
          <p className="font-syne text-2xl font-bold text-[#191919]">${totalCost.toFixed(3)}</p>
        </div>
        <div className="rounded-2xl border border-[#EDEEEF] bg-white p-4">
          <p className="text-xs text-[#808080] mb-1">Active Keys</p>
          <p className="font-syne text-2xl font-bold text-[#191919]">{keys.filter(k => k.active !== false).length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#EDEEEF] bg-white overflow-hidden">
        <div className="p-4 border-b border-[#EDEEEF] flex items-center justify-between">
          <span className="font-semibold text-sm text-[#191919] flex items-center gap-2">
            <Activity size={14} className="text-[#808080]" />
            Recent Activity
          </span>
          <select
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#EDEEEF] bg-white"
          >
            <option value="">All Keys</option>
            {keys.map(k => (
              <option key={k.id} value={k.id}>{k.key_name}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[#808080]"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-[#808080] text-sm">No usage recorded yet. Start making API calls with your key.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EDEEEF] bg-[#FAFBFC]">
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#808080]">Time</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#808080]">Key</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#808080]">Endpoint</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-[#808080]">Cost</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-[#808080]">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-[#EDEEEF] hover:bg-[#FAFBFC]">
                    <td className="px-4 py-2 text-sm text-[#808080] whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm text-[#191919] font-medium">{log.api_key_name || '—'}</td>
                    <td className="px-4 py-2 text-sm font-mono text-xs text-[#667085]">{log.endpoint || '—'}</td>
                    <td className="px-4 py-2 text-sm text-[#191919] text-right font-medium">${Number(log.cost || 0).toFixed(3)}</td>
                    <td className="px-4 py-2 text-sm text-[#808080] text-right">{log.input_tokens || 0} / {log.output_tokens || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function APIKeysPage({ inline = false }) {
  const [activeTab, setActiveTab] = useState('keys');
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [secretKey, setSecretKey] = useState(null); // shown once in modal

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApiKeys();
      setKeys(data.keys || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load keys');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const result = await createApiKey({ keyName: keyName.trim() });
      setSecretKey(result.key); // capture the plaintext key
      setKeyName('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create key');
    }
    setCreating(false);
  };

  const handleRevoke = async (id) => {
    try {
      await deleteApiKey(id);
      toast.success('Key revoked');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to revoke key');
    }
  };

  const handleUpdate = async (id, patch, keyObj) => {
    // Optimistic UI update
    setKeys(prev => prev.map(k => k.id === id ? { ...k, ...patch, isEditing: false } : k));
    try {
      await updateApiKey(id, patch);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update key');
      await loadData(); // revert
    }
  };

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    document.body.appendChild(script);
  });

  const handleTopup = async (keyId, amount) => {
    if (!keyId || !amount) return toast.error('Select key and amount');
    if (amount < 5) return toast.error('Minimum top-up is $5.00');
    try {
      const orderData = await createWalletTopupOrder(keyId, amount);
      const Rzp = await loadRazorpay();
      const rzp = new Rzp({
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Arena Slides',
        description: `Wallet top-up for ${orderData.key_name}`,
        order_id: orderData.razorpay_order_id,
        handler: async (resp) => {
          try {
            await verifyWalletTopup({ keyId, ...resp });
            toast.success(`Wallet topped up — $${amount}`);
            await loadData();
          } catch (err) {
            toast.error(err.message || 'Verification failed');
          }
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Failed to create order');
    }
  };

  const tabButtons = (
    <div className="flex gap-2">
      <TabButton active={activeTab === 'keys'} onClick={() => setActiveTab('keys')} label="API Keys" icon={Key} />
      <TabButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} label="Wallet" icon={Wallet} />
      <TabButton active={activeTab === 'usage'} onClick={() => setActiveTab('usage')} label="Usage" icon={Activity} />
    </div>
  );

  const tabContent = (
    <>
      {activeTab === 'keys' && <APIKeysTab keys={keys} loading={loading} handleCreateKey={handleCreateKey} handleRevoke={handleRevoke} handleUpdate={handleUpdate} creating={creating} keyName={keyName} setKeyName={setKeyName} copyToClipboard={() => {}} />}
      {activeTab === 'wallet' && <WalletTab keys={keys} handleTopup={handleTopup} />}
      {activeTab === 'usage' && <UsageTab keys={keys} />}
    </>
  );

  if (inline) {
    return (
      <div className="space-y-6">
        {tabButtons}
        {tabContent}
        {secretKey && (
          <SecretKeyModal
            secretKey={secretKey}
            onClose={() => setSecretKey(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="font-syne text-2xl font-bold">Developer Portal</h1>

        {tabButtons}

        {tabContent}
      </div>

      {secretKey && (
        <SecretKeyModal
          secretKey={secretKey}
          onClose={() => setSecretKey(null)}
        />
      )}
    </div>
  );
}