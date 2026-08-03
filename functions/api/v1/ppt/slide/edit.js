import { json, jsonError, getPresentation, savePresentation, cleanJsonText, genId } from '../../../../_lib';
import { requireUser } from '../../../../_auth';
import { llmJson, llmStructured, assertKey } from '../../../../_llm';
import { getTemplateData, getTemplateFonts } from '../../../../_templates';
import { getTemplateSchema } from '../../../../_schema';
import {
  getPalette,
  layoutSelectionPrompt,
  slideContentPrompt,
  prepareResponseSchema,
  hydrateLayoutUi,
} from '../../../../_slidegen';
import { hydrateImages } from '../../../../_images';

const CONTENT_SYSTEM =
  'You are an expert presentation copywriter. Respond with ONLY valid JSON. Never wrap the response in code fences or add commentary.';

const LAYOUT_SYSTEM =
  'You are an expert presentation layout designer. Respond with ONLY valid JSON matching the requested schema.';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const presentationId = body.presentation_id;
  const slideIndex = Number(body.slide_index) || 0;
  const instruction = String(body.instruction || '').trim();

  if (!presentationId) return jsonError('presentation_id is required', 400);

  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const pres = await getPresentation(env, user.id, presentationId);
  if (!pres) return jsonError('Presentation not found', 404);

  if (!Array.isArray(pres.slides) || !pres.slides[slideIndex]) {
    return jsonError('Slide not found', 404);
  }

  try {
    assertKey(env);
  } catch (err) {
    return jsonError(err.message, 500);
  }

  const slide = pres.slides[slideIndex];
  const template = pres.template || 'general';
  const total = pres.slides.length;

  const templateData = await getTemplateData(env, request, template);
  const layouts = Array.isArray(templateData?.layouts) ? templateData.layouts : [];
  const schemas = getTemplateSchema(templateData);
  const schemaLookup = {};
  if (schemas?.layouts) {
    for (const sl of schemas.layouts) schemaLookup[sl.layout_id] = sl.schema;
  }

  const pal = getPalette(template);
  const fontsCss = getTemplateFonts(templateData) || '';
  const sources = pres.sources || [];
  const outline = (pres.outlines?.slides || [])[slideIndex] || { title: slide.title || '', content: slide.content || '' };

  // Pick a new layout if instruction suggests it, otherwise keep current
  let layout = layouts.find((l) => l.id === slide.layout) || layouts[0];
  let layoutSchema = schemaLookup[layout.id] || null;

  if (instruction || layouts.length > 0) {
    const layoutPrompt = layoutSelectionPrompt([outline], template, layouts, schemas);
    const selSchema = {
      type: 'object',
      properties: { slides: { type: 'array', items: { type: 'integer', minimum: 0, maximum: layouts.length - 1 }, minItems: 1, maxItems: 1 } },
      required: ['slides'],
      additionalProperties: false,
    };
    try {
      const sel = await llmStructured(env, {
        messages: [
          { role: 'system', content: LAYOUT_SYSTEM },
          { role: 'user', content: layoutPrompt + (instruction ? `\n\nEdit instruction: ${instruction}` : '') },
        ],
        temperature: 0.3,
        max_tokens: 200,
        responseFormat: { type: 'json_schema', json_schema: { name: 'layout_sel', schema: selSchema, strict: false } },
      });
      const idx = sel?.slides?.[0];
      if (typeof idx === 'number' && idx >= 0 && idx < layouts.length) {
        layout = layouts[idx];
        layoutSchema = schemaLookup[layout.id] || null;
      }
    } catch {
      // keep existing layout
    }
  }

  // Generate new content
  let content = {};
  let speakerNote = '';
  try {
    const responseSchema = prepareResponseSchema(layoutSchema);
    let sourceContext = '';
    if (sources.length > 0) {
      sourceContext = '\n\n# Reference Sources:\n' +
        sources.map((s, i) => `[${i + 1}] ${s.title}: ${s.snippet}`).join('\n');
    }

    const userContent = slideContentPrompt({
      outline, layout, schema: responseSchema,
      slideNumber: slideIndex + 1, totalSlides: total,
      isTitle: slideIndex === 0, isClosing: slideIndex === total - 1,
      tone: pres.tone, verbosity: pres.verbosity, language: pres.language,
    }) + (instruction ? `\n\nEdit instruction: ${instruction}` : '') + sourceContext;

    const raw = await llmJson(env, {
      messages: [
        { role: 'system', content: CONTENT_SYSTEM },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const cleaned = cleanJsonText(raw);
    if (cleaned) {
      const parsed = JSON.parse(cleaned) || {};
      speakerNote = String(parsed.__speaker_note || '').trim();
      delete parsed.__speaker_note;
      content = parsed;
    }
  } catch {
    // keep empty content
  }

  // Hydrate UI
  let ui;
  try {
    ui = hydrateLayoutUi(layout, content, pal, fontsCss);
  } catch {
    ui = slide.ui || null;
  }

  if (ui) {
    try { await hydrateImages(env, ui, pal, template); } catch {}
  }

  const updated = {
    ...slide,
    id: genId(),
    index: slideIndex,
    title: outline.title || slide.title || '',
    content: outline.content || slide.content || '',
    layout: layout.id,
    layout_group: template,
    template,
    ui: ui || slide.ui,
    speaker_note: speakerNote || slide.speaker_note || '',
  };

  pres.slides[slideIndex] = updated;
  await savePresentation(env, user.id, pres);

  return json({ ok: true, id: pres.id, slide_index: slideIndex, slide: updated });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
