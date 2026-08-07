import { json, jsonError } from '../../../../_lib';
import { requireAuth } from '../../../../_auth';
import { listPresentations } from '../../../../_lib';

export const onRequestGet = async ({ env, request }) => {
  try {
    const auth = await requireAuth(request, env);
    const items = await listPresentations(env, auth.userId);
    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return json(items);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestGet(context);
};