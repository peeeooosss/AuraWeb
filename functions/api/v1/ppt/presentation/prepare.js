import { json, jsonError, nowIso, getPresentation, savePresentation } from '../../../../_lib';
import { requireUser } from '../../../../_auth';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const presentationId = body.presentation_id || body.id;
  if (!presentationId) return jsonError('presentation_id is required', 400);

  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const pres = await getPresentation(env, user.id, presentationId);
  if (!pres) return jsonError('Presentation not found', 404);

  const slides = Array.isArray(body.outlines) ? body.outlines : pres.outlines?.slides || [];
  const title = slides.find((s) => s && s.title)?.title || pres.title || 'Untitled';

  pres.outlines = { title, slides: slides.map((s) => ({ title: s.title || '', content: s.content || '' })) };
  pres.title = title;
  pres.n_slides = Math.max(1, slides.length);
  if (body.layout) pres.template = body.layout;
  pres.status = 'preparing';
  pres.updated_at = nowIso();

  await savePresentation(env, user.id, pres);
  return json({ id: pres.id, status: pres.status, title: pres.title, n_slides: pres.n_slides });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
