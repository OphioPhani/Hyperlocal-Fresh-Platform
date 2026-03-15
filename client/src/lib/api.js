// Always use same-origin API so Vercel can proxy requests consistently.
const API_BASE = "/api";

export async function pingHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(8000)
    });
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
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
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
