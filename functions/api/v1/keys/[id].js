import { json, jsonError, corsHeaders, requireAuth, requireUser, supabaseHeaders, revokeApiKey } from '../../../_auth';

export const onRequestDelete = async ({ request, params, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const auth = await requireAuth(request, env);
    const ok = await revokeApiKey(params.id, auth.userId, env);
    if (!ok) return jsonError('Key not found', 404);
    return json({ success: true });
  } catch (err) {
    return jsonError(err.message, 401);
  }
};

export const onRequestPatch = async ({ request, params, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const user = await requireUser(request, env);
    const body = await request.json().catch(() => ({}));
    const { key_name, active, rate_limit } = body;

    const patch = {};
    if (key_name !== undefined) patch.key_name = String(key_name);
    if (active !== undefined) patch.active = !!active;
    if (rate_limit !== undefined) patch.rate_limit = Number(rate_limit);

    if (Object.keys(patch).length === 0) return jsonError('No fields to update', 400);

    const url = env.VITE_SUPABASE_URL;
    const res = await fetch(
      `${url}/rest/v1/api_keys?id=eq.${encodeURIComponent(params.id)}&user_id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders(env, true), Prefer: 'return=representation' },
        body: JSON.stringify(patch),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return jsonError(`Failed to update key: ${text.slice(0, 100)}`, res.status);
    }
    const rows = await res.json();
    if (!rows || rows.length === 0) return jsonError('Key not found', 404);
    return json({ success: true, key: rows[0] });
  } catch (err) {
    return jsonError(err.message, 401);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  if (context.request.method === 'PATCH') return onRequestPatch(context);
  return jsonError('Method not allowed', 405);
};
