import {
  json,
  jsonError,
  corsHeaders,
  requireAuth,
  getUserApiKeys,
  createApiKey,
} from '../../../_auth';

export const onRequestGet = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const auth = await requireAuth(request, env);
    const keys = await getUserApiKeys(auth.userId, env);
    return json({ keys });
  } catch (err) {
    return jsonError(err.message, 401);
  }
};

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
  try {
    const auth = await requireAuth(request, env);
    const { key, record } = await createApiKey(
      {
        userId: auth.userId,
        keyName: String(body.keyName || 'API Key'),
        plan: String(body.plan || 'starter'),
        rateLimit: body.rateLimit,
      },
      env
    );
    return json({ key, id: record.id, prefix: record.key_prefix });
  } catch (err) {
    return jsonError(err.message, err.message.includes('required') ? 401 : 500);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return jsonError('Method not allowed', 405);
};
