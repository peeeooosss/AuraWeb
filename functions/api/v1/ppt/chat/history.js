import { json, jsonError, getPresentation } from '../../../../_lib';
import { requireUser } from '../../../../_auth';

export const onRequestGet = async ({ request, env }) => {
  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const url = new URL(request.url);
  const presentationId = url.searchParams.get('presentation_id');
  if (!presentationId) return jsonError('presentation_id is required', 400);

  const pres = await getPresentation(env, user.id, presentationId);
  if (!pres) return jsonError('Presentation not found', 404);

  return json({
    presentation_id: presentationId,
    history: Array.isArray(pres.chat_history) ? pres.chat_history : [],
  });
};

export const onRequestDelete = async ({ request, env }) => {
  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const url = new URL(request.url);
  const presentationId = url.searchParams.get('presentation_id');
  if (!presentationId) return jsonError('presentation_id is required', 400);

  const pres = await getPresentation(env, user.id, presentationId);
  if (!pres) return jsonError('Presentation not found', 404);

  pres.chat_history = [];
  await env.ARENA_KV.put(`pres:${user.id}:${presentationId}`, JSON.stringify(pres));
  return json({ ok: true });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  return onRequestGet(context);
};
