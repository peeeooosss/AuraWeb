const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_KEY || '';
const UNSPLASH_API = 'https://api.unsplash.com/search/photos';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export async function fetchStockImage(query, width = 800, height = 600) {
  if (!query) return null;

  // Try Unsplash API if key is available
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const res = await fetchWithTimeout(
        `${UNSPLASH_API}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const photo = data.results?.[0];
        if (photo?.urls?.regular) {
          return {
            url: photo.urls.regular,
            thumb: photo.urls?.thumb || null,
            alt: photo.alt_description || query,
            author: photo.user?.name || 'Unknown',
          };
        }
      }
    } catch {}
  }

  // Fallback: picsum.photos (CORS-friendly, no key needed)
  try {
    const seed = encodeURIComponent(query);
    const fallbackUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;
    // Verify the URL is reachable
    const res = await fetchWithTimeout(fallbackUrl, { method: 'HEAD' });
    if (res.ok) {
      return {
        url: fallbackUrl,
        thumb: null,
        alt: query,
        author: 'Picsum',
      };
    }
  } catch {}

  return null;
}

export async function fetchMultipleImages(queries, limit = 3) {
  const results = await Promise.allSettled(
    queries.slice(0, limit).map(q => fetchStockImage(q))
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : null);
}
