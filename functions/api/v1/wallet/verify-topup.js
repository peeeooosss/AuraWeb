import { json, jsonError } from '../../../_lib';
import { requireUser, supabaseHeaders } from '../../../_auth';

export const onRequestPost = async ({ request, env }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const { key_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!key_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonError('Missing payment details', 400);
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

  const url = env.VITE_SUPABASE_URL;

  // 1. Find pending top-up matching this order
  let topup;
  try {
    const res = await fetch(
      `${url}/rest/v1/wallet_topups?razorpay_order_id=eq.${razorpay_order_id}&user_id=eq.${user.id}&status=eq.pending&select=*`,
      { headers: supabaseHeaders(env, true) }
    );
    const rows = await res.json();
    if (!rows || rows.length === 0) return jsonError('Top-up order not found or already processed', 404);
    topup = rows[0];
  } catch {
    return jsonError('Failed to look up top-up order', 500);
  }

  if (topup.api_key_id !== key_id) {
    return jsonError('Key ID mismatch for this order', 400);
  }

  // 2. Verify Razorpay signature (HMAC-SHA256)
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
      await fetch(`${url}/rest/v1/wallet_topups?id=eq.${topup.id}`, {
        method: 'PATCH',
        headers: supabaseHeaders(env, true),
        body: JSON.stringify({ status: 'failed' }),
      });
      return jsonError('Invalid payment signature', 400);
    }
  } catch (err) {
    return jsonError(`Signature verification failed: ${err.message}`, 500);
  }

  // 3. Credit the API key balance + mark top-up complete (transactional-ish)
  let newBalance;
  try {
    // Read current balance, then update with row-level RLS guard via ?user_id check in WHERE
    const keyRes = await fetch(
      `${url}/rest/v1/api_keys?id=eq.${key_id}&user_id=eq.${user.id}&select=balance`,
      { headers: supabaseHeaders(env, true) }
    );
    const keyRows = await keyRes.json();
    if (!keyRows || keyRows.length === 0) throw new Error('API key not found');
    newBalance = Number(keyRows[0].balance || 0) + Number(topup.amount);

    const patchRes = await fetch(`${url}/rest/v1/api_keys?id=eq.${key_id}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders(env, true), Prefer: 'return=minimal' },
      body: JSON.stringify({ balance: newBalance }),
    });
    if (!patchRes.ok) throw new Error('Failed to update key balance');

    await fetch(`${url}/rest/v1/wallet_topups?id=eq.${topup.id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(env, true),
      body: JSON.stringify({
        status: 'completed',
        razorpay_payment_id,
        completed_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    return jsonError(err.message, 500);
  }

  return json({
    success: true,
    key_id,
    amount: topup.amount,
    new_balance: newBalance,
  });
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};
