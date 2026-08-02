import { json, jsonError } from '../../_lib';
import { requireUser } from '../../_auth';
import { getCreditsStatus } from '../../_plans';

export const onRequestGet = async ({ env, request }) => {
  try {
    const user = await requireUser(request, env);
    const status = await getCreditsStatus(user.id, env);
    return json({
      plan: status.plan,
      planName: status.planName,
      creditsLimit: status.creditsLimit,
      creditsBalance: status.creditsBalance,
      unlimited: status.unlimited,
      usedThisMonth: status.usedThisMonth,
      rolloverExpiry: status.rolloverExpiry,
      apiDaily: status.apiDaily,
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