import { json, jsonError, genId, nowIso, clamp } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';
import { calculateCredits, assertCreditsAllowed, deductCredits } from '../../../../../_plans';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const content = String(body.content || '').trim();
  if (!content) {
    return jsonError('content is required', 400);
  }

  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const requiredCredits = calculateCredits(body);
  try {
    await assertCreditsAllowed(user.id, env, requiredCredits);
  } catch (err) {
    return jsonError(err.message, err.status || 403, { 'X-Error-Code': err.code || '' });
  }

  const template = body.template || 'general';
  const id = genId();
  const pres = {
    id,
    title: '',
    content,
    n_slides: clamp(Number(body.n_slides) || 8, 1, 40),
    language: body.language || 'English',
    template,
    tone: body.tone || 'default',
    verbosity: body.verbosity || 'standard',
    instructions: String(body.instructions || ''),
    status: 'created',
    created_at: nowIso(),
    updated_at: nowIso(),
    outlines: null,
    slides: [],
  };

  await env.ARENA_KV.put(`pres:${user.id}:${id}`, JSON.stringify(pres));
  await deductCredits(user.id, requiredCredits, env);
  return json({ ...pres, credits_used: requiredCredits }, 201);
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};