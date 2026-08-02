import { json, jsonError, corsHeaders } from '../../../_auth';
import { requireAuth, checkRateLimit, logUsage, deductBalance } from '../../../_auth';
import { llmComplete } from '../../../_llm';
import { computeCost, getAliasForModel } from '../../../_models';

const MIN_BALANCE_INR = 10;

export const onRequestPost = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const prompt = String(body.prompt || '').trim();
  if (!prompt) return jsonError('prompt is required', 400);

  try {
    const auth = await requireAuth(request, env);

    const allowed = await checkRateLimit(auth.id, auth.userId, auth.rateLimit, env);
    if (!allowed) {
      return jsonError('Daily rate limit reached. Upgrade your plan or try again tomorrow.', 429);
    }

    if (auth.balance !== Infinity && auth.balance < MIN_BALANCE_INR) {
      return jsonError('Insufficient wallet balance. Please top up.', 402);
    }

    const systemPrompt = String(body.systemPrompt || 'You are a helpful AI assistant.');
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const result = await llmComplete(env, {
      messages,
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      jsonMode: !!body.json,
    });

    const inputTokens = result.usage?.prompt_tokens || result.usage?.input_tokens || 0;
    const outputTokens = result.usage?.completion_tokens || result.usage?.output_tokens || 0;
    const alias = getAliasForModel(result.model);
    const cost = computeCost(alias, inputTokens, outputTokens);

    await logUsage(
      {
        userId: auth.userId,
        apiKeyId: auth.id || null,
        endpoint: '/api/v1/ai/generate',
        inputTokens,
        outputTokens,
        cost,
        modelRouted: result.model,
      },
      env
    );

    if (auth.id) {
      await deductBalance(auth.id, cost, env);
    }

    return json({
      output: result.content,
      model: alias,
      model_routed: result.model,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
      cost,
      currency: auth.currency || 'INR',
    });
  } catch (err) {
    return jsonError(err.message, err.message.includes('required') || err.message.includes('Invalid') ? 401 : 500);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (context.request.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }
  return onRequestPost(context);
};
