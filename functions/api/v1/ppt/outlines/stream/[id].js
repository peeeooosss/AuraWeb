import { jsonError, getPresentation, savePresentation, sseStream, cleanJsonText, clamp } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';
import { llmChat, streamChatDelta, assertKey } from '../../../../../_llm';

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
    'Use concrete facts and numbers when supported by the user content.',
    'Never include URLs, citations, footnotes, or source lists.',
    'Write only audience-facing content.',
    'Ensure data is consistent across all slides.',
  ].join('\n');
}

function buildUserPrompt({ content, nSlides, language, tone, instructions }) {
  const today = new Date().toISOString().slice(0, 10);
  return [
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
  ].join('\n');
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

    let accumulated = '';
    let cleaned = null;

    try {
      await status('Preparing your presentation outline...');

      const nSlides = clamp(Number(pres.n_slides) || 8, 1, MAX_SLIDES);
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
          }),
        },
      ];

      await status('Writing your slide outlines...');

      const { res } = await llmChat(env, { messages, stream: true, temperature: 0.7, max_tokens: 6000 });
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

      await savePresentation(env, user.id, pres);

      await status('Outline ready');
      complete({ presentation: pres });
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
