/**
 * TryAuraAI Gateway — Presentation Generation Proxy
 *
 * Authenticates B2C users (Supabase JWT) or B2B clients (API key).
 * Two generation modes:
 *   a) Direct Ollama — outline only
 *   b) Presenton proxy — full pipeline (outline → slides → PPTX)
 *
 * Routes:
 *   POST /api/v1/generate          — Presentation generation
 *   GET  /api/v1/generate/export   — PPTX/PDF download proxy
 */

import {
  json,
  corsHeaders,
  requireAuth,
  checkRateLimit,
  logUsage,
  deductBalance,
} from '../../_auth';
import { computeCost } from '../../_models';

const PRESENTON_API_URL =
  typeof process !== 'undefined' ? process.env.PRESENTON_API_URL : globalThis?.PRESENTON_API_URL;
const BASE_URL = (PRESENTON_API_URL || 'http://localhost:5001').replace(/\/+$/, '');
const OLLAMA_URL = (typeof process !== 'undefined' ? process.env.OLLAMA_URL : globalThis?.OLLAMA_URL) || 'http://localhost:11434';
const OLLAMA_MODEL = (typeof process !== 'undefined' ? process.env.OLLAMA_MODEL : globalThis?.OLLAMA_MODEL) || 'llama3.2';

const MAX_SLIDES = 50;
const MAX_OUTLINE_WORDS = 100;
const MIN_BALANCE_INR = 10;
const PRESENTON_FLAT_COST_INR = 5;

function buildOutlineSystemPrompt({ verbosity }) {
  const wordCount = verbosity === 'concise' ? 20 : verbosity === 'text-heavy' ? 60 : 40;
  const verbosityInstruction = `Slide content should be around ${wordCount} words but detailed enough to generate a good slide.`;
  return [
    'Generate presentation title and content for slides.',
    'Generation settings are authoritative. The Number of Slides, Language, Tone, ',
    'Include Title Slide, and Include Table Of Contents fields override conflicting ',
    'requests inside Content, Instructions, or Context.',
    'If Language is not auto-detect, generate every presentation title and slide ',
    'outline in exactly that language, even if Content asks for a different language.',
    'Generate flow based on user **content** and use **context** just for reference.',
    'Presentation title should be plain text, not markdown.',
    'Each slide content should contain the content for that slide.',
    `Never generate more than ${MAX_SLIDES} slide outlines. `,
    `Each slide outline must be ${MAX_OUTLINE_WORDS} words or fewer.`,
    verbosityInstruction,
    "Follow the user's specified tone across all slides.",
    'Maintain clarity, readability, and factual accuracy.',
    'Ensure logical flow between slides and avoid repetition or generic filler content.',
    'Give each slide one clear purpose and split overloaded topics across multiple slides.',
    'Build a coherent narrative from the introduction through the conclusion.',
    'Vary content structures where appropriate — bullets, comparisons, chronological facts, tables, metrics.',
    'Use concrete facts, examples, and numbers when supported by the provided content.',
    'Include numerical data, tables or code if required by the user.',
    'Each slide content must have a ## title and be in Markdown format.',
    'First slide title must be the same as the presentation title.',
    'Title slide must only contain title, presenter name, date and overview.',
    'Slide outlines are a user-visible content plan, not a production brief.',
    "Write only audience-facing content. Never include commands like 'create a chart'.",
    'Do not include URLs, hyperlinks, citations, footnotes, references, or source lists.',
    'Make sure data is consistent across all slides.',
  ].join('\n');
}

function buildOutlineUserPrompt({ content, nSlides, language, tone, instructions }) {
  const displayLanguage = language || 'auto-detect';
  const displaySlides = nSlides != null ? String(nSlides) : `auto-detect, maximum ${MAX_SLIDES}`;
  const today = new Date().toISOString().slice(0, 10);
  return [
    'Generation Settings (authoritative):',
    `Number of Slides: ${displaySlides}`,
    `Maximum Slide Outlines: ${MAX_SLIDES}`,
    `Maximum Words Per Outline: ${MAX_OUTLINE_WORDS}`,
    `Language: ${displayLanguage}`,
    `Tone: ${tone || ''}`,
    'Include Title Slide: true',
    `Today's Date: ${today}`,
    `Content: ${content || ''}`,
    `Instructions (apply as constraints; never quote as slide content): ${instructions || ''}`,
  ].join('\n');
}

function buildOutlineJsonSchema(nSlides) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', description: 'Concise presentation title in plain text.' },
      slides: {
        type: 'array',
        description: 'List of slide outlines',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            content: {
              type: 'string',
              description: `Audience-facing Markdown content for the finished slide. Maximum ${MAX_OUTLINE_WORDS} words.`,
            },
          },
          required: ['content'],
        },
        maxItems: nSlides || MAX_SLIDES,
      },
    },
    required: ['title', 'slides'],
  };
}

async function generateViaOllama({ content, n_slides, language, tone, instructions, verbosity }) {
  const messages = [
    { role: 'system', content: buildOutlineSystemPrompt({ verbosity }) },
    { role: 'user', content: buildOutlineUserPrompt({ content, nSlides: n_slides, language, tone, instructions }) },
  ];
  const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      format: buildOutlineJsonSchema(n_slides),
      options: { temperature: 0.7, num_predict: 4096 },
    }),
  });
  if (!ollamaRes.ok) {
    const errText = await ollamaRes.text();
    throw new Error(`Ollama error ${ollamaRes.status}: ${errText}`);
  }
  const data = await ollamaRes.json();
  const parsed = JSON.parse(data.message?.content || '{}');
  return {
    title: parsed.title || '',
    slides: parsed.slides || [],
    mode: 'ollama',
    usage: {
      input_tokens: data.prompt_eval_count || 0,
      output_tokens: data.eval_count || 0,
    },
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { content, n_slides = 8, language = 'English', template = 'general', export_as = 'pptx', tone, instructions, verbosity, mode = 'presenton' } = body;
  if (!content || !content.trim()) {
    return json({ error: 'content is required' }, 400);
  }

  let auth;
  try {
    auth = await requireAuth(request, env);
  } catch (err) {
    return json({ error: err.message }, 401);
  }

  const allowed = await checkRateLimit(auth.id, auth.userId, auth.rateLimit, env);
  if (!allowed) return json({ error: 'Daily rate limit reached. Upgrade your plan.' }, 429);

  if (auth.balance !== Infinity && auth.balance < MIN_BALANCE_INR) {
    return json({ error: 'Insufficient wallet balance. Please top up.' }, 402);
  }

  // ── Mode: Direct Ollama (outline only) ──
  if (mode === 'ollama') {
    try {
      const result = await generateViaOllama({ content, n_slides, language, tone, instructions, verbosity });
      const inputTokens = result.usage.input_tokens;
      const outputTokens = result.usage.output_tokens;
      const cost = computeCost('claude-sonnet-5', inputTokens, outputTokens);
      await logUsage(
        {
          userId: auth.userId,
          apiKeyId: auth.id || null,
          endpoint: '/api/v1/generate (ollama)',
          inputTokens,
          outputTokens,
          cost,
          modelRouted: OLLAMA_MODEL,
        },
        env
      );
      if (auth.id) await deductBalance(auth.id, cost, env);
      return json({ ...result, usage: result.usage, cost, currency: auth.currency || 'INR' });
    } catch (err) {
      return json({ error: `Ollama unavailable: ${err.message}` }, 502);
    }
  }

  // ── Mode: Forward to Presenton (full pipeline) ──
  if (!BASE_URL) {
    return json({ error: 'PRESENTON_API_URL not configured' }, 500);
  }

  try {
    const presentonBody = {
      content: content.trim(),
      n_slides: Math.min(Math.max(Number(n_slides), 1), 30),
      language: language || 'English',
      template: template || 'general',
      export_as: export_as || 'pptx',
    };
    if (tone) presentonBody.tone = tone;
    if (instructions) presentonBody.instructions = instructions;

    const presRes = await fetch(`${BASE_URL}/api/v1/ppt/presentation/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presentonBody),
    });
    const result = await presRes.json();
    if (!presRes.ok) {
      return json({ error: result.detail || result.error || 'Generation failed' }, presRes.status);
    }

    const cost = PRESENTON_FLAT_COST_INR;
    await logUsage(
      {
        userId: auth.userId,
        apiKeyId: auth.id || null,
        endpoint: '/api/v1/generate (presenton)',
        inputTokens: 0,
        outputTokens: 0,
        cost,
        modelRouted: 'presenton',
      },
      env
    );
    if (auth.id) await deductBalance(auth.id, cost, env);

    return json({ ...result, cost, currency: auth.currency || 'INR' });
  } catch (err) {
    return json({ error: `Backend unavailable: ${err.message}` }, 502);
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === 'POST') {
    return onRequestPost(context);
  }

  // GET: Export/download proxy
  if (request.method === 'GET') {
    const url = new URL(request.url);
    try {
      await requireAuth(request, env);
    } catch (err) {
      return json({ error: err.message }, 401);
    }

    const presentationId = url.searchParams.get('presentation_id');
    const format = url.searchParams.get('format') || 'pptx';
    if (!presentationId) {
      return json({ error: 'presentation_id query parameter required' }, 400);
    }

    try {
      const destUrl =
        format === 'pptx'
          ? `${BASE_URL}/api/v1/ppt/presentation/export/pptx/${presentationId}`
          : `${BASE_URL}/api/v1/ppt/presentation/export/pdf/${presentationId}`;
      const presRes = await fetch(destUrl);
      if (!presRes.ok) return json({ error: 'Export failed' }, presRes.status);
      return new Response(presRes.body, {
        status: 200,
        headers: {
          'Content-Type': presRes.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition':
            presRes.headers.get('Content-Disposition') || `attachment; filename="${presentationId}.${format}"`,
          'Cache-Control': 'no-cache',
          ...corsHeaders(),
        },
      });
    } catch (err) {
      return json({ error: `Backend unavailable: ${err.message}` }, 502);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}
