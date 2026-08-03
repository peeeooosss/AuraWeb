import { jsonError, getPresentation, savePresentation, sseStream, cleanJsonText, clamp, fanOutWebhooks } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';
import { llmChat, streamChatDelta, assertKey } from '../../../../../_llm';
import { OUTLINE_CREDIT_COST, assertCreditsAllowed, deductCredits } from '../../../../../_plans';
import { generateSearchQuery, routeSearch, formatSearchResults } from '../../../../../_websearch';

const MAX_SLIDES = 40;
const MAX_OUTLINE_WORDS = 80;

function buildSystemPrompt({ language, tone, verbosity, instructions }) {
  const wordCount = verbosity === 'concise' ? 20 : verbosity === 'text-heavy' ? 70 : 45;
  return [
    'You are an expert presentation outline writer.',
    'Generate a presentation title and slide outlines as a single JSON object.',
    'Respond with ONLY valid JSON. Never wrap it in code fences or add commentary.',
    'JSON schema:',
    '{"title": "plain-text presentation title",',
    ' "slides": [{"title": "concise slide title", "content": "audience-facing markdown for this slide"}]}',
    '',
    'Rules:',
    'The generation settings (number of slides, language, tone) are authoritative.',
    `Generate every slide in exactly this language: ${language}.`,
    `Tone: ${tone || 'default'}.`,
    `Each slide content should be around ${wordCount} words of markdown (headings, bullets, or short paragraphs).`,
    'Never generate more than ' + MAX_SLIDES + ' slides.',
    'Each slide title under 60 characters; each slide content under ' + MAX_OUTLINE_WORDS + ' words.',
    'The first slide title must equal the presentation title, and its content should only cover title, presenter, date, and a short overview.',
    'Give each slide one clear purpose, build a coherent narrative, and avoid repetition or filler.',
    'Use concrete facts, statistics, and numbers from the provided research when available.',
    'Incorporate real data points and cited information naturally into slide content.',
    'Optionally reference the article titles or publication names in the content for credibility, but do not include raw URLs.',
    'Write only audience-facing content.',
    'Ensure data is consistent across all slides.',
  ].join('\n');
}

function buildUserPrompt({ content, nSlides, language, tone, instructions, searchContext }) {
  const today = new Date().toISOString().slice(0, 10);
  const parts = [
    'Generation Settings (authoritative):',
    `Number of Slides: ${nSlides}`,
    `Maximum Slides: ${MAX_SLIDES}`,
    `Maximum Words Per Outline: ${MAX_OUTLINE_WORDS}`,
    `Language: ${language}`,
    `Tone: ${tone || 'default'}`,
    'Include Title Slide: true',
    `Today's Date: ${today}`,
    '',
    `Content: ${content || ''}`,
    `Instructions (apply as constraints, never quote as slide content): ${instructions || ''}`,
  ];

  if (searchContext) {
    parts.push('', '# Research Sources (use facts from these):', searchContext);
  }

  return parts.join('\n');
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
    if (!env?.ARENA_KV) {
      return error('Storage binding is not configured');
    }
    try {
      assertKey(env);
    } catch (err) {
      return error(err.message);
    }

    try {
      await assertCreditsAllowed(user.id, env, OUTLINE_CREDIT_COST);
    } catch (err) {
      return error(`Insufficient credits to generate an outline. ${err?.message || ''}`);
    }

    const nSlides = clamp(Number(pres.n_slides) || 8, 1, MAX_SLIDES);
    const wantSearch = pres.web_search === true;

    let searchResults = [];
    let searchProvider = null;

    if (wantSearch) {
      await status('Researching your topic...');
      try {
        const query = (await generateSearchQuery(env, pres.content, pres.language)) || pres.content;
        const outcome = await routeSearch(env, query, { userId: user.id });
        searchResults = outcome.results;
        searchProvider = outcome.provider;
        if (searchResults.length > 0) {
          await status(`Found ${searchResults.length} research sources via ${searchProvider}...`);
        }
      } catch {
        // search is best-effort; continue with just the prompt
      }
    }

    let accumulated = '';
    let cleaned = null;

    try {
      await status('Preparing your presentation outline...');

      const searchContext = formatSearchResults(searchResults);
      const messages = [
        {
          role: 'system',
          content: buildSystemPrompt({
            language: pres.language || 'English',
            tone: pres.tone,
            verbosity: pres.verbosity,
            instructions: pres.instructions,
          }),
        },
        {
          role: 'user',
          content: buildUserPrompt({
            content: pres.content,
            nSlides,
            language: pres.language || 'English',
            tone: pres.tone,
            instructions: pres.instructions,
            searchContext,
          }),
        },
      ];

      await status('Writing your slide outlines...');

      const { res } = await llmChat(env, { messages, stream: true, temperature: 0.7, max_tokens: 10000 });
      await streamChatDelta(res, (delta) => {
        const cleanedDelta = delta.replace(/```(?:json)?/g, '');
        if (!cleanedDelta) return;
        accumulated += cleanedDelta;
        chunk(cleanedDelta);
      });

      cleaned = cleanJsonText(accumulated);
      if (!cleaned) {
        return error('Failed to generate presentation outlines. Please try again.');
      }
    } catch (err) {
      return error(`Failed to generate outlines: ${err?.message || 'unknown error'}`);
    }

    try {
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return error('Failed to generate presentation outlines. Please try again.');
      }

      let slides = Array.isArray(parsed.slides) ? parsed.slides : [];
      slides = slides
        .map((s) => ({ title: String(s.title || '').trim(), content: String(s.content || '').trim() }))
        .filter((s) => s.content || s.title);

      if (!slides.length) {
        return error('Failed to generate presentation outlines. Please try again.');
      }

      const title = String(parsed.title || slides[0]?.title || pres.title || 'Untitled').trim();
      pres.outlines = { title, slides };
      pres.title = title;
      pres.n_slides = slides.length;
      pres.status = 'outlined';
      if (searchResults.length > 0) {
        pres.sources = searchResults.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        }));
        pres.search_provider = searchProvider;
      }

      await savePresentation(env, user.id, pres);

      await deductCredits(user.id, OUTLINE_CREDIT_COST, env);

      await status('Outline ready');
      complete({ presentation: pres });
      fanOutWebhooks(env, user.id, { type: 'outline.completed', presentation_id: pres.id, title: pres.title });
    } catch (err) {
      return error(`Failed to generate presentation outlines: ${err?.message || 'unknown error'}`);
    }
  });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestGet(context);
};
