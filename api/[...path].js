export default async function handler(req, res) {
  const rawBackendUrl = String(process.env.BACKEND_URL || "").trim();

  if (!rawBackendUrl) {
    return res.status(500).json({
      error: "Missing BACKEND_URL in Vercel environment variables"
    });
  }

  const backendBase = rawBackendUrl.replace(/\/+$/, "");
  const backendApiBase = backendBase.endsWith("/api") ? backendBase : `${backendBase}/api`;

  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : [];

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === "path") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, String(item));
      }
    } else if (value !== undefined) {
      query.append(key, String(value));
    }
  }

  const queryString = query.toString();
  const target = `${backendApiBase}/${pathParts.join("/")}${queryString ? `?${queryString}` : ""}`;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

  const method = String(req.method || "GET").toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  let body;

  if (hasBody && req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string" || req.body instanceof Uint8Array) {
      body = req.body;
    } else {
      body = JSON.stringify(req.body);
      if (!headers["content-type"]) {
        headers["content-type"] = "application/json";
      }
    }
  }

  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body
    });

    const responseText = await upstream.text();
    const responseType = upstream.headers.get("content-type") || "application/json";

    res.status(upstream.status);
    res.setHeader("content-type", responseType);
    return res.send(responseText);
  } catch (error) {
    return res.status(502).json({
      error: "Proxy could not reach backend",
      details: error instanceof Error ? error.message : "Unknown proxy error"
    });
  }
}
