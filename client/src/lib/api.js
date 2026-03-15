// Always use same-origin API so Vercel can proxy requests consistently.
const API_BASE = "/api";

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function pingHealth() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 8000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiRequest(path, { method = "GET", body, token } = {}, _retries = 1) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetchWithTimeout(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    }, 12000);
  } catch {
    if (_retries > 0) {
      await new Promise(r => setTimeout(r, 8000));
      return apiRequest(path, { method, body, token }, _retries - 1);
    }
    throw new Error("Cannot reach backend. Check deployment env BACKEND_URL and try again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}
