import { supabaseHeaders } from './_auth';
import { listPresentations } from './_lib';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    pptLimit: 3,
    pptPeriod: 'month',
    apiDaily: 50,
    apiMonthly: 100,
    description: 'Start free — no card needed',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 199,
    pptLimit: 20,
    pptPeriod: 'month',
    apiDaily: 100,
    apiMonthly: 1000,
    description: 'For serious students',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 399,
    pptLimit: 100,
    pptPeriod: 'month',
    apiDaily: 300,
    apiMonthly: 5000,
    description: 'For power creators',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 999,
    pptLimit: Infinity,
    pptPeriod: 'month',
    apiDaily: 1000,
    apiMonthly: 50000,
    description: 'Unlimited PPTs',
  },
};

export function isUnlimited(plan) {
  return plan.pptLimit === Infinity;
}

export async function getUserPlan(userId, env) {
  const url = env?.VITE_SUPABASE_URL;
  if (!url) return PLANS.free;
  try {
    const res = await fetch(
      `${url}/rest/v1/user_plans?user_id=eq.${userId}&select=plan,status,valid_until&order=created_at.desc&limit=1`,
      { headers: supabaseHeaders(env, true) }
    );
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || row.status !== 'active') return PLANS.free;
    if (row.valid_until && new Date(row.valid_until) < new Date()) return PLANS.free;
    return PLANS[row.plan] || PLANS.free;
  } catch {
    return PLANS.free;
  }
}

export async function getMonthPptCount(userId, env) {
  const pres = await listPresentations(env, userId);
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return pres.filter((p) => p.created_at && new Date(p.created_at) >= start).length;
}

export async function getPptQuota(userId, env) {
  const plan = await getUserPlan(userId, env);
  const used = await getMonthPptCount(userId, env);
  const remaining = isUnlimited(plan) ? Infinity : Math.max(0, plan.pptLimit - used);
  return { plan, used, remaining, unlimited: isUnlimited(plan) };
}

export async function assertPptAllowed(userId, env) {
  const quota = await getPptQuota(userId, env);
  if (quota.unlimited || quota.used < quota.plan.pptLimit) return quota;
  const err = new Error('Monthly PPT limit reached. Upgrade your plan to continue.');
  err.status = 403;
  err.code = 'PPT_LIMIT_REACHED';
  err.quota = quota;
  throw err;
}
