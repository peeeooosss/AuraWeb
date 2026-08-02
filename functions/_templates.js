const TPL_PREFIX = 'tpl:data:';
const TPL_TTL = 6 * 3600;

export async function getTemplateData(env, request, templateId) {
  const cacheKey = `${TPL_PREFIX}${templateId}`;
  try {
    const cached = await env?.ARENA_KV?.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore cache errors
  }

  let base = '';
  if (request?.url) {
    base = new URL(request.url).origin;
  } else if (env?.CF_PAGES_URL) {
    base = env.CF_PAGES_URL.replace(/\/+$/, '');
  }
  const url = `${base}/arena/templates/${templateId}/template.json`;

  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }

  try {
    await env?.ARENA_KV?.put(cacheKey, JSON.stringify(data), { expirationTtl: TPL_TTL });
  } catch {
    // cache optional
  }
  return data;
}

export function getTemplateFonts(templateData) {
  const fonts = templateData?.fonts;
  if (!fonts || typeof fonts !== 'object') return null;
  const urls = Object.values(fonts).filter((v) => typeof v === 'string' && v.includes('fonts.googleapis.com'));
  if (!urls.length) return null;
  return `@import url('${urls.join("');\n@import url('")}');`;
}
