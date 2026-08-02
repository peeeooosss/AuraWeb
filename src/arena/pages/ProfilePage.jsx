import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Edit3, Shield, Bell, Crown, CreditCard, Check } from 'lucide-react';
import { supabase, getAccessToken } from '../lib/auth';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data?.session?.user;
      if (u) {
        setEmail(u.email || '');
        setName(u.user_metadata?.full_name || u.user_metadata?.name || '');
      }
      const token = await getAccessToken();
      if (token) {
        const r = await fetch('/api/v1/limits', { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) setCredits(await r.json());
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      });
      if (error) throw error;
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl hover:bg-[#F8F8FA] text-[#667085] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="19 12H5"></polyline><polyline points="12 19l-7-7"></polyline><polyline points="12 5v14"></polyline></svg>
        </button>
        <h1 className="font-syne text-2xl font-bold text-[#101323]">Profile</h1>
      </div>

      <div className="rounded-2xl border border-[#EDEEEF] bg-white p-8 space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[#F3F0FF] flex items-center justify-center">
            <span className="font-syne font-bold text-2xl text-[#7A5AF8]">
              {email?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="font-syne text-lg font-bold text-[#191919]">{name || email}</h2>
            <p className="text-sm text-[#808080]">{email}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
          <h3 className="font-syne text-sm font-semibold text-[#191919]">Display Name</h3>
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
        </div>

        <div className="rounded-xl border border-[#EDEEEF] bg-white p-6 space-y-4">
          <h3 className="font-syne text-sm font-semibold text-[#191919]">Email</h3>
          <p className="text-sm text-[#667085]">{email}</p>
          <p className="text-xs text-[#808080]">Email changes require verification. Contact support to update.</p>
        </div>

        {credits && (
          <div className="rounded-xl border border-[#EDEEEF] bg-[#F3F0FF] p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-[#7A5AF8]" />
              <h3 className="font-syne text-sm font-semibold text-[#191919]">{credits.planName || 'Free'} Plan</h3>
            </div>
            <p className="text-xs text-[#667085]">
              {credits.unlimited
                ? 'Unlimited credits'
                : `${credits.creditsBalance || 0} credits remaining`}
            </p>
            <Link to="/plans" className="text-xs text-[#7A5AF8] hover:underline">
              Manage plan &amp; credits
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
