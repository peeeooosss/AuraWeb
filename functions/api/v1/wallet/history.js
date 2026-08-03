import { json, jsonError } from '../../../_lib';
import { requireUser, supabaseHeaders } from '../../../_auth';

export const onRequestGet = async ({ request, env }) => {
  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const url = env.VITE_SUPABASE_URL;
  try {
    const res = await fetch(
      `${url}/rest/v1/wallet_topups?user_id=eq.${user.id}&select=*,api_key:api_keys(key_name,key_prefix)&order=created_at.desc&limit=50`,
      { headers: supabaseHeaders(env, true) }
    );
    const rows = await res.json();
    return json({ topups: Array.isArray(rows) ? rows : [] });
  } catch (err) {
    return jsonError(err.message, 500);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (context.request.method === 'GET') return onRequestGet(context);
  return jsonError('Method not allowed', 405);
};
