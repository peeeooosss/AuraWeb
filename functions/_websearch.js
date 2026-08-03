import { llmJson } from './_llm';

const MAX_RESULTS = 5;
const MAX_SNIPPET_CHARS = 300;

const PROVIDERS = [
  {
    id: 'exa',
    envKey: 'EXA_API_KEY',
    async search(env, query) {
      const key = env?.EXA_API_KEY;
      if (!key) throw new Error('EXA_API_KEY not configured');
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          query,
          numResults: MAX_RESULTS,
          type: 'neural',
          contents: { text: { maxCharacters: MAX_SNIPPET_CHARS } },
        }),
      });
      if (!res.ok) {
        if (res.status === 402 || res.status === 429) throw Object.assign(new Error('exa limit'), { quotaExhausted: true });
        throw new Error(`exa ${res.status}`);
      }
      const data = await res.json();
      return (data.results || []).map((r) => ({
        title: String(r.title || ''),
        url: String(r.url || ''),
        snippet: String(r.text || '').slice(0, MAX_SNIPPET_CHARS),
      }));
    },
  },
  {
    id: 'tavily',
    envKey: 'TAVILY_API_KEY',
    async search(env, query) {
      const key = env?.TAVILY_API_KEY;
      if (!key) throw new Error('TAVILY_API_KEY not configured');
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          query,
          search_depth: 'basic',
          max_results: MAX_RESULTS,
        }),
      });
      if (!res.ok) {
        if (res.status === 402 || res.status === 429) throw Object.assign(new Error('tavily limit'), { quotaExhausted: true });
        throw new Error(`tavily ${res.status}`);
      }
      const data = await res.json();
      return (data.results || []).map((r) => ({
        title: String(r.title || ''),
        url: String(r.url || ''),
        snippet: String(r.content || '').slice(0, MAX_SNIPPET_CHARS),
      }));
    },
  },
  {
    id: 'serper',
    envKey: 'SERPER_API_KEY',
    async search(env, query) {
      const key = env?.SERPER_API_KEY;
      if (!key) throw new Error('SERPER_API_KEY not configured');
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
        body: JSON.stringify({ q: query, num: MAX_RESULTS }),
      });
      if (!res.ok) {
        if (res.status === 402 || res.status === 429) throw Object.assign(new Error('serper limit'), { quotaExhausted: true });
        throw new Error(`serper ${res.status}`);
      }
      const data = await res.json();
      const organic = data.organic || [];
      return organic.map((r) => ({
        title: String(r.title || ''),
        url: String(r.link || ''),
        snippet: String(r.snippet || '').slice(0, MAX_SNIPPET_CHARS),
      }));
    },
  },
];

let _quotaExhausted = new Set();

function setQuotaExhausted(providerId) {
  _quotaExhausted.add(providerId);
  setTimeout(() => _quotaExhausted.delete(providerId), 5 * 60 * 1000);
}

/**
 * Generate a web search query from the user's presentation prompt.
 * Uses a cheap LLM call to extract the most useful search terms.
 */
export async function generateSearchQuery(env, prompt, language) {
  try {
    const raw = await llmJson(env, {
      messages: [
        {
          role: 'system',
          content: `Extract ONE concise search query (under 80 chars) from the user's presentation topic. Return ONLY: {"query":"..."}. Respond in ${language || 'English'}.`,
        },
        { role: 'user', content: `Presentation topic:\n${String(prompt || '').slice(0, 2000)}` },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });
    const cleaned = String(raw || '')
      .replace(/```(?:json)?/g, '')
      .trim();
    const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
    return String(parsed.query || '').slice(0, 120) || null;
  } catch {
    return null;
  }
}

/**
 * Search across all configured providers, falling through on failure.
 * Relies on per-provider env keys — only configured providers are used.
 * Returns { results, provider, fromCache }.
 */
export async function routeSearch(env, query, { userId, dailyCap = 30 } = {}) {
  if (!query || !query.trim()) return { results: [], provider: null };

  for (const provider of PROVIDERS) {
    if (_quotaExhausted.has(provider.id)) continue;
    if (!env?.[provider.envKey]) continue;

    try {
      const results = await provider.search(env, query.trim());
      if (results.length > 0) {
        return { results, provider: provider.id };
      }
    } catch (err) {
      if (err.quotaExhausted) {
        setQuotaExhausted(provider.id);
        continue;
      }
    }
  }

  return { results: [], provider: null };
}

/**
 * Format search results into a string for injection into the LLM prompt.
 */
export function formatSearchResults(results) {
  if (!results.length) return '';
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    ${r.snippet}\n    Source: ${r.url}`,
    )
    .join('\n\n');
}
