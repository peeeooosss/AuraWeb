import { jsonError, getPresentation, savePresentation, sseStream, cleanJsonText, clamp, genId } from '../../../../../_lib';
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
        max_tokens: 2000,
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
    // Small delay before retry
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  return null;
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

      await status(`Loading the ${template} template...`);
      const templateData = await getTemplateData(env, request, template);
      const layouts = Array.isArray(templateData?.layouts) ? templateData.layouts : [];

      const pal = getPalette(template);
      const fontsCss = getTemplateFonts(templateData) || '';
      const meta = `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} \u00b7 Aura AI`;

      // Build schema catalog from template layouts
      const schemas = getTemplateSchema(templateData);
      const schemaLookup = {};
      if (schemas?.layouts) {
        for (const sl of schemas.layouts) schemaLookup[sl.layout_id] = sl.schema;
      }

      // No template layout data available — fall back to deterministic builders.
      if (!layouts.length) {
        await status(`Designing ${total} slides with the ${template} template...`);
        const slides = buildFallbackSlides(outlinesSliced, template);
        pres.slides = slides;
        pres.n_slides = slides.length;
        pres.status = 'slides_ready';
        await savePresentation(env, user.id, pres);
        return complete({ presentation: pres });
      }

      // Stage 1: layout selection (single LLM call picks layout indices per slide).
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
        // Accept numeric indices directly, or try to resolve string IDs
        if (typeof idx === 'number' && idx >= 0 && idx < layouts.length) {
          picked.push(idx);
        } else if (typeof idx === 'string') {
          const found = layouts.findIndex((l) => l.id === idx);
          picked.push(found >= 0 ? found : defaultIdx);
        } else {
          picked.push(defaultIdx);
        }
      }

      // Stage 2: per-slide content generation + deterministic UI hydration, streamed live.
      const slides = [];
      for (let i = 0; i < total; i++) {
        await status(`Designing slide ${i + 1} of ${total}...`);
        const outline = outlinesSliced[i] || {};
        const layout = layouts[picked[i]] || layouts[0];
        const layoutSchema = schemaLookup[layout.id] || null;
        const responseSchema = prepareResponseSchema(layoutSchema);

        let content = {};

        try {
          const raw = await llmJson(env, {
            messages: [
              { role: 'system', content: CONTENT_SYSTEM },
              {
                role: 'user',
                content: slideContentPrompt({
                  outline,
                  layout,
                  schema: responseSchema,
                  slideNumber: i + 1,
                  totalSlides: total,
                  isTitle: i === 0,
                  isClosing: i === total - 1,
                }),
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          });
          const cleaned = cleanJsonText(raw);
          if (cleaned) {
            const parsed = JSON.parse(cleaned) || {};
            delete parsed.__speaker_note;
            content = parsed;
          }
        } catch {
          // keep empty content so the template's default text is used
        }

        let ui;
        try {
          ui = hydrateLayoutUi(layout, content, pal, fontsCss);
        } catch {
          const plan = {
            title: outline.title || '',
            type: 'bullets',
            meta: i === 0 || i === total - 1 ? meta : undefined,
          };
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
        };

        // Fetch stock images + set placeholders (best-effort)
        try {
          await hydrateImages(env, ui, pal, template);
        } catch {
          // Image fetching is best-effort; placeholders already set by hydrateLayoutUi
        }

        slides.push(slide);
        chunk(slide);
      }

      await status('Finalizing your presentation...');
      pres.slides = slides;
      pres.n_slides = slides.length;
      pres.status = 'slides_ready';

      await savePresentation(env, user.id, pres);

      complete({ presentation: pres });
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
