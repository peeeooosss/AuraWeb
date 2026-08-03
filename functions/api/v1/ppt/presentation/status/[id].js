import { json, jsonError } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';

export const onRequestGet = async ({ params, env, request }) => {
  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const taskId = params.id;
  try {
    const raw = await env.ARENA_KV.get(`task:${user.id}:${taskId}`);
    if (!raw) return jsonError('Task not found', 404);
    return json(JSON.parse(raw));
  } catch {
    return jsonError('Task not found', 404);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204 });
  return onRequestGet(context);
};
