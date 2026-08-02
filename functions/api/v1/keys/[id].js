import { json, jsonError, corsHeaders, requireAuth, revokeApiKey } from '../../../_auth';

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

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  return jsonError('Method not allowed', 405);
};
