import { jsonError, corsHeaders, requireAuth, checkRateLimit, logUsage, deductBalance } from '../../../_auth';
import { llmChat, streamWithUsage } from '../../../_llm';
import { computeCost, getAliasForModel } from '../../../_models';

const MIN_BALANCE_INR = 10;

export const onRequestPost = async ({ request, env, waitUntil }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return jsonError('messages array is required', 400);
  }

  try {
    const auth = await requireAuth(request, env);

    const allowed = await checkRateLimit(auth.id, auth.userId, auth.rateLimit, env);
    if (!allowed) {
      return jsonError('Daily rate limit reached. Upgrade your plan or try again tomorrow.', 429);
    }

    if (auth.balance !== Infinity && auth.balance < MIN_BALANCE_INR) {
      return jsonError('Insufficient wallet balance. Please top up.', 402);
    }

    const { res, model } = await llmChat(env, {
      messages,
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      stream: true,
    });

    const { response, usagePromise } = streamWithUsage(res);

    // Log usage and deduct balance after the stream finishes, without blocking response.
    waitUntil(
      usagePromise.then(async (usage) => {
        const inputTokens = usage?.prompt_tokens || usage?.input_tokens || 0;
        const outputTokens = usage?.completion_tokens || usage?.output_tokens || 0;
        const alias = getAliasForModel(model);
        const cost = computeCost(alias, inputTokens, outputTokens);
        await logUsage(
          {
            userId: auth.userId,
            apiKeyId: auth.id || null,
            endpoint: '/api/v1/ai/chat',
            inputTokens,
            outputTokens,
            cost,
            modelRouted: model,
          },
          env
        );
        if (auth.id) {
          await deductBalance(auth.id, cost, env);
        }
      })
    );

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
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
