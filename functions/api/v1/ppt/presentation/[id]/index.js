import { json, jsonError, getPresentation, deletePresentation } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';

export const onRequestGet = async ({ params, env, request }) => {
  try {
    const user = await requireUser(request, env);
    const pres = await getPresentation(env, user.id, params.id);
    if (!pres) return jsonError('Presentation not found', 404);
    return json(pres);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequestDelete = async ({ params, env, request }) => {
  try {
    const user = await requireUser(request, env);
    const pres = await getPresentation(env, user.id, params.id);
    if (!pres) return jsonError('Presentation not found', 404);
    await deletePresentation(env, user.id, params.id);
    return json({ id: params.id, deleted: true });
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  return jsonError('Method not allowed', 405);
};
