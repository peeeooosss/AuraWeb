import { json, jsonError, corsHeaders, requireAuth, supabaseHeaders } from '../../../_auth';

export const onRequestPost = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const keyId = body.key_id;
  const amount = Number(body.amount);
  if (!keyId) return jsonError('key_id is required', 400);
  if (!amount || amount < 1) return jsonError('amount must be at least ₹1', 400);

  try {
    const auth = await requireAuth(request, env);
    // Only Supabase-authenticated users can top up; API keys cannot top themselves up.
    if (auth.apiKey) {
      return jsonError('Use your account token to top up a wallet', 403);
    }

    const url = env.VITE_SUPABASE_URL;
    const res = await fetch(
      `${url}/rest/v1/api_keys?id=eq.${keyId}&user_id=eq.${auth.userId}&select=balance`,
      { headers: supabaseHeaders(env, true) }
    );
    const rows = await res.json();
    if (!rows || rows.length === 0) return jsonError('Key not found', 404);

    const current = Number(rows[0].balance || 0);
    const patchRes = await fetch(`${url}/rest/v1/api_keys?id=eq.${keyId}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({ balance: current + amount }),
    });
    if (!patchRes.ok) {
      const text = await patchRes.text().catch(() => 'Failed to update balance');
      throw new Error(text);
    }

    return json({ success: true, amount, key_id: keyId });
  } catch (err) {
    return jsonError(err.message, err.message.includes('required') || err.message.includes('Invalid') ? 401 : 500);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (context.request.method === 'POST') return onRequestPost(context);
  return jsonError('Method not allowed', 405);
};
