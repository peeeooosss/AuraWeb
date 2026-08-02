import { json, jsonError } from '../../../../../_lib';

const TEMPLATES = {
  general: { id: 'general', name: 'General', description: 'General template best for simple presentations, great spacing and clean layout.', layout_count: 12, is_default: true },
  modern: { id: 'modern', name: 'Modern', description: 'Clean, contemporary layouts with generous whitespace, confident typography, and bold visual accents.', layout_count: 10, is_default: true },
  executive: { id: 'executive', name: 'Executive', description: 'Leadership-ready layouts with bold typography and subtle violet accents.', layout_count: 32, is_default: true },
  momentum: { id: 'momentum', name: 'Momentum', description: 'A polished, high-energy business template for strategy, performance, product, and leadership presentations.', layout_count: 28, is_default: true },
  dynamic: { id: 'dynamic', name: 'Dynamic', description: 'Bold, high-contrast layouts with dark textured backgrounds and warm accents.', layout_count: 32, is_default: true },
  standard: { id: 'standard', name: 'Standard', description: 'Balanced, adaptable layouts that keep business and everyday content clear.', layout_count: 11, is_default: true },
  swift: { id: 'swift', name: 'Swift', description: 'Bright, energetic layouts with crisp structure and visual momentum.', layout_count: 9, is_default: true },
};

export const onRequestGet = async ({ params }) => {
  const t = TEMPLATES[params.id];
  if (!t) return jsonError('Template not found', 404);
  return json({ ...t, thumbnail: `/arena/templates/${t.id}/static/thumbnail.png` });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestGet(context);
};
