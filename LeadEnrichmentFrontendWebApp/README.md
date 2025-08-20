# Scalelabs — Lead Enrichment Frontend (React)

A custom-branded, lightweight React SPA for internal lead enrichment by Scalelabs. No login; unlisted URL only.

## Features
- Single-contact enrichment with two separate actions: “Find Email” and “Find Phone Number”
- Scalelabs branding, responsive and accessible UI
- Real-time validation and feedback
- Secure serverless proxy integration via environment variables (keeps secrets off the client)
- Prevents SEO indexing (robots.txt + meta noindex)
- Tasteful Scalelabs attribution in the footer
- Netlify-ready configuration (SPA redirects, headers, CSP)

## Quick start
- Node 18+
- Install: `npm install`
- Run dev: `npm start`
- Build: `npm run build` (Netlify uses `CI=false npm run build` via netlify.toml)

## Environment variables
Create a local `.env` based on `.env.example`. Do not place secrets in `.env` that will be committed.

- REACT_APP_AIRSCALE_BASE_URL: Optional non-secret base URL for the upstream enrichment API.
- Secret(s) for your proxy function (kept server-side only).

## Secure Proxy Integration
Client code never reads secrets. Instead:
- Frontend sends requests to a relative path like `/api/airscale/*` (or your selected proxy path).
- Configure a Netlify Function or proxy that:
  - Reads API credentials from Netlify’s environment
  - Calls the upstream API using server-side fetch with appropriate authentication
  - Returns JSON to the client and forwards useful headers (e.g., rate limits)

This keeps secrets out of the client bundle and browser.

Example function pseudo-code:
```js
export async function handler(event) {
  const API_KEY = process.env.ANY_UPSTREAM_API_KEY;
  const BASE = process.env.ANY_UPSTREAM_BASE || 'https://api.example.com';
  const forwardPath = event.path.replace(/^.*\/airscale/, '');
  const res = await fetch(`${BASE}${forwardPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: event.body
  });
  const headers = {
    'Content-Type': 'application/json',
    'x-ratelimit-limit': res.headers.get('x-ratelimit-limit') || '',
    'x-ratelimit-remaining': res.headers.get('x-ratelimit-remaining') || '',
    'x-ratelimit-reset': res.headers.get('x-ratelimit-reset') || ''
  };
  return { statusCode: res.status, headers, body: await res.text() };
}
```

Then configure a redirect in `netlify.toml` to map your proxy path to that function.

Rate limits and credits:
- The UI shows friendly messages on 429 (rate limit) and 402 (credits exhausted), using any forwarded headers.
- Ensure your Netlify environment has adequate credits and monitor usage in the upstream dashboard.

## Netlify setup
- Connect this repo to Netlify
- Build command: `CI=false npm run build` (already set in `netlify.toml`)
- Publish directory: `build`
- Environment: set your secret keys on Netlify only
- Headers and CSP are set via `netlify.toml` and `public/_headers`
- SEO blocked with `public/robots.txt` and meta noindex in `public/index.html`

## Accessibility
- Proper labels, aria-live regions, and disabled states
- Keyboard-friendly buttons and focus outlines

## Project structure
- src/components: LeadForm, ResultsPanel, Alert
- src/services: API client (no secrets)
- public: index.html, robots.txt, _headers
- netlify.toml: SPA redirects, security headers

## Notes
- Keep usage internal; do not share URL publicly.
- For local testing without functions, you can mock `/api/airscale/*` using a dev proxy or mock server.

License: Internal use for Scalelabs.
