import { json, jsonError, getPresentation, savePresentation, deletePresentation, clamp } from '../../../../../_lib';
import { requireAuth } from '../../../../../_auth';

export const onRequestGet = async ({ params, env, request }) => {
  try {
    const auth = await requireAuth(request, env);
    const pres = await getPresentation(env, auth.userId, params.id);
    if (!pres) return jsonError('Presentation not found', 404);
    return json(pres);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequestDelete = async ({ params, env, request }) => {
  try {
    const auth = await requireAuth(request, env);
    const pres = await getPresentation(env, auth.userId, params.id);
    if (!pres) return jsonError('Presentation not found', 404);
    await deletePresentation(env, auth.userId, params.id);
    return json({ id: params.id, deleted: true });
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequestPatch = async ({ request, params, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  try {
    const auth = await requireAuth(request, env);
    const pres = await getPresentation(env, auth.userId, params.id);
    if (!pres) return jsonError('Presentation not found', 404);

    if (body.content !== undefined) pres.content = body.content;
    if (body.n_slides !== undefined) pres.n_slides = clamp(Number(body.n_slides), 1, 40);
    if (body.language !== undefined) pres.language = body.language;
    if (body.template !== undefined) pres.template = body.template;
    if (body.tone !== undefined) pres.tone = body.tone;
    if (body.verbosity !== undefined) pres.verbosity = body.verbosity;
    if (body.instructions !== undefined) pres.instructions = String(body.instructions || '');
    if (body.web_search !== undefined) pres.web_search = !!body.web_search;
    if (body.include_title_slide !== undefined) pres.include_title_slide = !!body.include_title_slide;
    if (body.include_table_of_contents !== undefined) pres.include_table_of_contents = !!body.include_table_of_contents;

    pres.updated_at = new Date().toISOString();
    await savePresentation(env, auth.userId, pres);
    return json(pres);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'PATCH') return onRequestPatch(context);
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  return jsonError('Method not allowed', 405);
};