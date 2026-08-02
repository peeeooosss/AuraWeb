import { json, jsonError } from '../../../_lib';
import { requireUser } from '../../../_auth';
import { PLANS } from '../../../_plans';

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

  const planId = body.plan;
  const plan = PLANS[planId];
  if (!plan || plan.price <= 0) {
    return jsonError('Invalid plan', 400);
  }

  if (!env.VITE_RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return jsonError('Payments not configured', 500);
  }

  try {
    const auth = btoa(`${env.VITE_RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(plan.price * 100),
        currency: 'INR',
        receipt: `plan_${planId}_${user.id.slice(0, 8)}`,
        notes: { plan: planId, userId: user.id },
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      return jsonError(order.error?.description || 'Failed to create order', res.status);
    }

    return json({
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planId,
      key_id: env.VITE_RAZORPAY_KEY_ID,
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
