import { json, jsonError, nowIso, genId } from '../../../_lib';
import { requireUser } from '../../../_auth';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try { body = await request.json(); } catch {}

  const url = String(body.url || '').trim();
  if (!url) return jsonError('url is required', 400);

  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const events = Array.isArray(body.events) && body.events.length > 0
    ? body.events
    : ['presentation.completed'];

  const secret = String(body.secret || '');
  const id = genId();
  const subscription = {
    id,
    user_id: user.id,
    url,
    events,
    secret: secret || null,
    created_at: nowIso(),
  };

  await env.ARENA_KV.put(`webhook:${user.id}:${id}`, JSON.stringify(subscription));
  return json(subscription, 201);
};

export const onRequestDelete = async ({ request, env }) => {
  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonError('id is required', 400);

  await env.ARENA_KV.delete(`webhook:${user.id}:${id}`);
  return json({ ok: true });
};

export const onRequestGet = async ({ request, env }) => {
  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const list = await env.ARENA_KV.list({ prefix: `webhook:${user.id}:` });
  const subs = [];
  for (const key of list.keys) {
    const raw = await env.ARENA_KV.get(key.name);
    if (raw) {
      try { subs.push(JSON.parse(raw)); } catch {}
    }
  }

  return json({ subscriptions: subs });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (context.request.method === 'POST') return onRequestPost(context);
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  if (context.request.method === 'GET') return onRequestGet(context);
  return onRequestPost(context);
};
