import { json, jsonError, genId, nowIso, clamp } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';

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
    web_search: !!body.web_search,
    include_title_slide: body.include_title_slide !== false,
    include_table_of_contents: !!body.include_table_of_contents,
    status: 'created',
    created_at: nowIso(),
    updated_at: nowIso(),
    outlines: null,
    slides: [],
  };

  await env.ARENA_KV.put(`pres:${user.id}:${id}`, JSON.stringify(pres));
  return json({ ...pres }, 201);
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};