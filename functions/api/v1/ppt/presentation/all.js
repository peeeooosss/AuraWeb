import { json, jsonError } from '../../../../_lib';
import { requireUser } from '../../../../_auth';
import { listPresentations } from '../../../../_lib';

export const onRequestGet = async ({ env, request }) => {
  try {
    const user = await requireUser(request, env);
    const items = await listPresentations(env, user.id);
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
