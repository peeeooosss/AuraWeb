import { json, jsonError } from '../../_lib';
import { requireUser } from '../../_auth';
import { getPptQuota } from '../../_plans';

export const onRequestGet = async ({ env, request }) => {
  try {
    const user = await requireUser(request, env);
    const quota = await getPptQuota(user.id, env);
    return json({
      plan: quota.plan.id,
      planName: quota.plan.name,
      planPrice: quota.plan.price,
      pptLimit: quota.plan.pptLimit,
      used: quota.used,
      remaining: quota.remaining,
      unlimited: quota.unlimited,
      apiDaily: quota.plan.apiDaily,
    });
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestGet(context);
};
