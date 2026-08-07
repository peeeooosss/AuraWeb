import { json, jsonError, getPresentation, savePresentation } from '../../../../_lib';
import { requireAuth } from '../../../../_auth';

export const onRequestGet = async ({ params, env, request }) => {
  try {
    const auth = await requireAuth(request, env);
    const pres = await getPresentation(env, auth.userId, params.id);
    if (!pres) return jsonError('Presentation not found', 404);
    return json(pres.outlines || { title: '', slides: [] });
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequestPut = async ({ request, params, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  let auth;
  try {
    auth = await requireAuth(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const pres = await getPresentation(env, auth.userId, params.id);
  if (!pres) return jsonError('Presentation not found', 404);

  const slides = Array.isArray(body.slides)
    ? body.slides.map((s) => ({ title: String(s.title || '').trim(), content: String(s.content || '').trim() }))
    : [];

  const title = String(body.title || slides.find((s) => s.title)?.title || pres.title || 'Untitled').trim();
  pres.outlines = { title, slides };
  pres.title = title;
  pres.n_slides = slides.length;
  pres.status = 'outlined';

  await savePresentation(env, auth.userId, pres);
  return json(pres.outlines);
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'PUT') return onRequestPut(context);
  return jsonError('Method not allowed', 405);
};