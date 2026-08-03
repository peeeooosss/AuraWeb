import { json, jsonError } from '../../../../_lib';
import { requireUser } from '../../../../_auth';
import { llmJson, assertKey } from '../../../../_llm';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try { body = await request.json(); } catch {}

  let user;
  try { user = await requireUser(request, env); } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  try { assertKey(env); } catch (err) { return jsonError(err.message, 500); }

  const topic = String(body.topic || '').trim();
  const mood = String(body.mood || 'professional').trim();

  try {
    const raw = await llmJson(env, {
      messages: [
        {
          role: 'system',
          content: [
            'Generate a presentation color theme as JSON.',
            'Return ONLY: {"primary":"#hex","background":"#hex","accent_1":"#hex","accent_2":"#hex","text_1":"#hex","text_2":"#hex","name":"short theme name","is_dark":false}',
            'Primary = main brand color. Background = slide background. Accent_1 accent_2 = secondary colors. Text_1 = primary text. Text_2 = muted/secondary text.',
            'For light themes use white/light backgrounds. For dark themes use dark backgrounds with light text. Use brand-appropriate colors for the topic.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: `Topic: ${topic || 'general presentation'}\nMood: ${mood}\nGenerate a cohesive color palette.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const cleaned = String(raw || '').replace(/```(?:json)?/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end < 0) throw new Error('No JSON found');

    const parsed = JSON.parse(cleaned.slice(start, end + 1));

    const theme = {
      primary: String(parsed.primary || '#7C3AED'),
      background: String(parsed.background || '#FFFFFF'),
      accent_1: String(parsed.accent_1 || '#A855F7'),
      accent_2: String(parsed.accent_2 || '#C084FC'),
      text_1: String(parsed.text_1 || '#111827'),
      text_2: String(parsed.text_2 || '#6B7280'),
      name: String(parsed.name || 'Custom Theme'),
      is_dark: !!parsed.is_dark,
    };

    const g1 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g2 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g3 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g4 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g5 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g6 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g7 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g8 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    const g9 = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    theme.graph_colors = [
      `#${g1}`, `#${theme.accent_1}`, `#${g2}`, `#${theme.accent_2}`,
      `#${g3}`, `#${theme.primary}`, `#${g4}`, `#${g5}`, `#${g6}`,
      `#${g7}`, `#${g8}`, `#${g9}`,
    ];

    return json(theme);
  } catch (err) {
    return jsonError(`Failed to generate theme: ${err.message}`, 500);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
