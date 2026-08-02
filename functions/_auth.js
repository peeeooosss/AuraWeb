import { computeCost } from './_models';

export const corsHeaders = (origin = '*') => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
});

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(), ...extraHeaders },
  });
}

export function jsonError(message, status = 400, extraHeaders = {}) {
  return json({ error: message }, status, extraHeaders);
}

function supabaseUrl(env) {
  return env?.VITE_SUPABASE_URL || null;
}

export function supabaseHeaders(env, serviceRole = true) {
  const key = serviceRole ? env?.SUPABASE_SERVICE_ROLE_KEY : env?.VITE_SUPABASE_ANON_KEY;
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
  };
}

export function validateApiKeyPrefix(prefix, input) {
  return input && typeof input === 'string' && input.startsWith(`${prefix}_`);
}

export function generateApiKey(prefix = 'aurai_live') {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const key = `${prefix}_${hex}`;
  return { key, prefix: key.slice(0, 16) };
}

export async function hashKey(key) {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function validateSupabaseJWT(token, env) {
  const url = supabaseUrl(env);
  if (!url) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: env.VITE_SUPABASE_ANON_KEY },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function bearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  try {
    const url = new URL(request.url);
    return url.searchParams.get('token') || null;
  } catch {
    return null;
  }
}

export async function requireUser(request, env) {
  const token = bearerToken(request);
  if (!token) throw Object.assign(new Error('Authentication required'), { status: 401 });
  const user = await validateSupabaseJWT(token, env);
  if (!user) throw Object.assign(new Error('Invalid authentication'), { status: 401 });
  return user;
}

export async function validateApiKey(apiKey, env) {
  const url = supabaseUrl(env);
  if (!url) return null;
  try {
    const keyHash = await hashKey(apiKey);
    const res = await fetch(
      `${url}/rest/v1/api_keys?key_hash=eq.${keyHash}&active=eq.true&select=id,user_id,monthly_limit,rate_limit,plan,balance,currency,key_name`,
      { headers: supabaseHeaders(env, true) }
    );
    const rows = await res.json();
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    // Update last_used_at
    await fetch(`${url}/rest/v1/api_keys?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    });
    return {
      id: row.id,
      userId: row.user_id,
      monthlyLimit: row.monthly_limit,
      rateLimit: row.rate_limit,
      plan: row.plan,
      balance: Number(row.balance || 0),
      currency: row.currency || 'INR',
      keyName: row.key_name,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header required');
  }
  const token = authHeader.slice(7);

  if (validateApiKeyPrefix('aurai_live', token)) {
    const keyData = await validateApiKey(token, env);
    if (!keyData) throw new Error('Invalid or revoked API key');
    return { ...keyData, apiKey: token };
  }

  const user = await validateSupabaseJWT(token, env);
  if (!user) throw new Error('Invalid authentication');
  return { userId: user.id, apiKeyId: null, apiKey: null, balance: Infinity, rateLimit: 0, plan: 'user' };
}

export async function checkRateLimit(apiKeyId, userId, rateLimit, env) {
  const url = supabaseUrl(env);
  if (!url) return true;
  try {
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const filter = apiKeyId
      ? `api_key_id=eq.${apiKeyId}&created_at=gte.${since}`
      : `user_id=eq.${userId}&created_at=gte.${since}`;
    const res = await fetch(`${url}/rest/v1/usage_logs?${filter}&select=id`, {
      headers: supabaseHeaders(env, true),
    });
    const rows = await res.json();
    if (!rateLimit) return true; // 0 means unlimited
    return (rows?.length || 0) < rateLimit;
  } catch {
    return true;
  }
}

export async function deductBalance(apiKeyId, cost, env) {
  const url = supabaseUrl(env);
  if (!url || !apiKeyId || cost <= 0) return;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/deduct_balance`, {
      method: 'POST',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({ p_key_id: apiKeyId, p_cost: cost }),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`RPC ${res.status}: ${text}`);
    }
    // Returns new balance as a number, or -1 if insufficient funds
    const newBalance = Number(JSON.parse(text));
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
  } catch (err) {
    console.error('deductBalance error:', err.message);
  }
}

export async function logUsage({ userId, apiKeyId, endpoint, inputTokens, outputTokens, cost, modelRouted }, env) {
  const url = supabaseUrl(env);
  if (!url) return;
  try {
    await fetch(`${url}/rest/v1/usage_logs`, {
      method: 'POST',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({
        user_id: userId,
        api_key_id: apiKeyId || null,
        endpoint,
        input_tokens: inputTokens || 0,
        output_tokens: outputTokens || 0,
        cost: cost || 0,
        model_routed: modelRouted || null,
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-critical
  }
}

export async function getUserApiKeys(userId, env) {
  const url = supabaseUrl(env);
  if (!url) return [];
  const res = await fetch(
    `${url}/rest/v1/api_keys?user_id=eq.${userId}&select=id,key_name,key_prefix,monthly_limit,rate_limit,plan,balance,currency,created_at,last_used_at,active&order=created_at.desc`,
    { headers: supabaseHeaders(env, true) }
  );
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

export async function createApiKey({ userId, keyName, plan, rateLimit }, env) {
  const url = supabaseUrl(env);
  if (!url) throw new Error('Supabase not configured');
  const { key, prefix } = generateApiKey('aurai_live');
  const keyHash = await hashKey(key);
  const plans = {
    starter: { monthly_limit: 100, rate_limit: 50 },
    growth: { monthly_limit: 1000, rate_limit: 200 },
    enterprise: { monthly_limit: 100000, rate_limit: 0 },
  };
  const tier = plans[plan] || plans.starter;

  const res = await fetch(`${url}/rest/v1/api_keys`, {
    method: 'POST',
    headers: supabaseHeaders(env, true),
    body: JSON.stringify({
      user_id: userId,
      key_name: keyName,
      key_hash: keyHash,
      key_prefix: prefix,
      plan: plan || 'starter',
      monthly_limit: tier.monthly_limit,
      rate_limit: rateLimit != null ? rateLimit : tier.rate_limit,
      balance: 0,
      active: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Failed to create key');
    throw new Error(text);
  }
  const bodyText = await res.text().catch(() => '');
  let record;
  try {
    const rows = JSON.parse(bodyText);
    record = Array.isArray(rows) ? rows[0] : rows;
  } catch {
    record = { id: null, key_prefix: prefix };
  }
  return { key, record };
}

export async function revokeApiKey(keyId, userId, env) {
  const url = supabaseUrl(env);
  if (!url) throw new Error('Supabase not configured');
  const res = await fetch(`${url}/rest/v1/api_keys?id=eq.${keyId}&user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: supabaseHeaders(env, true),
  });
  return res.ok;
}

export async function getUsageSummary(userId, env, days = 30) {
  const url = supabaseUrl(env);
  if (!url) return { total: 0, thisMonth: 0, today: 0, cost: 0, tokens: { input: 0, output: 0 } };
  const since = new Date(Date.now() - days * 24 * 3600000).toISOString();
  const res = await fetch(
    `${url}/rest/v1/usage_logs?user_id=eq.${userId}&created_at=gte.${since}&select=input_tokens,output_tokens,cost,created_at`,
    { headers: supabaseHeaders(env, true) }
  );
  const rows = await res.json();
  if (!Array.isArray(rows)) return { total: 0, thisMonth: 0, today: 0, cost: 0, tokens: { input: 0, output: 0 } };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return rows.reduce(
    (acc, row) => {
      const created = new Date(row.created_at);
      acc.tokens.input += row.input_tokens || 0;
      acc.tokens.output += row.output_tokens || 0;
      acc.cost += Number(row.cost || 0);
      if (created >= startOfMonth) acc.thisMonth += 1;
      if (created >= startOfDay) acc.today += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, thisMonth: 0, today: 0, cost: 0, tokens: { input: 0, output: 0 } }
  );
}
