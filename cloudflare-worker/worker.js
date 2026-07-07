/**
 * Resilient Path — Gemini API Proxy (Cloudflare Worker) — v2
 *
 * Sits between the app and Google Gemini so the API key never ships in the
 * client bundle. v2 adds:
 *
 *   1. APP TOKEN CHECK — requests must carry `X-App-Token` matching the
 *      APP_TOKEN secret. Because Capacitor apps can't send a stable Origin
 *      header, v1 accepted requests from ANYWHERE, meaning anyone who found
 *      the worker URL could burn your Gemini quota from curl. The token is
 *      still extractable from a decompiled APK, but it stops casual abuse
 *      and lets you rotate access without an app-store release.
 *   2. STREAMING SUPPORT — the query string (e.g. `?alt=sse` for
 *      streamGenerateContent) is now forwarded. v1 dropped it, which broke
 *      streaming.
 *   3. BEST-EFFORT RATE LIMITING — per-IP sliding window inside the worker
 *      isolate. For real limits, ALSO add a Cloudflare WAF rate-limiting
 *      rule (dashboard → Security → WAF → Rate limiting rules):
 *      e.g. 30 requests / 1 minute per IP on this worker's route.
 *   4. MODEL ALLOWLIST — only the models the app actually uses can be
 *      called, so a leaked token can't run expensive models on your key.
 *
 * DEPLOYMENT:
 *   1. Workers & Pages → your worker → Settings → Variables & Secrets:
 *        Secret  GEMINI_API_KEY = <your Gemini key>
 *        Secret  APP_TOKEN      = <long random string, e.g. `openssl rand -hex 32`>
 *   2. Paste this file into the editor and Deploy.
 *   3. In the app builds, set:
 *        VITE_PROXY_URL  = https://<worker>.workers.dev
 *        VITE_APP_TOKEN  = <the same random string>
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
];

const ALLOWED_MODELS = new Set([
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
]);

const ALLOWED_METHODS = new Set(['generateContent', 'streamGenerateContent']);

// Best-effort per-IP limiter (per isolate; resets on worker recycle).
const RATE_LIMIT = { windowMs: 60_000, max: 30 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < RATE_LIMIT.windowMs);
  if (arr.length >= RATE_LIMIT.max) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory guard
  return false;
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // Capacitor native webview sends no Origin
  return ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin);
    }
    if (!isAllowedOrigin(origin)) {
      return json({ error: 'Forbidden' }, 403, origin);
    }

    // --- App token check ---
    if (!env.APP_TOKEN) {
      return json({ error: 'Server misconfigured: APP_TOKEN secret not set' }, 500, origin);
    }
    const token = request.headers.get('X-App-Token');
    if (token !== env.APP_TOKEN) {
      return json({ error: 'Unauthorized' }, 401, origin);
    }

    // --- Rate limit ---
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) {
      return json({ error: 'Too many requests. Please slow down.' }, 429, origin);
    }

    // --- Path + model validation ---
    // Expected: /v1beta/models/{model}:{generateContent|streamGenerateContent}
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/v1beta\/models\/([a-zA-Z0-9.\-]+):([a-zA-Z]+)$/);
    if (!m || !ALLOWED_MODELS.has(m[1]) || !ALLOWED_METHODS.has(m[2])) {
      return json({ error: 'Invalid path. Use /v1beta/models/{allowed-model}:generateContent' }, 400, origin);
    }

    // --- Forward to Gemini (query string preserved for ?alt=sse streaming) ---
    const targetUrl = `https://generativelanguage.googleapis.com${url.pathname}${url.search}`;

    try {
      const geminiResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: request.body,
      });

      const responseHeaders = new Headers(geminiResponse.headers);
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => responseHeaders.set(k, v));

      return new Response(geminiResponse.body, {
        status: geminiResponse.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return json({ error: 'Proxy error', details: err.message }, 502, origin);
    }
  },
};
