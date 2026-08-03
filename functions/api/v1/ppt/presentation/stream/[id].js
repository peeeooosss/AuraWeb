import { jsonError, getPresentation, savePresentation, sseStream, cleanJsonText, clamp, genId, fanOutWebhooks } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';
import { llmJson, llmStructured, assertKey } from '../../../../../_llm';
import { getTemplateData, getTemplateFonts } from '../../../../../_templates';
import { getTemplateSchema, componentContentKeys } from '../../../../../_schema';
import {
  getPalette,
  layoutSelectionPrompt,
  slideContentPrompt,
  prepareResponseSchema,
  hydrateLayoutUi,
  buildSlideFromPlan,
  buildFallbackSlides,
} from '../../../../../_slidegen';
import { hydrateImages } from '../../../../../_images';

const MAX_SLIDES = 40;
const PARALLEL_BATCH = 5;

const LAYOUT_SYSTEM =
  'You are an expert presentation layout designer. Respond with ONLY valid JSON matching the requested schema. Never wrap the response in code fences or add commentary.';
const CONTENT_SYSTEM =
  'You are an expert presentation copywriter. Respond with ONLY valid JSON. Never wrap the response in code fences or add commentary.';

const LAYOUT_SELECTION_SCHEMA = {
  type: 'object',
  properties: {
    slides: {
      type: 'array',
      items: { type: 'integer', minimum: 0 },
      minItems: 1,
    },
  },
  required: ['slides'],
  additionalProperties: false,
};

async function selectLayoutsWithRetry(env, systemPrompt, userPrompt, maxSlides, maxAttempts = 3) {
  const schema = {
    ...LAYOUT_SELECTION_SCHEMA,
    properties: {
      slides: {
        type: 'array',
        items: { type: 'integer', minimum: 0, maximum: 100 },
        minItems: maxSlides,
        maxItems: maxSlides,
      },
    },
    required: ['slides'],
    additionalProperties: false,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await llmStructured(env, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
        responseFormat: {
          type: 'json_schema',
          json_schema: {
            name: 'layout_selection',
            schema,
            strict: false,
          },
        },
      });
      if (result && Array.isArray(result.slides) && result.slides.length === maxSlides) {
        return result.slides;
      }
    } catch (e) {
      // Fall through to next attempt
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  return null;
}

async function generateSlideContent(env, { outline, layout, layoutSchema, index, total, tone, verbosity, language, sources }) {
  const responseSchema = prepareResponseSchema(layoutSchema);
  let content = {};
  let speakerNote = '';

  try {
    let sourceContext = '';
    if (sources && sources.length > 0) {
      sourceContext = '\n\n# Reference Sources (use facts/numbers from these where relevant):\n' +
        sources.map((s, i) => `[${i + 1}] ${s.title}: ${s.snippet}`).join('\n');
    }

    const raw = await llmJson(env, {
      messages: [
        { role: 'system', content: CONTENT_SYSTEM },
        {
          role: 'user',
          content: slideContentPrompt({
            outline,
            layout,
            schema: responseSchema,
            slideNumber: index + 1,
            totalSlides: total,
            isTitle: index === 0,
            isClosing: index === total - 1,
            tone,
            verbosity,
            language,
          }) + sourceContext,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });
    const cleaned = cleanJsonText(raw);
    if (cleaned) {
      const parsed = JSON.parse(cleaned) || {};
      speakerNote = String(parsed.__speaker_note || '').trim();
      delete parsed.__speaker_note;
      content = parsed;
    }
  } catch {
    // keep empty content so the template's default text is used
  }

  return { content, speakerNote };
}

export const onRequestGet = async ({ params, env, request }) => {
  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const pres = await getPresentation(env, user.id, params.id);
  if (!pres) return jsonError('Presentation not found', 404);

  return sseStream(async ({ status, chunk, complete, error }) => {
    if (typeof env === 'undefined' || !env?.ARENA_KV) {
      return error('Storage binding is not configured');
    }
    try {
      assertKey(env);
    } catch (err) {
      return error(err.message);
    }

    try {
      const outlines = pres.outlines?.slides || [];
      if (!outlines.length) {
        return error('No outlines found. Generate an outline first.');
      }

      const template = pres.template || 'general';
      const nSlides = clamp(Number(pres.n_slides) || outlines.length, 1, MAX_SLIDES);
      const outlinesSliced = outlines.slice(0, nSlides);
      const total = outlinesSliced.length;
      const sources = pres.sources || [];

      await status(`Loading the ${template} template...`);
      const templateData = await getTemplateData(env, request, template);
      const layouts = Array.isArray(templateData?.layouts) ? templateData.layouts : [];

      const pal = getPalette(template);
      const fontsCss = getTemplateFonts(templateData) || '';
      const meta = `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} \u00b7 Aura AI`;

      const schemas = getTemplateSchema(templateData);
      const schemaLookup = {};
      if (schemas?.layouts) {
        for (const sl of schemas.layouts) schemaLookup[sl.layout_id] = sl.schema;
      }

      if (!layouts.length) {
        await status(`Designing ${total} slides with the ${template} template...`);
        const slides = buildFallbackSlides(outlinesSliced, template);
        pres.slides = slides;
        pres.n_slides = slides.length;
        pres.status = 'slides_ready';
        await savePresentation(env, user.id, pres);
        return complete({ presentation: pres });
      }

      // Stage 1: layout selection
      await status(`Selecting layouts for ${total} slides...`);
      let layoutIndices = [];
      try {
        const userPrompt = layoutSelectionPrompt(outlinesSliced, template, layouts, schemas);
        const indices = await selectLayoutsWithRetry(env, LAYOUT_SYSTEM, userPrompt, total);
        if (indices) {
          layoutIndices = indices;
        }
      } catch {
        // fall back to default layout below
      }

      const defaultIdx = 0;
      const picked = [];
      for (let i = 0; i < total; i++) {
        const idx = layoutIndices[i];
        if (typeof idx === 'number' && idx >= 0 && idx < layouts.length) {
          picked.push(idx);
        } else if (typeof idx === 'string') {
          const found = layouts.findIndex((l) => l.id === idx);
          picked.push(found >= 0 ? found : defaultIdx);
        } else {
          picked.push(defaultIdx);
        }
      }

      // Stage 2: parallel per-slide content generation
      const slides = Array.from({ length: total }, () => null);

      for (let batchStart = 0; batchStart < total; batchStart += PARALLEL_BATCH) {
        const batchEnd = Math.min(batchStart + PARALLEL_BATCH, total);
        await status(`Designing slides ${batchStart + 1}–${batchEnd} of ${total}...`);

        const batchPromises = [];
        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push(
            generateSlideContent(env, {
              outline: outlinesSliced[i] || {},
              layout: layouts[picked[i]] || layouts[0],
              layoutSchema: schemaLookup[(layouts[picked[i]] || layouts[0]).id] || null,
              index: i,
              total,
              tone: pres.tone,
              verbosity: pres.verbosity,
              language: pres.language,
              sources,
            }),
          );
        }

        const batchResults = await Promise.allSettled(batchPromises);

        for (let j = 0; j < batchResults.length; j++) {
          const i = batchStart + j;
          const outline = outlinesSliced[i] || {};
          const layout = layouts[picked[i]] || layouts[0];
          const result = batchResults[j];

          let content = {};
          let speakerNote = '';
          if (result.status === 'fulfilled') {
            content = result.value.content;
            speakerNote = result.value.speakerNote;
          }

          let ui;
          try {
            ui = hydrateLayoutUi(layout, content, pal, fontsCss);
          } catch {
            const title = outline.title || '';
            const outlineContent = outline.content || '';
            const bodyLines = outlineContent
              .split('\n')
              .map((l) => l.replace(/^#+\s*/, '').replace(/^\s*[-*]\s*/, '').replace(/^\s*>\s*/, '').trim())
              .filter(Boolean);
            const plan = {
              title,
              type: i === 0 ? 'title' : i === total - 1 ? 'closing' : 'bullets',
              meta: i === 0 || i === total - 1 ? meta : undefined,
            };
            if (plan.type === 'title') {
              plan.subtitle = bodyLines.length > 1 ? bodyLines.slice(1).slice(0, 2).join(' \u00b7 ') : '';
              plan.eyebrow = String(i + 1);
            } else if (plan.type === 'bullets') {
              plan.points = bodyLines.slice(0, 6).map((l) => ({ heading: l, body: '' }));
            } else {
              plan.subtitle = bodyLines.slice(0, 2).join(' \u00b7 ');
              plan.eyebrow = String(i + 1);
            }
            ui = buildSlideFromPlan(plan, i, total, template).ui;
          }

          const slide = {
            id: genId(),
            index: i,
            title: outline.title || '',
            content: outline.content || '',
            layout: layout.id,
            layout_group: template,
            template,
            ui,
            speaker_note: speakerNote,
          };

          try {
            await hydrateImages(env, ui, pal, template);
          } catch {
            // Image fetching is best-effort
          }

          slides[i] = slide;
          chunk(slide);
        }
      }

      await status('Finalizing your presentation...');
      const validSlides = slides.filter(Boolean);
      pres.slides = validSlides;
      pres.n_slides = validSlides.length;
      pres.status = 'slides_ready';

      await savePresentation(env, user.id, pres);

      complete({ presentation: pres });
      fanOutWebhooks(env, user.id, { type: 'presentation.completed', presentation_id: pres.id, title: pres.title, n_slides: validSlides.length });
    } catch (err) {
      return error(`Failed to generate slides: ${err?.message || 'unknown error'}`);
    }
  });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestGet(context);
};
