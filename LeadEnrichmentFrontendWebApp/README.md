# Worldwide Charters — Lead Enrichment Frontend (React)

A custom-branded, lightweight React SPA for internal lead enrichment using Airscale (Scalelabs). No login; unlisted URL only.

## Features
- Single-contact enrichment with two separate actions: “Find Email” and “Find Phone Number”
- Worldwide Charters branding, responsive and accessible UI
- Real-time validation and feedback
- Secure Airscale integration via Netlify environment variables and edge/serverless proxy
- Prevents SEO indexing (robots.txt + meta noindex)
- Minimal Scalelabs attribution in the footer
- Netlify-ready configuration (SPA redirects, headers, CSP)

## Quick start
- Node 18+
- Install: `npm install`
- Run dev: `npm start`
- Build: `npm run build` (Netlify uses `CI=false npm run build` via netlify.toml)

## Environment variables
Create a local `.env` based on `.env.example`. Do not place secrets in `.env` that will be committed.

- REACT_APP_AIRSCALE_BASE_URL: Non-secret base URL (e.g., https://api.airscale.dev)

Secrets:
- AIRSCALE_API_KEY: Do not put in React env (would expose in bundle). Configure in Netlify site settings:
  - Netlify dashboard -> Site settings -> Build & deploy -> Environment -> Environment variables
  - Add variable: `AIRSCALE_API_KEY` with your secret value.

## Secure Airscale Integration
Client code never reads AIRSCALE_API_KEY. Instead:
- Frontend sends requests to a relative path `/api/airscale/*`.
- Configure a Netlify Function or proxy that:
  - Reads `AIRSCALE_API_KEY` from Netlify’s environment
  - Calls the Airscale API using server-side fetch with the API key
  - Returns JSON to the client

This keeps secrets out of the client bundle and browser.

Example function pseudo-code (create in `netlify/functions/airscale.js` if you choose to add functions):
```js
export async function handler(event) {
  // event.path will look like: /.netlify/functions/airscale/v1/email
  // We want to forward to Airscale as /v1/email or /v1/phone
  const apiKey = process.env.AIRSCALE_API_KEY;
  const base = process.env.AIRSCALE_BASE_URL || 'https://api.airscale.dev';

  // Extract the path after the function name, e.g., /v1/email
  const forwardPath = event.path.replace(/^.*\/airscale/, '');

  const res = await fetch(`${base}${forwardPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Per Airscale docs you can send API key via X-Api-Key header.
      'X-Api-Key': apiKey
      // If docs prefer Authorization: Bearer <key>, adjust here accordingly.
      // 'Authorization': `Bearer ${apiKey}`
    },
    body: event.body
  });

  // Surface rate limit headers so the client can show hints
  const headers = {
    'Content-Type': 'application/json',
    'x-ratelimit-limit': res.headers.get('x-ratelimit-limit') || '',
    'x-ratelimit-remaining': res.headers.get('x-ratelimit-remaining') || '',
    'x-ratelimit-reset': res.headers.get('x-ratelimit-reset') || ''
  };

  return {
    statusCode: res.status,
    headers,
    body: await res.text()
  };
}
```

Then configure a redirect in `netlify.toml` to map `/api/airscale/*` to that function. Note: This repo currently sets headers and SPA redirects; add the function mapping if you implement functions.

Rate limits and credits:
- The UI will show friendly messages on 429 (rate limit) and 402 (credits exhausted), using any x-ratelimit-* headers forwarded by the function.
- Ensure your Netlify environment has adequate credits and monitor usage in Airscale dashboard.

## Netlify setup
- Connect this repo to Netlify
- Build command: `CI=false npm run build` (already set in `netlify.toml`)
- Publish directory: `build`
- Environment:
  - AIRSCALE_API_KEY: your secret
  - Optional: AIRSCALE_BASE_URL (defaults to https://api.airscale.dev)
- Headers and CSP are set via `netlify.toml` and `public/_headers`
- SEO blocked with `public/robots.txt` and meta noindex in `public/index.html`

## Accessibility
- Proper labels, aria-live regions, and disabled states
- Keyboard-friendly buttons and focus outlines

## Project structure
- src/components: LeadForm, ResultsPanel, Alert
- src/services: airscaleClient (no secrets)
- public: index.html, robots.txt, _headers
- netlify.toml: SPA redirects, security headers

## Notes
- Keep usage internal; do not share URL publicly.
- For local testing without functions, you can mock `/api/airscale/*` using a dev proxy or mock server.

License: Internal use for Worldwide Charters.
