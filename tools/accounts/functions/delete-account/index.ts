// Supabase Edge Function: delete-account (intent 063, privacy finding F3).
// Deletes the signed-in caller's own account. Deploy with JWT verification
// off (--no-verify-jwt): the function checks the access token itself with
// /auth/v1/user, which also works with Supabase's newer signing keys.
//
// Deleting the auth user removes the profiles row and its consent events
// (on delete cascade). If the account had opted in to marketing, the
// profiles delete trigger puts the address on the do-not-email list.

const ALLOWED_ORIGINS = ['https://aggallim.github.io', 'http://localhost:8000'];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
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
  if (req.method !== 'POST') return json(req, 405, { error: 'Use POST.' });

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json(req, 401, { error: 'Sign in first.' });

  // Guard against a stray request: the app sends this only after the user
  // confirms in the account panel.
  const body = await req.json().catch(() => ({}));
  if (!body || body.confirm !== 'delete') return json(req, 400, { error: 'Missing confirmation.' });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json(req, 500, { error: 'Not configured.' });

  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return json(req, 401, { error: 'Your session has expired. Sign in again.' });
  const user = await userRes.json();
  if (!user || !user.id) return json(req, 401, { error: 'Your session has expired. Sign in again.' });

  const delRes = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  if (!delRes.ok) {
    console.error('delete-account: admin delete failed', delRes.status);
    return json(req, 502, { error: 'Could not delete the account. Try again, or send a privacy request.' });
  }
  return json(req, 200, { deleted: true });
});
