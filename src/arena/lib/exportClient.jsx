import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import HtmlSlideRenderer from '../components/HtmlSlideRenderer';

const W = 1280;
const H = 720;

function renderSlidesOffscreen(slides) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-99999px;top:0;z-index:-1;pointer-events:none;';
  const node = document.createElement('div');
  container.appendChild(node);
  document.body.appendChild(container);

  const root = createRoot(node);
  root.render(
    <div>
      {slides.map((slide, i) => (
        <div
          key={i}
          className="export-slide"
          style={{ width: W, height: H, overflow: 'hidden', background: '#fff' }}
        >
          <HtmlSlideRenderer slide={slide} fixedSize />
        </div>
      ))}
    </div>,
  );
  return { root, container, node };
}

export async function exportSlides({ slides, format = 'pptx', onProgress }) {
  const list = Array.isArray(slides) ? slides : [];
  if (!list.length) throw new Error('No slides to export');

  const { root, container, node } = renderSlidesOffscreen(list);
  try {
    await new Promise((r) => setTimeout(r, 150));
    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch {}
    }
    await new Promise((r) => setTimeout(r, 650));

    const els = Array.from(node.querySelectorAll('.export-slide'));
    const dataUrls = [];
    for (let i = 0; i < els.length; i += 1) {
      onProgress?.(i, els.length);
      const canvas = await html2canvas(els[i], {
        width: W,
        height: H,
        scale: 1,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: W,
        windowHeight: H,
        logging: false,
      });
      dataUrls.push(canvas.toDataURL('image/jpeg', 0.92));
    }
    onProgress?.(list.length, list.length);

    if (format === 'pptx') {
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
      pptx.layout = 'WIDE';
      dataUrls.forEach((url) => {
        const slide = pptx.addSlide();
        slide.addImage({ data: url, x: 0, y: 0, w: 13.333, h: 7.5 });
      });
      return await pptx.write('blob');
    }

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [W, H] });
    dataUrls.forEach((url, i) => {
      if (i > 0) pdf.addPage([W, H], 'landscape');
      pdf.addImage(url, 'JPEG', 0, 0, W, H);
    });
    return pdf.output('blob');
  } finally {
    try { root.unmount(); } catch {}
    container.remove();
  }
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
