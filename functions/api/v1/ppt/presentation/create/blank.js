import { json, jsonError, genId, nowIso, clamp } from '../../../../../_lib';
import { requireAuth } from '../../../../../_auth';
import { calculateCredits, assertCreditsAllowed, deductCredits } from '../../../../../_plans';

const W = 1280;
const H = 720;

function blankSlide() {
  return {
    id: genId(),
    index: 0,
    title: 'Untitled',
    content: '',
    template: 'general',
    ui: {
      background: '#FFFFFF',
      fonts: { css: "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');" },
      components: [
        {
          type: 'text',
          position: { x: 90, y: 300 },
          size: { width: 1100, height: 80 },
          text: 'Your title here',
          font: { family: 'Poppins', size: 52, color: '#111827', bold: true },
          alignment: { horizontal: 'left', vertical: 'middle' },
        },
        {
          type: 'text',
          position: { x: 90, y: 400 },
          size: { width: 1100, height: 120 },
          text: 'Start typing to replace this placeholder slide.',
          font: { family: 'Poppins', size: 24, color: '#4B5563' },
          alignment: { horizontal: 'left', vertical: 'top' },
        },
      ],
    },
  };
}

export const onRequestPost = async ({ request, env }) => {
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

  const isB2B = !!(auth.apiKeyId || auth.id);

  if (!isB2B) {
    const requiredCredits = calculateCredits({ n_slides: 1 });
    try {
      await assertCreditsAllowed(auth.userId, env, requiredCredits);
    } catch (err) {
      return jsonError(err.message, err.status || 403, { 'X-Error-Code': err.code || '' });
    }
  }

  const id = genId();
  const now = nowIso();
  const pres = {
    id,
    title: body.title || '',
    content: body.content || '',
    n_slides: clamp(Number(body.n_slides) || 1, 1, 40),
    language: body.language || 'English',
    template: body.template || 'general',
    tone: body.tone || 'default',
    verbosity: body.verbosity || 'standard',
    instructions: String(body.instructions || ''),
    web_search: !!body.web_search,
    include_title_slide: body.include_title_slide !== false,
    include_table_of_contents: !!body.include_table_of_contents,
    status: 'created',
    created_at: now,
    updated_at: now,
    outlines: null,
    slides: [],
  };
  await env.ARENA_KV.put(`pres:${auth.userId}:${id}`, JSON.stringify(pres));

  if (!isB2B) {
    await deductCredits(auth.userId, calculateCredits({ n_slides: 1 }), env);
  }
  return json({ ...pres }, 201);
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};