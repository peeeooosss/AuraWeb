import { getLimits } from './limits';

const USAGE_KEY = 'auraai_usage';
const TOKEN_KEY = 'auraai_token_usage';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function loadUsage() {
  try {
    const data = localStorage.getItem(USAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveUsage(usage) {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch {
    // localStorage full or unavailable
  }
}

export function getUsage(tier) {
  const usage = loadUsage();
  const today = getToday();
  const tierUsage = usage[tier] || {};
  const todayUsage = tierUsage[today] || {};

  return {
    docs: todayUsage.docs || 0,
    youtube: todayUsage.youtube || 0,
    pdf: todayUsage.pdf || 0,
    ppt: todayUsage.ppt || 0,
    image: todayUsage.image || 0,
    xlsx: todayUsage.xlsx || 0,
  };
}

export function incrementUsage(tier, type) {
  const usage = loadUsage();
  const today = getToday();

  if (!usage[tier]) usage[tier] = {};
  if (!usage[tier][today]) usage[tier][today] = {};

  usage[tier][today][type] = (usage[tier][today][type] || 0) + 1;

  // Clean up old days (keep last 7 days)
  const dates = Object.keys(usage[tier]);
  dates.sort();
  while (dates.length > 7) {
    const oldDate = dates.shift();
    delete usage[tier][oldDate];
  }

  saveUsage(usage);
}

export function canUseFeature(tier, type) {
  const limits = getLimits(tier);
  const usage = getUsage(tier);
  const limit = limits[type + 'PerDay'];

  // -1 means unlimited
  if (limit === -1) return true;

  return usage[type] < limit;
}

export function getUsageSummary(tier) {
  const limits = getLimits(tier);
  const usage = getUsage(tier);

  return {
    docs: { used: usage.docs, limit: limits.docsPerDay },
    youtube: { used: usage.youtube, limit: limits.youtubePerDay },
    pdf: { used: usage.pdf, limit: limits.pdfPerDay },
    ppt: { used: usage.ppt, limit: limits.pptPerDay },
    image: { used: usage.image, limit: limits.imagePerDay },
    xlsx: { used: usage.xlsx, limit: limits.xlsxPerDay },
  };
}

// ─── Token Usage Persistence ──────────────────────────────────────────────────

export function getTokenUsage() {
  try {
    const data = localStorage.getItem(TOKEN_KEY);
    return data ? JSON.parse(data) : { totalTokens: 0, totalCost: 0, requests: 0 };
  } catch {
    return { totalTokens: 0, totalCost: 0, requests: 0 };
  }
}

export function addTokenUsage(tokens, cost) {
  try {
    const usage = getTokenUsage();
    usage.totalTokens += tokens;
    usage.totalCost += cost;
    usage.requests += 1;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(usage));
  } catch {
    // localStorage unavailable
  }
}

export function resetTokenUsage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable
  }
}
