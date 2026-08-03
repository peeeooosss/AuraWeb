import { getAccessToken, supabase } from './auth';

const BASE = '/api/v1/ppt';

async function authHeaders() {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not signed in');
  }
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function authFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = await getAccessToken();
  if (!token) {
    await supabase.auth.signOut();
    window.location.href = '/login';
    throw new Error('Session expired. Please sign in again.');
  }
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && typeof options.body !== 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.href = '/login';
    throw new Error('Session expired. Please sign in again.');
  }
  return res;
}

async function handleResponse(res) {
  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.href = '/login';
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(err.detail || err.message || 'Request failed');
    error.status = res.status;
    error.code = res.headers.get('X-Error-Code') || err.code;
    throw error;
  }
  return res.json();
}

async function request(method, path, body) {
  const opts = { method, headers: await authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  return handleResponse(res);
}

export function generate(data) {
  return request('POST', '/presentation/generate', data);
}

export function createBlank(data) {
  return request('POST', '/presentation/create/blank', data || {});
}

export function getAllPresentations() {
  return request('GET', '/presentation/all');
}

export function getPresentation(id) {
  return request('GET', `/presentation/${id}`);
}

export function duplicatePresentation(id) {
  return request('POST', `/presentation/${id}/duplicate`);
}

export function deletePresentation(id) {
  return request('DELETE', `/presentation/${id}`);
}

export function getOutlines(id) {
  return request('GET', `/outlines/${id}`);
}

export function updateOutlines(id, data) {
  return request('PUT', `/outlines/${id}`, data);
}

export function getAllTemplates() {
  return request('GET', '/template/all');
}

export function getTemplate(id) {
  return request('GET', `/template/${id}`);
}

export function getTemplateLayouts(id) {
  return request('GET', `/template/${id}/layouts`);
}

export async function uploadFile(file) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization },
    body: form,
  });
  return handleResponse(res);
}

export function searchIcons(query) {
  return request('GET', `/icons/search?q=${encodeURIComponent(query)}`);
}

export async function exportPresentation(id, format = 'pptx') {
  const headers = await authHeaders();
  const expRes = await fetch('/api/export-presentation', {
    method: 'POST',
    headers,
    body: JSON.stringify({ id, format }),
  });
  if (!expRes.ok) throw new Error('Export request failed');
  const { path: filePath } = await expRes.json();
  if (!filePath) throw new Error('No export path');

  const dlRes = await fetch(filePath, { headers: { Authorization: headers.Authorization } });
  if (!dlRes.ok) throw new Error('Download failed');
  return dlRes.blob();
}

export function preparePresentation(id) {
  return request('POST', `/presentation/${id}/prepare`);
}

export function slideUpdate(id, data) {
  return request('PATCH', '/presentation/slide_update', { presentation_id: id, ...data });
}

export async function getCredits() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch('/api/v1/limits', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch credits');
  return res.json();
}

// Non-PPT endpoints live under /api/v1 (not /api/v1/ppt)
async function directRequest(method, path, body) {
  const opts = { method, headers: await authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  return handleResponse(res);
}

export async function getApiKeys() {
  return directRequest('GET', '/api/v1/keys');
}

export async function createApiKey(data) {
  return directRequest('POST', '/api/v1/keys', data);
}

export async function deleteApiKey(id) {
  return directRequest('DELETE', `/api/v1/keys/${id}`);
}

export async function getUsageSummary(days = 30) {
  return directRequest('GET', `/api/v1/usage?days=${days}`);
}

export async function createBillingOrder(data) {
  return directRequest('POST', '/api/v1/billing/create-plan-order', data);
}

export async function verifyBilling(data) {
  return directRequest('POST', '/api/v1/billing/verify-plan', data);
}

// ---- Wallet (B2B pay-as-you-go) ----

export async function createWalletTopupOrder(keyId, amountInr) {
  return directRequest('POST', '/api/v1/wallet/create-topup-order', {
    key_id: keyId,
    amount: Number(amountInr),
  });
}

export async function verifyWalletTopup({ keyId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  return directRequest('POST', '/api/v1/wallet/verify-topup', {
    key_id: keyId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
}

export async function getWalletTopupHistory() {
  return directRequest('GET', '/api/v1/wallet/history');
}
