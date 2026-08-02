import { json, jsonError, corsHeaders, requireAuth, getUsageSummary } from '../../_auth';

export const onRequestGet = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const auth = await requireAuth(request, env);
    const url = new URL(request.url);
    const days = Math.min(parseInt(url.searchParams.get('days') || '30', 10), 90);
    const summary = await getUsageSummary(auth.userId, env, days);
    return json(summary);
  } catch (err) {
    return jsonError(err.message, 401);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (context.request.method === 'GET') return onRequestGet(context);
  return jsonError('Method not allowed', 405);
};
