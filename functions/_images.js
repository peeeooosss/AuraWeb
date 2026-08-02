/**
 * Stock image search and placeholder generation.
 * Searches Pexels for stock photos; falls back to SVG placeholder on failure.
 */

const PEXELS_BASE = 'https://api.pexels.com/v1/search';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function sanitizeQuery(query) {
  return String(query || '')
    .replace(/[^\w\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

/**
 * Search Pexels for an image matching the prompt.
 * Returns the image URL string, or null on failure.
 */
export async function searchStockImage(env, query) {
  const key = env.PEXELS_API_KEY;
  if (!key) return null;

  const q = sanitizeQuery(query);
  if (!q) return null;

  try {
    const url = `${PEXELS_BASE}?query=${encodeURIComponent(q)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: key },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photos = data?.photos;
    if (!Array.isArray(photos) || !photos.length) return null;

    // Pick a random photo from the results for variety
    const photo = photos[Math.floor(Math.random() * photos.length)];
    // Use medium size for good quality without excessive bandwidth
    return photo?.src?.medium || photo?.src?.large || photo?.src?.original || null;
  } catch {
    return null;
  }
}

/**
 * Generate an SVG placeholder for an image element.
 * Returns a data URI string.
 */
export function placeholderImage(pal, prompt, isIcon) {
  const accent = (pal && pal.accent) || '#1E4CD9';
  const label = escapeXml(String(prompt || 'image').slice(0, 32));
  let svg;
  if (isIcon) {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="44" fill="${accent}"/></svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${accent}44"/><stop offset="100%" stop-color="${accent}99"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="300" font-family="Arial,Helvetica,sans-serif" font-size="30" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Process image elements in a slide's UI tree.
 * For each element with content_prompt but no data, fetch a stock image
 * or set a placeholder.
 */
export async function hydrateImages(env, ui, pal, template) {
  if (!ui?.components) return;

  // Step 1: Rewrite decorative paths AND clear placeholder paths FIRST
  if (template) {
    _rewriteDecorativeImagePaths(ui.components, template);
  }

  // Step 2: Now fetch stock photos for images with null data
  const contentTasks = [];
  const walk = (elems) => {
    for (const el of elems || []) {
      if (el.type === 'image' && !el.data) {
        const prompt = el.content_prompt || _deriveImagePrompt(el);
        if (prompt) {
          el.content_prompt = prompt;
          contentTasks.push(el);
        }
      }
      if (el.type === 'container' && el.child) walk([el.child]);
      if (el.type === 'flex' || el.type === 'grid' || el.type === 'group') {
        walk(el.children || []);
      }
    }
  };
  for (const comp of ui.components) walk(comp.elements || []);

  // Fetch content images in parallel (limited concurrency)
  const CONCURRENCY = 5;
  for (let i = 0; i < contentTasks.length; i += CONCURRENCY) {
    const batch = contentTasks.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (el) => {
        const q = el.is_icon ? `${el.content_prompt} icon` : el.content_prompt;
        const url = await searchStockImage(env, q);
        el.data = url || placeholderImage(pal, el.content_prompt, !!el.is_icon);
      }),
    );
  }
}

/**
 * Build a slide_assets payload for SSE events.
 * Collects all image elements with their prompts.
 */
export function buildSlideAssets(ui) {
  const assets = [];
  const walk = (elems) => {
    for (const el of elems || []) {
      if (el.type === 'image' && el.content_prompt) {
        assets.push({ prompt: el.content_prompt, data: el.data || null });
      }
      if (el.type === 'container' && el.child) walk([el.child]);
      if (el.type === 'flex' || el.type === 'grid' || el.type === 'group') {
        walk(el.children || []);
      }
    }
  };
  if (ui?.components) {
    for (const comp of ui.components) walk(comp.elements || []);
  }
  return assets;
}

/**
 * Derive an image search prompt from an element's name when no content_prompt exists.
 */
function _deriveImagePrompt(el) {
  if (!el || el.decorative === true) return null;
  if (el.name) {
    return String(el.name)
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return null;
}

/**
 * Rewrite decorative image data paths to point to the correct template asset URLs.
 * Template images like "static/image2-xxx.png" become
 * "/arena/templates/{template}/static/image2-xxx.png".
 * Placeholder paths like "/static/images/replaceable_template_image.png" are cleared
 * (they have no real file — content images already got null'd by _applyImageContent).
 */
function _rewriteDecorativeImagePaths(components, template) {
  if (!template) return;
  const walk = (elems) => {
    for (const el of elems || []) {
      if (el.type === 'image' && el.data && typeof el.data === 'string') {
        const data = el.data;

        // Already resolved — skip
        if (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('data:')) continue;

        // Placeholder paths — clear data so hydrateImages or frontend fallback handles them
        if (data.includes('/static/images/replaceable') || data.includes('/static/icons/placeholder')) {
          el.data = null;
          continue;
        }

        // Generic icons at /static/icons/ — try to resolve as template asset
        if (data.includes('/static/icons/')) {
          const idx = data.indexOf('static/icons/');
          if (idx >= 0) {
            el.data = `/arena/templates/${template}/${data.slice(idx)}`;
          }
          continue;
        }

        // Template asset paths like "static/image2-xxx.png" — rewrite to correct URL
        const idx = data.indexOf('static/');
        if (idx >= 0) {
          el.data = `/arena/templates/${template}/${data.slice(idx)}`;
        }
      }
      if (el.type === 'container' && el.child) walk([el.child]);
      if (el.type === 'flex' || el.type === 'grid' || el.type === 'group') {
        walk(el.children || []);
      }
    }
  };
  for (const comp of components) walk(comp.elements || []);
}
