import { json, jsonError, nowIso, genId, clamp } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try { body = await request.json(); } catch {}

  const content = String(body.content || '').trim();
  if (!content) return jsonError('content is required', 400);

  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const id = genId();
  const task = {
    id,
    type: 'presentation_generation',
    user_id: user.id,
    status: 'pending',
    progress: 0,
    content,
    n_slides: clamp(Number(body.n_slides) || 8, 1, 40),
    language: body.language || 'English',
    template: body.template || 'general',
    tone: body.tone || 'default',
    verbosity: body.verbosity || 'standard',
    instructions: String(body.instructions || ''),
    web_search: !!body.web_search,
    created_at: nowIso(),
    updated_at: nowIso(),
    result: null,
    error: null,
  };

  await env.ARENA_KV.put(`task:${user.id}:${id}`, JSON.stringify(task));
  return json(task, 202);
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204 });
  return onRequestPost(context);
};
