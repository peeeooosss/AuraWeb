import React, { useState, useEffect, useCallback } from 'react';
import { Key, Copy, Plus, Trash2, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '../lib/api';

function StatCard({ icon: Icon, label, value, sub, color = 'text-[#7A5AF8]' }) {
  return (
    <div className="rounded-xl border border-[#EDEEEF] bg-[#FAFBFC] p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-[#808080] font-medium">{label}</span>
      </div>
      <p className="font-syne text-2xl font-bold text-[#101323]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#808080]">{sub}</p>}
    </div>
  );
}

const API_DOCS = `curl -X POST https://api.auraai.in/v1/ppt/presentation/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Your presentation topic here"}'`;

export default function APIKeysPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState({ total: 0, thisMonth: 0, today: 0, cost: 0 });
  const [revoking, setRevoking] = useState(null);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');

  const fetchKeys = useCallback(async () => {
    try {
      const data = await authFetch('/api/v1/keys').then(r => r.json());
      setKeys(data.keys || []);
    } catch (e) {
      console.error('Failed to load API keys:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const data = await authFetch('/api/v1/usage?days=30').then(r => r.json());
      setUsage(data);
    } catch (e) {
      console.error('Failed to load usage:', e);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchUsage();
  }, [fetchKeys, fetchUsage]);

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    setCreating(true);
    try {
      const data = await authFetch('/api/v1/keys', {
        method: 'POST',
        body: JSON.stringify({ keyName: keyName.trim(), plan: 'starter' }),
      }).then(r => r.json());
      setNewKey(data.key);
      setKeyName('');
      await fetchKeys();
      toast.success('API key created');
    } catch (err) {
      toast.error(err.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    setRevoking(id);
    try {
      await authFetch(`/api/v1/keys/${id}`, { method: 'DELETE' });
      await fetchKeys();
      toast.success('API key revoked');
    } catch (err) {
      toast.error(err.message || 'Failed to revoke API key');
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-syne text-2xl font-bold text-[#101323]">API Keys</h1>
          <p className="text-sm text-[#808080] mt-1">Manage your API keys and view usage statistics</p>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BarChart3} label="Total Requests" value={usage.total || 0} />
          <StatCard icon={BarChart3} label="This Month" value={usage.thisMonth || 0} />
          <StatCard icon={BarChart3} label="Today" value={usage.today || 0} />
          <StatCard icon={BarChart3} label="API Cost" value={`₹${(usage.cost || 0).toFixed(2)}`} />
        </div>

        {/* Create New Key */}
        <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6 mb-8">
          <h2 className="font-syne text-sm font-semibold text-[#191919] mb-4">Create New API Key</h2>
          <div className="flex gap-3 max-w-md">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. Production API, Dashboard widget"
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#EDEEEF] bg-white text-sm text-[#191919] placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8]"
            />
            <button
              onClick={handleCreateKey}
              disabled={creating || !keyName.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#7A5AF8] text-white text-sm font-medium hover:bg-[#6B48EE] transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Key Display */}
        {newKey && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 className="font-syne font-semibold text-green-800">Key created successfully!</h3>
            </div>
            <p className="text-sm text-green-700 mb-2">Store this key safely — it won't be shown again.</p>
            <div className="relative">
              <code className="block text-xs font-mono bg-white rounded-lg p-3 pr-10 text-green-800 border border-green-100 overflow-x-auto">
                {newKey}
              </code>
              <button
                onClick={() => copyToClipboard(newKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[#F8F8FA] rounded-lg text-green-600 transition-colors"
                title="Copy key"
              >
                {copied ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="rounded-2xl border border-[#EDEEEF] bg-white overflow-hidden">
          <div className="p-4 border-b border-[#EDEEEF] flex items-center justify-between">
            <h2 className="font-syne text-sm font-semibold text-[#191919]">Your Keys ({keys.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#808080]">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-10 h-10 mx-auto text-[#808080] mb-3" />
              <h3 className="font-syne font-semibold text-sm text-[#191919] mb-1">No API Keys</h3>
              <p className="text-sm text-[#808080] mb-4">Create an API key to access Arena's API programmatically</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EDEEEF] bg-[#FAFBFC]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Prefix</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Requests</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Created</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(key => (
                    <tr key={key.id} className="border-b border-[#EDEEEF] hover:bg-[#FAFBFC]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-[#191919]">{key.name}</p>
                        <p className="text-xs text-[#808080] mt-0.5">{key.key_prefix}••••••••</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#667085] font-mono">{key.key_prefix}</td>
                      <td className="px-4 py-3 text-right text-sm text-[#667085]">{key.usage_count || 0}</td>
                      <td className="px-4 py-3 text-sm text-[#667085]">
                        {new Date(key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(key.key_prefix + '••••••••')}
                            className="p-1.5 hover:bg-[#F8F8FA] rounded-lg text-[#667085] transition-colors"
                            title="Copy prefix"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRevoke(key.id)}
                            disabled={revoking === key.id}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="Revoke"
                          >
                            {revoking === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

        {/* API Docs */}
        <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6 mt-8">
          <h2 className="font-syne text-sm font-semibold text-[#191919] mb-4">Quick Start</h2>
          <p className="text-sm text-[#808080] mb-3">
            Use your API key as a Bearer token to access Arena's API endpoints.
          </p>
          <div className="relative">
            <pre className="text-xs font-mono bg-[#191919] text-green-400 p-4 rounded-lg overflow-x-auto">
              {API_DOCS}
            </pre>
            <button
              onClick={() => copyToClipboard(API_DOCS)}
              className="absolute right-2 top-2 p-1.5 hover:bg-[#F8F8FA] rounded text-[#667085] transition-colors"
              title="Copy example"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
