import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';
import { getAllSlideThemeCSS } from '@/shared/brain/slideThemes';

const PPTX_API_URL = import.meta.env.VITE_PPTX_API_URL || 'http://localhost:4567';
const PPTX_TIMEOUT_MS = 30000;
const MAX_HTML_SIZE = 50000;
const FORBIDDEN_TAGS = ['svg', 'canvas', 'iframe', 'script'];

/**
 * Validate HTML before sending to compiler.
 * @returns {{ isValid: boolean, errors: string[], cleaned: string }}
 */
function validateSlideHTML(html) {
  const errors = [];
  if (!html || !html.includes('<section')) {
    errors.push('No <section> slides found');
  }
  if (html && html.length > MAX_HTML_SIZE) {
    errors.push(`HTML too large (${(html.length/1024).toFixed(0)}KB, max ${(MAX_HTML_SIZE/1024).toFixed(0)}KB)`);
  }
  FORBIDDEN_TAGS.forEach(tag => {
    if (html && html.includes(`<${tag}`)) {
      errors.push(`Forbidden tag: <${tag}> (will crash compiler)`);
    }
  });
  // Strip forbidden tags for safe transport
  let cleaned = html || '';
  FORBIDDEN_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  return { isValid: errors.length === 0, errors, cleaned };
}

/**
 * Export HTML slides to PPTX.
 * Tries native Python backend first, falls back to html2canvas (rasterized).
 * @returns {{ method: 'native'|'fallback', filename: string }}
 */
export async function exportSlidesToPPTX(htmlContent, theme = 'glass-dark', filename = 'presentation.pptx') {
  if (!htmlContent) throw new Error('No HTML content to export');
  if (!filename.endsWith('.pptx')) filename += '.pptx';

  const { isValid, errors, cleaned } = validateSlideHTML(htmlContent);
  if (!isValid) {
    console.warn('Slide validation issues:', errors);
    // Try anyway with cleaned HTML — backend also sanitizes
  }

  const htmlToSend = cleaned || htmlContent;

  // ── Attempt 1: Native Python backend ──
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PPTX_TIMEOUT_MS);

    const response = await fetch(`${PPTX_API_URL}/export-pptx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: htmlToSend, theme, filename }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Backend error ${response.status}: ${errText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    return { method: 'native', filename };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`PPTX backend timed out after ${PPTX_TIMEOUT_MS}ms, using fallback`);
    } else {
      console.warn('Native PPTX export failed, using fallback:', err.message);
    }
  }

  // ── Attempt 2: html2canvas fallback (rasterized images) ──
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = filename.replace('.pptx', '');

  const sectionRegex = /<section[\s\S]*?<\/section>/gi;
  const sections = htmlContent.match(sectionRegex) || [htmlContent];

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 1280px; height: 720px; overflow: hidden; background: #09090B;
  `;
  document.body.appendChild(container);

  const styleEl = document.createElement('style');
  styleEl.textContent = getAllSlideThemeCSS();
  container.appendChild(styleEl);

  try {
    for (let i = 0; i < sections.length; i++) {
      const slideEl = document.createElement('div');
      slideEl.style.cssText = 'width: 1280px; height: 720px; position: relative; overflow: hidden;';
      slideEl.innerHTML = sections[i];
      container.appendChild(slideEl);

      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(slideEl, {
        width: 1280, height: 720, scale: 2,
        useCORS: true, allowTaint: true,
        backgroundColor: null, logging: false,
      });

      pptx.addSlide().addImage({ data: canvas.toDataURL('image/png'), x: 0, y: 0, w: 10, h: 5.63 });
      container.removeChild(slideEl);
    }

    await pptx.writeFile({ fileName: filename });
    return { method: 'fallback', filename };
  } finally {
    document.body.removeChild(container);
  }
}
