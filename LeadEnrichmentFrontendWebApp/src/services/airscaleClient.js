/**
 * API client (via secure proxy)
 * Note: Never embed secrets in client code. This client uses:
 * - A configurable base URL from REACT_APP_AIRSCALE_BASE_URL for non-sensitive config.
 * - A relative proxy path intended to be backed by a Netlify Function or proxy
 *   that injects API keys securely at the edge. See README for setup.
 */

// PUBLIC_INTERFACE
export async function findEmail({ name, company, domain, linkedin }) {
  /** Find an email for a single contact.
   * Parameters:
   *  - name: Full name of the contact (required by our UI workflow)
   *  - company: Company name (required by our UI workflow)
   *  - domain: Company domain (optional but recommended)
   *  - linkedin: LinkedIn URL (optional)
   * Returns: { success: boolean, data?: object, error?: string }
   */
  const payload = buildPayload({
    name,
    company,
    domain,
    linkedin,
  });

  return postToProxy("/v1/email", payload, {
    feature: "email",
  });
}

// PUBLIC_INTERFACE
export async function findPhone({ name, company, domain, email }) {
  /** Find a phone number for a single contact.
   * Parameters:
   *  - name: Full name of the contact (required by our UI workflow)
   *  - company: Company name (required by our UI workflow)
   *  - domain: Company domain (optional)
   *  - email: Email address (optional but improves accuracy)
   * Returns: { success: boolean, data?: object, error?: string }
   */
  const payload = buildPayload({
    name,
    company,
    domain,
    email,
  });

  return postToProxy("/v1/phone", payload, {
    feature: "phone",
  });
}

const DEFAULT_TIMEOUT_MS = 20000;

/**
 * Build payload by stripping undefined/empty string values.
 */
function buildPayload(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      out[k] = v;
    }
  });
  return out;
}

/**
 * Post JSON via secure proxy.
 * - The proxy must inject authentication headers and handle upstream API details.
 * - This client adds only Content-Type and handles standard error translation.
 */
async function postToProxy(path, body, { feature } = {}) {
  const baseUrl = process.env.REACT_APP_AIRSCALE_BASE_URL || "";
  const viaProxyUrl = `/api/airscale${path}`;
  const directUrl = baseUrl ? `${baseUrl}${path}` : null;

  // Use proxy by default to avoid exposing secrets
  const url = viaProxyUrl || directUrl;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(id);

    // Capture headers that might inform rate limits
    const rateLimit = {
      limit: res.headers.get("x-ratelimit-limit"),
      remaining: res.headers.get("x-ratelimit-remaining"),
      reset: res.headers.get("x-ratelimit-reset"),
    };

    const maybeJson = await safeJson(res);

    if (!res.ok) {
      // Normalize known error cases: 401/403 auth, 402/429 credits/rate limit, 422 validation, 5xx upstream
      const errMsg = normalizeErrorMessage(res.status, maybeJson, rateLimit, feature);
      return { success: false, error: errMsg, status: res.status, rateLimit, data: maybeJson };
    }

    // Success
    return { success: true, data: maybeJson, status: res.status, rateLimit };
  } catch (err) {
    return { success: false, error: err?.message || "Network error", status: 0 };
  }
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function normalizeErrorMessage(status, body, rateLimit, feature) {
  const base = feature ? `${capitalize(feature)} enrichment` : "Request";
  if (status === 429) {
    const resetNote = rateLimit?.reset ? ` Try again after ${new Date(Number(rateLimit.reset) * 1000).toLocaleTimeString()}.` : "";
    return `${base}: rate limit exceeded (429).${resetNote}`;
  }
  if (status === 402) {
    return `${base}: credits exhausted (402). Please try again later.`;
  }
  if (status === 401 || status === 403) {
    return `${base}: authentication failed (${status}). Check serverless proxy configuration.`;
  }
  if (status === 422) {
    const detail = extractFirstError(body);
    return `${base}: invalid request (422)${detail ? ` - ${detail}` : ""}.`;
  }
  if (status >= 500) {
    return `${base}: upstream service error (${status}). Please try again.`;
  }
  const message = body?.message || body?.error || body?.raw || "";
  return `${base}: ${status}${message ? ` - ${message}` : ""}`;
}

function extractFirstError(body) {
  if (!body) return "";
  if (Array.isArray(body?.errors) && body.errors.length) {
    const e = body.errors[0];
    if (typeof e === "string") return e;
    if (e?.message) return e.message;
  }
  if (body?.error) return typeof body.error === "string" ? body.error : JSON.stringify(body.error);
  if (body?.message) return body.message;
  return "";
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
