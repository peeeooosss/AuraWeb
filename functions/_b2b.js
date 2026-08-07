/**
 * B2B API-key billing helpers.
 *
 * All prices are in USD. Wallet balances are stored on api_keys.balance
 * as a NUMERIC value in USD (not cents). Razorpay orders are created in
 * INR paise using the USD_TO_INR conversion rate.
 */
import { deductBalance, logUsage } from './_auth';

export const OUTLINE_USD_COST = 0.01;
export const SLIDE_USD_COST = 0.01;
export const MIN_TOPUP_USD = 5;
export const DEFAULT_USD_TO_INR = 85;

export function usdToInr(usd, env) {
  const rate = Number(env?.B2B_USD_TO_INR || DEFAULT_USD_TO_INR);
  return usd * rate;
}

/**
 * Deducts cost from the API key's wallet balance and logs usage.
 * Throws if the deduction fails (including insufficient funds).
 *
 * @returns {{ newBalance: number, keyId: string }}
 */
export async function chargeB2B({ env, auth, cost, endpoint, inputTokens, outputTokens, modelRouted }) {
  if (cost <= 0) return { newBalance: 0, keyId: auth.id };

  const keyId = auth.id || auth.apiKeyId;
  if (!keyId) throw new Error('No API key for B2B charge');

  const newBalance = await deductBalance(keyId, cost, env);

  // Log usage non-blocking
  await logUsage({
    userId: auth.userId,
    apiKeyId: keyId,
    endpoint,
    inputTokens: inputTokens || 0,
    outputTokens: outputTokens || 0,
    cost,
    modelRouted: modelRouted || null,
  }, env);

  return { newBalance, keyId };
}