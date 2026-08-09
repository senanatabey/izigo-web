// Admin-only edge function — manually marks a user's email as confirmed.
//
// This requires the Supabase Admin API (auth.admin.updateUserById), which in
// turn requires the service_role key. That key must never reach the browser,
// so this action can only happen server-side, here — the client only ever
// holds the anon key. Deploy with:
//   supabase functions deploy confirm-user-email
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are already
// present automatically in every Supabase Edge Function's environment.)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "This function is missing its Supabase environment secrets." }, 501);
  }

  // Same admin gate as generate-content: verify the caller's own session
  // (via the anon-key client, which respects RLS) before doing anything
  // privileged with the service-role client below.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Not authenticated." }, 401);

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return json({ error: "Not authenticated." }, 401);

  const { data: profile } = await callerClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Admins only." }, 403);

  let body: { user_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const { user_id } = body;
  if (!user_id) return json({ error: "user_id is required." }, 400);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await adminClient.auth.admin.updateUserById(user_id, { email_confirm: true });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
});
