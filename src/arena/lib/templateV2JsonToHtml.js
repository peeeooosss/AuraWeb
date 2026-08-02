import { resolveBackendAssetUrl } from './resolveAssetUrl';

const ELEMENT_TYPES = new Set([
  'text', 'container', 'image', 'text-list', 'table', 'vector', 'svg',
  'chart', 'infographic', 'flex', 'grid', 'group', 'list-view', 'grid-view',
]);

const DEFAULT_CHART_COLORS = [
  '#7F22FE', '#155DFC', '#F59E0B', '#12B76A', '#EF4444', '#06B6D4', '#8B5CF6', '#64748B',
];

export const TEMPLATE_V2_HTML_WIDTH = 1280;
export const TEMPLATE_V2_HTML_HEIGHT = 720;

function markdownToPlainChartText(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s{0,3}>\s?/, '')
        .replace(/^\s*[-+*]\s+/, ''),
    )
    .join('\n')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/~~([^~\n]+)~~/g, '$1')
    .replace(/(^|[^\w])(\*\*|__)([^*\n_]+)\2(?=$|[^\w])/g, '$1$3')
    .replace(/(^|[^\w])([*_])([^*\n_]+)\2(?=$|[^\w])/g, '$1$3')
    .replace(/\\([\\`*_[\]{}()#+\-.!>])/g, '$1');
}

function parseMarkdownText(text) {
  const parsed = [];
  let index = 0;
  while (index < text.length) {
    if (text.startsWith('**', index) || text.startsWith('__', index)) {
      const delim = text.startsWith('**', index) ? '**' : '__';
      const close = text.indexOf(delim, index + delim.length);
      if (close > index + delim.length) {
        parsed.push({ text: text.slice(index + delim.length, close), style: { bold: true } });
        index = close + delim.length;
        continue;
      }
    }
    if (text.startsWith('*', index) || text.startsWith('_', index)) {
      const delim = text.charAt(index);
      const close = text.indexOf(delim, index + 1);
      if (close > index + 1) {
        parsed.push({ text: text.slice(index + 1, close), style: { italic: true } });
        index = close + 1;
        continue;
      }
    }
    const delims = ['**', '__', '*', '_'];
    const nextIndexes = delims.map(d => text.indexOf(d, index + 1)).filter(i => i !== -1);
    const next = nextIndexes.length ? Math.min(...nextIndexes) : text.length;
    parsed.push({ text: text.slice(index, next), style: {} });
    index = next;
  }
  return parsed;
}

function normalizeRunsForHtml(item, fallbackFont) {
  const runs = readArray(item.runs).map(readRecord);
  const effectiveRuns = runs.length ? runs : [{ text: readStringValue(item.text) }];
  const sourceText = Object.prototype.hasOwnProperty.call(item, 'text')
    ? item.text : effectiveRuns.map(r => readStringValue(r.text)).join('');

  const result = [];
  for (const run of effectiveRuns) {
    const parsed = parseMarkdownText(readStringValue(run.text));
    for (const p of parsed) {
      if (!p.text) continue;
      const mergedFont = { ...readRecord(fallbackFont), ...readRecord(run.font), ...(p.style.bold ? { bold: true } : {}), ...(p.style.italic ? { italic: true } : {}) };
      const last = result[result.length - 1];
      if (last && JSON.stringify(last.font) === JSON.stringify(mergedFont)) {
        last.text += p.text;
      } else {
        result.push({ text: p.text, font: mergedFont });
      }
    }
  }
  return result.length ? result : [{ text: readStringValue(sourceText) || ' ' }];
}

function hasTemplateV2RenderableUi(ui) {
  const record = readRecord(ui);
  return readArray(record.components).length > 0 || readArray(record.elements).length > 0;
}

export { hasTemplateV2RenderableUi };

function normalizeTemplateV2AssetUrls(value) {
  if (Array.isArray(value)) return value.map(normalizeTemplateV2AssetUrls);
  const record = readRecord(value);
  if (!Object.keys(record).length) return value;
  const normalized = {};
  for (const [key, child] of Object.entries(record)) {
    normalized[key] = normalizeTemplateV2AssetUrls(child);
  }
  if (readString(normalized.type) === 'image') {
    const source = readString(normalized.data);
    if (source) normalized.data = resolveBackendAssetUrl(source);
  }
  return normalized;
}

export function templateV2UiToHtmlFragment(ui, options = {}) {
  const record = readRecord(ui);
  const rootElements = readArray(record.elements);
  const components = readArray(record.components);
  const items = [...rootElements, ...components].map(item =>
    readRecord(normalizeTemplateV2AssetUrls(item)),
  );
  if (items.length === 0) return null;
  const width = options.width ?? TEMPLATE_V2_HTML_WIDTH;
  const height = options.height ?? TEMPLATE_V2_HTML_HEIGHT;
  const background = normalizeCssColor(readString(record.background) ?? '#FFFFFF');
  const records = items.map(readRecord);
  const bg = escapeCssColor(background);
  const fontCss = renderFontAssetTags(options.fonts);
  const content = records.map(item => renderItem(item, 'absolute')).join('');
  return `${fontCss}<div data-template-v2-html-slide="true" style="box-sizing:border-box;position:relative;width:${cssNumber(width)}px;height:${cssNumber(height)}px;overflow:hidden;background:${bg};font-family:Arial,Helvetica,sans-serif">${content}</div>`;
}

function renderFontAssetTags(fonts) {
  if (!fonts) return '';
  const css = readStringValueOrNull(fonts);
  if (css) return `<style>${escapeStyleText(css)}${fontCssFamilyAliases(css)}</style>`;
  const record = readRecord(fonts);
  const embeddedCss = readStringValueOrNull(record.css ?? record.font_css);
  const tags = [];
  if (embeddedCss) tags.push(`<style>${escapeStyleText(embeddedCss)}${fontCssFamilyAliases(embeddedCss)}</style>`);
  return tags.join('');
}

function fontCssFamilyAliases(css) {
  const aliases = [];
  const facePattern = /@font-face\s*\{[^}]*font-family\s*:\s*(['"]?)([^;'"}]+)\1[^}]*\}/gi;
  for (const match of css.matchAll(facePattern)) {
    const block = match[0];
    const family = match[2]?.trim();
    if (!family) continue;
    const weight = /font-weight\s*:\s*([^;}]+)/i.exec(block)?.[1]?.trim();
    for (const alias of fontFamilyAliases(family, weight).filter(item => item !== family)) {
      aliases.push(block.replace(/font-family\s*:\s*(['"]?)([^;'"}]+)\1/i, `font-family:${escapeCssFont(alias)}`));
    }
  }
  return aliases.join('');
}

function fontFamilyAliases(family, weight) {
  const normalized = family.trim();
  const aliases = new Set([normalized]);
  const alias = normalized
    .replace(/\s+(regular|bold\s*italic|bold|italic|black|semibold|semi\s*bold|medium|light)$/i, '')
    .trim();
  if (alias && alias !== normalized && (weight || inferFontWeight(normalized))) {
    aliases.add(alias);
  }
  return [...aliases];
}

function inferFontWeight(value) {
  const normalized = decodeFontHint(value).toLowerCase();
  if (/\b(black|heavy)\b/.test(normalized)) return '900';
  if (/\b(extra|ultra)[\s_-]?bold\b/.test(normalized)) return '800';
  if (/\bbold\b/.test(normalized)) return '700';
  if (/\b(semi|demi)[\s_-]?bold\b/.test(normalized)) return '600';
  if (/\bmedium\b/.test(normalized)) return '500';
  if (/\bregular\b|\bnormal\b/.test(normalized)) return '400';
  if (/\blight\b/.test(normalized)) return '300';
  if (/\b(extra|ultra)[\s_-]?light\b/.test(normalized)) return '200';
  if (/\bthin\b/.test(normalized)) return '100';
  return undefined;
}

function decodeFontHint(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function renderItem(item, mode) {
  if (isComponent(item)) return renderGroup({ ...item, type: 'group', children: item.elements }, mode);
  switch (readString(item.type)) {
    case 'vector': return renderPolygon(item, mode);
    case 'svg': return renderSvg(item, mode);
    case 'image': return renderImage(item, mode);
    case 'text': return renderText(item, mode);
    case 'text-list': return renderTextList(item, mode);
    case 'table': return renderTable(item, mode);
    case 'container': return renderContainer(item, mode);
    case 'flex': case 'list-view': return renderFlex(item, mode);
    case 'grid': case 'grid-view': return renderGrid(item, mode);
    case 'group': return renderGroup(item, mode);
    case 'chart': return renderChart(item, mode);
    case 'infographic': return renderInfographic(item, mode);
    default:
      if (Array.isArray(item.children)) return renderGroup(item, mode);
      if (readRecordOrNull(item.child)) return renderContainer(item, mode);
      return '';
  }
}

function renderImage(item, mode) {
  const source = readString(item.data);
  if (!source) return '';
  const color = normalizeChartColor(readString(item.color));
  const clipPath = clipPathStyle(item);
  if (color && readBoolean(item.is_icon ?? item.is_icon)) {
    const maskUrl = cssUrl(source);
    const maskSize = imageMaskSize(item.fit);
    return `<div style="${frameStyle(item, mode)}${boxStyle(item)}color:${escapeCssColor(color)};background:currentColor;-webkit-mask:${maskUrl} center/${maskSize} no-repeat;mask:${maskUrl} center/${maskSize} no-repeat;${clipPath}"></div>`;
  }
  const fit = imageFit(item.fit);
  const focusStyle = imageFocusStyle(item);
  const cropTransform = imageCropTransformStyle(item);
  if (cropTransform) {
    return `<div style="${frameStyle(item, mode)}${boxStyle(item)}${clipPath}overflow:hidden;"><img alt="" src="${escapeAttribute(source)}" style="display:block;max-width:none;max-height:none;height:100%;width:100%;object-fit:${fit};${focusStyle}${cropTransform}"></div>`;
  }
  if (clipPath) {
    return `<div style="${frameStyle(item, mode)}${boxStyle(item)}${clipPath}overflow:hidden;"><img alt="" src="${escapeAttribute(source)}" style="display:block;max-width:none;max-height:none;height:100%;width:100%;object-fit:${fit};${focusStyle}"></div>`;
  }
  return `<img alt="" src="${escapeAttribute(source)}" style="${frameStyle(item, mode)}${boxStyle(item)}display:block;max-width:none;max-height:none;object-fit:${fit};${focusStyle}${clipPath}">`;
}

function renderText(item, mode) {
  const font = readRecord(item.font);
  const alignment = readRecord(item.alignment);
  const horizontal = readString(alignment.horizontal);
  const vertical = readString(alignment.vertical);
  const runs = normalizeRunsForHtml(item, font);
  const runHtml = runs.map(run => {
    const runFont = { ...font, ...readRecord(run.font) };
    return `<span style="${fontStyle(runFont)}">${escapeHtml(readStringValue(run.text))}</span>`;
  }).join('');
  return `<div style="${frameStyle(item, mode)}${transformStyle(item)}${fontStyle(font, { includeLineHeight: false, includeTextDecoration: false })}${textShadowStyle(item)}display:flex;align-items:${verticalAlign(vertical)};justify-content:${horizontalAlign(horizontal)};${lineHeightStyle(font, 1.1)}${textOverflowStyle()}text-align:${textAlign(horizontal)};"><span style="display:block;width:100%">${runHtml}</span></div>`;
}

function renderTextList(item, mode) {
  const marker = readString(item.marker);
  const tag = marker === 'number' ? 'ol' : 'ul';
  const font = readRecord(item.font);
  const entries = readArray(item.items).map(entry => {
    const runs = normalizeRunsForHtml(entry, font);
    const html = runs.map(run =>
      `<span style="${fontStyle({ ...font, ...readRecord(run.font) })}">${escapeHtml(readStringValue(run.text))}</span>`
    ).join('');
    return `<li style="${textOverflowStyle()}">${html}</li>`;
  }).join('');
  const listStyle = `margin:0;padding-left:${marker === 'none' ? 0 : 24}px;${marker === 'none' ? 'list-style-type:none;' : ''}`;
  return `<div style="${frameStyle(item, mode)}${transformStyle(item)}${fontStyle(font, { includeTextDecoration: false })}${textOverflowStyle()}"><${tag} style="${listStyle}">${entries}</${tag}></div>`;
}

function renderTable(item, mode) {
  const rows = tableRows(item);
  if (!rows.length) return `<div style="${frameStyle(item, mode)}${transformStyle(item)}overflow:hidden"></div>`;
  const rowCount = Math.max(1, rows.length);
  const colCount = Math.max(1, ...rows.map(row => row.length));
  const tableFont = tableBaseFont(item);
  const cells = rows.flatMap((row, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) => {
      const cell = row[colIndex] ?? {};
      return `<div style="${tableCellStyle(cell, rowIndex === 0, tableFont)}">${cellText(cell, tableFont, rowIndex === 0)}</div>`;
    })
  ).join('');
  return `<div style="${frameStyle(item, mode)}${transformStyle(item)}display:grid;grid-template-columns:repeat(${colCount},minmax(0,1fr));grid-template-rows:repeat(${rowCount},minmax(0,1fr));overflow:hidden">${cells}</div>`;
}

function renderContainer(item, mode) {
  const child = readRecordOrNull(item.child);
  const alignment = readRecord(item.alignment);
  const style = `${frameStyle(item, mode)}${boxStyle(item)}${paddingStyle(readRecord(item.padding))}display:flex;align-items:${verticalAlign(readString(alignment.vertical))};justify-content:${horizontalAlign(readString(alignment.horizontal))};${containerOverflowStyle(item, child)}`;
  return `<div style="${style}">${child ? renderItem(child, readRecordOrNull(child.position) ? 'absolute' : 'flow') : ''}</div>`;
}

function containerOverflowStyle(item, child) {
  const overflow = readString(item.overflow);
  if (overflow === 'hidden' || overflow === 'visible') return `overflow:${overflow}`;
  if (readBoolean(item.clip)) return 'overflow:hidden';
  if (!child || readString(child.type) !== 'image') return 'overflow:visible';
  const hasPositionedChild = Boolean(readRecordOrNull(child.position));
  if (!hasPositionedChild) return 'overflow:visible';
  const containerBox = readBox(item);
  const childBox = readBox(child);
  if (containerBox.width == null || containerBox.height == null) return 'overflow:visible';
  const epsilon = 0.01;
  const childOverflows =
    childBox.x < -epsilon ||
    childBox.y < -epsilon ||
    (childBox.width != null && childBox.x + childBox.width > containerBox.width + epsilon) ||
    (childBox.height != null && childBox.y + childBox.height > containerBox.height + epsilon);
  return childOverflows ? 'overflow:hidden' : 'overflow:visible';
}

function renderFlex(item, mode) {
  const direction = readString(item.direction) === 'row' ? 'row' : 'column';
  const gap = readNumber(item.gap) ?? 0;
  const rowGap = readNumber(item.rowGap ?? item.row_gap) ?? gap;
  const columnGap = readNumber(item.columnGap ?? item.column_gap) ?? gap;
  const childrenList = readLayoutChildren(item);
  const children = childrenList.map(child => renderItem(readRecord(child), 'flow')).join('');
  const style = `${flexFrameStyle(item, mode, childrenList, direction, readBoolean(item.wrap), columnGap, rowGap)}${boxStyle(item)}${paddingStyle(readRecord(item.padding))}display:flex;flex-direction:${direction};flex-wrap:${readBoolean(item.wrap) ? 'wrap' : 'nowrap'};align-items:${cssAlignment(readString(item.alignItems ?? item.align_items), 'stretch')};justify-content:${cssAlignment(readString(item.justifyContent ?? item.justify_content), 'flex-start')};gap:${cssNumber(gap)}px;column-gap:${cssNumber(columnGap)}px;row-gap:${cssNumber(rowGap)}px;overflow:visible`;
  return `<div style="${style}">${children}</div>`;
}

function flexFrameStyle(item, mode, children, direction, wrap, columnGap, rowGap) {
  const box = readBox(item);
  const expanded = flexExpandedSize(item, box, children, direction, wrap, columnGap, rowGap);
  let style = frameStyleFromBox(box, mode);
  if (expanded.width != null && (box.width == null || expanded.width > box.width)) {
    style += `width:${cssNumber(expanded.width)}px;`;
  }
  if (expanded.height != null && (box.height == null || expanded.height > box.height)) {
    style += `height:${cssNumber(expanded.height)}px;`;
  }
  return style;
}

function flexExpandedSize(item, box, children, direction, wrap, columnGap, rowGap) {
  const records = children.map(readRecord);
  if (!records.length) return {};
  const padding = readRecord(item.padding);
  const paddingX = (readNumber(padding.left) ?? 0) + (readNumber(padding.right) ?? 0);
  const paddingY = (readNumber(padding.top) ?? 0) + (readNumber(padding.bottom) ?? 0);
  const sizes = records.map(flowChildSize);
  if (!wrap) {
    if (direction === 'row') {
      return { width: paddingX + sizes.reduce((sum, size) => sum + size.width, 0) + columnGap * Math.max(0, sizes.length - 1) };
    }
    return { height: paddingY + sizes.reduce((sum, size) => sum + size.height, 0) + rowGap * Math.max(0, sizes.length - 1) };
  }
  const mainLimit = direction === 'row' ? (box.width == null ? null : Math.max(1, box.width - paddingX)) : (box.height == null ? null : Math.max(1, box.height - paddingY));
  if (mainLimit == null) return {};
  const lines = [];
  const mainGap = direction === 'row' ? columnGap : rowGap;
  const crossGap = direction === 'row' ? rowGap : columnGap;
  sizes.forEach(size => {
    const childMain = direction === 'row' ? size.width : size.height;
    const childCross = direction === 'row' ? size.height : size.width;
    let line = lines[lines.length - 1];
    if (!line || (line.main > 0 && line.main + mainGap + childMain > mainLimit)) {
      line = { cross: 0, main: 0 };
      lines.push(line);
    }
    line.main += (line.main > 0 ? mainGap : 0) + childMain;
    line.cross = Math.max(line.cross, childCross);
  });
  const requiredCross = lines.reduce((sum, line) => sum + line.cross, 0) + crossGap * Math.max(0, lines.length - 1);
  return direction === 'row' ? { height: paddingY + requiredCross } : { width: paddingX + requiredCross };
}

function flowChildSize(child) {
  const fallback = Array.isArray(child.children) ? childrenBounds(readArray(child.children).map(readRecord)) : undefined;
  const box = readBox(child, fallback);
  return { width: box.width ?? 1, height: box.height ?? 1 };
}

function renderGrid(item, mode) {
  const columns = Math.max(1, Math.floor(readNumber(item.columns) ?? 1));
  const gap = readNumber(item.gap) ?? 0;
  const rowGap = readNumber(item.rowGap ?? item.row_gap) ?? gap;
  const columnGap = readNumber(item.columnGap ?? item.column_gap) ?? gap;
  const childrenList = readLayoutChildren(item);
  const renderedRows = Math.max(1, Math.ceil(childrenList.length / columns));
  const declaredRows = readNumber(item.rows);
  const rows = declaredRows == null ? null : Math.max(1, Math.floor(declaredRows));
  const size = readRecord(item.size);
  const explicitHeight = readNumber(size.height);
  const explicitWidth = readNumber(size.width);
  const children = childrenList.map(child => renderItem(readRecord(child), 'flow')).join('');
  const rowTemplate = gridRowTemplate(rows, renderedRows, explicitHeight, rowGap);
  const columnTemplate = gridColumnTemplate(columns, explicitWidth, columnGap);
  const style = `${frameStyle(item, mode)}${boxStyle(item)}${paddingStyle(readRecord(item.padding))}display:grid;grid-template-columns:${columnTemplate};${rowTemplate}align-items:${cssAlignment(readString(item.alignItems ?? item.align_items), 'stretch')};justify-items:${cssAlignment(readString(item.justifyItems ?? item.justify_items), 'stretch')};column-gap:${cssNumber(columnGap)}px;row-gap:${cssNumber(rowGap)}px;overflow:visible`;
  return `<div style="${style}">${children}</div>`;
}

function gridColumnTemplate(columns, explicitWidth, columnGap) {
  if (explicitWidth == null) return `repeat(${columns},minmax(0,1fr))`;
  const w = Math.max(1, (explicitWidth - columnGap * (columns - 1)) / columns);
  return `repeat(${columns},${cssNumber(w)}px)`;
}

function gridRowTemplate(rows, renderedRows, explicitHeight, rowGap) {
  if (!rows) return '';
  if (explicitHeight == null) return `grid-template-rows:repeat(${Math.max(rows, renderedRows)},minmax(0,1fr));`;
  const h = Math.max(1, (explicitHeight - rowGap * (rows - 1)) / rows);
  return `grid-template-rows:repeat(${Math.max(rows, renderedRows)},${cssNumber(h)}px);`;
}

function readLayoutChildren(item) {
  const children = readArray(item.children);
  if (children.length) return children;
  const elements = readArray(item.elements);
  if (elements.length) return elements;
  const child = readRecordOrNull(item.item);
  const count = Math.max(0, Math.floor(readNumber(item.count) ?? 0));
  return child && count ? Array.from({ length: count }, () => child) : [];
}

function renderGroup(item, mode) {
  const children = readArray(item.children).map(readRecord);
  const content = children.map(child => renderItem(child, 'absolute')).join('');
  return `<div style="${frameStyle(item, mode, childrenBounds(children))}${boxStyle(item)}overflow:visible">${content}</div>`;
}

function renderPolygon(item, mode) {
  if (readString(item.type) === 'vector' && vectorShape(item) === 'ellipse') return renderEllipseVector(item, mode);
  const points = polygonPoints(item);
  if (points.length < 2) return '';
  const box = polygonBox(item, points);
  const closed = polygonClosed(item, points);
  const stroke = readRecord(item.stroke);
  const fill = readRecord(item.fill);
  const fillColor = closed ? colorWithOpacity(readString(fill.color) ?? '', readNumber(fill.opacity)) : '';
  const strokeWidth = Math.max(0, readNumber(stroke.width) ?? 1);
  const strokeColor = colorWithOpacity(readString(stroke.color) ?? (!closed ? '#000000' : ''), readNumber(stroke.opacity));
  if (!fillColor && !(strokeColor && strokeWidth > 0)) return '';
  const pointString = points.map(p => `${cssNumber(p.x - box.x)},${cssNumber(p.y - box.y)}`).join(' ');
  const dash = readArray(stroke.dash).map(readNumber).filter(v => v != null).join(' ');
  const shape = closed
    ? `<polygon points="${escapeAttribute(pointString)}"${fillColor ? ` fill="${escapeAttribute(fillColor)}"` : ` fill="none"`}${strokeColor && strokeWidth > 0 ? ` stroke="${escapeAttribute(strokeColor)}" stroke-width="${cssNumber(strokeWidth)}"` : ''}${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
    : `<polyline points="${escapeAttribute(pointString)}" fill="none"${strokeColor && strokeWidth > 0 ? ` stroke="${escapeAttribute(strokeColor)}" stroke-width="${cssNumber(strokeWidth)}"` : ''}${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  return `<div style="${frameStyleFromBox(box, mode)}${transformStyle(item)}overflow:visible"><svg width="100%" height="100%" viewBox="0 0 ${cssNumber(box.width ?? 1)} ${cssNumber(box.height ?? 1)}" preserveAspectRatio="none" style="display:block;overflow:visible">${shape}</svg></div>`;
}

function renderEllipseVector(item, mode) {
  const points = polygonSourcePoints(item);
  if (points.length < 2) return '';
  const box = polygonBox(item, points);
  const stroke = readRecord(item.stroke);
  const fill = readRecord(item.fill);
  const fillColor = colorWithOpacity(readString(fill.color) ?? '', readNumber(fill.opacity));
  const strokeWidth = Math.max(0, readNumber(stroke.width) ?? 1);
  const strokeColor = colorWithOpacity(readString(stroke.color) ?? '', readNumber(stroke.opacity));
  if (!fillColor && !(strokeColor && strokeWidth > 0)) return '';
  const dash = readArray(stroke.dash).map(readNumber).filter(v => v != null).join(' ');
  const w = box.width ?? 1;
  const h = box.height ?? 1;
  const shape = `<ellipse cx="${cssNumber(w / 2)}" cy="${cssNumber(h / 2)}" rx="${cssNumber(w / 2)}" ry="${cssNumber(h / 2)}"${fillColor ? ` fill="${escapeAttribute(fillColor)}"` : ` fill="none"`}${strokeColor && strokeWidth > 0 ? ` stroke="${escapeAttribute(strokeColor)}" stroke-width="${cssNumber(strokeWidth)}"` : ''}${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  return `<div style="${frameStyleFromBox(box, mode)}${transformStyle(item)}overflow:visible"><svg width="100%" height="100%" viewBox="0 0 ${cssNumber(w)} ${cssNumber(h)}" preserveAspectRatio="none" style="display:block;overflow:visible">${shape}</svg></div>`;
}

function renderSvg(item, mode) {
  const svg = readStringValue(item.svg);
  if (!svg) return '';
  return `<div style="${frameStyle(item, mode)}${transformStyle(item)}overflow:hidden">${svg}</div>`;
}

function renderChart(item, mode) {
  const box = readBox(item);
  const w = Math.max(1, box.width ?? 1);
  const h = Math.max(1, box.height ?? 1);
  const config = chartConfig(item, h);
  return `<div style="${frameStyle(item, mode)}${transformStyle(item)}overflow:hidden"><canvas data-presenton-chart="true" data-chart-config="${escapeAttribute(JSON.stringify(config))}" width="${cssNumber(Math.round(w))}" height="${cssNumber(Math.round(h))}" style="display:block;width:100%;height:100%"></canvas></div>`;
}

function renderInfographic(item, mode) {
  const data = readRecord(item.data);
  const kind = readString(data.type) === 'gauge' ? 'gauge' : 'progress_bar';
  if (kind === 'gauge') return renderGaugeInfographic(item, mode);
  return renderProgressBarInfographic(item, mode);
}

function renderProgressBarInfographic(item, mode) {
  const data = readRecord(item.data);
  const rawMin = readNumber(data.min_value) ?? 0;
  const rawMax = readNumber(data.max_value) ?? 100;
  const min = Math.min(rawMin, rawMax);
  const max = Math.max(rawMin, rawMax);
  const value = clamp(readNumber(data.value) ?? min, min, max);
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const label = String(Math.round(value * 100) / 100);
  const colors = readArray(item.colors);
  const highlightColor = normalizeChartColor(readString(colors[1])) ?? DEFAULT_CHART_COLORS[0];
  const baseColor = normalizeChartColor(readString(colors[0])) ?? '#E5E7EB';
  const fallbackSize = { width: 180, height: 40 };
  const box = readBox(item, fallbackSize);
  const showLabel = (box.height ?? fallbackSize.height) >= 28;
  const labelHtml = showLabel ? `<div style="color:#111827;font-size:${cssNumber(Math.max(10, Math.min(16, Math.round((box.height ?? fallbackSize.height) * 0.3))))}px;font-weight:700;line-height:1;text-align:right">${escapeHtml(label)}</div>` : '';
  return `<div style="${frameStyle(item, mode, fallbackSize)}${transformStyle(item)}display:flex;flex-direction:column;gap:6px;justify-content:center;overflow:hidden"><div style="position:relative;width:100%;height:${cssNumber(Math.max(6, Math.min(18, Math.round((box.height ?? fallbackSize.height) * 0.35))))}px;border-radius:999px;background:${escapeCssColor(baseColor)};overflow:hidden"><div style="height:100%;width:${cssNumber(ratio * 100)}%;border-radius:inherit;background:${escapeCssColor(highlightColor)}"></div></div>${labelHtml}</div>`;
}

function renderGaugeInfographic(item, mode) {
  const data = readRecord(item.data);
  const rawMin = readNumber(data.min_value) ?? 0;
  const rawMax = readNumber(data.max_value) ?? 100;
  const min = Math.min(rawMin, rawMax);
  const max = Math.max(rawMin, rawMax);
  const value = clamp(readNumber(data.value) ?? min, min, max);
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const label = String(Math.round(value * 100) / 100);
  const colors = readArray(item.colors);
  const highlightColor = normalizeChartColor(readString(colors[1])) ?? DEFAULT_CHART_COLORS[0];
  const baseColor = normalizeChartColor(readString(colors[0])) ?? '#E5E7EB';
  const fallbackSize = { width: 160, height: 96 };
  const progressPath = ratio > 0 ? `<path d="${escapeAttribute(describeGaugeArc(60, 60, 48, ratio))}" fill="none" stroke="${escapeAttribute(escapeCssColor(highlightColor))}" stroke-width="12" stroke-linecap="round"/>` : '';
  return `<div style="${frameStyle(item, mode, fallbackSize)}${transformStyle(item)}overflow:hidden"><svg width="100%" height="100%" viewBox="0 0 120 72" preserveAspectRatio="xMidYMid meet" style="display:block"><path d="M 12 60 A 48 48 0 0 1 108 60" fill="none" stroke="${escapeAttribute(escapeCssColor(baseColor))}" stroke-width="12" stroke-linecap="round"/>${progressPath}<text x="60" y="52" text-anchor="middle" fill="#111827" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeHtml(label)}</text></svg></div>`;
}

function describeGaugeArc(cx, cy, radius, ratio) {
  const start = gaugePoint(cx, cy, radius, 180);
  const end = gaugePoint(cx, cy, radius, 180 + clamp(ratio, 0, 1) * 180);
  return `M ${cssNumber(start.x)} ${cssNumber(start.y)} A ${cssNumber(radius)} ${cssNumber(radius)} 0 0 1 ${cssNumber(end.x)} ${cssNumber(end.y)}`;
}

function gaugePoint(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function chartConfig(item, height) {
  const chartKind = chartKindFromValue(readString(item.chartType ?? item.chart_type));
  const data = normalizeChartData(item, chartKind);
  const primaryColor = safeChartColor(readString(item.color), DEFAULT_CHART_COLORS[0]);
  const colors = data.colors.length > 0 ? data.colors : [primaryColor];
  const axisColor = safeChartColor(readString(item.axisColor ?? item.axis_color), '#98A2B3');
  const gridColor = safeChartColor(readString(item.gridColor ?? item.grid_color), axisColor);
  const textColor = safeChartColor(readString(item.textColor ?? item.text_color ?? item.labelColor ?? item.label_color), '#475467');
  const titleColor = safeChartColor(readString(item.titleColor ?? item.title_color), '#344054');
  const legendColor = safeChartColor(readString(item.legendColor ?? item.legend_color), textColor);
  const title = markdownToPlainChartText(readString(item.title) ?? '');
  const fontSize = clamp(height * 0.033, 9, 18);
  const titleFontSize = clamp(height * 0.044, 11, 26);
  const valueFontSize = clamp(height * 0.029, 8, 15);
  const autoShowLegend = isPieLikeChart(chartKind) || data.series.length > 1 || Boolean(data.series[0]?.name && data.series[0].name !== 'Series 1');
  const showLegend = item.legend != null ? readBoolean(item.legend) : autoShowLegend;
  const dataLabelPosition = readDataLabelPosition(
    Object.prototype.hasOwnProperty.call(item, 'data_labels')
      ? item.data_labels
      : item.dataLabels
  );
  const dataLabels = dataLabelPosition != null;
  const xAxisGrid = item.x_axis_grid != null ? readBoolean(item.x_axis_grid) : item.xAxisGrid != null ? readBoolean(item.xAxisGrid) : item.grid != null ? readBoolean(item.grid) : true;
  const yAxisGrid = item.y_axis_grid != null ? readBoolean(item.y_axis_grid) : item.yAxisGrid != null ? readBoolean(item.yAxisGrid) : item.grid != null ? readBoolean(item.grid) : true;
  const xAxis = item.x_axis != null ? readBoolean(item.x_axis) : item.xAxis != null ? readBoolean(item.xAxis) : true;
  const yAxis = item.y_axis != null ? readBoolean(item.y_axis) : item.yAxis != null ? readBoolean(item.yAxis) : true;
  const xAxisTitle = markdownToPlainChartText(readString(item.x_axis_title ?? item.xAxisTitle) ?? '');
  const yAxisTitle = markdownToPlainChartText(readString(item.y_axis_title ?? item.yAxisTitle) ?? '');

  const config = {
    type: chartJsType(chartKind),
    data: { labels: data.categories, datasets: chartDatasets(chartKind, { ...data, colors }) },
    options: {
      color: textColor,
      font: { family: 'Inter, Arial, sans-serif' },
      indexAxis: isHorizontalChart(chartKind) ? 'y' : 'x',
      layout: { padding: isPieLikeChart(chartKind) ? { top: 16, right: 20, bottom: 12, left: 20 } : { top: 12, right: 22, bottom: 8, left: 12 } },
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      plugins: {
        legend: { display: showLegend, position: 'bottom', labels: { boxWidth: Math.max(8, fontSize * 0.8), boxHeight: Math.max(8, fontSize * 0.8), color: legendColor, font: { family: 'Inter, Arial, sans-serif', size: fontSize, weight: 600 }, padding: Math.max(8, fontSize), usePointStyle: true } },
        title: { display: Boolean(title), text: title.split(/\r?\n/).filter(Boolean), color: titleColor, font: { family: 'Inter, Arial, sans-serif', size: titleFontSize, weight: '700' }, padding: { bottom: Math.max(16, titleFontSize * 0.8), top: 0 } },
        tooltip: { enabled: false },
        presentonDataLabels: { enabled: dataLabels, color: textColor, fontFamily: 'Inter, Arial, sans-serif', fontSize: valueFontSize, horizontal: isHorizontalChart(chartKind), position: dataLabelPosition ?? 'top' },
      },
    },
  };

  if (chartKind === 'donut') { config.options.cutout = '58%'; }
  else if (chartKind === 'pie') { config.options.cutout = '0%'; }
  else {
    config.options.scales = chartScales({ axisColor, chartKind, fontSize, gridColor, xAxis, xAxisGrid, xAxisTitle, yAxis, yAxisGrid, yAxisTitle });
  }
  return config;
}

function chartDatasets(chartKind, data) {
  if (chartKind === 'pie' || chartKind === 'donut') {
    const s = data.series[0];
    if (!s) return [];
    return [{ label: s.name, data: s.values.map(v => Math.max(0, v)), backgroundColor: s.values.map((_, i) => data.colors[i % data.colors.length] ?? DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length]), borderColor: '#FFFFFF', borderWidth: 1, hoverOffset: 0 }];
  }
  if (chartKind === 'polar_area') {
    const series = data.series.length ? data.series : [{ name: 'Series 1', points: [{ x: 1, y: 0 }], values: [0] }];
    return series.map(s => {
      const cs = data.series.length === 1 ? s.values.map((_, i) => data.colors[i % data.colors.length] ?? DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length]) : s.values.map(() => data.colors[0] ?? DEFAULT_CHART_COLORS[0]);
      return { label: s.name, data: s.values, backgroundColor: cs.map(c => withAlpha(c, 0.78)), borderColor: cs, borderWidth: 1 };
    });
  }
  if (chartKind === 'scatter' || chartKind === 'bubble') {
    return data.series.map(s => {
      const cs = data.series.length === 1 ? s.values.map((_, i) => data.colors[i % data.colors.length] ?? DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length]) : [data.colors[0] ?? DEFAULT_CHART_COLORS[0]];
      return { label: s.name, data: chartKind === 'bubble' ? s.points.map(p => ({ ...p, r: p.r ?? 6 })) : s.points.map(({ x, y }) => ({ x, y })), backgroundColor: cs.map(c => withAlpha(c, 0.78)), borderColor: cs, borderWidth: 2, pointRadius: chartKind === 'scatter' ? 4 : undefined, pointHoverRadius: 4 };
    });
  }
  const lineLike = chartKind === 'line' || chartKind === 'area';
  return data.series.map((s, idx) => {
    const color = data.colors[idx % data.colors.length] ?? DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];
    const barChart = isBarChart(chartKind);
    const stackedBarChart = isStackedChart(chartKind);
    return {
      label: s.name, data: s.values,
      backgroundColor: chartKind === 'area' ? withAlpha(color, 0.24) : lineLike ? color : color,
      borderColor: color, borderWidth: lineLike ? 3 : 0,
      borderRadius: barChart && stackedBarChart ? 7 : undefined,
      borderSkipped: barChart ? (stackedBarChart ? 'start' : false) : undefined,
      fill: chartKind === 'area', maxBarThickness: 62,
      pointBackgroundColor: color, pointBorderColor: '#FFFFFF',
      pointBorderWidth: lineLike ? 1.5 : 0, pointRadius: lineLike ? 3.5 : 0, tension: lineLike ? 0.35 : 0,
    };
  });
}

function normalizeChartData(item, chartKind) {
  const points = readArray(item.data).map(readRecord).map((p, i) => ({
    label: readString(p.label) ?? `Value ${i + 1}`,
    value: chartValue(p),
    point: chartPoint(p, i),
    color: normalizeChartColor(readString(p.color)),
  })).filter(p => p);
  let series = readArray(item.series).map(readRecord).map((s, i) => {
    const rawValues = readArray(s.values ?? s.data);
    return {
      name: readString(s.name) ?? `Series ${i + 1}`,
      points: rawValues.map((v, vi) => chartPoint(v, vi)),
      values: rawValues.map(chartValue),
    };
  }).filter(s => s.values.length);
  if (!series.length && points.length) series.push({ name: readString(item.title) ?? 'Series 1', points: points.map(p => p.point), values: points.map(p => p.value) });
  if (!series.length) series.push({ name: 'Series 1', points: [{ x: 1, y: 0 }], values: [0] });
  if (isPieLikeChart(chartKind) && series.length > 1) series.splice(1);
  const maxLen = Math.min(24, Math.max(1, ...series.map(s => s.values.length), points.length));
  const categoryValues = readArray(item.categories);
  const categories = Array.from({ length: maxLen }, (_, i) => readStringValue(categoryValues.length ? categoryValues[i] : points[i]?.label) || `Value ${i + 1}`);
  const colors = readArray(item.colors).map(c => normalizeChartColor(readString(c))).filter(Boolean);
  return {
    categories,
    colors: colors.length > 0 ? colors : [normalizeChartColor(readString(item.color)) ?? DEFAULT_CHART_COLORS[0]],
    series: series.map(s => ({
      ...s,
      values: Array.from({ length: maxLen }, (_, i) => s.values[i] ?? 0),
      points: Array.from({ length: maxLen }, (_, i) => s.points[i] ?? { x: i + 1, y: 0 }),
    })),
  };
}

function chartScales({ axisColor, chartKind, fontSize, gridColor, xAxis, xAxisGrid, xAxisTitle, yAxis, yAxisGrid, yAxisTitle }) {
  if (isPieLikeChart(chartKind) || chartKind === 'polar_area') return undefined;
  if (chartKind === 'radar') {
    return { r: { angleLines: { color: withAlpha(gridColor, xAxisGrid ? 0.35 : 0), display: xAxisGrid }, beginAtZero: true, grid: { color: withAlpha(gridColor, yAxisGrid ? 0.35 : 0), display: yAxisGrid }, pointLabels: { color: axisColor, display: xAxis, font: { family: 'Inter, Arial, sans-serif', size: fontSize, weight: 600 } }, ticks: { backdropColor: 'transparent', color: axisColor, display: yAxis, font: { family: 'Inter, Arial, sans-serif', size: Math.max(8, fontSize - 1) } } } };
  }
  const horizontal = isHorizontalChart(chartKind);
  const stacked = isStackedChart(chartKind);
  const showCatGrid = horizontal ? xAxisGrid : yAxisGrid;
  const showLinGrid = horizontal ? yAxisGrid : xAxisGrid;
  const showCatAxis = horizontal ? yAxis : xAxis;
  const showLinAxis = horizontal ? xAxis : yAxis;
  const categoryAxis = { display: showCatAxis || showCatGrid, border: { color: axisColor, display: showCatAxis }, grid: { color: withAlpha(gridColor, showCatGrid ? 0.25 : 0), display: showCatGrid, drawTicks: showCatAxis }, stacked, ticks: { color: axisColor, display: showCatAxis, font: { family: 'Inter, Arial, sans-serif', size: fontSize, weight: 600 }, maxRotation: 0, autoSkip: true }, title: { color: axisColor, display: showCatAxis && Boolean(horizontal ? yAxisTitle : xAxisTitle), font: { family: 'Inter, Arial, sans-serif', size: fontSize, weight: 700 }, text: horizontal ? yAxisTitle : xAxisTitle }, type: 'category' };
  const linearAxis = { beginAtZero: true, display: showLinAxis || showLinGrid, border: { color: axisColor, display: showLinAxis }, grace: '8%', grid: { color: withAlpha(gridColor, showLinGrid ? 0.35 : 0), display: showLinGrid, drawTicks: showLinAxis }, stacked, ticks: { color: axisColor, display: showLinAxis, font: { family: 'Inter, Arial, sans-serif', size: Math.max(8, fontSize - 2), weight: 600 } }, title: { color: axisColor, display: showLinAxis && Boolean(horizontal ? xAxisTitle : yAxisTitle), font: { family: 'Inter, Arial, sans-serif', size: fontSize, weight: 700 }, text: horizontal ? xAxisTitle : yAxisTitle }, type: 'linear' };
  if (chartKind === 'scatter' || chartKind === 'bubble') {
    return { x: { ...linearAxis }, y: { ...linearAxis } };
  }
  return horizontal ? { x: linearAxis, y: categoryAxis } : { x: categoryAxis, y: linearAxis };
}

function chartValue(v) {
  if (typeof v === 'number') return v;
  const r = readRecord(v);
  return readNumber(r.value ?? r.y ?? r.data) ?? 0;
}

function chartPoint(value, index) {
  const record = readRecord(value);
  const radius = readNumber(record.r ?? record.radius);
  return {
    x: readNumber(record.x) ?? index + 1,
    y: chartValue(value),
    ...(radius != null ? { r: radius } : {}),
  };
}

function readDataLabelPosition(value) {
  if (value === true) return 'top';
  if (value === false || value == null) return null;
  const text = readString(value);
  return text && (text === 'base' || text === 'mid' || text === 'top' || text === 'outside') ? text : null;
}

function chartKindFromValue(v) {
  if (!v) return 'bar';
  const n = v.trim().replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().replace(/[\s-]+/g, '_').replace(/_+/g, '_');
  if (n === 'bubble') return 'bubble';
  if (n === 'horizontal_bar' || n === 'bar_horizontal') return 'horizontal_bar';
  if (n === 'horizontal_stacked_bar' || n === 'stacked_horizontal_bar') return 'horizontal_stacked_bar';
  if (n === 'stacked_bar' || n === 'bar_stacked' || n === 'stacked' || n === 'stacked_column') return 'stacked_bar';
  if (n === 'line') return 'line';
  if (n === 'area') return 'area';
  if (n === 'pie') return 'pie';
  if (n === 'donut' || n === 'doughnut') return 'donut';
  if (n === 'polar' || n === 'polar_area') return 'polar_area';
  if (n === 'radar') return 'radar';
  if (n === 'scatter') return 'scatter';
  return 'bar';
}

function chartJsType(k) {
  if (k === 'donut') return 'doughnut';
  if (k === 'area') return 'line';
  if (k === 'polar_area') return 'polarArea';
  if (k === 'horizontal_bar' || k === 'stacked_bar' || k === 'horizontal_stacked_bar') return 'bar';
  return k;
}

function isPieLikeChart(k) { return k === 'pie' || k === 'donut'; }
function isBarChart(k) { return k === 'bar' || k === 'horizontal_bar' || k === 'stacked_bar' || k === 'horizontal_stacked_bar'; }
function isHorizontalChart(k) { return k === 'horizontal_bar' || k === 'horizontal_stacked_bar'; }
function isStackedChart(k) { return k === 'stacked_bar' || k === 'horizontal_stacked_bar'; }

function frameStyle(item, mode, fallbackSize) {
  const box = readBox(item, fallbackSize);
  return frameStyleFromBox(box, mode);
}

function frameStyleFromBox(box, mode) {
  let style = `box-sizing:border-box;min-height:0;min-width:0;position:${mode === 'absolute' ? 'absolute' : 'relative'};`;
  if (mode === 'flow') style += 'flex-shrink:0;';
  if (mode === 'absolute') style += `left:${cssNumber(box.x)}px;top:${cssNumber(box.y)}px;`;
  if (box.width != null) style += `width:${cssNumber(box.width)}px;`;
  if (box.height != null) style += `height:${cssNumber(box.height)}px;`;
  return style;
}

function readBox(item, fallbackSize) {
  const position = readRecord(item.position);
  const size = readRecord(item.size);
  if (readString(item.type) === 'vector') {
    const pts = vectorShape(item) === 'ellipse' ? polygonSourcePoints(item) : polygonPoints(item);
    return polygonBox(item, pts);
  }
  return { x: readNumber(position.x) ?? 0, y: readNumber(position.y) ?? 0, width: readNumber(size.width) ?? fallbackSize?.width, height: readNumber(size.height) ?? fallbackSize?.height };
}

function childrenBounds(children) {
  return children.reduce((b, child) => { const box = readBox(child); return { width: Math.max(b.width, box.x + (box.width ?? 1)), height: Math.max(b.height, box.y + (box.height ?? 1)) }; }, { width: 1, height: 1 });
}

function polygonSourcePoints(item) {
  return readArray(item.points).map(readRecord).map(p => { const x = readNumber(p.x); const y = readNumber(p.y); return x != null && y != null ? { x, y } : null; }).filter(Boolean);
}

function vectorShape(item) { return readString(item.shape) === 'ellipse' ? 'ellipse' : 'polygon'; }

function polygonPoints(item) {
  const points = polygonSourcePoints(item);
  if (readString(item.type) === 'vector' && vectorShape(item) === 'ellipse') return points;
  const closed = polygonClosed(item, points);
  const rounded = closed ? roundedPolygonPoints(points, cornerRadii(item, points.length)) : points;
  return rounded;
}

function cornerRadii(item, count) {
  return readArray(item.corner_radii ?? item.cornerRadii).map(readNumber).filter(v => v != null).slice(0, count).map(v => Math.max(0, v));
}

function pointAt(points, i) { return points[((i % points.length) + points.length) % points.length]; }
function lerpPoint(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

function roundedPolygonPoints(points, radii, segments = 8) {
  if (points.length < 3 || radii.length === 0) return points;
  const rounded = [];
  points.forEach((point, index) => {
    const radius = radii[index] ?? 0;
    const prev = pointAt(points, index - 1);
    const next = pointAt(points, index + 1);
    const prevDist = Math.hypot(point.x - prev.x, point.y - prev.y);
    const nextDist = Math.hypot(point.x - next.x, point.y - next.y);
    const safeRadius = Math.min(radius, prevDist / 2, nextDist / 2);
    if (safeRadius <= 0) { rounded.push(point); return; }
    const from = lerpPoint(point, prev, safeRadius / prevDist);
    const to = lerpPoint(point, next, safeRadius / nextDist);
    rounded.push(from);
    for (let step = 1; step < segments; step++) {
      const t = step / segments;
      rounded.push({ x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * point.x + t * t * to.x, y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * point.y + t * t * to.y });
    }
    rounded.push(to);
  });
  return rounded;
}

function polygonClosed(item, points) {
  if (readString(item.type) === 'vector' && vectorShape(item) === 'ellipse') return true;
  const v = item.closed;
  if (v === false || v === 'false' || v === '0') return false;
  if (v === true || v === 'true' || v === '1') return true;
  return points.length > 2;
}

function polygonBox(item, points) {
  if (!points.length) return { x: 0, y: 0, width: 1, height: 1 };
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));
  const stroke = readRecord(item.stroke);
  const sw = Math.max(1, readNumber(stroke.width) ?? 1);
  return { x: minX, y: minY, width: Math.max(maxX - minX, sw, 1), height: Math.max(maxY - minY, sw, 1) };
}

function boxStyle(item) {
  const fill = readRecord(item.fill);
  const stroke = readRecord(item.stroke);
  const shadow = readRecord(item.shadow);
  const radius = readRecord(item.borderRadius ?? item.border_radius);
  let style = transformStyle(item);
  const fillColor = readString(fill.color);
  if (fillColor) style += `background-color:${escapeCssColor(colorWithOpacity(fillColor, readNumber(fill.opacity)))};`;
  const strokeColor = readString(stroke.color);
  const strokeWidth = readNumber(stroke.width);
  if (strokeColor || strokeWidth != null) style += `border:${cssNumber(strokeWidth ?? 1)}px solid ${escapeCssColor(colorWithOpacity(strokeColor ?? 'transparent', readNumber(stroke.opacity)))};`;
  const br = borderRadiusStyle(radius);
  if (br) style += `border-radius:${br};`;
  const sv = shadowCssValue(shadow);
  if (sv) style += `box-shadow:${sv};`;
  const opacity = readNumber(item.opacity);
  if (opacity != null) style += `opacity:${cssNumber(opacity)};`;
  return style;
}

function textShadowStyle(item) {
  const sv = shadowCssValue(readRecord(item.shadow));
  return sv ? `text-shadow:${sv};` : '';
}

function shadowCssValue(shadow) {
  const o = Object.keys(shadow).length ? (readNumber(shadow.opacity) ?? 1) : 0;
  if (o <= 0) return '';
  return `${cssNumber(readNumber(shadow.offsetX ?? shadow.offset_x) ?? 0)}px ${cssNumber(readNumber(shadow.offsetY ?? shadow.offset_y) ?? 0)}px ${cssNumber(readNumber(shadow.blur) ?? 0)}px ${escapeCssColor(colorWithOpacity(readString(shadow.color) ?? '#000000', o))}`;
}

function transformStyle(item) {
  const rot = readNumber(item.rotation);
  const flipH = readBoolean(item.flip_h ?? item.flipH);
  const flipV = readBoolean(item.flip_v ?? item.flipV);
  if (!rot && !flipH && !flipV) return '';
  const t = [];
  if (rot) t.push(`rotate(${cssNumber(rot)}deg)`);
  if (flipH) t.push('scaleX(-1)');
  if (flipV) t.push('scaleY(-1)');
  return `transform:${t.join(' ')};transform-origin:center;`;
}

function fontStyle(fontVal, options = {}) {
  const font = readRecord(fontVal);
  let style = `color:${escapeCssColor(colorWithOpacity(readString(font.color) ?? '#111827', readNumber(font.opacity)))};`;
  const family = readString(font.family);
  const size = readNumber(font.size);
  if (family) style += `font-family:${escapeCssFont(family)};`;
  if (size != null) style += `font-size:${cssNumber(size)}px;`;
  if (hasOwn(font, 'italic')) style += readBoolean(font.italic) ? 'font-style:italic;' : 'font-style:normal;';
  if (hasOwn(font, 'bold')) style += readBoolean(font.bold) ? 'font-weight:700;' : 'font-weight:400;';
  if (options.includeLineHeight !== false) style += lineHeightStyle(font);
  const ls = readNumber(font.letterSpacing ?? font.letter_spacing);
  if (ls != null) style += `letter-spacing:${cssNumber(ls)}px;`;
  if (options.includeTextDecoration !== false) style += textDecorationStyle(font);
  return style;
}

function textDecorationStyle(font) {
  if (hasOwn(font, 'underline')) return readBoolean(font.underline) ? 'text-decoration:underline;' : 'text-decoration:none;';
  const decs = [font.text_decoration, font.textDecoration].map(v => readString(v)?.toLowerCase()).filter(Boolean);
  if (decs.includes('underline')) return 'text-decoration:underline;';
  if (decs.includes('none')) return 'text-decoration:none;';
  return '';
}

function lineHeightStyle(font, fallback) {
  const lh = readNumber(font.lineHeight ?? font.line_height) ?? fallback;
  if (lh == null) return '';
  return `line-height:${cssNumber(lh)};`;
}

function paddingStyle(padding) {
  return `padding:${cssNumber(readNumber(padding.top) ?? 0)}px ${cssNumber(readNumber(padding.right) ?? 0)}px ${cssNumber(readNumber(padding.bottom) ?? 0)}px ${cssNumber(readNumber(padding.left) ?? 0)}px;`;
}

function borderRadiusStyle(radius) {
  const tl = readNumber(radius.tl) ?? 0;
  const tr = readNumber(radius.tr) ?? tl;
  const br = readNumber(radius.br) ?? tl;
  const bl = readNumber(radius.bl) ?? tl;
  return tl || tr || br || bl ? `${cssNumber(tl)}px ${cssNumber(tr)}px ${cssNumber(br)}px ${cssNumber(bl)}px` : '';
}

function imageFit(v) { return v === 'cover' || v === 'fill' ? v : 'contain'; }
function imageMaskSize(v) { return imageFit(v) === 'fill' ? '100% 100%' : imageFit(v); }
function imageCropTransformStyle(item) {
  const cs = clamp(readNumber(item.crop_scale ?? item.cropScale) ?? 1, 1, 6);
  if (cs <= 1) return '';
  return `transform:scale(${cssNumber(cs)});transform-origin:${imageFocusValue(item) ?? 'center'};`;
}
function imageFocusStyle(item) { const f = imageFocusValue(item); return f ? `object-position:${f};` : ''; }
function imageFocusValue(item) {
  const focus = readArray(item.focus);
  const rx = item.focus_x ?? item.focusX ?? focus[0];
  const ry = item.focus_y ?? item.focusY ?? focus[1];
  if (rx == null && ry == null) return null;
  return `${cssNumber(clamp(readNumber(rx) ?? 50, 0, 100))}% ${cssNumber(clamp(readNumber(ry) ?? 50, 0, 100))}%`;
}
function clipPathStyle(item) {
  const v = readString(item.clippath ?? item.clipPath ?? item.clip_path);
  if (!v) return '';
  return `clip-path:${v};-webkit-clip-path:${v};`;
}

function tableRows(item) {
  const cols = readArray(item.columns);
  const body = readArray(item.rows).map(readArray);
  return (cols.length ? [cols, ...body] : body).filter(r => Array.isArray(r));
}
function tableBaseFont(item) { return { family: 'Arial', size: 18, color: '#111827', line_height: 1.15, ...readRecord(item.font) }; }
function tableCellStyle(cellVal, header, tf) {
  const cell = readRecord(cellVal);
  const cellFont = { ...tf, ...readRecord(cell.font) };
  const fill = readRecord(cell.color ?? cell.fill);
  const fillColor = readString(fill.color);
  const bg = fillColor ? colorWithOpacity(fillColor, readNumber(fill.opacity)) : 'transparent';
  let style = `${fontStyle(cellFont, { includeTextDecoration: false })}display:flex;align-items:center;justify-content:flex-start;border:1px solid ${escapeCssColor(colorWithOpacity(readString(readRecord(cell.stroke).color) ?? '#D1D5DB', readNumber(readRecord(cell.stroke).opacity)))};min-height:0;min-width:0;overflow:hidden;padding:4px 6px;text-align:left;vertical-align:middle;white-space:pre-wrap;word-break:break-word;background:${escapeCssColor(bg)};`;
  return style;
}
function textOverflowStyle() { return 'overflow:visible;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;'; }
function cellText(cellVal, tf, header) {
  if (typeof cellVal === 'string' || typeof cellVal === 'number') return escapeHtml(String(cellVal));
  const cell = readRecord(cellVal);
  const runs = readArray(cell.runs).map(readRecord);
  if (runs.length) {
    return runs.map(run => `<span style="${fontStyle({ ...tf, ...readRecord(cell.font), ...readRecord(run.font) })}">${escapeHtml(readStringValue(run.text))}</span>`).join('');
  }
  const text = cell.text;
  if (typeof text === 'string') return `<span style="${fontStyle(tf)}">${escapeHtml(text)}</span>`;
  const textRecord = readRecord(text);
  const textRuns = readArray(textRecord.runs).map(readRecord);
  if (textRuns.length) return textRuns.map(run => `<span style="${fontStyle({ ...tf, ...readRecord(textRecord.font), ...readRecord(run.font) })}">${escapeHtml(readStringValue(run.text))}</span>`).join('');
  return `<span style="${fontStyle(tf)}">${escapeHtml(readStringValue(readRecord(text).text))}</span>`;
}

function isComponent(item) { return Array.isArray(item.elements) && (!readString(item.type) || !ELEMENT_TYPES.has(readString(item.type))); }
function readRecord(v) { return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {}; }
function readRecordOrNull(v) { const r = readRecord(v); return Object.keys(r).length ? r : null; }
function hasOwn(r, k) { return Object.prototype.hasOwnProperty.call(r, k); }
function readArray(v) { return Array.isArray(v) ? v : []; }
function readString(v) { return typeof v === 'string' && v.trim() ? v.trim() : null; }
function readStringValueOrNull(v) { return typeof v === 'string' && v.trim() ? v : null; }
function readStringValue(v) { return typeof v === 'string' ? v : v == null ? '' : String(v); }
function readNumber(v) { if (typeof v === 'number' && Number.isFinite(v)) return v; if (typeof v === 'string' && v.trim()) { const p = Number(v); return Number.isFinite(p) ? p : null; } return null; }
function readBoolean(v) { return v === true || v === 'true' || v === '1'; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function normalizeChartColor(v) { if (!v) return null; return safeChartColor(v, DEFAULT_CHART_COLORS[0]); }
function safeChartColor(v, fb = DEFAULT_CHART_COLORS[0]) { const c = withHash(v); if (/^#[0-9A-Fa-f]{3}$/.test(c) || /^#[0-9A-Fa-f]{6}$/.test(c) || /^rgba?\(/i.test(c)) return c; return fb; }
function withHash(v) { if (!v) return null; const c = v.trim(); if (!c) return null; return c.startsWith('#') || /^rgba?\(/i.test(c) ? c : `#${c}`; }
function withAlpha(color, alpha) {
  const n = safeChartColor(color);
  const hex = n.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (!hex) { const rgb = n.match(/^rgba?\(([^)]+)\)$/i); if (rgb) { const ch = rgb[1].split(',').slice(0, 3).map(p => p.trim()); return `rgba(${ch.join(', ')}, ${alpha})`; } return n; }
  const raw = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1];
  const int = Number.parseInt(raw, 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}
function normalizeCssColor(c) { const n = c.trim(); const hex = n.match(/^#?([0-9a-fA-F]{6})$/)?.[1]; return hex ? `#${hex}` : n; }
function colorWithOpacity(color, opacity) {
  const n = normalizeCssColor(color);
  if (opacity == null || opacity >= 1 || n === 'transparent') return n;
  const hex = n.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return n;
  const v = Number.parseInt(hex, 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, opacity)})`;
}
function cssNumber(v) { return Number.isFinite(v) ? String(v) : '0'; }
function escapeHtml(v) { return v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function escapeAttribute(v) { return escapeHtml(v); }
function escapeStyleText(v) { return v.replaceAll('</style', '<\\/style'); }
function escapeCssColor(v) { return /^[#(),.%\s\w-]+$/.test(v) ? v : 'transparent'; }
function escapeCssFont(v) { return `'${v.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`; }
function cssUrl(v) { return `url('${escapeCssUrl(v)}')`; }
function escapeCssUrl(v) { return v.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll("'", "\\'").replaceAll('\n', '').replaceAll('\r', ''); }
function horizontalAlign(v) { return v === 'center' ? 'center' : v === 'right' ? 'flex-end' : 'flex-start'; }
function verticalAlign(v) { return v === 'middle' || v === 'center' ? 'center' : v === 'bottom' ? 'flex-end' : 'flex-start'; }
function textAlign(v) { return v === 'center' || v === 'right' ? v : 'left'; }
function cssAlignment(v, fb) { return v === 'flex-start' || v === 'flex-end' || v === 'center' || v === 'stretch' ? v : fb; }
