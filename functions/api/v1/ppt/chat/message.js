import { json, jsonError, getPresentation, savePresentation, cleanJsonText, clamp } from '../../../../_lib';
import { requireUser } from '../../../../_auth';
import { llmJson, assertKey } from '../../../../_llm';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const presentationId = body.presentation_id;
  const message = String(body.message || '').trim();
  if (!presentationId) return jsonError('presentation_id is required', 400);
  if (!message) return jsonError('message is required', 400);

  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const pres = await getPresentation(env, user.id, presentationId);
  if (!pres) return jsonError('Presentation not found', 404);

  try {
    assertKey(env);
  } catch (err) {
    return jsonError(err.message, 500);
  }

  const current = (pres.outlines?.slides || [])
    .map((s, i) => `${i + 1}. ${s.title || ''}\n   ${(s.content || '').slice(0, 300)}`)
    .join('\n\n');

  const raw = await llmJson(env, {
    messages: [
      {
        role: 'system',
        content: [
          'You edit presentation outlines based on a user request.',
          'Respond with ONLY a JSON object, never markdown fences:',
          '{"summary": "one short sentence confirming what changed",',
          ' "outlines": {"title": "updated presentation title", "slides": [{"title": "...", "content": "markdown content"}]}}',
          'Return the FULL updated outline, applying the user request to the current one.',
          'Keep the same language, style, and quality as the existing outline.',
          'Each slide content is audience-facing markdown, max 80 words.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Current outline:\n${current || '(empty outline)'}\n\nUser request: ${message}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 6000,
  });

  const cleaned = cleanJsonText(raw);
  let parsed = null;
  if (cleaned) {
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = null;
    }
  }

  const slides = Array.isArray(parsed?.outlines?.slides)
    ? parsed.outlines.slides
        .map((s) => ({ title: String(s.title || '').trim(), content: String(s.content || '').trim() }))
        .filter((s) => s.content || s.title)
    : pres.outlines?.slides || [];

  if (slides.length) {
    const title = String(parsed.outlines.title || slides[0]?.title || pres.title || 'Untitled').trim();
    pres.outlines = { title, slides };
    pres.title = title;
    pres.n_slides = clamp(slides.length, 1, 40);
    await savePresentation(env, user.id, pres);
  }

  return json({ response: String(parsed?.summary || 'Done! I updated your outline.') });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
