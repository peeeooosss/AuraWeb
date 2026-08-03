import { resolveModelAlias, FALLBACK_CHAIN } from './_models';

const ZENGO_URL = 'https://opencode.ai/zen/go/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-v4-pro';
const DEFAULT_FALLBACK_MODEL = 'deepseek-v4-flash';

export function llmConfig(env) {
  const apiKey = env?.ZENGO_API_KEY;
  const model = env?.ZENGO_MODEL || DEFAULT_MODEL;
  return { apiKey, model };
}

export function assertKey(env) {
  const { apiKey } = llmConfig(env);
  if (!apiKey) {
    throw new Error('No LLM API key configured (set ZENGO_API_KEY)');
  }
}

function buildBody(opts) {
  const body = {
    model: opts.model,
    messages: opts.messages,
    stream: !!opts.stream,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 4096,
  };
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  } else if (opts.responseFormat) {
    body.response_format = opts.responseFormat;
  }
  if (opts.extra) Object.assign(body, opts.extra);
  return body;
}

async function callZenGo(env, opts) {
  const { apiKey } = llmConfig(env);
  if (!apiKey) throw new Error('ZENGO_API_KEY is not configured');
  const body = buildBody(opts);
  const res = await fetch(ZENGO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ZenGo ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

function buildModelChain(requestedModel, env) {
  const primary = resolveModelAlias(requestedModel || env?.ZENGO_MODEL || DEFAULT_MODEL);
  const chain = [primary];
  if (FALLBACK_CHAIN[primary]) chain.push(FALLBACK_CHAIN[primary]);
  return [...new Set(chain)];
}

export async function llmChat(env, opts) {
  assertKey(env);
  const models = buildModelChain(opts.model, env);
  let lastErr;
  for (const model of models) {
    try {
      const res = await callZenGo(env, { ...opts, model });
      return { provider: 'zengo', res, model, usage: null };
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`LLM request failed: ${lastErr?.message || 'unknown error'}`);
}

function extractContent(data) {
  const msg = data.choices?.[0]?.message;
  if (!msg) return '';
  // Reasoning models (deepseek-v4-pro) put the final answer in content,
  // but when max_tokens is tight, content may be empty and reasoning_content
  // contains the generated JSON. Prefer content, fall back to reasoning_content.
  const content = msg.content;
  if (content && content.trim()) return content;
  const reasoning = msg.reasoning_content;
  if (reasoning && reasoning.trim()) return reasoning;
  return '';
}

export async function llmJson(env, opts) {
  const { res } = await llmChat(env, { ...opts, stream: false, jsonMode: true });
  const data = await res.json();
  return extractContent(data) || '';
}

export async function llmStructured(env, opts) {
  const { res } = await llmChat(env, { ...opts, stream: false, responseFormat: opts.responseFormat });
  const data = await res.json();
  const content = extractContent(data) || '{}';
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function llmText(env, opts) {
  const { res } = await llmChat(env, { ...opts, stream: false });
  const data = await res.json();
  return extractContent(data) || '';
}

/**
 * Non-streaming completion with full usage metadata.
 * Returns { content, model, usage: { input_tokens, output_tokens, total_tokens } }.
 */
export async function llmComplete(env, opts) {
  const { res, model } = await llmChat(env, { ...opts, stream: false });
  const data = await res.json();
  return {
    content: extractContent(data) || '',
    model,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

/**
 * Wrap a streaming response in a transform stream so we can both forward SSE
 * frames and capture the usage object the API emits in the final frame.
 */
export function streamWithUsage(res, onDelta) {
  const { readable, writable } = new TransformStream();
  const reader = res.body.getReader();
  const writer = writable.getWriter();
  const decoder = new TextDecoder();
  let buffer = '';

  const usagePromise = new Promise((resolve) => {
    let resolved = false;
    const resolveOnce = (usage) => {
      if (resolved) return;
      resolved = true;
      resolve(usage || null);
    };

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.close();
            resolveOnce(null);
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          let idx;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (line.startsWith('data:')) {
              const payload = line.slice(5).trim();
              if (payload && payload !== '[DONE]') {
                try {
                  const parsed = JSON.parse(payload);
                  if (parsed.usage) resolveOnce(parsed.usage);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta && onDelta) await onDelta(delta);
                } catch {
                  // ignore malformed frames
                }
              }
            }
          }
          await writer.write(value);
        }
      } catch (err) {
        try { writer.abort(err); } catch {}
        resolveOnce(null);
      }
    })();
  });

  return {
    response: new Response(readable, {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
    }),
    usagePromise,
  };
}

export async function streamChatDelta(res, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      if (payload === '[DONE]') return;
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) await onDelta(delta);
      } catch {
        // ignore malformed frames
      }
    }
  }
}
