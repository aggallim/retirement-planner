// Supabase Edge Function: unsubscribe (intent 063, privacy finding F8).
// No sign-in: the unguessable token from the email is the credential.
// Deploy with JWT verification off (--no-verify-jwt).
//
// - POST ?token=… or a JSON body {"token": "…"}: turns marketing consent off
//   and adds the address to the do-not-email list. This covers the button
//   on the app's unsubscribe.html page and mail clients' one-click
//   unsubscribe (RFC 8058: a form POST of "List-Unsubscribe=One-Click").
// - GET: redirects to the app's unsubscribe page, which asks for a click.
//   A GET never unsubscribes, so link scanners in mail systems can't.
//
// Every marketing email should carry:
//   List-Unsubscribe: <https://<project>.supabase.co/functions/v1/unsubscribe?token=TOKEN>
//   List-Unsubscribe-Post: List-Unsubscribe=One-Click
// and, in the body, a link to APP_URL + 'unsubscribe.html#token=TOKEN'.

const APP_URL = 'https://aggallim.github.io/retirement-planner/';
const ALLOWED_ORIGINS = ['https://aggallim.github.io', 'http://localhost:8000'];
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
  const url = new URL(req.url);
  let token = url.searchParams.get('token') || '';

  if (req.method === 'GET') {
    // The token goes in the hash: it isn't sent to GitHub Pages, and the
    // service worker doesn't cache a copy of the page per token.
    const page = new URL('unsubscribe.html', APP_URL);
    if (TOKEN_RE.test(token)) page.hash = `token=${token}`;
    return new Response(null, { status: 302, headers: { Location: page.toString() } });
  }
  if (req.method !== 'POST') return json(req, 405, { error: 'Use POST.' });

  if (!token && (req.headers.get('Content-Type') || '').includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    token = body && typeof body.token === 'string' ? body.token : '';
  }
  if (!TOKEN_RE.test(token)) return json(req, 400, { error: 'This unsubscribe link is incomplete.' });

  const base = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!base || !serviceKey) return json(req, 500, { error: 'Not configured.' });

  const res = await fetch(`${base}/rest/v1/rpc/unsubscribe_by_token`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_token: token })
  });
  if (!res.ok) {
    console.error('unsubscribe: rpc failed', res.status);
    return json(req, 502, { error: 'Something went wrong. Try again later.' });
  }
  const found = await res.json();
  if (found !== true) return json(req, 404, { error: 'This unsubscribe link is no longer valid. The account may have been deleted.' });
  return json(req, 200, { unsubscribed: true });
});
