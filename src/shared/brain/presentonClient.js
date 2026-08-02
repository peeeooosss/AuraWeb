/**
 * TryAuraAI — Presenton API Client
 *
 * Talks to the gateway (/api/v1/generate) which authenticates
 * the user and forwards to the Presenton backend.
 *
 * For general chat, the existing client.js (OpenRouter) remains active.
 * Presentation generation routes exclusively through this module.
 */

const GATEWAY_URL = '/api/v1/generate';

/**
 * Generate a presentation synchronously.
 * @returns {{ presentation_id, path, edit_path }}
 */
export async function generatePresentation({
  content,
  nSlides = 8,
  language = 'English',
  template = 'general',
  exportAs = 'pptx',
  tone,
  instructions,
}) {
  const body = {
    content,
    n_slides: nSlides,
    language,
    template,
    export_as: exportAs,
  };
  if (tone) body.tone = tone;
  if (instructions) body.instructions = instructions;

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || err.detail || 'Generation failed');
  }

  return response.json();
}

/**
 * Generate outlines directly via Ollama (fast, no Docker required).
 * Returns { title, slides: [{ content }], mode: "ollama" }
 */
export async function generateOutlineOllama({
  content,
  nSlides = 8,
  language = 'English',
  tone,
  instructions,
  verbosity,
}) {
  const body = {
    content,
    n_slides: nSlides,
    language,
    mode: 'ollama',
  };
  if (tone) body.tone = tone;
  if (instructions) body.instructions = instructions;
  if (verbosity) body.verbosity = verbosity;

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || err.detail || 'Outline generation failed');
  }

  return response.json();
}

/**
 * Stream presentation generation progress (SSE).
 * Calls onEvent({ type, data }) for each SSE event.
 * @returns the final result
 */
export async function streamPresentation({
  content,
  nSlides = 8,
  language = 'English',
  template = 'general',
  tone,
  onEvent,
  signal,
}) {
  const body = {
    content,
    n_slides: nSlides,
    language,
    template,
    stream: true,
  };
  if (tone) body.tone = tone;

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || err.detail || 'Generation failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        if (json.type === 'complete') {
          result = json;
        }
        onEvent?.({ type: json.type || 'progress', data: json });
      } catch {
        // partial SSE chunk
      }
    }
  }

  return result;
}

/**
 * Download an exported presentation.
 */
export async function downloadPresentation(presentationId, format = 'pptx') {
  const url = `/api/v1/generate/export?presentation_id=${presentationId}&format=${format}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) throw new Error('Download failed');

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${presentationId}.${format}`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(blobUrl);
  a.remove();

  return true;
}

// ─── Auth token resolution ──────────────────────────────────────────────────

function getAuthToken() {
  // Try Supabase session token (available via supabase client)
  if (typeof window !== 'undefined') {
    try {
      const session = JSON.parse(localStorage.getItem('sb-wuaqawwclchnoqljsfao-auth-token') || '{}');
      if (session?.access_token) return session.access_token;
    } catch {}
  }

  // Try API key (B2B clients can set this)
  try {
    const apiKey = localStorage.getItem('aurai_api_key');
    if (apiKey) return apiKey;
  } catch {}

  return '';
}
