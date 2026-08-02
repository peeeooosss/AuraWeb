import { json, jsonError, genId, nowIso, getPresentation, savePresentation } from '../../../../../_lib';
import { requireUser } from '../../../../../_auth';
import { calculateCredits, assertCreditsAllowed, deductCredits } from '../../../../../_plans';

export const onRequestPost = async ({ params, env, request }) => {
  let user;
  try {
    user = await requireUser(request, env);
  } catch (err) {
    return jsonError(err.message, err.status || 401);
  }

  const original = await getPresentation(env, user.id, params.id);
  if (!original) return jsonError('Presentation not found', 404);

  const requiredCredits = calculateCredits({ n_slides: original.n_slides || 8, theme: original.template });
  try {
    await assertCreditsAllowed(user.id, env, requiredCredits);
  } catch (err) {
    return jsonError(err.message, err.status || 403, { 'X-Error-Code': err.code || '' });
  }

  const now = nowIso();
  const copy = {
    ...JSON.parse(JSON.stringify(original)),
    id: genId(),
    title: `${original.title || 'Untitled'} (Copy)`,
    created_at: now,
    updated_at: now,
  };

  await savePresentation(env, user.id, copy);
  await deductCredits(user.id, requiredCredits, env);
  return json({ ...copy, credits_used: requiredCredits }, 201);
};

export const onRequest = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return onRequestPost(context);
};