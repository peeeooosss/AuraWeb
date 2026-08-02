import { json, jsonError } from '../../../_lib';
import { requireUser, supabaseHeaders } from '../../../_auth';
import { PLANS } from '../../../_plans';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!plan || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonError('Missing payment details', 400);
  }

  const planDef = PLANS[plan];
  if (!planDef || planDef.price <= 0) {
    return jsonError('Invalid plan', 400);
  }

  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  if (!env.RAZORPAY_KEY_SECRET) {
    return jsonError('Payments not configured', 500);
  }

  // Verify signature (HMAC SHA-256 via Web Crypto)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.RAZORPAY_KEY_SECRET);
  const bodyData = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);

  try {
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
    const expected = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (expected !== razorpay_signature) {
      return jsonError('Invalid payment signature', 400);
    }
  } catch (err) {
    return jsonError(err.message, 500);
  }

  // Activate plan: upsert user_plans (insert with on_conflict merge)
  const validUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const url = env.VITE_SUPABASE_URL;

  try {
    const res = await fetch(`${url}/rest/v1/user_plans?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(env, true),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        user_id: user.id,
        plan,
        status: 'active',
        valid_until: validUntil,
        razorpay_order_id,
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return jsonError(`Failed to activate plan: ${text}`, res.status);
    }
  } catch (err) {
    return jsonError(err.message, 500);
  }

  return json({
    success: true,
    plan,
    planName: planDef.name,
    valid_until: validUntil,
  });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
