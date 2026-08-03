import { json, jsonError, nowIso, getPresentation, savePresentation, genId } from '../../../../_lib';
import { requireUser } from '../../../../_auth';
import { calculateSlidesCredits, assertCreditsAllowed, deductCredits } from '../../../../_plans';

function insertTocSlides(outlines, nSlides) {
  if (nSlides < 3) return outlines;
  const hasToc = outlines.some((s) => {
    const t = (s.title || '').toLowerCase();
    const c = (s.content || '').toLowerCase();
    return t.includes('table of contents') || t.includes('agenda') || t.includes('contents') ||
           c.includes('table of contents') || c.includes('agenda') || c.includes('outline');
  });
  if (hasToc) return outlines;

  const titleSlide = outlines.shift();
  const items = outlines.map((s, i) => `- ${s.title || `Section ${i + 1}`}`);
  const tocSlide = {
    title: 'Agenda',
    content: items.slice(0, 8).join('\n'),
  };
  return [titleSlide, tocSlide, ...outlines].slice(0, nSlides + 1);
}

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

  let slides = Array.isArray(body.outlines) ? body.outlines : pres.outlines?.slides || [];

  if (slides.length && pres.include_title_slide !== false) {
    const hasTitle = slides.some((s) => {
      const t = ((s && s.title) || '').toLowerCase();
      return t.includes('title') || t === 'cover' || t.includes('introduction');
    });
    if (!hasTitle) {
      const first = slides[0];
      slides.unshift({
        title: pres.title || 'Title',
        content: first ? (first.content || '').slice(0, 200) : `Presentation — ${new Date().toISOString().slice(0, 10)}`,
      });
    }
  }

  if (pres.include_table_of_contents) {
    slides = insertTocSlides(slides, pres.n_slides);
  }

  const title = slides.find((s) => s && s.title)?.title || pres.title || 'Untitled';

  pres.outlines = { title, slides: slides.map((s) => ({ title: s.title || '', content: s.content || '' })) };
  pres.title = title;
  pres.n_slides = Math.max(1, slides.length);
  if (body.layout) pres.template = body.layout;
  pres.status = 'preparing';
  pres.updated_at = nowIso();

  const slidesCredits = calculateSlidesCredits(slides.length);
  try {
    await assertCreditsAllowed(user.id, env, slidesCredits);
  } catch (err) {
    return jsonError(err.message, err.status || 403, { 'X-Error-Code': err.code || '' });
  }

  await savePresentation(env, user.id, pres);
  await deductCredits(user.id, slidesCredits, env);
  return json({
    id: pres.id,
    status: pres.status,
    title: pres.title,
    n_slides: pres.n_slides,
    credits_used: slidesCredits,
  });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
