// ─── Shared Fetch Utilities ─────────────────────────────────────────────────
// Consolidated fetch-to-base64 and image fetching utilities

/**
 * Fetch a URL and convert to base64 data URL
 * @param {string} url - The URL to fetch
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<string|null>} - Base64 data URL or null on failure
 */
export async function fetchUrlToBase64(url, timeoutMs = 8000) {
  if (!url) return null;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) return null;
    
    const blob = await res.blob();
    return blobToBase64(blob, timeoutMs);
  } catch {
    return null;
  }
}

/**
 * Convert a Blob to base64 data URL
 * @param {Blob} blob - The blob to convert
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<string|null>} - Base64 data URL or null on failure
 */
export function blobToBase64(blob, timeoutMs = 5000) {
  if (!blob) return null;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    const timeoutId = setTimeout(() => {
      reader.abort();
      resolve(null);
    }, timeoutMs);
    
    reader.onload = () => {
      clearTimeout(timeoutId);
      resolve(reader.result);
    };
    
    reader.onerror = () => {
      clearTimeout(timeoutId);
      resolve(null);
    };
    
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetch stock image from Unsplash or fallback to Picsum
 * @param {string} query - Search query
 * @param {string} accessKey - Unsplash API key (optional)
 * @returns {Promise<{url: string, thumb: string|null, alt: string}|null>}
 */
export async function fetchStockImage(query, accessKey = '') {
  if (!query) return null;
  
  // Try Unsplash API if key is available
  if (accessKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );
      
      if (res.ok) {
        const data = await res.json();
        const photo = data.results?.[0];
        if (photo?.urls?.regular) {
          return {
            url: photo.urls.regular,
            thumb: photo.urls?.thumb || null,
            alt: photo.alt_description || query,
          };
        }
      }
    } catch {}
  }
  
  // Fallback to Picsum (CORS-friendly)
  try {
    const seed = encodeURIComponent(query);
    const fallbackUrl = `https://picsum.photos/seed/${seed}/800/600`;
    const res = await fetch(fallbackUrl, { method: 'HEAD' });
    
    if (res.ok) {
      return {
        url: fallbackUrl,
        thumb: null,
        alt: query,
      };
    }
  } catch {}
  
  return null;
}

/**
 * Batch fetch multiple images
 * @param {string[]} queries - Array of search queries
 * @param {number} limit - Maximum number of images to fetch
 * @returns {Promise<(object|null)[]>}
 */
export async function fetchMultipleImages(queries, limit = 3) {
  const results = await Promise.allSettled(
    queries.slice(0, limit).map(q => fetchStockImage(q))
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : null);
}
