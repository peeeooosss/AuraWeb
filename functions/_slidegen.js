import { genId, clamp } from './_lib';

const W = 1280;
const H = 720;

const GF = {
  Poppins: 'family=Poppins:wght@400;500;600;700',
  Montserrat: 'family=Montserrat:wght@400;500;600;700;800',
  Anton: 'family=Anton',
  'DM Sans': 'family=DM+Sans:wght@400;500;700',
  Lato: 'family=Lato:wght@400;700;900',
  'Playfair Display': 'family=Playfair+Display:wght@400;600;700',
  'Albert Sans': 'family=Albert+Sans:wght@400;500;600;700',
  Inter: 'family=Inter:wght@400;500;600;700',
};

const PALETTES = {
  general: {
    bg: '#FFFFFF', fg: '#111827', muted: '#4B5563', accent: '#9333EA', accent2: '#C084FC', soft: '#F5F3FF',
    displayFont: 'Poppins', bodyFont: 'Poppins', dark: false,
  },
  modern: {
    bg: '#F5F8FE', fg: '#334155', muted: '#64748B', accent: '#1E4CD9', accent2: '#3B82F6', soft: '#E4EDFB',
    displayFont: 'Montserrat', bodyFont: 'Montserrat', dark: false,
  },
  executive: {
    bg: '#FFFFFF', fg: '#000000', muted: '#5F4F9B', accent: '#8958F4', accent2: '#9081C8', soft: '#F5F2FA',
    displayFont: 'Anton', bodyFont: 'DM Sans', dark: false,
  },
  momentum: {
    bg: '#F6F7FC', fg: '#101323', muted: '#2E3545', accent: '#1A3DB3', accent2: '#2344B8', soft: '#E7ECFB',
    displayFont: 'Anton', bodyFont: 'Lato', dark: false,
  },
  dynamic: {
    bg: '#111111', fg: '#FFFFFF', muted: '#D9D9D9', accent: '#FD7536', accent2: '#F4511E', soft: '#242424',
    displayFont: 'Montserrat', bodyFont: 'Montserrat', dark: true,
  },
  standard: {
    bg: '#FFFFFF', fg: '#111827', muted: '#6B7280', accent: '#1B8C2D', accent2: '#168C2A', soft: '#E8F5EC',
    displayFont: 'Playfair Display', bodyFont: 'Inter', dark: false,
  },
  swift: {
    bg: '#FFFFFF', fg: '#111827', muted: '#6B7280', accent: '#111827', accent2: '#06B6D4', soft: '#EFFCFF',
    displayFont: 'Albert Sans', bodyFont: 'Albert Sans', dark: false,
  },
};

const DEFAULT_PALETTE = PALETTES.general;

export function getPalette(template) {
  return PALETTES[template] || DEFAULT_PALETTE;
}

export function fontCss(pal) {
  const families = new Set();
  if (GF[pal.displayFont]) families.add(GF[pal.displayFont]);
  if (GF[pal.bodyFont]) families.add(GF[pal.bodyFont]);
  if (!families.size) return '';
  return `@import url('https://fonts.googleapis.com/css2?${Array.from(families).join('&')}&display=swap');`;
}

function t(x, y, w, h, value, o = {}) {
  const item = {
    type: 'text',
    position: { x, y },
    size: { width: w, height: h },
    text: String(value ?? ''),
    font: {
      family: o.family,
      size: o.size ?? 20,
      color: o.color,
      bold: !!o.bold,
      italic: !!o.italic,
      lineHeight: o.lineHeight,
      letterSpacing: o.letterSpacing,
    },
    alignment: { horizontal: o.align || 'left', vertical: o.valign || 'top' },
  };
  if (o.opacity != null) item.font.opacity = o.opacity;
  return item;
}

function r(x, y, w, h, o = {}) {
  return {
    type: 'container',
    position: { x, y },
    size: { width: w, height: h },
    fill: { color: o.color, opacity: o.opacity ?? 1 },
    borderRadius: { tl: o.radius ?? 0, tr: o.radius ?? 0, br: o.radius ?? 0, bl: o.radius ?? 0 },
    child: null,
  };
}

function ul(x, y, w, h, items, o = {}) {
  return {
    type: 'text-list',
    marker: o.marker ?? 'bullet',
    items: (items || []).map((it) => ({ text: String(it) })),
    position: { x, y },
    size: { width: w, height: h },
    font: { family: o.family, size: o.size ?? 18, color: o.color, lineHeight: o.lineHeight ?? 1.35 },
  };
}

function col(x, y, w, h, children, o = {}) {
  return {
    type: 'flex', direction: 'column', position: { x, y }, size: { width: w, height: h },
    gap: o.gap ?? 0, alignItems: o.alignItems ?? 'stretch', justifyContent: o.justify ?? 'flex-start', children,
  };
}

function row(x, y, w, h, children, o = {}) {
  return {
    type: 'flex', direction: 'row', position: { x, y }, size: { width: w, height: h },
    gap: o.gap ?? 0, alignItems: o.alignItems ?? 'center', justifyContent: o.justify ?? 'flex-start', children,
  };
}

function grp(x, y, w, h, children) {
  return { type: 'group', position: { x, y }, size: { width: w, height: h }, children };
}

function numCircle(x, y, size, label, o = {}) {
  return {
    type: 'container',
    position: { x, y },
    size: { width: size, height: size },
    fill: { color: o.color, opacity: 1 },
    borderRadius: { tl: size / 2, tr: size / 2, br: size / 2, bl: size / 2 },
    alignment: { horizontal: 'center', vertical: 'middle' },
    child: {
      type: 'text',
      text: String(label),
      size: { width: size, height: size },
      font: { family: o.family, size: o.size ?? 15, color: '#FFFFFF', bold: true },
      alignment: { horizontal: 'center', vertical: 'middle' },
    },
  };
}

function headingBlock(title, pal, extraY = 0) {
  const y = 64 + extraY;
  return [
    t(90, y, 1100, 60, title, { size: 40, bold: true, color: pal.fg, family: pal.displayFont, valign: 'middle' }),
    r(92, y + 72, 72, 6, pal.accent, { radius: 3 }),
  ];
}

function buildPoints(colX, colW, points, pal, startIdx) {
  const items = [];
  let y = 220;
  const gap = 34;
  points.forEach((p, i) => {
    const heading = p.heading || p.title || '';
    const body = p.body || p.detail || '';
    const rowH = body ? 96 : 52;
    const children = [
      numCircle(colX, y + 4, 36, startIdx + i + 1, { color: pal.accent, family: pal.bodyFont, size: 15 }),
      t(colX + 56, y, colW - 56, 36, heading, { size: 21, bold: true, color: pal.fg, family: pal.bodyFont, valign: 'middle' }),
    ];
    if (body) children.push(t(colX + 56, y + 40, colW - 56, 48, body, { size: 15, color: pal.muted, family: pal.bodyFont, lineHeight: 1.4 }));
    items.push(grp(colX, y, colW, rowH, children));
    y += rowH + gap;
  });
  return items;
}

function buildTitleSlide(plan, pal, meta) {
  const titleColor = pal.dark ? '#FFFFFF' : pal.fg;
  const panel = pal.dark ? pal.soft : pal.accent;
  const panelText = pal.dark ? pal.fg : '#FFFFFF';
  return {
    components: [
      r(740, 0, 540, H, { color: panel }),
      r(0, 0, W, 10, { color: pal.accent }),
      t(90, 250, 620, 190, plan.title, { size: 62, bold: true, color: titleColor, family: pal.displayFont, valign: 'middle', lineHeight: 1.08 }),
      r(94, 452, 90, 10, pal.accent, { radius: 5 }),
      t(90, 486, 590, 90, plan.subtitle || '', { size: 22, color: pal.muted, family: pal.bodyFont, valign: 'top', lineHeight: 1.35 }),
      t(90, 600, 590, 44, meta, { size: 16, color: pal.muted, family: pal.bodyFont, valign: 'middle' }),
      t(770, 210, 480, 320, String(plan.eyebrow ?? plan.index ?? '01'), {
        size: 130, bold: true, color: panelText, family: pal.displayFont, align: 'center', valign: 'middle', opacity: 0.9,
      }),
      t(770, 560, 480, 60, plan.tagline || '', { size: 17, color: panelText, family: pal.bodyFont, align: 'center', valign: 'middle', opacity: 0.8 }),
    ],
  };
}

function buildSectionSlide(plan, pal) {
  return {
    components: [
      r(0, 0, 500, H, { color: pal.accent }),
      t(64, 300, 380, 170, plan.title, { size: 54, bold: true, color: '#FFFFFF', family: pal.displayFont, valign: 'middle', lineHeight: 1.1 }),
      t(66, 484, 380, 70, plan.subtitle || '', { size: 18, color: '#FFFFFF', family: pal.bodyFont, valign: 'top', lineHeight: 1.35, opacity: 0.85 }),
      t(700, 170, 500, 400, String(plan.index ?? ''), {
        size: 240, bold: true, color: pal.dark ? pal.soft : pal.accent2, family: pal.displayFont, align: 'center', valign: 'middle', opacity: pal.dark ? 0.7 : 0.14,
      }),
      t(700, 610, 500, 50, pal.dark ? plan.title : '', { size: 16, color: pal.muted, family: pal.bodyFont, align: 'center', valign: 'middle', opacity: 0.6 }),
    ],
  };
}

function buildBulletsSlide(plan, pal) {
  const points = normalizePoints(plan.points);
  const twoCol = plan.layout === 'two_column' && points.length > 3;
  const components = headingBlock(plan.title, pal);
  if (!points.length) {
    components.push(t(90, 230, 1100, 400, plan.body || '', { size: 22, color: pal.muted, family: pal.bodyFont, valign: 'top', lineHeight: 1.5 }));
    return { components };
  }
  if (twoCol) {
    const half = Math.ceil(points.length / 2);
    components.push(...buildPoints(90, 540, points.slice(0, half), pal, 0));
    components.push(...buildPoints(650, 540, points.slice(half), pal, half));
  } else {
    components.push(...buildPoints(90, 1100, points, pal, 0));
  }
  return { components };
}

function buildStatsSlide(plan, pal) {
  const items = normalizeStats(plan);
  const components = headingBlock(plan.title, pal);
  const area = { x: 90, y: 210, w: 1100, h: 430 };
  const n = Math.max(1, items.length);
  const gap = 26;
  const cardW = Math.floor((area.w - gap * (n - 1)) / n);
  const cards = items.slice(0, 6).map((it, i) =>
    grp(0, 0, cardW, area.h, [
      r(0, 0, cardW, area.h, { color: pal.soft, radius: 20 }),
      t(30, 150, cardW - 60, 120, it.value, { size: 54, bold: true, color: pal.accent, family: pal.displayFont, align: 'center', valign: 'middle' }),
      t(30, 286, cardW - 60, 100, it.label, { size: 16, color: pal.fg, family: pal.bodyFont, align: 'center', valign: 'top', lineHeight: 1.3 }),
    ]),
  );
  components.push(row(area.x, area.y, area.w, area.h, cards, { gap, alignItems: 'stretch' }));
  return { components };
}

function buildTableSlide(plan, pal) {
  const columns = (plan.columns || []).slice(0, 6);
  const rows = (plan.rows || []).slice(0, 12).map((rowItems) => rowItems.slice(0, 6));
  const components = headingBlock(plan.title, pal);
  components.push({
    type: 'table',
    position: { x: 90, y: 210 },
    size: { width: 1100, height: 420 },
    columns: columns.map((c) => ({
      text: String(c),
      font: { family: pal.bodyFont, size: 17, color: '#FFFFFF', bold: true },
      color: { color: pal.accent, opacity: 1 },
    })),
    rows: rows.map((cell) => ({
      text: String(cell),
      font: { family: pal.bodyFont, size: 15, color: pal.fg },
    })),
    font: { family: pal.bodyFont, size: 15, color: pal.fg, line_height: 1.2 },
  });
  return { components };
}

function buildQuoteSlide(plan, pal) {
  return {
    components: [
      t(90, 120, 120, 120, '\u201C', { size: 110, bold: true, color: pal.accent, family: pal.displayFont, valign: 'middle' }),
      t(140, 190, 1000, 280, plan.quote || plan.text || '', { size: 34, color: pal.fg, family: pal.displayFont, align: 'center', valign: 'middle', lineHeight: 1.35 }),
      r(590, 500, 100, 6, pal.accent, { radius: 3 }),
      t(140, 530, 1000, 60, plan.author || '', { size: 18, color: pal.muted, family: pal.bodyFont, align: 'center', valign: 'middle' }),
    ],
  };
}

function buildClosingSlide(plan, pal, meta) {
  const titleColor = pal.dark ? '#FFFFFF' : pal.fg;
  const panel = pal.dark ? pal.soft : pal.accent;
  return {
    components: [
      r(0, 0, 460, H, { color: panel }),
      t(0, 0, 460, H, String(plan.eyebrow ?? '\u2726'), { size: 90, bold: true, color: pal.dark ? pal.fg : '#FFFFFF', family: pal.displayFont, align: 'center', valign: 'middle', opacity: 0.9 }),
      t(520, 240, 660, 180, plan.title || 'Thank You', { size: 64, bold: true, color: titleColor, family: pal.displayFont, valign: 'middle', lineHeight: 1.1 }),
      r(524, 436, 90, 10, pal.accent, { radius: 5 }),
      t(520, 470, 660, 100, plan.subtitle || '', { size: 22, color: pal.muted, family: pal.bodyFont, valign: 'top', lineHeight: 1.35 }),
      t(520, 620, 660, 44, meta, { size: 16, color: pal.muted, family: pal.bodyFont, valign: 'middle' }),
    ],
  };
}

function normalizePoints(points) {
  return (points || []).map((p) => (typeof p === 'string' ? { heading: p, body: '' } : p)).filter((p) => p.heading || p.body);
}

function normalizeStats(plan) {
  const src = plan.items || plan.stats || [];
  const out = [];
  for (const it of src) {
    if (typeof it === 'string') {
      out.push({ value: it, label: '' });
    } else if (it && (it.value || it.label)) {
      out.push({ value: String(it.value ?? ''), label: String(it.label ?? '') });
    }
  }
  return out;
}

function layoutFor(plan, index, total, pal) {
  const type = plan.type || (index === 0 ? 'title' : index === total - 1 ? 'closing' : 'bullets');
  switch (type) {
    case 'title': return buildTitleSlide(plan, pal, plan.meta || '');
    case 'section': return buildSectionSlide(plan, pal);
    case 'stats': return buildStatsSlide(plan, pal);
    case 'table': return buildTableSlide(plan, pal);
    case 'quote': return buildQuoteSlide(plan, pal);
    case 'closing': return buildClosingSlide(plan, pal, plan.meta || '');
    case 'two_column': return buildBulletsSlide({ ...plan, layout: 'two_column' }, pal);
    case 'bullets':
    default: return buildBulletsSlide(plan, pal);
  }
}

export function buildSlideFromPlan(plan, index, total, template) {
  const pal = getPalette(template);
  const ui = layoutFor(plan, index, total, pal);
  ui.background = pal.bg;
  ui.fonts = { css: fontCss(pal) };
  const title = String(plan.title || '');
  const points = normalizePoints(plan.points).map((p) => p.heading || '').filter(Boolean);
  const content = [title, ...points].filter(Boolean).join('\n\n');
  return {
    id: genId(),
    index,
    title,
    content,
    layout: plan.type || 'bullets',
    layout_group: template,
    template,
    ui,
  };
}

export function buildSlidesFromPlans(plans, template, meta) {
  const total = Math.max(1, (plans || []).length);
  const slides = (plans || []).map((plan, i) => {
    const normalized = {
      ...plan,
      title: plan.title || '',
      meta: (i === 0 || i === total - 1) ? meta : undefined,
      index: i + 1,
    };
    if (i === 0) normalized.type = 'title';
    if (i === total - 1 && !['closing', 'quote'].includes(plan.type)) normalized.type = 'closing';
    return buildSlideFromPlan(normalized, i, total, template);
  });
  return slides;
}

export function buildFallbackSlides(outlines, template) {
  const total = Math.max(1, (outlines || []).length);
  return (outlines || []).map((outline, i) => {
    const title = outline.title || `Slide ${i + 1}`;
    const content = outline.content || '';
    const bodyLines = content
      .split('\n')
      .map((l) => l.replace(/^#+\s*/, '').replace(/^\s*[-*]\s*/, '').replace(/^\s*>\s*/, '').trim())
      .filter(Boolean);
    const plan = { type: i === 0 ? 'title' : i === total - 1 ? 'closing' : 'bullets', title };
    if (plan.type === 'title') {
      plan.subtitle = bodyLines.length > 1 ? bodyLines.slice(1).slice(0, 2).join(' \u00b7 ') : '';
      plan.eyebrow = String(i + 1);
    } else if (plan.type === 'bullets') {
      plan.points = bodyLines.slice(1, 7).map((l) => ({ heading: l, body: '' }));
    } else {
      plan.subtitle = bodyLines.slice(1, 3).join(' \u00b7 ');
      plan.eyebrow = String(i + 1);
    }
    return buildSlideFromPlan(plan, i, total, template);
  });
}

// ---------------------------------------------------------------------------
// Template-v2 layout generation: layout selection + per-slide content + hydration
// Ported from Presenton's v2/schema.py and slide content generation logic.
// ---------------------------------------------------------------------------

const CONTENT_TYPES = new Set(['text', 'image', 'text-list', 'table', 'chart', 'infographic']);

export function hasContentFields(layout) {
  return extractContentFields(layout).length > 0;
}

export function extractContentFields(layout) {
  const map = new Map();
  const walk = (elems) => {
    for (const e of elems || []) {
      if (CONTENT_TYPES.has(e.type) && e.name && e.decorative !== true) {
        const cur = map.get(e.name);
        if (cur) cur.count += 1;
        else map.set(e.name, { name: e.name, type: e.type, count: 1 });
      }
      for (const ch of e.children || []) walk([ch]);
      if (e.child) walk([e.child]);
    }
  };
  for (const c of layout.components || []) walk(c.elements || []);
  return Array.from(map.values());
}

/**
 * Build layout selection prompt matching Presenton's GET_MESSAGES_SYSTEM_PROMPT.
 * Passes the full schema catalog so the LLM understands each layout's capabilities.
 */
export function layoutSelectionPrompt(outlines, template, layouts, schemas) {
  const schemaLookup = {};
  if (schemas?.layouts) {
    for (const sl of schemas.layouts) schemaLookup[sl.layout_id] = sl.schema;
  }

  const lines = [];
  lines.push(`You're a professional presentation designer with creative freedom to design engaging presentations.`);
  lines.push('');
  lines.push('# DESIGN PHILOSOPHY');
  lines.push('- Create visually compelling and varied presentations');
  lines.push('- Match layout to content purpose and audience needs');
  lines.push('');
  lines.push('# Layout Selection Guidelines');
  lines.push('1. **Content-driven choices**: Let the slide\'s purpose guide layout selection');
  lines.push('   - Opening/closing → Title layouts');
  lines.push('   - Processes/workflows → Visual process layouts');
  lines.push('   - Comparisons/contrasts → Side-by-side layouts');
  lines.push('   - Data/metrics → Chart/graph layouts');
  lines.push('   - Concepts/ideas → Image + text layouts');
  lines.push('   - Key insights → Emphasis layouts');
  lines.push('2. **Visual variety**: Aim for diverse slide layouts across the presentation.');
  lines.push('   - Don\'t use same layout for multiple slides unless necessary.');
  lines.push('   - Mix text-heavy and visual-heavy slides naturally');
  lines.push('   - Use your judgment on when repetition serves the content');
  lines.push('   - Balance information density across slides');
  lines.push('   - Adjacent slide layouts should be different unless instructed/necessary otherwise.');
  lines.push('3. **Table of contents**:');
  lines.push('   - Must only use table of contents layout if slide content contains table of contents.');
  lines.push('4. **Table Layout Selection Rules**:');
  lines.push('   - Must select table layout if the content contains table with text data.');
  lines.push('   - Must only select a layout with table if the table only contains text data.');
  lines.push('5. **Graph Layout Selection Rules**:');
  lines.push('   - Must only select a layout with chart if the content contains table with numeric data.');
  lines.push('   - Identify how many columns are present in the table.');
  lines.push('   - Must select a layout that supports n-1 charts for n columns.');
  lines.push('   - Must prioritize layouts that support multiple charts.');
  lines.push('   - Don\'t select metrics layout for content containing table with numeric data.');
  lines.push('   - For example, if content contains table with 3 columns, then select a layout that supports 2 charts.');
  lines.push('');
  lines.push(`Select layout index for each of the ${outlines.length} slides based on what will best serve the presentation's goals.`);
  lines.push('');
  lines.push(`## Available Slide Layouts (${template} template)`);
  for (let i = 0; i < layouts.length; i++) {
    const l = layouts[i];
    const desc = String(l.description || '').replace(/\s+/g, ' ').slice(0, 200);
    lines.push(`### Slide Layout: ${i}`);
    lines.push(`- Name: ${l.id}`);
    lines.push(`- Description: ${desc}`);
    const schema = schemaLookup[l.id];
    if (schema) {
      // Output full schema without truncation so LLM sees all field types and requirements
      lines.push(`- Schema: ${JSON.stringify(schema)}`);
    }
    lines.push('');
  }
  lines.push('');
  lines.push('## Slides to design:');
  for (let i = 0; i < outlines.length; i++) {
    lines.push(`### Slide ${i + 1}`);
    lines.push(`Title: ${outlines[i].title || '(untitled)'}`);
    lines.push(`Content: ${String(outlines[i].content || '').slice(0, 300)}`);
    lines.push('');
  }
  lines.push('');
  lines.push('Output ONLY a JSON object, no markdown fences: {"slides": [0, 1, 2, ...]}.');
  lines.push('Rules:');
  lines.push(`- Exactly ${outlines.length} layout indices, one per slide, in order.`);
  lines.push('- The FIRST slide is the opening/title slide: prefer a layout whose name/description mentions cover, title, hero, or intro.');
  lines.push('- The LAST slide is the closing slide: prefer a clean closing/thank-you layout when available.');
  lines.push('- Match content to layout: tables for tabular data, charts for numeric data, cards for lists of items, split text for stories.');
  lines.push('- Vary layouts across slides; avoid repeating the same layout unless content genuinely matches.');
  lines.push('- Use layout INDEX numbers (0-based), not layout IDs.');
  lines.push('- Adjacent slide layouts should be different unless instructed/necessary otherwise.');
  return lines.join('\n');
}

/**
 * Build per-slide content prompt matching Presenton's SLIDE_CONTENT_SYSTEM_PROMPT.
 * Passes the full JSON schema so the LLM generates structured output that matches.
 */
export function slideContentPrompt({ outline, layout, schema, slideNumber, totalSlides, isTitle, isClosing, language, tone, verbosity }) {
  const lines = [];
  lines.push('You will be given slide content and response schema.');
  lines.push('You need to generate structured content json based on the schema.');
  lines.push('');
  lines.push('# Steps');
  lines.push('1. Analyze the content.');
  lines.push('2. Analyze the response schema.');
  lines.push('3. Generate structured content json based on the schema.');
  lines.push('4. Generate speaker note if required.');
  lines.push('5. Provide structured content json as output.');
  lines.push('');
  lines.push('# General Rules');
  lines.push('- Follow language guidelines.');
  if (language) lines.push(`- Slide Language: ${language}.`);
  lines.push('- Speaker notes must be plain text (no markdown).');
  lines.push('- Never exceed max character limits; do not clip mid-sentence to fit—rephrase instead.');
  lines.push('- Do not use emojis or $schema fields.');
  lines.push('- Treat chart, layout, styling, positioning, and other visual instructions as production controls. Honor them through the selected schema, but never emit those instructions or meta-commentary as a title, body, label, table cell, or speaker note.');
  lines.push('- Output fields must contain only audience-facing content and data. For chart fields, populate the requested labels, series, and values rather than text such as "create a bar chart" or "show this data as a graph".');
  lines.push('');
  if (isTitle) {
    lines.push('This is the TITLE slide: the main heading field must be the presentation title; other fields should introduce the deck (subtitle, presenter, date, short overview).');
  }
  if (isClosing) {
    lines.push('This is the CLOSING slide: thank the audience and give the key takeaway. If there is a heading field, use it for a short closing message.');
  }
  if (tone) lines.push(`- Tone: ${tone}.`);
  if (verbosity === 'concise') lines.push('- Be concise.');
  else if (verbosity === 'text-heavy') lines.push('- Be detailed and text-heavy.');
  else lines.push('- Standard verbosity.');
  lines.push('');
  if (slideNumber) lines.push(`# Slide Number:\n${slideNumber}`);
  lines.push('');
  lines.push('# SLIDE CONTENT: START');
  lines.push(outline.title || '');
  lines.push(outline.content || '');
  lines.push('# SLIDE CONTENT: END');
  lines.push('');
  lines.push('# Output Fields:');
  if (schema) {
    lines.push(`- Follow this response schema exactly: ${JSON.stringify(schema)}`);
  } else {
    lines.push('- Generate appropriate content fields for this layout.');
  }
  lines.push('');
  lines.push('Output ONLY a single JSON object (no markdown fences). Include a "__speaker_note" field with 100-500 chars of plain-text speaker notes.');
  return lines.join('\n');
}

/**
 * Prepare response schema for LLM — strips asset-only fields, adds __speaker_note__.
 * Mirrors Presenton's _prepare_response_schema().
 */
export function prepareResponseSchema(jsonSchema) {
  if (!jsonSchema || typeof jsonSchema !== 'object') return null;
  const schema = JSON.parse(JSON.stringify(jsonSchema));
  // Remove $schema metadata
  delete schema.$schema;
  // Ensure type is object
  if (schema.type !== 'object') schema.type = 'object';
  // Add __speaker_note__ field
  if (!schema.properties) schema.properties = {};
  if (!schema.properties.__speaker_note) {
    schema.properties.__speaker_note = {
      type: 'string',
      minLength: 100,
      maxLength: 500,
      description: 'Speaker note for the slide',
    };
  }
  if (!schema.required) schema.required = [];
  if (!schema.required.includes('__speaker_note')) {
    schema.required.push('__speaker_note');
  }
  return schema;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function imagePlaceholder(pal, prompt, isIcon) {
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
/**
 * Hydrate template UI with generated content — ported from Presenton's
 * _apply_template_content_to_ui(). Handles component-level keying,
 * recursive element walking, repeated children, and all content types.
 */
let _currentPal = null;

export function hydrateLayoutUi(layout, content, pal, fontsCss) {
  _currentPal = pal || null;
  try {
  const components = deepClone(layout.components || []);
  if (!content || typeof content !== 'object') {
    return { background: pal.bg, fonts: { css: fontsCss || '' }, components };
  }

  // Build component-level content keys (same logic as _template_component_content_keys)
  const componentKeys = _componentContentKeys(components);

  // Detect whether content uses component-level keys or flat keys
  // If none of the component keys exist in content, treat the whole object as flat
  const hasComponentKeys = componentKeys.some((k) => k in content);
  const hasAnyComponentId = components.some((c) => c?.id && c.id in content);
  const useFlatContent = !hasComponentKeys && !hasAnyComponentId;

  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (!comp || typeof comp !== 'object') continue;

    let compContent;
    if (useFlatContent) {
      // Flat content: all elements look up names directly from the top-level content
      compContent = content;
    } else {
      const compKey = componentKeys[i];
      compContent = content[compKey];
      if (!compContent && comp.id) compContent = content[comp.id];
      if (!compContent || typeof compContent !== 'object') compContent = {};
    }

    const elements = comp.elements;
    if (Array.isArray(elements)) {
      comp.elements = _applyContentToElementList(elements, compContent);
    }
  }

  return { background: pal.bg, fonts: { css: fontsCss || '' }, components };
  } finally {
    _currentPal = null;
  }
}

function _componentContentKeys(components) {
  if (!Array.isArray(components)) return [];
  const ids = components.map((c, i) => {
    const id = c?.id;
    return typeof id === 'string' ? id : `component_${i}`;
  });
  const counts = {};
  for (const id of ids) counts[id] = (counts[id] || 0) + 1;
  const indexes = {};
  const used = new Set();
  const keys = [];
  for (const id of ids) {
    const occ = indexes[id] || 0;
    indexes[id] = occ + 1;
    let base = counts[id] > 1 ? `${id}_${occ}` : id;
    let key = base;
    let suffix = 1;
    while (used.has(key)) { key = `${base}_${suffix}`; suffix++; }
    used.add(key);
    keys.push(key);
  }
  return keys;
}

function _applyContentToElementList(elements, content) {
  const nameOccurrences = {};
  return elements.map((el) => _applyContentToElement(el, content, { nameOccurrences }));
}

function _applyContentToElement(element, content, opts = {}) {
  if (!element || typeof element !== 'object') return element;
  const type = element.type;
  const name = typeof element.name === 'string' ? element.name : null;
  const nameOccurrences = opts.nameOccurrences;

  let hasValue = false;
  let value = null;
  let preferredKeys = null;
  if (name) {
    if (nameOccurrences) {
      preferredKeys = _repeatedContentKeysForName(name, content, nameOccurrences);
    }
    const result = _contentValue(content, name, preferredKeys);
    hasValue = result.found;
    value = result.value;
  }

  if (element.decorative === false && name && hasValue && CONTENT_TYPES.has(type)) {
    return _applyContentValue(element, value);
  }

  if (type === 'container') {
    const updated = JSON.parse(JSON.stringify(element));
    const nestedContent = hasValue && typeof value === 'object' ? value : content;
    const nestedOccurrences = hasValue && typeof value === 'object' ? undefined : nameOccurrences;
    updated.child = _applyContentToElement(element.child, nestedContent, { nameOccurrences: nestedOccurrences });
    return updated;
  }

  if (type === 'flex' || type === 'grid' || type === 'group') {
    const updated = JSON.parse(JSON.stringify(element));
    const children = Array.isArray(element.children) ? element.children : [];
    const nestedOccurrences = hasValue && typeof value === 'object' ? undefined : nameOccurrences;
    if (Array.isArray(value) && children.length) {
      const nestedContent = hasValue && typeof value === 'object' ? value : content;
      updated.children = _applyContentToChildren(children, value, nestedContent, { nameOccurrences: nestedOccurrences });
    } else {
      const nestedContent = hasValue && typeof value === 'object' ? value : content;
      updated.children = _applyContentToElementList(children, nestedContent);
    }
    return updated;
  }

  return JSON.parse(JSON.stringify(element));
}

function _applyContentToChildren(children, value, content) {
  // If value is an array and we have children, map array items to children
  if (Array.isArray(value) && children.length) {
    return children.map((child, i) => {
      const item = value[Math.min(i, value.length - 1)];
      return _applyContentToElement(child, item);
    });
  }
  return _applyContentToElementList(children, content);
}

function _contentValue(content, name, preferredKeys) {
  if (!content || typeof content !== 'object') return { found: false, value: null };
  const candidates = [];
  for (const candidate of [
    ...(preferredKeys || []),
    name,
    ..._contentNameCandidates(name),
  ]) {
    if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
  }
  for (const candidate of candidates) {
    if (candidate in content) return { found: true, value: content[candidate] };
  }
  return { found: false, value: null };
}

function _contentNameCandidates(name) {
  const withoutNumericToken = name.replace(/_\d+(?=_|$)/g, '');
  const withoutPrefix = withoutNumericToken.includes('_')
    ? withoutNumericToken.split('_').slice(1).join('_')
    : withoutNumericToken;
  const results = [];
  for (const c of [withoutNumericToken, withoutPrefix]) {
    if (c && c !== name && !results.includes(c)) results.push(c);
  }
  return results;
}

function _repeatedContentKeysForName(name, content, nameOccurrences) {
  const occurrenceIndex = nameOccurrences[name] || 0;
  nameOccurrences[name] = occurrenceIndex + 1;
  if (occurrenceIndex === 0) return null;
  const suffixedKey = `${name}_${occurrenceIndex + 1}`;
  return suffixedKey in content ? [suffixedKey] : null;
}

function _applyContentValue(element, value) {
  const type = element.type;
  if (type === 'text') {
    return _applyMarkdownTextContent(element, value);
  }
  if (type === 'text-list') {
    return _applyTextListContent(element, value);
  }
  if (type === 'image') {
    return _applyImageContent(element, value);
  }
  if (type === 'chart') {
    return _applyChartContent(element, value);
  }
  if (type === 'table') {
    return _applyTableContent(element, value);
  }
  return element;
}

const _markdownStrongDelims = ['**', '__'];
const _markdownEmphasisDelims = ['*', '_'];
const _markdownDelims = [..._markdownStrongDelims, ..._markdownEmphasisDelims];

function _applyMarkdownTextContent(element, value) {
  const text = _readTextValue(value);
  if (text == null || text === '') return JSON.parse(JSON.stringify(element));

  const firstRun = _firstRun(element);
  const updated = JSON.parse(JSON.stringify(element));
  delete updated.text;
  updated.runs = _textRunsFromMarkdown(text, firstRun, element.font);
  return updated;
}

function _readTextValue(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
  if (value && typeof value === 'object' && typeof value.text === 'string') return value.text;
  return null;
}

function _firstRun(element) {
  const runs = Array.isArray(element.runs) ? element.runs : [];
  return runs.length > 0 && runs[0] && typeof runs[0] === 'object' ? runs[0] : {};
}

function _textRunsFromMarkdown(text, firstRun, fallbackFont) {
  const baseRun = typeof firstRun === 'object' ? JSON.parse(JSON.stringify(firstRun)) : {};
  const parsed = _parseMarkdownText(text);
  const hasMarkdownStyle = parsed.some(([, style]) => style && Object.keys(style).length > 0);
  const baseFont = _resolveBaseFont(baseRun, fallbackFont, hasMarkdownStyle);

  const runs = [];
  for (const [parsedText, style] of parsed) {
    const run = JSON.parse(JSON.stringify(baseRun));
    run.text = parsedText;
    if (style && Object.keys(style).length > 0) {
      run.font = { ...(run.font || {}), ...style };
    }
    _appendTextRun(runs, run);
  }
  if (runs.length) return runs;
  return [{ ...baseRun, text: ' ' }];
}

function _resolveBaseFont(baseRun, fallbackFont, stripInlineEmphasis) {
  const runFont = baseRun.font;
  const fallback = typeof fallbackFont === 'object' ? fallbackFont : null;
  let resolved;
  if (fallback) {
    resolved = { ...JSON.parse(JSON.stringify(fallback)), ...(runFont ? JSON.parse(JSON.stringify(runFont)) : {}) };
  } else if (runFont) {
    resolved = JSON.parse(JSON.stringify(runFont));
  } else {
    resolved = { family: 'Arial', size: 18, color: '#111827' };
  }
  if (stripInlineEmphasis) {
    delete resolved.bold;
    delete resolved.italic;
  }
  baseRun.font = resolved;
  return baseRun;
}

function _parseMarkdownText(text) {
  const parsed = [];
  let idx = 0;
  while (idx < text.length) {
    let matched = false;
    for (const delim of _markdownStrongDelims) {
      if (text.startsWith(delim, idx)) {
        const close = text.indexOf(delim, idx + delim.length);
        if (close > idx + delim.length) {
          parsed.push([text.slice(idx + delim.length, close), { bold: true }]);
          idx = close + delim.length;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;
    for (const delim of _markdownEmphasisDelims) {
      if (text.startsWith(delim, idx)) {
        const close = text.indexOf(delim, idx + delim.length);
        if (close > idx + delim.length) {
          parsed.push([text.slice(idx + delim.length, close), { italic: true }]);
          idx = close + delim.length;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;
    const nextIdx = _nextMarkdownDelimIndex(text, idx + 1);
    parsed.push([text.slice(idx, nextIdx === -1 ? text.length : nextIdx), {}]);
    idx = nextIdx === -1 ? text.length : nextIdx;
  }
  return parsed;
}

function _nextMarkdownDelimIndex(text, start) {
  const indices = _markdownDelims.map((d) => text.indexOf(d, start)).filter((i) => i !== -1);
  return indices.length ? Math.min(...indices) : -1;
}

function _appendTextRun(runs, run) {
  const runText = run.text;
  if (typeof runText !== 'string' || runText === '') return;
  const prev = runs.length ? runs[runs.length - 1] : null;
  if (prev && typeof prev === 'object') {
    const prevStyle = {};
    const nextStyle = {};
    for (const key of Object.keys(prev)) { if (key !== 'text') prevStyle[key] = prev[key]; }
    for (const key of Object.keys(run)) { if (key !== 'text') nextStyle[key] = run[key]; }
    if (JSON.stringify(prevStyle) === JSON.stringify(nextStyle) && typeof prev.text === 'string') {
      prev.text += runText;
      return;
    }
  }
  runs.push(run);
}

function _applyTextListContent(element, value) {
  if (!Array.isArray(value)) return JSON.parse(JSON.stringify(element));
  const existing = Array.isArray(element.items) ? element.items : [];
  const items = [];
  for (let i = 0; i < value.length; i++) {
    const itemText = _readTextValue(value[i]);
    if (itemText != null && itemText !== '') {
      const existingItem = i < existing.length && Array.isArray(existing[i]) ? existing[i] : null;
      const firstItemRun = existingItem && existingItem.length && typeof existingItem[0] === 'object'
        ? existingItem[0] : {};
      items.push(_textRunsFromMarkdown(itemText, firstItemRun, element.font));
    }
  }
  const updated = JSON.parse(JSON.stringify(element));
  updated.items = items;
  return updated;
}

function _applyImageContent(element, value) {
  const prompt = typeof value === 'object' && value !== null
    ? (value.image_prompt || value.icon_query || '')
    : String(value ?? '');
  const promptKey = element.is_icon ? 'icon_query' : 'image_prompt';
  const contentObj = typeof value === 'object' && value !== null ? value : { [promptKey]: prompt };
  const updated = JSON.parse(JSON.stringify(element));

  // Extract image_url from LLM content (matching Python _apply_template_image_content)
  let url = null;
  if (contentObj && typeof contentObj === 'object') {
    url = contentObj.image_url || contentObj.icon_url || contentObj.url || null;
  }
  if (url && typeof url === 'string' && url.trim()) {
    updated.data = url.trim();
  } else {
    // No URL from LLM — clear data so hydrateImages picks it up for Pexels stock photo
    updated.data = null;
  }

  updated.content_prompt = prompt;
  updated.content = contentObj;
  _normalizeGeneratedImageFit(updated);
  return updated;
}

function _normalizeGeneratedImageFit(element) {
  if (element.is_icon === true) return;
  if (element.fit === 'cover') return;
  if (_hasImageClipPath(element)) return;
  if (_looksLikeSvg(element.data)) return;
  element.fit = 'cover';
}

function _hasImageClipPath(element) {
  for (const key of ['clip_path', 'clipPath', 'clippath']) {
    const val = element[key];
    if (typeof val === 'string' && val.trim() && val.trim().toLowerCase() !== 'none') return true;
  }
  return false;
}

function _looksLikeSvg(value) {
  if (typeof value !== 'string') return false;
  const n = value.trim().toLowerCase();
  if (n.startsWith('data:image/svg+xml')) return true;
  return n.split('?')[0].split('#')[0].endsWith('.svg');
}

function _applyChartContent(element, value) {
  if (!value || typeof value !== 'object') {
    const updated = JSON.parse(JSON.stringify(element));
    delete updated.data_labels_color;
    delete updated.grid;
    return updated;
  }
  const updated = JSON.parse(JSON.stringify(element));
  delete updated.data_labels_color;
  delete updated.grid;
  const ct = value.chartType || value.chart_type;
  if (ct && ['area','bar','bubble','donut','horizontal_bar','horizontal_stacked_bar','line','pie','polar_area','radar','scatter','stacked_bar'].includes(ct)) {
    updated.chart_type = ct;
  }
  if (typeof value.title === 'string') updated.title = value.title;
  if (Array.isArray(value.categories) && value.categories.length) updated.categories = value.categories;
  if (Array.isArray(value.series) && value.series.length) updated.series = value.series;
  if (Array.isArray(value.colors) && value.colors.length) {
    // Template chart colors carry the theme — don't let LLM override them.
    // Presenton's chart schema exposes no colors; our templates bake them in.
  }
  for (const [sk, tk] of [
    ['xAxisTitle','x_axis_title'], ['x_axis_title','x_axis_title'],
    ['yAxisTitle','y_axis_title'], ['y_axis_title','y_axis_title'],
    ['source','source'],
  ]) {
    if (typeof value[sk] === 'string') updated[tk] = value[sk];
  }
  for (const [sk, tk] of [
    ['xAxis','x_axis'], ['x_axis','x_axis'],
    ['yAxis','y_axis'], ['y_axis','y_axis'],
    ['xAxisGrid','x_axis_grid'], ['x_axis_grid','x_axis_grid'],
    ['yAxisGrid','y_axis_grid'], ['y_axis_grid','y_axis_grid'],
  ]) {
    if (typeof value[sk] === 'boolean') updated[tk] = value[sk];
  }
  for (const sk of ['dataLabels', 'data_labels']) {
    if (sk in value) {
      const v = value[sk];
      if (v === true) updated.data_labels = 'top';
      else if (v === false || v === null) { delete updated.data_labels; }
      else if (typeof v === 'string' && ['base','mid','top','outside'].includes(v.trim().toLowerCase())) {
        updated.data_labels = v.trim().toLowerCase();
      }
    }
  }
  return updated;
}

function _applyTableContent(element, value) {
  if (!value || typeof value !== 'object') return JSON.parse(JSON.stringify(element));
  const templateCols = Array.isArray(element.columns) ? element.columns : [];
  const templateRows = (element.rows || []).filter((r) => Array.isArray(r));
  const genCols = Array.isArray(value.columns) ? value.columns.map((c) => _readTextValue(c)) : [];
  const genRows = Array.isArray(value.rows)
    ? value.rows.filter((r) => Array.isArray(r)).map((r) => r.map((c) => _readTextValue(c)))
    : [];
  const fallbackRow = templateRows.length ? templateRows[templateRows.length - 1] : templateCols;

  const updated = JSON.parse(JSON.stringify(element));
  updated.columns = genCols.length
    ? _mergeTableRowToLength(templateCols, genCols, true)
    : JSON.parse(JSON.stringify(templateCols));
  updated.rows = genRows.length
    ? genRows.map((row, i) =>
        _mergeTableRowToLength(
          i < templateRows.length ? templateRows[i] : fallbackRow,
          row,
          false,
        ),
      )
    : JSON.parse(JSON.stringify(templateRows));
  return updated;
}

function _mergeTableRowToLength(templateCells, generatedTexts, isHeader) {
  const fallbackCell = Array.isArray(templateCells) && templateCells.length ? templateCells[templateCells.length - 1] : null;
  return generatedTexts.map((text, i) =>
    _replaceTableTemplateCellText(
      i < templateCells.length ? templateCells[i] : fallbackCell,
      text || '',
      isHeader,
    ),
  );
}

function _replaceTableTemplateCellText(cell, text, isHeader) {
  const pal = _currentPal;
  const accent = pal?.accent || '#1E4CD9';
  const soft = pal?.soft || '#F8F4E9';
  const muted = pal?.muted || '#D8D3C4';
  const fg = pal?.fg || '#082314';

  if (!cell || typeof cell !== 'object') {
    const font = isHeader
      ? { family: 'Arial', size: 12, color: '#FFFFFF', bold: true }
      : { family: 'Arial', size: 12, color: fg };
    return {
      color: { color: isHeader ? accent : soft, opacity: 1 },
      stroke: { color: muted, opacity: 1, width: 1 },
      font,
      runs: _textRunsFromMarkdown(text, { font }, font),
    };
  }
  const updated = JSON.parse(JSON.stringify(cell));
  const firstRun = _firstRun(updated);
  const runFont = firstRun.font;
  const nextFont = runFont || updated.font || { family: 'Arial', size: 12, color: fg };
  updated.color = updated.color || updated.fill || { color: soft, opacity: 1 };
  updated.stroke = updated.stroke || { color: muted, opacity: 1, width: 1 };
  updated.font = updated.font || nextFont;
  updated.runs = _textRunsFromMarkdown(text, firstRun, nextFont);
  delete updated.text;
  delete updated.fill;
  return updated;
}
