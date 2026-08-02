/**
 * Template Schema Builder — JavaScript port of Presenton's v2/schema.py.
 *
 * Walks template.json layouts → components → elements and builds JSON Schema
 * for each layout.  Used by the LLM to generate content that exactly matches
 * the template's editable fields.
 */

const JSON_SCHEMA_URI = 'https://json-schema.org/draft/2020-12/schema';

const CONTENT_TYPES = new Set(['text', 'image', 'text-list', 'table', 'chart', 'infographic']);

const CHART_TYPE_VALUES = [
  'area', 'bar', 'bubble', 'donut', 'horizontal_bar',
  'horizontal_stacked_bar', 'line', 'pie', 'polar_area', 'radar',
  'scatter', 'stacked_bar',
];

const REPEATED_NAME_SUFFIX_RE = /_\d+$/;
const COMPONENT_REPEATED_NAME_TOKEN_RE = /_\d+(?=_|$)/;
const COMPONENT_SCHEMA_METADATA_KEYS = new Set(['$schema', 'title', 'description', 'x-element-type', 'x-element-path']);

/* ── public ──────────────────────────────────────────────────────────── */

/**
 * Build editable-content JSON schemas for all layouts in a template.
 *
 * @param {object} templateJson  The parsed template.json.
 * @returns {{ source_file: string, layout_count: number, layouts: Array<{slide:number, layout_id:string, schema:object|null}> }}
 */
export function getTemplateSchema(templateJson) {
  const layouts = Array.isArray(templateJson?.layouts) ? templateJson.layouts : [];
  const generated = layouts.map((layout, i) => _buildLayoutSchema(layout, i));
  return {
    source_file: 'template.json',
    layout_count: generated.length,
    layouts: generated,
  };
}

/**
 * Component-level content keys — mirrors Presenton's
 * `_template_component_content_keys()`.  Returns an ordered array of strings
 * where each entry is the content key for the corresponding component in the
 * layout.
 */
export function componentContentKeys(components) {
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

/* ── layout schema ───────────────────────────────────────────────────── */

function _buildLayoutSchema(layout, slideIndex) {
  const components = Array.isArray(layout?.components) ? layout.components : [];

  const entries = [];
  for (const comp of components) {
    const data = _componentData(comp);
    if (!data) continue;
    const schema = _getComponentSchema(data);
    if (!schema) continue;
    entries.push({ id: _componentId(data), schema });
  }

  // Count occurrences per component id
  const counts = {};
  for (const { id } of entries) counts[id] = (counts[id] || 0) + 1;

  const properties = {};
  const required = [];
  const indexes = {};

  for (const { id, schema } of entries) {
    const occ = indexes[id] || 0;
    indexes[id] = occ + 1;
    const key = _templateComponentKey(id, occ, counts[id], properties);
    properties[key] = _stripComponentSchemaMetadata(schema);
    required.push(key);
  }

  let schema = null;
  if (Object.keys(properties).length) {
    schema = {
      $schema: JSON_SCHEMA_URI,
      type: 'object',
      title: layout?.id || `slide_${slideIndex}`,
      description: layout?.description,
      additionalProperties: false,
      properties,
      required,
    };
  }

  return { slide: slideIndex, layout_id: layout?.id, schema };
}

function _templateComponentKey(componentId, occurrenceIndex, occurrenceCount, properties) {
  let key = occurrenceCount > 1 ? `${componentId}_${occurrenceIndex}` : componentId;
  const base = key;
  let suffix = 1;
  while (properties[key]) { key = `${base}_${suffix}`; suffix++; }
  return key;
}

/* ── component schema ────────────────────────────────────────────────── */

function _getComponentSchema(componentData) {
  const elements = componentData?.elements;
  if (!Array.isArray(elements)) return null;
  const nodes = _componentSchemaNodesForElements(elements);
  if (!nodes.length) return null;

  const properties = {};
  for (const [name, schema] of nodes) _addProperty(properties, name, schema);

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}

function _componentSchemaNodesForElements(elements, pathPrefix = 'elements') {
  const nodes = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (typeof el !== 'object' || el === null) continue;
    nodes.push(..._componentSchemaNodesForElement(el, `${pathPrefix}.${i}`));
  }
  return nodes;
}

function _componentSchemaNodesForElement(element, path) {
  const type = element?.type;
  const name = _componentSchemaElementName(element);

  // Content elements → direct schema
  if (CONTENT_TYPES.has(type) && element?.decorative === false && name) {
    return [[name, _componentContentFieldSchema({ name, path, element })]];
  }

  // Container → recurse into child
  if (type === 'container') {
    const child = element?.child;
    const childNodes = (child && typeof child === 'object')
      ? _componentSchemaNodesForElement(child, `${path}.child`)
      : [];
    if (!name || !childNodes.length) return childNodes;
    return [[name, _componentObjectSchemaFromNodes(childNodes)]];
  }

  // flex / grid / group → recurse into children
  if (type === 'flex' || type === 'grid' || type === 'group') {
    const children = element?.children;
    if (!Array.isArray(children)) return [];
    const childNodeSets = children.map((ch, i) =>
      (ch && typeof ch === 'object') ? _componentSchemaNodesForElement(ch, `${path}.children.${i}`) : [],
    );
    const flatChildNodes = childNodeSets.flat();
    if (!name || !flatChildNodes.length) return flatChildNodes;

    // Try to collapse repeated children into array (flex/grid only)
    if (type === 'flex' || type === 'grid') {
      const arrSchema = _componentArraySchemaForRepeatedChildren(element, childNodeSets);
      if (arrSchema) return [[name, arrSchema]];
    }
    return [[name, _componentObjectSchemaFromNodes(flatChildNodes)]];
  }

  return [];
}

function _componentSchemaElementName(element) {
  const name = element?.name;
  if (typeof name !== 'string') return null;
  const stripped = name.trim();
  return stripped || null;
}

/* ── per-element-type schemas ────────────────────────────────────────── */

function _componentContentFieldSchema(field) {
  const el = field.element;
  const type = el?.type;
  let schema;

  if (type === 'text') {
    schema = { type: 'string', minLength: el.min_length, maxLength: el.max_length };
  } else if (type === 'image') {
    const promptKey = el?.is_icon === true ? 'icon_query' : 'image_prompt';
    schema = {
      type: 'object',
      additionalProperties: false,
      properties: { [promptKey]: { type: 'string', description: el?.is_icon ? 'Search query for the replacement icon.' : 'Prompt for the replacement image.' } },
      required: [promptKey],
    };
  } else if (type === 'text-list') {
    schema = {
      type: 'array',
      items: { type: 'string', minLength: el.min_item_length, maxLength: el.max_item_length },
      minItems: el.min_items,
      maxItems: el.max_items,
    };
  } else if (type === 'table') {
    schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        columns: { type: 'array', items: { type: 'string' }, minItems: el.min_columns, maxItems: el.max_columns },
        rows: {
          type: 'array',
          items: { type: 'array', items: { type: 'string' }, minItems: el.min_columns, maxItems: el.max_columns },
          minItems: el.min_rows,
          maxItems: el.max_rows,
        },
      },
      required: ['columns', 'rows'],
    };
  } else if (type === 'chart') {
    schema = _chartContentSchema();
  } else if (type === 'infographic') {
    schema = _infographicContentSchema();
  } else {
    schema = {};
  }

  return { ..._withoutNoneValues(schema), title: _componentContentFieldTitle(field.name) };
}

function _chartContentSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      chart_type: { type: 'string', enum: CHART_TYPE_VALUES },
      title: { type: ['string', 'null'] },
      categories: { type: 'array', items: { type: 'string' }, maxItems: 24 },
      series: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            values: { type: 'array', items: { type: 'number' }, maxItems: 24 },
          },
          required: ['name', 'values'],
        },
        maxItems: 12,
      },
    },
    required: ['chart_type', 'categories', 'series'],
  };
}

function _infographicContentSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      data: {
        oneOf: [
          _infographicDataSchema('progress_bar'),
          _infographicDataSchema('gauge'),
        ],
      },
      colors: { type: 'array', items: { type: 'string' }, minItems: 1 },
    },
    required: ['data'],
  };
}

function _infographicDataSchema(infographicType) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { const: infographicType },
      min_value: { type: 'number' },
      max_value: { type: 'number' },
      value: { type: 'number' },
    },
    required: ['type', 'min_value', 'max_value', 'value'],
  };
}

/* ── repeated children → array collapse ──────────────────────────────── */

function _componentArraySchemaForRepeatedChildren(element, childNodeSets) {
  const populated = childNodeSets.filter((ns) => ns.length > 0);
  if (populated.length !== childNodeSets.length) return null;
  if (populated.length < 2 && !_canExpandRepeatedChildren(element, populated.length)) return null;

  for (const strategy of ['numeric', 'none', 'prefix']) {
    const normalizedItems = populated.map((ns) => _componentNormalizedRepeatedItemSchema(ns, strategy));
    const merged = _componentMergeRepeatedSchemas(normalizedItems);
    if (merged) {
      return _withoutNoneValues({
        type: 'array',
        minItems: element?.min_children,
        maxItems: element?.max_children,
        items: merged,
      });
    }
  }
  return null;
}

function _componentNormalizedRepeatedItemSchema(nodes, strategy) {
  const token = _componentNormalizationTokenForNodes(nodes, strategy);
  const itemSchema = (nodes.length === 1 && nodes[0][1]?.type === 'object')
    ? nodes[0][1]
    : _componentObjectSchemaFromNodes(nodes);
  return _componentSchemaWithoutRepeatedNameSuffix(itemSchema, token);
}

function _componentNormalizationTokenForNodes(nodes, strategy) {
  if (strategy === 'none') return null;
  const getter = strategy === 'numeric' ? _componentNumericNameToken : _componentPrefixNameToken;
  const tokens = nodes.map(([name]) => getter(name)).filter(Boolean);
  if (!tokens.length) return null;
  return tokens.every((t) => t === tokens[0]) ? tokens[0] : null;
}

function _componentNumericNameToken(value) {
  const m = COMPONENT_REPEATED_NAME_TOKEN_RE.exec(value);
  return m ? m[0] : null;
}

function _componentPrefixNameToken(value) {
  const idx = value.indexOf('_');
  if (idx < 1) return null;
  return value.slice(0, idx + 1);
}

function _componentSchemaWithoutRepeatedNameSuffix(schema, suffix) {
  return _componentNormalizeSchemaValue(schema, suffix);
}

function _componentNormalizeSchemaValue(value, suffix) {
  if (Array.isArray(value)) return value.map((v) => _componentNormalizeSchemaValue(v, suffix));
  if (typeof value !== 'object' || value === null) return value;

  const normalized = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'x-element-path') continue;
    if (key === 'properties' && typeof nested === 'object' && nested !== null) {
      const props = {};
      for (const [pn, ps] of Object.entries(nested)) {
        const normName = _componentStripRepeatedSuffix(pn, suffix);
        const normSchema = _componentNormalizeSchemaValue(ps, suffix);
        if (typeof normSchema === 'object' && normSchema !== null && 'title' in normSchema) {
          normSchema.title = _componentContentFieldTitle(normName);
        }
        props[normName] = normSchema;
      }
      normalized[key] = props;
      continue;
    }
    if (key === 'required' && Array.isArray(nested)) {
      normalized[key] = nested
        .filter((item) => typeof item === 'string')
        .map((item) => _componentStripRepeatedSuffix(item, suffix));
      continue;
    }
    normalized[key] = _componentNormalizeSchemaValue(nested, suffix);
  }
  return normalized;
}

function _componentStripRepeatedSuffix(value, suffix) {
  if (suffix && value.includes(suffix)) return value.replace(suffix, '');
  return value;
}

function _componentMergeRepeatedSchemas(schemas) {
  if (!schemas.length) return null;
  const first = _componentComparableRepeatedSchema(schemas[0]);
  if (schemas.some((s) => JSON.stringify(_componentComparableRepeatedSchema(s)) !== JSON.stringify(first))) return null;
  return JSON.parse(JSON.stringify(schemas[0]));
}

function _componentComparableRepeatedSchema(value, key = '') {
  if (Array.isArray(value)) {
    const items = value.map((v) => _componentComparableRepeatedSchema(v, key));
    if ((key === 'enum' || key === 'required') && items.every((i) => typeof i === 'string')) return items.sort();
    return items;
  }
  if (typeof value !== 'object' || value === null) return value;
  const comparable = {};
  for (const k of Object.keys(value).sort()) {
    if (k === 'x-element-path') continue;
    comparable[k] = _componentComparableRepeatedSchema(value[k], k);
  }
  return comparable;
}

/* ── strip metadata from component schemas ───────────────────────────── */

function _stripComponentSchemaMetadata(value) {
  if (Array.isArray(value)) return value.map(_stripComponentSchemaMetadata);
  if (typeof value !== 'object' || value === null) return value;
  const stripped = {};
  for (const [k, nested] of Object.entries(value)) {
    if (COMPONENT_SCHEMA_METADATA_KEYS.has(k)) continue;
    if (k === 'properties' && typeof nested === 'object' && nested !== null) {
      stripped[k] = {};
      for (const [pn, ps] of Object.entries(nested)) {
        stripped[k][pn] = _stripComponentSchemaMetadata(ps);
      }
      continue;
    }
    stripped[k] = _stripComponentSchemaMetadata(nested);
  }
  return stripped;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

function _componentData(comp) {
  if (typeof comp === 'object' && comp !== null) return comp;
  return null;
}

function _componentId(componentData) {
  const id = componentData?.id;
  if (typeof id === 'string') return id;
  return 'unknown_component';
}

function _componentObjectSchemaFromNodes(nodes) {
  const properties = {};
  for (const [name, schema] of nodes) _addProperty(properties, name, schema);
  return { type: 'object', additionalProperties: false, properties, required: Object.keys(properties) };
}

function _addProperty(properties, name, schema) {
  let key = name;
  let suffix = 2;
  while (key in properties) { key = `${name}_${suffix}`; suffix++; }
  properties[key] = schema;
}

function _componentContentFieldTitle(name) {
  return name.split('_').filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || name;
}

function _canExpandRepeatedChildren(element, childCount) {
  const max = element?.max_children;
  return typeof max === 'number' && max > childCount;
}

function _withoutNoneValues(value) {
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map(_withoutNoneValues);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    out[k] = _withoutNoneValues(v);
  }
  return out;
}
