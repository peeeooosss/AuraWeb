import { json } from '../../../../_lib';

const TEMPLATES = [
  { id: 'general', name: 'General', description: 'General template best for simple presentations, great spacing and clean layout.', layout_count: 12, is_default: true },
  { id: 'modern', name: 'Modern', description: 'Clean, contemporary layouts with generous whitespace, confident typography, and bold visual accents for a polished presentation.', layout_count: 10, is_default: true },
  { id: 'executive', name: 'Executive', description: 'Leadership-ready layouts with bold typography, crisp structure, and subtle violet accents for strategic, decision-focused presentations.', layout_count: 32, is_default: true },
  { id: 'momentum', name: 'Momentum', description: 'A polished, high-energy business template for strategy, performance, product, and leadership presentations.', layout_count: 28, is_default: true },
  { id: 'dynamic', name: 'Dynamic', description: 'Bold, high-contrast layouts with dark textured backgrounds and warm accents for impactful, story-driven presentations.', layout_count: 32, is_default: true },
  { id: 'standard', name: 'Standard', description: 'Balanced, adaptable layouts that keep business and everyday content clear, organized, and easy to follow.', layout_count: 11, is_default: true },
  { id: 'swift', name: 'Swift', description: 'Bright, energetic layouts with crisp structure and visual momentum for concise, fast-paced presentations.', layout_count: 9, is_default: true },
];

const items = TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  thumbnail: `/arena/templates/${t.id}/static/thumbnail.png`,
  layout_count: t.layout_count,
  is_default: t.is_default,
}));

export const onRequestGet = async () => json({ items });

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestGet(context);
};
