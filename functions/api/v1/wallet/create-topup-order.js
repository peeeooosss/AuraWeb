import { json, jsonError } from '../../../_lib';
import { requireUser, supabaseHeaders } from '../../../_auth';
import { MIN_TOPUP_USD, usdToInr } from '../../../_b2b';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const { key_id, amount } = body;
  if (!key_id) return jsonError('key_id is required', 400);
  if (!amount || Number(amount) < MIN_TOPUP_USD) return jsonError(`amount must be at least $${MIN_TOPUP_USD}`, 400);

  if (!env.VITE_RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return jsonError('Payments not configured', 500);
  }

  // Verify key belongs to user
  const url = env.VITE_SUPABASE_URL;
  let keyName = 'API Key';
  try {
    const res = await fetch(
      `${url}/rest/v1/api_keys?id=eq.${key_id}&user_id=eq.${user.id}&select=id,key_name,balance`,
      { headers: supabaseHeaders(env, true) }
    );
    const rows = await res.json();
    if (!rows || rows.length === 0) return jsonError('API key not found', 404);
    keyName = rows[0].key_name;
  } catch {
    return jsonError('Failed to verify API key', 500);
  }

  try {
    const amountInrPaise = Math.round(usdToInr(Number(amount), env) * 100);

    const auth = btoa(`${env.VITE_RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInrPaise,
        currency: 'INR',
        receipt: `topup_${key_id.slice(0, 8)}_${Date.now().toString(36)}`,
        notes: { key_id, user_id: user.id, type: 'wallet_topup', key_name: keyName },
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      return jsonError(order.error?.description || 'Failed to create order', res.status);
    }

    // Log pending top-up
    try {
      await fetch(`${url}/rest/v1/wallet_topups`, {
        method: 'POST',
        headers: { ...supabaseHeaders(env, true), Prefer: 'return=minimal' },
        body: JSON.stringify({
          user_id: user.id,
          api_key_id: key_id,
          razorpay_order_id: order.id,
          amount: Number(amount),
          status: 'pending',
        }),
      });
    } catch {
      // non-fatal — audit log failure shouldn't block payment
    }

    return json({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
      key_name: keyName,
      razorpay_key_id: env.VITE_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return jsonError(err.message, 500);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
