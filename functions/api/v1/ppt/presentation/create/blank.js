import { json, jsonError, genId, nowIso } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';
import { assertPptAllowed } from '../../../../../_plans';

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
  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  try {
    await assertPptAllowed(user.id, env);
  } catch (err) {
    return jsonError(err.message, err.status || 403, { 'X-Error-Code': err.code || '' });
  }

  const id = genId();
  const now = nowIso();
  const pres = {
    id,
    title: 'Untitled',
    content: '',
    n_slides: 1,
    language: 'English',
    template: 'general',
    tone: 'default',
    verbosity: 'standard',
    instructions: '',
    status: 'slides_ready',
    created_at: now,
    updated_at: now,
    outlines: null,
    slides: [blankSlide()],
  };
  await env.ARENA_KV.put(`pres:${user.id}:${id}`, JSON.stringify(pres));
  return json(pres, 201);
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
