import { json, jsonError, getPresentation, savePresentation } from '../../../../_lib';
import { requireUser } from '../../../../_auth';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const presentationId = body.presentation_id;
  if (!presentationId) return jsonError('presentation_id is required', 400);

  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const pres = await getPresentation(env, user.id, presentationId);
  if (!pres) return jsonError('Presentation not found', 404);

  const index = Number(body.slide_index) || 0;
  if (!Array.isArray(pres.slides) || !pres.slides[index]) {
    return jsonError('Slide not found', 404);
  }

  const slide = pres.slides[index];
  if (body.title != null) slide.title = String(body.title);
  if (body.content != null) slide.content = String(body.content);
  if (body.elements != null) slide.elements = body.elements;
  slide.updated_at = new Date().toISOString();

  await savePresentation(env, user.id, pres);
  return json({ ok: true, id: pres.id, slide_index: index });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
