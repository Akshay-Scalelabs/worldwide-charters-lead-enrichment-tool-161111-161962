/**
 * Airscale API client
 * Note: Never embed secrets in client code. This client uses:
 * - A configurable base URL from REACT_APP_AIRSCALE_BASE_URL for non-sensitive config.
 * - A relative proxy path (/api/airscale) intended to be backed by a Netlify Function or proxy
 *   that injects the AIRSCALE_API_KEY securely at the edge. See README for setup.
 *
 * This implementation aligns with the latest official Airscale docs:
 * - Endpoints: /v1/email and /v1/phone (proxied via /api/airscale/v1/*)
 * - Auth: API key in header (added by proxy), content-type application/json
 * - Request fields: name, company, domain, email, linkedin as applicable
 * - Response handling: parse known fields and surface rate-limit and credit errors
 */

// PUBLIC_INTERFACE
export async function findEmail({ name, company, domain, linkedin }) {
  /** Find an email for a single contact via Airscale.
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

  return postToAirscale("/v1/email", payload, {
    feature: "email",
  });
}

// PUBLIC_INTERFACE
export async function findPhone({ name, company, domain, email }) {
  /** Find a phone number for a single contact via Airscale.
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

  return postToAirscale("/v1/phone", payload, {
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
 * Post JSON to Airscale via secure proxy.
 * - The proxy must inject:
 *    - X-Api-Key (or Authorization) per docs
 *    - Any additional headers required by Airscale
 * - This client adds only Content-Type and handles standard error translation.
 */
async function postToAirscale(path, body, { feature } = {}) {
  // Prefer a secure proxy path so secrets are never sent to browser.
  // Netlify setup will map /api/airscale/* to a function that calls Airscale with the API key.
  const baseUrl = process.env.REACT_APP_AIRSCALE_BASE_URL || "";
  const viaProxyUrl = `/api/airscale${path}`;
  const directUrl = baseUrl ? `${baseUrl}${path}` : null;

  // Use the proxy by default; fallback to direct only if explicitly allowed
  const url = viaProxyUrl || directUrl;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Do NOT attach secrets here; proxy adds authentication header securely.
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
      // Normalize known error cases per docs: 401/403 auth, 402/429 credits/rate limit, 422 validation, 5xx upstream
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
  const base = feature ? `Airscale ${feature} error` : "Airscale error";
  // Rate limit or credits exhausted
  if (status === 429) {
    const resetNote = rateLimit?.reset ? ` Try again after ${new Date(Number(rateLimit.reset) * 1000).toLocaleTimeString()}.` : "";
    return `${base}: Rate limit exceeded (429).${resetNote}`;
  }
  if (status === 402) {
    return `${base}: Credits exhausted (402). Please top up your Airscale credits.`;
  }
  if (status === 401 || status === 403) {
    return `${base}: Authentication failed (${status}). Check API key configuration on the serverless proxy.`;
  }
  if (status === 422) {
    const detail = extractFirstError(body);
    return `${base}: Invalid request (422)${detail ? ` - ${detail}` : ""}.`;
  }
  if (status >= 500) {
    return `${base}: Upstream service error (${status}). Please try again.`;
  }
  // Fallback
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
