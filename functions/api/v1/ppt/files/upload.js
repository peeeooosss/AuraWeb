import { json, jsonError, getPresentation, savePresentation, nowIso } from '../../../../_lib';
import { requireUser } from '../../../../_auth';

const MAX_TOTAL_CHARS = 50000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function extractText(file) {
  const name = (file.name || '').toLowerCase();
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // TXT / MD — direct decode
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.json')) {
    return new TextDecoder('utf-8').decode(uint8);
  }

  // PDF — basic text extraction (scans for text streams, best-effort)
  if (name.endsWith('.pdf')) {
    const text = new TextDecoder('latin1').decode(uint8);
    const parts = [];
    const regex = /\/Text\s*\n?\s*<(.*?)>/gs;
    let match;
    while ((match = regex.exec(text)) !== null) {
      parts.push(match[1]);
    }
    // Also try BT/ET text operators
    const btRegex = /\bBT\s*\n(.*?)\n\s*ET\b/gs;
    while ((match = btRegex.exec(text)) !== null) {
      const block = match[1];
      const tjRegex = /<([0-9A-Fa-f]+)>/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        try {
          const hex = tjMatch[1].match(/.{1,2}/g).map((b) => String.fromCharCode(parseInt(b, 16))).join('');
          parts.push(hex);
        } catch {}
      }
      const literalRegex = /\(([^)]*)\)\s*Tj/g;
      let litMatch;
      while ((litMatch = literalRegex.exec(block)) !== null) {
        parts.push(litMatch[1]);
      }
    }
    const result = parts.join('\n').trim();
    if (result.length > 50) return result;
    return null;
  }

  // DOCX — ZIP container with word/document.xml
  if (name.endsWith('.docx')) {
    return _extractDocxText(uint8);
  }

  return null;
}

function _extractDocxText(uint8) {
  try {
    // Look for word/document.xml in ZIP (crude but works without full zip lib)
    const sig = new TextDecoder('ascii').decode(uint8.slice(0, 4));
    if (sig !== 'PK\u0003\u0004') return null;

    const text = new TextDecoder('latin1').decode(uint8);
    const docIdx = text.indexOf('word/document.xml');
    if (docIdx < 0) return null;

    // Find the compressed data for word/document.xml
    // Simple approach: extract all <w:t> text tags
    const wtRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
    const parts = [];
    let match;
    while ((match = wtRegex.exec(text)) !== null) {
      const val = match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      parts.push(val);
    }
    return parts.length > 0 ? parts.join(' ') : null;
  } catch {
    return null;
  }
}

export const onRequestPost = async ({ request, env }) => {
  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError('Expected multipart/form-data', 400);
  }

  const presentationId = formData.get('presentation_id');
  if (!presentationId) return jsonError('presentation_id is required', 400);

  const pres = await getPresentation(env, user.id, presentationId);
  if (!pres) return jsonError('Presentation not found', 404);

  const files = formData.getAll('files').filter((f) => f && typeof f !== 'string' && f.name);
  if (!files.length) return jsonError('No files provided', 400);

  const extracted = [];
  let totalChars = 0;
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      extracted.push({ name: file.name, type: file.type, error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` });
      continue;
    }
    try {
      const text = await extractText(file);
      if (text && text.trim()) {
        const trimmed = text.trim().slice(0, MAX_TOTAL_CHARS - totalChars);
        if (trimmed.length > 10) {
          extracted.push({ name: file.name, type: file.type, chars: trimmed.length, text: trimmed });
          totalChars += trimmed.length;
        } else {
          extracted.push({ name: file.name, type: file.type, chars: 0, error: 'No extractable text found' });
        }
      } else {
        extracted.push({ name: file.name, type: file.type, chars: 0, error: 'Could not extract text from this format' });
      }
    } catch (err) {
      extracted.push({ name: file.name, type: file.type, error: err.message });
    }
    if (totalChars >= MAX_TOTAL_CHARS) break;
  }

  if (totalChars > 0) {
    const fileText = extracted
      .filter((e) => e.text)
      .map((e) => `--- ${e.name} ---\n${e.text}`)
      .join('\n\n');
    const existing = pres.content || '';
    pres.content = existing ? `${existing}\n\n# From uploaded files:\n${fileText}` : fileText;
    pres.has_files = true;
    pres.updated_at = nowIso();
    await savePresentation(env, user.id, pres);
  }

  return json({
    id: pres.id,
    files: extracted.map((e) => ({ name: e.name, chars: e.chars || 0, error: e.error || null })),
    total_chars: totalChars,
  });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
