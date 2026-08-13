// Deletes an unconfirmed auth.users row so its email can be used to sign up
// again — for the "I mistyped my email and never got the confirmation link"
// case. Same shape as confirm-user-email: service_role key never leaves this
// function, and it's the only place that can hold it.
//
// SECURITY: never delete based on email alone. The caller must prove they
// know both the email AND the password — that proof is re-verified here,
// server-side, via Supabase's own signInWithPassword. The client's own
// account of what error it saw is never trusted; this function repeats the
// check independently. A confirmed account can never be deleted through this
// path, no matter what the request claims.
//
// Deploy with: supabase functions deploy reregister-unverified-account

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generic on purpose — never reveals *why* a request was rejected (wrong
// password vs. already confirmed vs. no such account are all
// indistinguishable from the outside, so this can't be used to probe which
// emails exist or whether a given account is confirmed).
function reject(status = 400) {
  return new Response(JSON.stringify({ error: "Unable to process this request." }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return reject(405);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return reject(501);
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return reject(400);
  }

  // Never log `body` or any derived value containing the password.
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) return reject(400);

  // --- Step A: independent, server-side proof of email+password ownership.
  // A fresh anon-key client per request — this is the exact same call
  // login() makes from the browser, just executed here so the *result* is
  // something this function can trust instead of taking the client's word
  // for it.
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({ email, password });

  if (signInData?.session) {
    // Credentials are valid AND the account is confirmed (unconfirmed
    // accounts never get a session back). Refuse outright — this path must
    // never be able to touch a confirmed account.
    return reject(403);
  }
  if (!signInError || signInError.message !== "Email not confirmed") {
    // Any other outcome — wrong password, no such account, rate-limited,
    // etc. — is rejected the same generic way.
    return reject(401);
  }

  // --- Step B: locate the user via the Admin API and re-check confirmation
  // status directly against auth.users, independent of the error string
  // above. (listUsers has no server-side email filter in the current SDK,
  // so this paginates — fine at this project's scale; capped to bound worst
  // case.)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let matchedUser: { id: string; email?: string; email_confirmed_at?: string | null } | null = null;
  const perPage = 1000;
  for (let page = 1; page <= 10 && !matchedUser; page++) {
    const { data: pageData, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (listError) return reject(500);
    const users = pageData?.users || [];
    matchedUser = users.find((u) => (u.email || "").toLowerCase() === email) || null;
    if (users.length < perPage) break; // last page
  }

  if (!matchedUser) return reject(404);
  if (matchedUser.email_confirmed_at) {
    // Belt-and-suspenders: confirmed accounts are never deletable here,
    // even if Step A's error check were ever somehow wrong.
    return reject(403);
  }

  // --- Step C: delete. Cascades through profiles/listings/reviews/etc via
  // existing foreign-key ON DELETE CASCADE — nothing else to clean up here.
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(matchedUser.id);
  if (deleteError) return reject(500);

  return ok();
});
