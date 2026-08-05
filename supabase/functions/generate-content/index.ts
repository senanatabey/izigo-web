// Stage 3 — AI Content Assistant edge function.
//
// Proxies a single generation request to an LLM. Requires an admin-authenticated
// caller and an OPENAI_API_KEY secret — deploy with:
//   supabase functions deploy generate-content
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// This function only ever RETURNS text to the client — it never writes to
// the database itself, so generated content can't accidentally get
// published without a human reviewing and clicking Save.

import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const MODEL = "gpt-4o-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const LANGUAGE_NAMES: Record<string, string> = { az: "Azerbaijani", en: "English", ar: "Arabic" };

type PromptContext = { entityLabel: string; name: string; city?: string; category?: string };

const PROMPTS: Record<string, (ctx: PromptContext) => string> = {
  content: ({ entityLabel, name, city, category }) =>
    `Write engaging, factual travel content (250-400 words, plain text, no markdown headers) for a ${entityLabel} called "${name}"${city ? ` in ${city}, Azerbaijan` : ""}${category ? ` (category: ${category})` : ""}.`,
  history: ({ name, city }) =>
    `Write a short "History" section (120-200 words, plain text) about "${name}"${city ? ` in ${city}, Azerbaijan` : ""} for a travel guide.`,
  thingsToDo: ({ name, city }) =>
    `Write a "Things To Do" section (120-200 words, plain text) for "${name}"${city ? ` in ${city}, Azerbaijan` : ""}.`,
  faq: ({ name, city }) =>
    `Generate exactly 4 frequently asked questions with concise answers about "${name}"${city ? ` in ${city}, Azerbaijan` : ""} for travelers. Respond ONLY with a JSON array like [{"question":"...","answer":"..."}] — no other text.`,
  seo_title: ({ name, city }) =>
    `Write one SEO title (max 60 characters) for a travel page about "${name}"${city ? ` in ${city}, Azerbaijan` : ""}. Respond with only the title text, no quotes.`,
  meta_description: ({ name, city }) =>
    `Write one SEO meta description (max 155 characters) for a travel page about "${name}"${city ? ` in ${city}, Azerbaijan` : ""}. Respond with only the description text, no quotes.`,
  keywords: ({ name, city }) =>
    `Suggest 8 SEO keywords/phrases for a travel page about "${name}"${city ? ` in ${city}, Azerbaijan` : ""}. Respond ONLY as a comma-separated list, no numbering, no other text.`,
  alt_text: ({ name, city }) =>
    `Write one concise, descriptive image ALT text (max 125 characters) for a photo representing "${name}"${city ? ` in ${city}, Azerbaijan` : ""}. Respond with only the alt text, no quotes.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!OPENAI_API_KEY) {
    return json({ error: "AI is not configured yet. Ask an engineer to set the OPENAI_API_KEY secret for this Supabase project (supabase secrets set OPENAI_API_KEY=...)." }, 501);
  }

  // Admin-only — mirrors the is_admin() gate every cms_* table already enforces via RLS.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: "Not authenticated." }, 401);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Not authenticated." }, 401);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Admins only." }, 403);

  let body: { type?: string; entityLabel?: string; name?: string; city?: string; category?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const { type, entityLabel = "page", name, city, category, language = "en" } = body;
  if (!name) return json({ error: "A title/name is required before generating content." }, 400);

  const buildPrompt = type ? PROMPTS[type] : undefined;
  if (!buildPrompt) return json({ error: `Unknown generation type: ${type}` }, 400);

  const languageInstruction = `Write in ${LANGUAGE_NAMES[language] || "English"}.`;
  const prompt = `${buildPrompt({ entityLabel, name, city, category })} ${languageInstruction}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are a travel content writer for IZIGO, an Azerbaijan travel marketplace. Follow the user's format instructions exactly and output nothing else." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return json({ error: `AI provider error (${res.status}): ${errText.slice(0, 300)}` }, 502);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    return json({ text });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Generation failed." }, 500);
  }
});
