const PRES_PREFIX = 'pres:';

export function presKey(userId, id) {
  return `${PRES_PREFIX}${userId}:${id}`;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export function jsonError(detail, status = 400, extraHeaders = {}) {
  return json({ detail }, status, extraHeaders);
}

export function genId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function getPresentation(env, userId, id) {
  const raw = await env.ARENA_KV.get(presKey(userId, id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function savePresentation(env, userId, pres) {
  pres.user_id = userId;
  pres.updated_at = nowIso();
  await env.ARENA_KV.put(presKey(userId, pres.id), JSON.stringify(pres));
  return pres;
}

export async function listPresentations(env, userId) {
  const list = await env.ARENA_KV.list({ prefix: presKey(userId, '') });
  const out = [];
  for (const key of list.keys) {
    const raw = await env.ARENA_KV.get(key.name);
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw));
    } catch {
      // skip corrupt entries
    }
  }
  return out;
}

export async function deletePresentation(env, userId, id) {
  await env.ARENA_KV.delete(presKey(userId, id));
}

const ENCODER = new TextEncoder();

export function sseFrame(event, data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const lines = payload.split('\n').map((l) => `data: ${l}`);
  const ev = event ? `event: ${event}\n` : '';
  return ENCODER.encode(`${ev}${lines.join('\n')}\n\n`);
}

export function sseStatus(status) {
  return sseFrame('response', JSON.stringify({ type: 'status', status }));
}

export function sseChunk(chunk) {
  return sseFrame('response', JSON.stringify({ type: 'chunk', chunk }));
}

export function sseComplete(value) {
  return sseFrame('response', JSON.stringify({ type: 'complete', ...value }));
}

export function sseError(detail) {
  return sseFrame('response', JSON.stringify({ type: 'error', detail }));
}

export function sseResponseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

export function sseStream(controller) {
  return new Response(
    new ReadableStream({
      async start(c) {
        try {
          await controller({
            enqueue: (frame) => c.enqueue(frame),
            status: (s) => c.enqueue(sseStatus(s)),
            chunk: (s) => c.enqueue(sseChunk(s)),
            complete: (v) => c.enqueue(sseComplete(v)),
            error: (d) => c.enqueue(sseError(d)),
          });
        } catch (err) {
          c.enqueue(sseError(err?.message || 'Internal error'));
        } finally {
          try { c.close(); } catch { /* already closed */ }
        }
      },
    }),
    { headers: sseResponseHeaders() },
  );
}

export function cleanJsonText(text) {
  let t = String(text || '');
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1];
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return t.slice(start, end + 1);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function makeTitleSlideSlides(nSlides) {
  return Array.from({ length: nSlides }, (_, i) => ({
    title: '',
    content: '',
  }));
}

export async function fanOutWebhooks(env, userId, event) {
  try {
    const list = await env.ARENA_KV.list({ prefix: `webhook:${userId}:` });
    const targets = [];
    for (const key of list.keys) {
      const raw = await env.ARENA_KV.get(key.name);
      if (raw) {
        try {
          const sub = JSON.parse(raw);
          if (Array.isArray(sub.events) && sub.events.includes(event.type) && sub.url) {
            targets.push(sub);
          }
        } catch {}
      }
    }

    const payload = JSON.stringify(event);
    await Promise.allSettled(
      targets.map((sub) =>
        fetch(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sub.secret ? { Authorization: `Bearer ${sub.secret}` } : {}),
          },
          body: payload,
          signal: AbortSignal.timeout(5000),
        }).catch(() => {})
      ),
    );
  } catch {
    // webhook fan-out is best-effort
  }
}
