import React, { useState, useEffect, useCallback } from 'react';
import { Key, Copy, Plus, Trash2, Loader2, BarChart3, Wallet, CreditCard, ChevronDown, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, getApiKeys, createApiKey, deleteApiKey, getUsageSummary, createWalletTopupOrder, verifyWalletTopup, getWalletTopupHistory, createBillingOrder, verifyBilling } from '../lib/api';
import { useNavigate } from 'react-router-dom';

// --- Components for Tabs ---

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

function APIKeysTab({ keys, loading, handleCreateKey, handleRevoke, copyToClipboard, creating, keyName, setKeyName }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6">
        <h2 className="font-syne text-sm font-semibold text-[#191919] mb-4">Create New API Key</h2>
        <div className="flex gap-3 max-w-md">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="e.g. Production API"
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

      <div className="rounded-2xl border border-[#EDEEEF] bg-white overflow-hidden">
        <div className="p-4 border-b border-[#EDEEEF] font-semibold text-sm text-[#191919]">Your Keys ({keys.length})</div>
        {loading ? (
          <div className="p-8 text-center text-[#808080]">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-[#808080]">No API Keys created yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EDEEEF] bg-[#FAFBFC]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Balance</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#808080] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(key => (
                <tr key={key.id} className="border-b border-[#EDEEEF] hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3 text-sm text-[#191919] font-medium">{key.key_name}</td>
                  <td className="px-4 py-3 text-sm text-[#667085]">₹{Number(key.balance || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRevoke(key.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function WalletTab({ keys, handleTopup }) {
  const [amount, setAmount] = useState('500');
  const [selectedKey, setSelectedKey] = useState('');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#EDEEEF] bg-white p-6">
        <h2 className="font-syne text-sm font-semibold text-[#191919] mb-4">Add Credits (B2B Wallet)</h2>
        <div className="grid gap-4 max-w-lg">
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className="w-full p-2.5 rounded-lg border border-[#EDEEEF]">
            <option value="">Select an API Key</option>
            {keys.map(k => <option key={k.id} value={k.id}>{k.key_name} (Bal: ₹{Number(k.balance).toFixed(2)})</option>)}
          </select>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 rounded-lg border border-[#EDEEEF]" />
          <button onClick={() => handleTopup(selectedKey, amount)} className="w-full bg-[#7A5AF8] text-white p-2.5 rounded-lg font-medium">Top Up via Razorpay</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function APIKeysPage() {
  const [activeTab, setActiveTab] = useState('keys');
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getApiKeys();
    setKeys(data.keys || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateKey = async () => {
    setCreating(true);
    await createApiKey({ keyName });
    await loadData();
    setCreating(false);
  };

  const handleRevoke = async (id) => {
    await deleteApiKey(id);
    await loadData();
  };

  const loadRazorpay = () => new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    document.body.appendChild(script);
  });

  const handleTopup = async (keyId, amount) => {
    if (!keyId || !amount) return toast.error('Select key and amount');
    const orderData = await createWalletTopupOrder(keyId, amount);
    const Rzp = await loadRazorpay();
    const rzp = new Rzp({
      key: orderData.razorpay_key_id,
      amount: orderData.amount,
      currency: 'INR',
      name: 'Arena',
      description: `Wallet top-up for ${orderData.key_name}`,
      order_id: orderData.razorpay_order_id,
      handler: async (resp) => {
        await verifyWalletTopup({ keyId, ...resp });
        toast.success('Wallet topped up');
        loadData();
      }
    });
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="font-syne text-2xl font-bold">Developer Portal</h1>
        <div className="flex gap-2">
          <TabButton active={activeTab === 'keys'} onClick={() => setActiveTab('keys')} label="API Keys" icon={Key} />
          <TabButton active={activeTab === 'credits'} onClick={() => setActiveTab('credits')} label="Credits & Plans" icon={CreditCard} />
          <TabButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} label="Wallet" icon={Wallet} />
        </div>
        
        {activeTab === 'keys' && <APIKeysTab keys={keys} loading={loading} handleCreateKey={handleCreateKey} handleRevoke={handleRevoke} creating={creating} keyName={keyName} setKeyName={setKeyName} />}
        {activeTab === 'wallet' && <WalletTab keys={keys} handleTopup={handleTopup} />}
        {activeTab === 'credits' && <div className="text-gray-500 p-8">B2C Credits & Plans Content (Coming Soon/Adapt from Upgrade.jsx)</div>}
      </div>
    </div>
  );
}
