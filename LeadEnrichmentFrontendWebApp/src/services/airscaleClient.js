/**
 * Airscale API client
 * Note: Never embed secrets in client code. This client uses:
 * - A configurable base URL from REACT_APP_AIRSCALE_BASE_URL for non-sensitive config.
 * - A relative proxy path (/api/airscale) intended to be backed by a Netlify Function or proxy
 *   that injects the AIRSCALE_API_KEY securely at the edge. See README for setup.
 */

// PUBLIC_INTERFACE
export async function findEmail({ name, company, domain, linkedin }) {
  /** Find an email for a single contact via Airscale.
   * Parameters:
   *  - name: Full name of the contact
   *  - company: Company name
   *  - domain: Company domain (optional but recommended)
   *  - linkedin: LinkedIn URL (optional)
   * Returns: { success: boolean, data?: object, error?: string }
   */
  return postToAirscale("/find/email", { name, company, domain, linkedin });
}

// PUBLIC_INTERFACE
export async function findPhone({ name, company, domain, email }) {
  /** Find a phone number for a single contact via Airscale.
   * Parameters:
   *  - name: Full name of the contact
   *  - company: Company name
   *  - domain: Company domain (optional)
   *  - email: Email address (optional but improves accuracy)
   * Returns: { success: boolean, data?: object, error?: string }
   */
  return postToAirscale("/find/phone", { name, company, domain, email });
}

const DEFAULT_TIMEOUT_MS = 20000;

async function postToAirscale(path, body) {
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
        "Content-Type": "application/json"
        // No API key header here in client code. The proxy must add it securely.
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(id);

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Airscale error: ${res.status} ${text}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err?.message || "Network error" };
  }
}
