import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  hasTemplateV2RenderableUi,
  TEMPLATE_V2_HTML_WIDTH,
  TEMPLATE_V2_HTML_HEIGHT,
  templateV2UiToHtmlFragment,
} from '../lib/templateV2JsonToHtml';

const useChartLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function readNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function chartValue(raw) {
  if (typeof raw === 'number') return raw;
  const record = readRecord(raw);
  const value = record.y ?? record.value ?? record.data;
  const numeric = readNumber(value);
  if (numeric != null) return numeric;
  const parsed = readNumber(raw);
  return parsed ?? 0;
}

function formatChartValue(value) {
  if (!Number.isFinite(value)) return '';
  if (Math.abs(value) >= 1000 && typeof Intl !== 'undefined' && Intl.NumberFormat) {
    return Intl.NumberFormat('en', { notation: 'compact' }).format(value);
  }
  return Math.abs(value) % 1 === 0 ? String(value) : String(Math.round(value * 10) / 10).replace(/\.0$/, '');
}

function formatAxisTick(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? formatChartValue(numeric) : String(value);
}

function hydrateScales(scales) {
  const scaleRecords = readRecord(scales);
  Object.values(scaleRecords).forEach(scaleValue => {
    const scale = readRecord(scaleValue);
    const ticks = readRecord(scale.ticks);
    if (ticks.presentonFormat) {
      ticks.callback = formatAxisTick;
      delete ticks.presentonFormat;
    }
    const radial = readRecord(scale.r);
    const radialTicks = readRecord(radial.ticks);
    if (radialTicks.presentonFormat) {
      radialTicks.callback = formatAxisTick;
      delete radialTicks.presentonFormat;
    }
  });
}

function barBorderRadius(rawValue, horizontal, radius = 7) {
  const value = chartValue(rawValue);
  if (horizontal) {
    return value < 0
      ? { bottomLeft: radius, bottomRight: 0, topLeft: radius, topRight: 0 }
      : { bottomLeft: 0, bottomRight: radius, topLeft: 0, topRight: radius };
  }
  return value < 0
    ? { bottomLeft: radius, bottomRight: radius, topLeft: 0, topRight: 0 }
    : { bottomLeft: 0, bottomRight: 0, topLeft: radius, topRight: radius };
}

function hydrateBarBorderRadii(config) {
  const datasets = Array.isArray(config.data?.datasets) ? config.data.datasets : [];
  datasets.forEach(dataset => {
    const options = readRecord(dataset.presentonBarRadius);
    if (!Object.keys(options).length) return;
    const horizontal = Boolean(options.horizontal);
    const radius = readNumber(options.radius) ?? 7;
    dataset.borderRadius = context => barBorderRadius(context?.raw, horizontal, radius);
    delete dataset.presentonBarRadius;
  });
}

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

function parseColor(color) {
  if (!color) return null;
  const hex = String(color).match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (hex) {
    const raw = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1];
    const v = Number.parseInt(raw, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 1];
  }
  const rgb = String(color).match(/^rgba?\(([^)]+)\)$/i);
  if (!rgb) return null;
  const ch = rgb[1].split(',').map(p => Number(p.trim()));
  if (ch.length < 3 || ch.slice(0, 3).some(Number.isNaN)) return null;
  return [clamp(ch[0], 0, 255), clamp(ch[1], 0, 255), clamp(ch[2], 0, 255), clamp(Number.isFinite(ch[3]) ? ch[3] : 1, 0, 1)];
}

function relativeLuminance(ch) {
  const m = ch.map(c => { const n = c / 255; return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); });
  return m[0] * 0.2126 + m[1] * 0.7152 + m[2] * 0.0722;
}

function contrastRatio(a, b) { return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }

function contrastTextColor(bg, fb) {
  const p = parseColor(bg);
  if (!p) return fb;
  const comp = [p[0], p[1], p[2]].map(c => c * p[3] + 255 * (1 - p[3]));
  const bgLum = relativeLuminance(comp);
  const darkContrast = contrastRatio(bgLum, relativeLuminance([16, 24, 40]));
  const lightContrast = contrastRatio(bgLum, relativeLuminance([255, 255, 255]));
  return lightContrast >= darkContrast ? '#FFFFFF' : '#101828';
}

function readDataLabelPosition(value) {
  return value === 'base' || value === 'mid' || value === 'outside' || value === 'top' ? value : 'top';
}

const presentonDataLabelPlugin = {
  id: 'presentonDataLabels',
  afterDatasetsDraw(chart, _args, options) {
    if (!options?.enabled) return;
    const ctx = chart.ctx;
    const fontSize = options.fontSize || 11;
    const outsideColor = options.color || '#475467';
    const position = readDataLabelPosition(options.position);
    ctx.save();
    ctx.font = `600 ${fontSize}px ${options.fontFamily || 'Inter, Arial, sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;
      const metaType = String(meta.type || '');

      meta.data.forEach((element, index) => {
        const raw = Array.isArray(dataset.data) ? dataset.data[index] : 0;
        const value = chartValue(raw);
        const label = formatChartValue(value);
        if (!label) return;

        if (metaType === 'bar') {
          const el = readRecord(element);
          const x = readNumber(el.x), y = readNumber(el.y), base = readNumber(el.base);
          const w = Math.abs(readNumber(el.width) || 0), h = Math.abs(readNumber(el.height) || 0);
          if (x == null || y == null || base == null) return;
          const textW = ctx.measureText(label).width;
          const pad = 5;
          const fits = options.horizontal ? w >= textW + pad * 2 && h >= fontSize * 1.35 : h >= fontSize * 1.65 && w >= textW + pad * 2;
          const pos = position === 'outside' || !fits ? 'outside' : position;
          if (pos !== 'outside') {
            ctx.fillStyle = contrastTextColor(dataset.backgroundColor?.[index], outsideColor);
            ctx.fillText(label, options.horizontal ? (pos === 'base' ? base + (value < 0 ? -1 : 1) * (textW / 2 + pad) : pos === 'top' ? x - (value < 0 ? -1 : 1) * (textW / 2 + pad) : (x + base) / 2) : x, options.horizontal ? y : (pos === 'base' ? base + (value < 0 ? 1 : -1) * (fontSize / 2 + pad) : pos === 'top' ? y - (value < 0 ? 1 : -1) * (fontSize / 2 + pad) : (y + base) / 2));
          } else {
            ctx.fillStyle = outsideColor;
            ctx.fillText(label, options.horizontal ? x + (value < 0 ? -1 : 1) * (textW / 2 + pad) : x, options.horizontal ? y : y + (value < 0 ? 1 : -1) * (fontSize / 2 + pad));
          }
          return;
        }

        const fallback = typeof element.tooltipPosition === 'function' ? element.tooltipPosition(true) : null;
        if (fallback) {
          ctx.fillStyle = outsideColor;
          ctx.fillText(label, fallback.x || 0, fallback.y || 0);
        }
      });
    });
    ctx.restore();
  },
};

let didRegister = false;

function registerPlugin() {
  if (didRegister || !window.Chart) return;
  try { window.Chart.register(presentonDataLabelPlugin); didRegister = true; } catch {}
}

export function shouldRenderTemplateV2Html(slide) {
  if (!slide || typeof slide !== 'object') return false;
  return hasTemplateV2RenderableUi(slide.ui);
}

export default function HtmlSlideRenderer({ slide, fixedSize = false, className = '', contentClassName = '' }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const html = useMemo(() => {
    if (!slide || typeof slide !== 'object') return null;
    return templateV2UiToHtmlFragment(slide.ui);
  }, [slide]);

  const htmlMarkup = useMemo(() => ({ __html: html ?? '' }), [html]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useChartLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || !html) return;

    let disposed = false;
    const charts = [];

    const renderCharts = () => {
      const canvases = Array.from(el.querySelectorAll('canvas[data-presenton-chart]'))
        .filter(c => c.getAttribute('data-chart-config'));
      if (!canvases.length) return;

      try {
        registerPlugin();
        canvases.forEach(canvas => {
          const configText = canvas.getAttribute('data-chart-config');
          if (!configText) return;
          const existing = window.Chart?.getChart?.(canvas);
          existing?.destroy();
          const config = JSON.parse(configText);
          config.options = { ...(config.options ?? {}), animation: false, responsive: false, maintainAspectRatio: false };
          hydrateScales(config.options?.scales);
          hydrateBarBorderRadii(config);
          const chart = new window.Chart(canvas, config);
          chart.update('none');
          charts.push(chart);
        });
      } catch (err) {
        console.error('Chart render error:', err);
      }
    };

    if (window.Chart) {
      renderCharts();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
      script.onload = () => { if (!disposed) renderCharts(); };
      document.head.appendChild(script);
    }

    return () => {
      disposed = true;
      charts.forEach(c => { try { c.destroy(); } catch {} });
    };
  }, [html]);

  const scale = fixedSize ? 1 : containerWidth ? Math.min((containerWidth / TEMPLATE_V2_HTML_WIDTH) * 0.98, 1) : 0;
  const previewHeight = TEMPLATE_V2_HTML_HEIGHT * (scale || 1);

  if (!html) {
    return (
      <div ref={containerRef} className={`relative flex aspect-video w-full items-center justify-center bg-white text-xs text-gray-500 ${className}`}
        style={fixedSize ? { width: TEMPLATE_V2_HTML_WIDTH, height: TEMPLATE_V2_HTML_HEIGHT } : undefined}>
        Preview unavailable
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden bg-white ${className}`}
      style={fixedSize ? { width: TEMPLATE_V2_HTML_WIDTH, height: TEMPLATE_V2_HTML_HEIGHT } : { height: scale ? previewHeight : undefined, aspectRatio: scale ? undefined : '16 / 9' }}>
      <div className={fixedSize ? 'absolute left-0 top-0' : 'absolute left-1/2 top-0'}
        style={{
          width: TEMPLATE_V2_HTML_WIDTH, height: TEMPLATE_V2_HTML_HEIGHT,
          transform: fixedSize ? undefined : `translateX(-50%) scale(${scale || 1})`,
          transformOrigin: fixedSize ? undefined : 'top center',
          opacity: scale ? 1 : 0,
        }}>
        <div ref={contentRef} className={`block h-full w-full bg-white ${contentClassName}`}
          style={{ pointerEvents: 'none' }} dangerouslySetInnerHTML={htmlMarkup} />
      </div>
    </div>
  );
}
