import { json, jsonError } from '../../../../_lib';
import { requireAuth, corsHeaders, supabaseHeaders } from '../../../../_auth';

export const onRequestGet = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const auth = await requireAuth(request, env);
    const url = new URL(request.url);
    const apiKeyId = url.searchParams.get('api_key_id') || '';
    const days = Math.min(Number(url.searchParams.get('days')) || 30, 90);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);

    const supabaseUrl = env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return jsonError('Supabase not configured', 500);

    const since = new Date(Date.now() - days * 24 * 3600000).toISOString();
    let filter = `user_id=eq.${auth.userId}&created_at=gte.${since}`;
    if (apiKeyId) filter += `&api_key_id=eq.${encodeURIComponent(apiKeyId)}`;

    const select = 'id,api_key_id,endpoint,cost,input_tokens,output_tokens,model_routed,created_at';

    const res = await fetch(
      `${supabaseUrl}/rest/v1/usage_logs?${filter}&select=${encodeURIComponent(select)}&limit=${limit}&order=created_at.desc`,
      { headers: supabaseHeaders(env, true) }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return jsonError(`Failed to load usage: ${text.slice(0, 100)}`, res.status);
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) return json({ logs: [] });

    // Resolve API key names in a single batch
    const keyIds = [...new Set(rows.map((r) => r.api_key_id).filter(Boolean))];
    const keyNames = {};
    if (keyIds.length > 0) {
      const idsFilter = keyIds.map((id) => `id=eq.${id}`).join('&or=');
      try {
        const keysRes = await fetch(
          `${supabaseUrl}/rest/v1/api_keys?or=(${idsFilter})&select=id,key_name`,
          { headers: supabaseHeaders(env, true) }
        );
        const keysData = await keysRes.json();
        if (Array.isArray(keysData)) {
          for (const k of keysData) keyNames[k.id] = k.key_name;
        }
      } catch { /* non-critical */ }
    }

    const logs = rows.map((r) => ({
      id: r.id,
      api_key_id: r.api_key_id,
      api_key_name: keyNames[r.api_key_id] || null,
      endpoint: r.endpoint || '',
      cost: Number(r.cost || 0),
      input_tokens: Number(r.input_tokens || 0),
      output_tokens: Number(r.output_tokens || 0),
      model_routed: r.model_routed || null,
      created_at: r.created_at,
    }));

    return json({ logs });
  } catch (err) {
    return jsonError(err.message, 401);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  return onRequestGet(context);
};