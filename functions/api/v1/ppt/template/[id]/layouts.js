import { json, jsonError } from '../../../../../_lib';

const LAYOUT_COUNTS = {
  general: 12,
  modern: 10,
  executive: 32,
  momentum: 28,
  dynamic: 32,
  standard: 11,
  swift: 9,
};

export const onRequestGet = async ({ params }) => {
  const count = LAYOUT_COUNTS[params.id];
  if (count == null) return jsonError('Template not found', 404);
  const layouts = Array.from({ length: count }, (_, i) => ({ id: `${params.id}-layout-${i + 1}`, index: i + 1 }));
  return json({ template_id: params.id, layouts });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestGet(context);
};
