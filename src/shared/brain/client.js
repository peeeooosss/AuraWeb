

const ZENGO_KEY = import.meta.env.VITE_ZENGO_KEY;
const ZENGO_URL = 'https://opencode.ai/zen/go/v1/chat/completions';

// ─── Model Registry ───────────────────────────────────────────────────────────
export const MODELS = {
  'deepseek-v4-pro':     { id: 'deepseek-v4-pro',     inputCost: 0.44, outputCost: 0.87, speed: 'medium', tier: 'paid' },
  'deepseek-v4-flash':   { id: 'deepseek-v4-flash',   inputCost: 0.09, outputCost: 0.18, speed: 'fast',   tier: 'paid' },
};

// ─── Model Lists by Tier (cost-ordered, free models first) ────────────────────
const TIER_MODELS = {
  student: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  creator: ['deepseek-v4-flash', 'deepseek-v4-pro'],
};

const DOCUMENT_FAST_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];

// ─── Query-Based Model Routing ────────────────────────────────────────────────
const QUERY_PATTERNS = {
  simple:      /^(hi|hello|hey|thanks|ok|yes|no|what is|define|who is|how are you|bye|good morning|good night)/i,
  math:        /\d+\s*[+\-*/^%]\s*\d+|integrate|differentiate|solve for|calculate|equation/i,
  document:    /(pdf|ppt|excel|doc|document|report|presentation|spreadsheet|slides)/i,
  code:        /(write|create|generate|code|function|script|program|implement|build|debug|fix|refactor)\b/i,
  education:   /(jee|neet|assam|apsc|cbse|icse|study|exam|syllabus|class|chapter|ncert)/i,
  youtube:     /(youtube|video|watch|summarize|transcript)/i,
  creative:    /(essay|article|blog|story|write|content|poem|speech|letter)/i,
  translation: /(translate|hindi|bengali|tamil|telugu|kannada|malayalam|marathi|gujarati)/i,
};

const QUERY_MODEL_BOOST = {
  simple:      ['deepseek-v4-flash'],
  math:        ['deepseek-v4-pro'],
  document:    ['deepseek-v4-flash'],
  code:        ['deepseek-v4-pro'],
  education:   ['deepseek-v4-pro'],
  youtube:     ['deepseek-v4-flash'],
  creative:    ['deepseek-v4-pro'],
  translation: ['deepseek-v4-pro'],
};

export function classifyQuery(message) {
  for (const [type, pattern] of Object.entries(QUERY_PATTERNS)) {
    if (pattern.test(message)) return type;
  }
  return 'default';
}

// ─── Model List Builder ───────────────────────────────────────────────────────

export function getModelList(tier = 'student') {
  const base = TIER_MODELS[tier] || TIER_MODELS.student;
  return base.map(key => MODELS[key]?.id).filter(Boolean);
}

function getModelsForQuery(query, tier) {
  const queryType = classifyQuery(query);
  const boost = QUERY_MODEL_BOOST[queryType] || [];
  const tierKeys = TIER_MODELS[tier] || TIER_MODELS.student;

  // Build priority list: boosted models first, then rest of tier
  const boostedIds = boost.map(k => MODELS[k]?.id).filter(Boolean);
  const tierIds = tierKeys.map(k => MODELS[k]?.id).filter(Boolean);

  // Dedupe: boosted first, then tier-ordered
  const seen = new Set();
  const result = [];
  for (const id of [...boostedIds, ...tierIds]) {
    if (!seen.has(id)) { seen.add(id); result.push(id); }
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isGarbageResponse(content) {
  if (!content) return true;
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  if (lower.length < 3) return true;
  if (lower.startsWith('user safety')) return true;
  if (lower === 'safe' || lower === 'unsafe') return true;
  if (lower.includes('content policy')) return true;
  if (lower.includes('i cannot') && lower.length < 50) return true;
  if (lower.startsWith('the user says') || lower.startsWith('the user is asking')) return true;
  if (lower.startsWith('we need to respond') || lower.startsWith('we should respond')) return true;
  if (lower.startsWith('the assistant should')) return true;
  if (lower.startsWith('the user wants') && lower.length < 100) return true;
  if (lower.startsWith('the user provided') && lower.length < 100) return true;
  const nonReasoning = stripThinkingTags(trimmed);
  if (nonReasoning.length < 10 && trimmed.length > 50) return true;
  return false;
}

function extractReasoning(content) {
  // Handle both <reasoning> and <think> tags from various providers
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) return thinkMatch[1].trim();
  const reasonMatch = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/i);
  if (reasonMatch) return reasonMatch[1].trim();
  return null;
}

function stripThinkingTags(content) {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
}

// ─── Cache Metrics ──────────────────────────────────────────────────────────

export function extractCacheMetrics(usage, model = '') {
  if (!usage) return { cachedTokens: 0, cacheWriteTokens: 0, cacheSavings: 0 };

  let cachedTokens = usage.prompt_cache_hit_tokens || 0;
  let cacheWriteTokens = usage.prompt_tokens_details?.cache_creation_input_tokens || 0;

  let cacheSavings = cachedTokens > 0 ? 0.90 : 0;

  return { cachedTokens, cacheWriteTokens, cacheSavings };
}

// ─── API Call ─────────────────────────────────────────────────────────────────

async function callModel(model, messages, maxTokens) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {
    const body = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    };

    const response = await fetch(ZENGO_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZENGO_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      const errBody = await response.text().catch(() => '');
      console.error(`[callModel] ${model} → ${response.status}: ${errBody.slice(0, 200)}`);
      if (response.status === 429) return { retry: true };
      if (response.status === 402) return { retry: true }; // Insufficient credits
      return null;
    }

    const data = await response.json();
    clearTimeout(timeoutId);
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage || null;

    if (!content || isGarbageResponse(content)) return null;

    // Strip <think> / <reasoning> tags and extract actual content
    const cleanContent = stripThinkingTags(content);

    if (!cleanContent || isGarbageResponse(cleanContent)) return null;

    // Extract cache metrics from usage (pass model for provider-specific handling)
    const cacheMetrics = extractCacheMetrics(usage, model);

    return { content: cleanContent, usage, cacheMetrics };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      console.warn(`[callModel] Timeout calling ${model}`);
    }
    return null;
  }
}

// ─── Streaming API Call ─────────────────────────────────────────────────────
// Reads the ZenGo SSE stream and invokes onDelta(deltaText, accumulated)
// as tokens arrive, so the UI can show real-time progress instead of a
// blind multi-minute wait.

async function callModelStream(model, messages, maxTokens, onDelta, { signal } = {}) {
  const controller = new AbortController();
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });
  let connectTimeoutId = setTimeout(() => controller.abort(), 10000);
  let overallTimeoutId = null;

  try {
    const body = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true,
    };

    const response = await fetch(ZENGO_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZENGO_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      clearTimeout(connectTimeoutId);
      const errBody = await response.text().catch(() => '');
      console.error(`[callModelStream] ${model} → ${response.status}: ${errBody.slice(0, 200)}`);
      if (response.status === 429) return { retry: true };
      if (response.status === 402) return { retry: true };
      return null;
    }

    if (!response.body) {
      clearTimeout(connectTimeoutId);
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let usage = null;
    let firstChunk = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (firstChunk) {
        clearTimeout(connectTimeoutId);
        // Safety net once streaming has started — generous ceiling for long HTML generations.
        overallTimeoutId = setTimeout(() => controller.abort(), 120000);
        firstChunk = false;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const deltaText = json.choices?.[0]?.delta?.content || '';
          // DeepSeek reasoning models may put content in reasoning_content during streaming
          const reasoningText = json.choices?.[0]?.delta?.reasoning_content || '';
          const text = deltaText || reasoningText;
          if (text) {
            accumulated += text;
            onDelta?.(text, accumulated);
          }
          if (json.usage) usage = json.usage;
        } catch {
          // partial/malformed SSE chunk — ignore and continue buffering
        }
      }
    }

    clearTimeout(connectTimeoutId);
    if (overallTimeoutId) clearTimeout(overallTimeoutId);

    if (!accumulated || isGarbageResponse(accumulated)) return null;

    // Strip <think> / <reasoning> tags and extract actual content
    const cleanContent = stripThinkingTags(accumulated);

    if (!cleanContent || isGarbageResponse(cleanContent)) return null;

    const cacheMetrics = extractCacheMetrics(usage, model);
    return { content: cleanContent, usage, cacheMetrics };
  } catch (err) {
    clearTimeout(connectTimeoutId);
    if (overallTimeoutId) clearTimeout(overallTimeoutId);
    if (err?.name === 'AbortError') {
      console.warn(`[callModelStream] Timeout calling ${model}`);
    }
    return null;
  }
}

// ─── Response Parser ──────────────────────────────────────────────────────────

export function parseResponse(content) {
  // Strip any <think> / <reasoning> tags that leaked through
  let jsonStr = stripThinkingTags(content.trim());

  // Try markdown code fences first
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  // Try to parse the extracted string
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && (parsed.text || parsed.type)) {
      return parsed;
    }
  } catch {}

  // Fallback: find JSON object in mixed content (text + JSON)
  const jsonPattern = /\{[\s\S]*"type"[\s\S]*\}/;
  const jsonMatch = content.match(jsonPattern);
  if (jsonMatch) {
    try {
      const cleaned = stripThinkingTags(jsonMatch[0]);
      const parsed = JSON.parse(cleaned);
      if (parsed && (parsed.text || parsed.type)) {
        return parsed;
      }
    } catch {}
  }

  return { text: content.trim(), type: null, content: null };
}

// ─── Token Cost Calculator ────────────────────────────────────────────────────

export function calculateCost(modelId, promptTokens, completionTokens, cacheMetrics = null) {
  const modelKey = Object.keys(MODELS).find(k => MODELS[k].id === modelId);
  if (!modelKey) return 0;
  const m = MODELS[modelKey];

  // Apply cache discount if available
  if (cacheMetrics && cacheMetrics.cachedTokens > 0 && cacheMetrics.cacheSavings > 0) {
    const uncachedTokens = promptTokens - cacheMetrics.cachedTokens;
    const cachedCost = cacheMetrics.cachedTokens * m.inputCost * (1 - cacheMetrics.cacheSavings);
    const uncachedCost = uncachedTokens * m.inputCost;
    return (uncachedCost + cachedCost + completionTokens * m.outputCost) / 1_000_000;
  }

  return (promptTokens * m.inputCost + completionTokens * m.outputCost) / 1_000_000;
}

// ─── Estimate tokens without AST (for dashboard comparison) ────────────────────

export function estimateTokensWithoutAST(messages) {
  // Simulate full context: system prompt (1500 tokens) + all examples (900) + full history (2000) + message
  const systemPromptTokens = 1500;
  const examplesTokens = 900;
  const messageTokens = Math.ceil((messages.map(m => m.content || '').join('\n').length || 0) / 4);
  return systemPromptTokens + examplesTokens + messageTokens;
}

// ─── Main Chat Function ───────────────────────────────────────────────────────

export async function chat(messages, { maxTokens = 2000, tier = 'student', isDocument = false } = {}) {
  try {
    const MAX_RETRIES = 1;
    const userMessage = messages[messages.length - 1]?.content || '';
    const queryType = classifyQuery(userMessage);
    const models = getModelsForQuery(userMessage, tier);
    // Code/education/creative answers can run long — give them more headroom than simple chat.
    const boostedTokens = ['code', 'creative', 'education'].includes(queryType) ? 3000 : maxTokens;
    const effectiveMaxTokens = isDocument ? Math.max(maxTokens, 6000) : boostedTokens;

    for (let pass = 0; pass <= MAX_RETRIES; pass++) {
      for (const model of models) {
        try {
          const result = await callModel(model, messages, effectiveMaxTokens);

          if (result?.retry) {
            await delay(2000 * Math.pow(2, pass));
            const retryResult = await callModel(model, messages, effectiveMaxTokens);
            if (retryResult?.content) {
              return {
                error: false,
                data: parseResponse(retryResult.content),
                usage: retryResult.usage || null,
                cacheMetrics: retryResult.cacheMetrics || null,
                model,
              };
            }
            continue;
          }

          if (result?.content) {
            return {
              error: false,
              data: parseResponse(result.content),
              usage: result.usage || null,
              cacheMetrics: result.cacheMetrics || null,
              model,
            };
          }
        } catch (e) {
          console.warn(`[chat] model ${model} threw:`, e);
          continue;
        }
      }

      if (pass < MAX_RETRIES) {
        await delay(3000 * (pass + 1));
      }
    }

    return {
      error: true,
      message: "All AI models are temporarily at maximum capacity. Please try again in a few seconds.",
      usage: null,
      cacheMetrics: null,
      model: null,
    };
  } catch (e) {
    console.error('[chat] unexpected error:', e);
    return {
      error: true,
      message: "Something went wrong with the AI service. Please try again.",
      usage: null,
      cacheMetrics: null,
      model: null,
    };
  }
}

// ─── Streaming Chat (for document/PPT generation) ─────────────────────────────
// Paid-only, fast-fail model list — no cascading through slow free-tier
// models. Streams tokens as they arrive via onDelta(deltaText, accumulated)
// so the UI can show real, live progress instead of a blind multi-minute wait.

export async function chatStream(messages, { maxTokens = 10000, tier = 'student', isDocument = false, onDelta, signal } = {}) {
  try {
    const models = isDocument
      ? DOCUMENT_FAST_MODELS.map(k => MODELS[k]?.id).filter(Boolean)
      : getModelsForQuery(messages[messages.length - 1]?.content || '', tier);

    const effectiveMaxTokens = isDocument ? Math.max(maxTokens, 10000) : maxTokens;

    for (const model of models) {
      try {
        const result = await callModelStream(model, messages, effectiveMaxTokens, onDelta, { signal });

        if (result?.retry) {
          await delay(1000);
          const retryResult = await callModelStream(model, messages, effectiveMaxTokens, onDelta, { signal });
          if (retryResult?.content) {
            return {
              error: false,
              data: parseResponse(retryResult.content),
              usage: retryResult.usage || null,
              cacheMetrics: retryResult.cacheMetrics || null,
              model,
            };
          }
          continue;
        }

        if (result?.content) {
          return {
            error: false,
            data: parseResponse(result.content),
            usage: result.usage || null,
            cacheMetrics: result.cacheMetrics || null,
            model,
          };
        }
      } catch (e) {
        console.warn(`[chatStream] model ${model} threw:`, e);
        continue;
      }
    }

    return {
      error: true,
      message: isDocument
        ? "Couldn't generate your document right now. Please try again in a moment."
        : "All AI models are temporarily at maximum capacity. Please try again in a few seconds.",
      usage: null,
      cacheMetrics: null,
      model: null,
    };
  } catch (e) {
    console.error('[chatStream] unexpected error:', e);
    return {
      error: true,
      message: "Something went wrong with the AI service. Please try again.",
      usage: null,
      cacheMetrics: null,
      model: null,
    };
  }
}


