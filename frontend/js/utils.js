export const API_BASE = window.location.origin;

export function getToken() {
  return localStorage.getItem('token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (!headers['Content-Type'] && options.body) headers['Content-Type'] = 'application/json';

  // Track API calls for E2E tests (Network check)
  try {
    if (window.__e2e_apiCalls) {
      window.__e2e_apiCalls.push({ url: API_BASE + path, method: options.method || 'GET', time: Date.now() });
    }
  } catch {
    // Non-critical
  }

  const response = await fetch(API_BASE + path, { ...options, headers });
  if (!response.ok) throw new Error('API Error: ' + response.status);
  return response.json();
}
