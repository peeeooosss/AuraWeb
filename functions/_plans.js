import { supabaseHeaders } from './_auth';
import { listPresentations } from './_lib';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 50,
    rolloverMonths: 0,
    apiDaily: 50,
    apiMonthly: 100,
    description: 'Start free — no card needed',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 149,
    credits: 300,
    rolloverMonths: 3,
    apiDaily: 100,
    apiMonthly: 1000,
    description: 'For serious students',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 299,
    credits: 900,
    rolloverMonths: 6,
    apiDaily: 300,
    apiMonthly: 5000,
    description: 'For power creators',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 799,
    credits: 3000,
    rolloverMonths: 12,
    apiDaily: 1000,
    apiMonthly: 50000,
    description: 'Unlimited PPTs',
  },
};

export function isUnlimited(plan) {
  return plan.credits === Infinity;
}

export const MODEL_MULTIPLIER = {
  'claude-haiku': 1,
  'claude-sonnet-5': 1.5,
  'claude-sonnet-5-reasoning': 2,
};

export const CREDIT_COST = {
  perSlide: 1,
  perImage: 1,
  premiumTheme: 3,
};

export const OUTLINE_CREDIT_COST = 2;
export const SLIDES_MIN_CREDITS = 15;
export const SLIDES_MAX_CREDITS = 20;

export function calculateCredits(data) {
  const {
    n_slides = 8,
    images = 0,
    theme = 'general',
    model = 'claude-sonnet-5',
  } = data;

  let credits = 0;
  credits += (n_slides || 8) * CREDIT_COST.perSlide;
  credits += (images || 0) * CREDIT_COST.perImage;
  if (theme !== 'general' && theme !== 'standard') {
    credits += CREDIT_COST.premiumTheme;
  }
  const mult = MODEL_MULTIPLIER[model] || MODEL_MULTIPLIER['claude-sonnet-5'];
  credits = Math.ceil(credits * mult);
  return Math.max(10, Math.min(20, credits));
}

export function calculateSlidesCredits(nSlides) {
  const credits = Math.ceil((nSlides || 8) * CREDIT_COST.perSlide * (MODEL_MULTIPLIER['claude-sonnet-5'] || 1));
  return Math.max(SLIDES_MIN_CREDITS, Math.min(SLIDES_MAX_CREDITS, credits));
}

export async function getUserPlan(userId, env) {
  const url = env?.VITE_SUPABASE_URL;
  if (!url) return PLANS.free;
  try {
    const res = await fetch(
      `${url}/rest/v1/user_plans?user_id=eq.${userId}&select=plan,status,valid_until,credits_balance,credits_granted_at,rollover_months&order=created_at.desc&limit=1`,
      { headers: supabaseHeaders(env, true) }
    );
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || row.status !== 'active') return PLANS.free;
    if (row.valid_until && new Date(row.valid_until) < new Date()) return PLANS.free;
    const planDef = PLANS[row.plan] || PLANS.free;
    return {
      ...planDef,
      creditsBalance: row.credits_balance ?? planDef.credits,
      creditsGrantedAt: row.credits_granted_at,
      rolloverMonths: row.rollover_months ?? planDef.rolloverMonths,
    };
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

export async function getCreditsStatus(userId, env) {
  const plan = await getUserPlan(userId, env);
  const used = await getMonthPptCount(userId, env);
  let balance = plan.creditsBalance ?? plan.credits;
  let rolloverExpiry = null;

  if (plan.rolloverMonths > 0 && plan.creditsGrantedAt) {
    const granted = new Date(plan.creditsGrantedAt);
    const expiry = new Date(granted);
    expiry.setMonth(expiry.getMonth() + plan.rolloverMonths);
    if (expiry > new Date()) {
      rolloverExpiry = expiry.toISOString();
    } else {
      balance = plan.credits;
    }
  }

  return {
    plan: plan.id,
    planName: plan.name,
    creditsLimit: plan.credits,
    creditsBalance: balance,
    unlimited: isUnlimited(plan),
    usedThisMonth: used,
    rolloverExpiry,
    apiDaily: plan.apiDaily,
  };
}

export async function assertCreditsAllowed(userId, env, requiredCredits) {
  const status = await getCreditsStatus(userId, env);
  if (status.unlimited) return { ok: true, status, remaining: Infinity };
  if (status.creditsBalance >= requiredCredits) {
    return { ok: true, status, remaining: status.creditsBalance - requiredCredits };
  }
  const err = new Error(`Insufficient credits. Need ${requiredCredits}, have ${status.creditsBalance}. Upgrade your plan.`);
  err.status = 403;
  err.code = 'CREDITS_INSUFFICIENT';
  err.required = requiredCredits;
  err.available = status.creditsBalance;
  throw err;
}

export async function deductCredits(userId, credits, env) {
  const url = env?.VITE_SUPABASE_URL;
  if (!url) return;

  // Primary path: RPC. Only trust it if it actually returns a numeric new balance.
  // (A 204/empty/no-op response means the function is missing/stubbed — fall through.)
  let rpcApplied = false;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/deduct_credits`, {
      method: 'POST',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({ p_user_id: userId, p_credits: credits }),
    });
    if (res.ok) {
      const body = await res.text().catch(() => '');
      const trimmed = body.trim();
      if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
        rpcApplied = true;
      } else {
        console.error('deductCredits RPC returned no numeric balance:', res.status, JSON.stringify(body));
      }
    } else {
      console.error('deductCredits RPC failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.error('deductCredits RPC error:', e.message);
  }
  if (rpcApplied) return;

  // Fallback: direct upsert / decrement on user_plans (reliable regardless of RPC).
  try {
    const existing = await fetch(`${url}/rest/v1/user_plans?user_id=eq.${userId}&select=user_id`, {
      headers: supabaseHeaders(env, true),
    });
    const existingData = await existing.json().catch(() => []);
    const rows = Array.isArray(existingData) ? existingData : [];
    if (rows.length === 0) {
      await fetch(`${url}/rest/v1/user_plans`, {
        method: 'POST',
        headers: supabaseHeaders(env, true),
        body: JSON.stringify({
          user_id: userId,
          plan: 'free',
          status: 'active',
          credits_balance: Math.max((PLANS.free.credits || 50) - credits, 0),
          updated_at: new Date().toISOString(),
        }),
      });
      return;
    }
    const patchRes = await fetch(`${url}/rest/v1/user_plans?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({
        credits_balance: { decrement: credits },
        updated_at: new Date().toISOString(),
      }),
    });
    if (!patchRes.ok) {
      console.error('deductCredits PATCH fallback failed:', patchRes.status, await patchRes.text().catch(() => ''));
    }
  } catch (e) {
    console.error('deductCredits PATCH fallback error:', e.message);
  }
}

export async function grantPlanCredits(userId, planId, env) {
  const url = env?.VITE_SUPABASE_URL;
  const plan = PLANS[planId] || PLANS.free;
  if (!url || plan.credits === Infinity) return;
  try {
    const now = new Date().toISOString();
    const res = await fetch(`${url}/rest/v1/user_plans?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({
        credits_balance: plan.credits,
        credits_granted_at: now,
        rollover_months: plan.rolloverMonths,
        updated_at: now,
      }),
    });
    if (res.status === 404) {
      await fetch(`${url}/rest/v1/user_plans`, {
        method: 'POST',
        headers: supabaseHeaders(env, true),
        body: JSON.stringify({
          user_id: userId,
          plan: planId,
          status: 'active',
          valid_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          credits_balance: plan.credits,
          credits_granted_at: now,
          rollover_months: plan.rolloverMonths,
        }),
      });
    }
  } catch (e) {
    console.error('grantPlanCredits error:', e.message);
  }
}