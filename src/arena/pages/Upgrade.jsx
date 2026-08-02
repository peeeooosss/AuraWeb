import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Sparkles, Zap, ChevronDown, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken } from '../lib/auth';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start exploring — no card needed',
    price: 0,
    period: '',
    credits: 50,
    creditsPeriod: '50 credits (no rollover)',
    icon: <Zap size={20} />,
    iconClass: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    features: [
      '50 credits to start',
      'All core templates',
      'Basic outline generation',
      'PPTX download',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For students & side-projects',
    price: 149,
    period: 'one-time',
    credits: 300,
    creditsPeriod: '300 credits (3-month rollover)',
    icon: <CreditCard size={20} />,
    iconClass: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    features: [
      '300 credits',
      'Credits roll over for 3 months',
      'All core templates',
      'Faster generation',
      'PPTX + PDF download',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For creators and freelancers',
    price: 299,
    period: 'one-time',
    credits: 900,
    creditsPeriod: '900 credits (6-month rollover)',
    icon: <Sparkles size={20} />,
    iconClass: 'bg-[#F3F0FF] text-[#7A5AF8] border-[#DDD9F8]',
    popular: true,
    features: [
      '900 credits',
      'Credits roll over for 6 months',
      'All core templates',
      'Priority generation queue',
      'PPTX + PDF download',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For professional creators',
    price: 799,
    period: 'one-time',
    credits: 3000,
    creditsPeriod: '3000 credits (12-month rollover)',
    icon: <Crown size={20} />,
    iconClass: 'bg-amber-50 text-amber-600 border-amber-200',
    features: [
      '3000 credits',
      'Credits roll over for 12 months',
      'All core templates',
      'Priority generation queue',
      'Early access features',
    ],
  },
];

const FAQ = [
  {
    q: 'How are credits used?',
    a: 'Each presentation costs 10-20 credits depending on complexity (slides, images, model used). Premium themes add a small bonus cost.',
  },
  {
    q: 'Do credits expire?',
    a: 'Free tier credits do not roll over. Paid plan credits roll over for 3, 6, or 12 months depending on your plan (Basic, Growth, or Pro), using FIFO expiration.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes! Purchase any plan at any time. Your new credits are added to your existing balance.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We support UPI, credit/debit cards, net banking, and wallets through RazorPay — India\'s most trusted payment gateway.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'These are one-time purchases, so there is nothing to cancel. Credits remain valid for the stated rollover period.',
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[#EDEEEF] bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-[#191919] pr-4">{item.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#98A2B3] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-[#667085] leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Failed to load Razorpay')));
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

export default function Upgrade() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch('/api/v1/limits', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.plan || 'free');
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSubscribe = async (plan) => {
    setProcessing(plan.id);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');

      const orderRes = await fetch('/api/v1/billing/create-plan-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: plan.id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.detail || 'Failed to create order');

      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Arena',
        description: `${plan.name} plan — ${plan.credits} credits for ₹${plan.price}`,
        order_id: orderData.razorpay_order_id,
        prefill: { email: 'user@example.com' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/v1/billing/verify-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                plan: plan.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.detail || 'Payment verification failed');
            setCurrentPlan(plan.id);
            toast.success(`${plan.name} plan activated! ${plan.credits} credits added.`);
          } catch (err) {
            toast.error(err.message);
          }
        },
        modal: {
          ondismiss: () => setProcessing(null),
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message);
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-5 lg:p-8 pb-24 lg:pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-xl hover:bg-[#F8F8FA] text-[#667085] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-syne text-2xl font-bold text-[#101323]">Choose Your Plan</h1>
          <p className="text-sm text-[#667085] mt-0.5">One-time purchases with credit rollover</p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 flex flex-col transition-shadow ${
                plan.popular
                  ? 'border-[#7A5AF8] bg-[linear-gradient(180deg,#FAFAFF_0%,#F3F0FF_100%)] shadow-[0_8px_22px_rgba(81,70,229,0.12)]'
                  : 'border-[#EDEEEF] bg-white hover:border-[#CFC7FF]'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#7A5AF8] text-white">
                  Most Popular
                </span>
              )}

              <div className={`w-10 h-10 rounded-xl ${plan.iconClass} border flex items-center justify-center mb-4`}>
                {plan.icon}
              </div>
              <h3 className="font-syne text-lg font-bold text-[#101323]">{plan.name}</h3>
              <p className="text-xs text-[#98A2B3] mb-3">{plan.tagline}</p>

              <div className="mb-4">
                {plan.price === 0 ? (
                  <span className="font-syne text-3xl font-bold text-[#101323]">Free</span>
                ) : (
                  <span className="font-syne text-3xl font-bold text-[#101323]">
                    ₹{plan.price}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 mb-4 text-xs text-[#98A2B3]">
                <CreditCard size={12} />
                <span>{plan.creditsPeriod}</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#475467]">
                    <Check size={14} className="shrink-0 mt-0.5 text-[#7A5AF8]" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="w-full py-2.5 rounded-full text-sm font-semibold bg-[#F3F0FF] text-[#7A5AF8] cursor-default">
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processing !== null}
                  className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors hover:opacity-90 disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-[#7A5AF8] text-white'
                      : 'bg-[#101323] text-white'
                  }`}
                >
                  {processing === plan.id ? 'Processing...' : plan.price === 0 ? 'Free' : `Get ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="font-syne text-lg font-semibold text-[#101323]">How Credits Work</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <FAQItem key={item.q} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
