import { jsonrepair } from 'jsonrepair';
import { jsonError, getPresentation, savePresentation, sseStream, cleanJsonText, clamp, genId, fanOutWebhooks } from '../../../../../_lib';
import { requireAuth, logUsage } from '../../../../../_auth';
import { llmChat, llmJson, assertKey } from '../../../../../_llm';
import { getTemplateData, getTemplateFonts } from '../../../../../_templates';
import { getTemplateSchema, componentContentKeys } from '../../../../../_schema';
import {
  getPalette,
  layoutSelectionPrompt,
  slideContentPrompt,
  prepareResponseSchema,
  hydrateLayoutUi,
  extractContentFields,
  buildSlideFromPlan,
  buildFallbackSlides,
} from '../../../../../_slidegen';
import { hydrateImages } from '../../../../../_images';

const MAX_SLIDES = 40;
const PARALLEL_BATCH = 5;

const LAYOUT_SYSTEM =
  'You are an expert presentation layout designer. Respond with ONLY valid JSON matching the requested schema. Never wrap the response in code fences or add commentary.';
const CONTENT_SYSTEM =
  'You are an expert presentation copywriter. Respond with ONLY valid JSON. Never wrap the response in code fences or add commentary. Every text field must be filled close to its maximum length — a sparse slide with short or empty text is unacceptable. Expand the outline content with relevant details, examples, statistics, and supporting context. Use the full space available in each field.';

function layoutContentTypes(layout) {
  return new Set(extractContentFields(layout).map((field) => field.type));
}

function visualNeed(outline, index, total) {
  const text = `${outline?.title || ''} ${outline?.content || ''}`.toLowerCase();
  if (/(table|tabular|matrix|breakdown|by segment|by category)/.test(text) && /\d|data|statistic|percentage|rate|revenue|growth|trend/.test(text)) {
    return 'table';
  }
  if (/(chart|graph|bar|trend|over time|comparison|compare|percentage|percent|rate|revenue|growth|statistic|data)/.test(text) && /\d|data|statistic|percentage|rate|revenue|growth|trend/.test(text)) {
    return 'chart';
  }
  return 'image';
}

function enforceVisualLayouts(layouts, selected, outlines) {
  const used = new Set();
  const findCandidate = (need, currentIndex) => {
    const candidates = layouts
      .map((layout, index) => ({ layout, index, types: layoutContentTypes(layout) }))
      .filter(({ types }) => types.has(need));
    return candidates.find(({ index }) => index !== currentIndex && !used.has(index)) ||
      candidates.find(({ index }) => index !== currentIndex) ||
      candidates[0] || null;
  };

  return outlines.map((outline, slideIndex) => {
    const currentIndex = selected[slideIndex];
    const current = layouts[currentIndex];
    const need = visualNeed(outline, slideIndex, outlines.length);
    const currentTypes = current ? layoutContentTypes(current) : new Set();
    let chosenIndex = currentIndex;

    if (!currentTypes.has(need)) {
      const candidate = findCandidate(need, currentIndex);
      if (candidate) chosenIndex = candidate.index;
    }

    used.add(chosenIndex);
    return chosenIndex;
  });
}
async function selectLayoutsWithRetry(env, systemPrompt, userPrompt, maxSlides) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await llmJson(env, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
        timeoutMs: 30000,
      });
      const cleaned = cleanJsonText(raw);
      if (!cleaned) continue;
      let result;
      try {
        result = JSON.parse(cleaned);
      } catch (e) {
        try {
          result = JSON.parse(jsonrepair(cleaned));
        } catch (e2) {
          continue;
        }
      }
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

  if (!responseSchema) {
    return { content, speakerNote };
  }

  let sourceContext = '';
  if (sources && sources.length > 0) {
    sourceContext = '\n\n# Reference Sources (use facts/numbers from these where relevant):\n' +
      sources.map((s, i) => `[${i + 1}] ${s.title}: ${s.snippet}`).join('\n');
  }

  const baseUserContent = slideContentPrompt({
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
  }) + sourceContext;

  try {
    const raw = await llmJson(env, {
      messages: [
        { role: 'system', content: CONTENT_SYSTEM },
        { role: 'user', content: baseUserContent },
      ],
      temperature: 0.5,
      max_tokens: 8000,
      timeoutMs: 45000,
    });
    const cleaned = cleanJsonText(raw);
    if (cleaned) {
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        parsed = JSON.parse(jsonrepair(cleaned));
      }
      if (parsed) {
        speakerNote = String(parsed.__speaker_note || '').trim();
        delete parsed.__speaker_note;
        content = parsed;
      }
    }
  } catch {
    // Keep empty content/speakerNote fallback
  }

  return { content, speakerNote };
}

export const onRequestGet = async ({ params, env, request }) => {
  let auth;
  try {
    auth = await requireAuth(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const pres = await getPresentation(env, auth.userId, params.id);
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
await savePresentation(env, auth.userId, pres);
        return complete({ presentation: pres });
      }

      // Stage 1: layout selection — use pre-generated structure from prepare if available
      let picked = [];
      if (Array.isArray(pres.structure) && pres.structure.length === total) {
        // Structure was pre-computed in prepare.js (matches Presenton's prepare step)
        picked = pres.structure.map((idx) => {
          if (typeof idx === 'number' && idx >= 0 && idx < layouts.length) return idx;
          if (typeof idx === 'string') {
            const found = layouts.findIndex((l) => l.id === idx);
            return found >= 0 ? found : 0;
          }
          return 0;
        });
        console.log(`[presentation/stream] using pre-stored structure: [${picked.join(',')}]`);
      } else {
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

        for (let i = 0; i < total; i++) {
          const idx = layoutIndices[i];
          if (typeof idx === 'number' && idx >= 0 && idx < layouts.length) {
            picked.push(idx);
          } else if (typeof idx === 'string') {
            const found = layouts.findIndex((l) => l.id === idx);
            picked.push(found >= 0 ? found : 0);
          } else {
            picked.push(0);
          }
        }
      }

      // The model selects the best layout, then this deterministic pass enforces
      // the product visual contract instead of allowing text-only slides.
      const visualLayoutIndices = enforceVisualLayouts(layouts, picked, outlinesSliced);
      for (let i = 0; i < picked.length; i++) picked[i] = visualLayoutIndices[i];

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

      await savePresentation(env, auth.userId, pres);

      complete({ presentation: pres });
      fanOutWebhooks(env, auth.userId, { type: 'presentation.completed', presentation_id: pres.id, title: pres.title, n_slides: validSlides.length });
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
