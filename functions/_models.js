/**
 * Model registry, alias routing, and customer-facing pricing.
 *
 * Public-facing aliases are marketed as Claude tiers.
 * Internal routing maps each alias to the most cost-effective powerful model,
 * with Kimi K2.7-Code used for the reasoning/premium tier and as a fallback.
 */

// Internal OpenRouter model IDs
export const INTERNAL_MODELS = {
  'deepseek-v4-pro': 'deepseek/deepseek-v4-pro',
  'deepseek-v4-flash': 'deepseek/deepseek-v4-flash',
  'kimi-k2.7-code': 'moonshotai/kimi-k2.7-code',
};

// Customer-facing aliases (USD -> INR prices per 1M tokens)
// 1 USD ≈ 85 INR (approximate; adjust via MARKETING_USD_INR if needed)
const MARKETING_USD_INR = 85;

export const PRICING = {
  // Fast / cheap tier
  'claude-haiku': {
    internal: INTERNAL_MODELS['deepseek-v4-flash'],
    input_inr_per_mtok: 30,
    output_inr_per_mtok: 60,
  },
  // Default Claude-grade tier
  'claude-sonnet-5': {
    internal: INTERNAL_MODELS['deepseek-v4-pro'],
    input_inr_per_mtok: 200,
    output_inr_per_mtok: 1000,
  },
  // Reasoning / premium tier
  'claude-sonnet-5-reasoning': {
    internal: INTERNAL_MODELS['kimi-k2.7-code'],
    input_inr_per_mtok: 300,
    output_inr_per_mtok: 1500,
  },
};

export const DEFAULT_MODEL_ALIAS = 'claude-sonnet-5';

// Fallback chain when the primary model fails
export const FALLBACK_CHAIN = {
  [INTERNAL_MODELS['deepseek-v4-pro']]: INTERNAL_MODELS['kimi-k2.7-code'],
  [INTERNAL_MODELS['deepseek-v4-flash']]: INTERNAL_MODELS['deepseek-v4-pro'],
  [INTERNAL_MODELS['kimi-k2.7-code']]: INTERNAL_MODELS['deepseek-v4-pro'],
};

/**
 * Resolve a public model alias (or internal model id) to an internal OpenRouter model id.
 */
export function resolveModelAlias(alias) {
  if (!alias) return PRICING[DEFAULT_MODEL_ALIAS].internal;
  const normalized = String(alias).toLowerCase().trim();
  if (PRICING[normalized]) return PRICING[normalized].internal;
  // Allow callers to pass an OpenRouter model id directly
  if (Object.values(INTERNAL_MODELS).includes(normalized)) return normalized;
  return PRICING[DEFAULT_MODEL_ALIAS].internal;
}

/**
 * Get the public alias and pricing for a given internal model.
 */
export function getAliasForModel(internalModel) {
  for (const [alias, cfg] of Object.entries(PRICING)) {
    if (cfg.internal === internalModel) return alias;
  }
  return DEFAULT_MODEL_ALIAS;
}

/**
 * Compute customer cost in INR from token usage.
 */
export function computeCost(alias, inputTokens, outputTokens) {
  const cfg = PRICING[alias] || PRICING[DEFAULT_MODEL_ALIAS];
  const cost =
    ((inputTokens || 0) * cfg.input_inr_per_mtok +
      (outputTokens || 0) * cfg.output_inr_per_mtok) /
    1_000_000;
  return Number(cost.toFixed(6));
}

/**
 * Approximate internal cost in INR (for margin tracking dashboards).
 */
export function computeInternalCost(internalModel, inputTokens, outputTokens) {
  const costs = {
    [INTERNAL_MODELS['deepseek-v4-pro']]: { inUsd: 0.44, outUsd: 0.87 },
    [INTERNAL_MODELS['deepseek-v4-flash']]: { inUsd: 0.09, outUsd: 0.18 },
    [INTERNAL_MODELS['kimi-k2.7-code']]: { inUsd: 0.61, outUsd: 3.07 },
  };
  const c = costs[internalModel] || costs[INTERNAL_MODELS['deepseek-v4-pro']];
  const costUsd =
    ((inputTokens || 0) * c.inUsd + (outputTokens || 0) * c.outUsd) / 1_000_000;
  return Number((costUsd * MARKETING_USD_INR).toFixed(6));
}
