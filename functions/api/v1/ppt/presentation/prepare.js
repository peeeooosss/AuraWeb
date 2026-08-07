import { json, jsonError, nowIso, getPresentation, savePresentation, genId, cleanJsonText } from '../../../../_lib';
import { requireAuth, logUsage } from '../../../../_auth';
import { calculateSlidesCredits, assertCreditsAllowed, deductCredits } from '../../../../_plans';
import { chargeB2B, SLIDE_USD_COST } from '../../../../_b2b';
import { llmJson, assertKey } from '../../../../_llm';
import { getTemplateData } from '../../../../_templates';
import { getTemplateSchema } from '../../../../_schema';
import { layoutSelectionPrompt } from '../../../../_slidegen';

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

  let auth;
  try {
    auth = await requireAuth(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  // Retry getPresentation to handle KV propagation delay
  let pres;
  for (let attempt = 0; attempt < 3; attempt++) {
    pres = await getPresentation(env, auth.userId, presentationId);
    if (pres) break;
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  if (!pres) return jsonError('Presentation not found', 404);

  const isB2B = !!(auth.apiKeyId || auth.id);

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

  // Generate layout structure (matches Presenton's prepare step)
  const finalSlides = slides.map((s) => ({ title: s.title || '', content: s.content || '' }));
  try {
    const templateName = pres.template || 'general';
    const templateData = await getTemplateData(env, request, templateName);
    const layouts = Array.isArray(templateData?.layouts) ? templateData.layouts : [];
    if (layouts.length > 0) {
      assertKey(env);
      const schemas = getTemplateSchema(templateData);
      const userPrompt = layoutSelectionPrompt(finalSlides, templateName, layouts, schemas);
      const system = 'You are an expert presentation layout designer. Respond with ONLY valid JSON matching the requested schema. Never wrap the response in code fences or add commentary.';
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const raw = await llmJson(env, {
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 2000,
            timeoutMs: 30000,
          });
          const cleaned = cleanJsonText(raw);
          if (cleaned) {
            const result = JSON.parse(cleaned);
            if (result && Array.isArray(result.slides) && result.slides.length === finalSlides.length) {
              pres.structure = result.slides;
              break;
            }
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  } catch {}
  pres.status = 'preparing';
  pres.updated_at = nowIso();

  const slidesCredits = calculateSlidesCredits(slides.length);

  // Charge before preparing: B2B (USD wallet per slide) or B2C (credits)
  let creditsUsed = 0;
  try {
    if (isB2B) {
      const nSlides = slides.length;
      const totalCost = SLIDE_USD_COST * nSlides;
      await chargeB2B({ env, auth, cost: totalCost, endpoint: 'presentation/prepare', inputTokens: 0, outputTokens: 0 });
      creditsUsed = totalCost; // USD value
    } else {
      await assertCreditsAllowed(auth.userId, env, slidesCredits);
    }
  } catch (err) {
    if (err.code === 'WALLET_INSUFFICIENT') {
      return jsonError(`Insufficient wallet balance. ${err.message}`, 402);
    }
    return jsonError(err.message, err.status || 403, { 'X-Error-Code': err.code || '' });
  }

  await savePresentation(env, auth.userId, pres);

  // Deduct credits for B2C; B2B already charged
  if (!isB2B) {
    await deductCredits(auth.userId, slidesCredits, env);
    await logUsage({ userId: auth.userId, apiKeyId: null, endpoint: 'presentation/prepare', inputTokens: 0, outputTokens: 0, cost: slidesCredits }, env);
  }

  return json({
    id: pres.id,
    status: pres.status,
    title: pres.title,
    n_slides: pres.n_slides,
    credits_used: isB2B ? `$${creditsUsed.toFixed(2)}` : slidesCredits,
  });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
