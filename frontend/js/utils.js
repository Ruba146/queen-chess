export const API_BASE = 'https://queen-chess.onrender.com';

export function getToken() {
  return localStorage.getItem('token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (!headers['Content-Type'] && options.body) headers['Content-Type'] = 'application/json';

  const response = await fetch(API_BASE + path, { ...options, headers });
  if (!response.ok) throw new Error('API Error: ' + response.status);
  return response.json();
}
