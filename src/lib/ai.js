import { supabase } from "./supabaseClient";

/**
 * Calls the `generate-content` edge function (supabase/functions/generate-content).
 * Returns plain generated text — never writes anything to the database itself,
 * so nothing an admin generates here can end up published without them
 * explicitly inserting it into a field and then clicking Save.
 *
 * Throws with a human-readable message on failure (including "not configured
 * yet" if OPENAI_API_KEY hasn't been set for the Supabase project).
 */
export async function generateAiContent({ type, entityLabel, name, city, category, language }) {
  const { data, error } = await supabase.functions.invoke("generate-content", {
    body: { type, entityLabel, name, city, category, language },
  });
  if (error) throw new Error(error.message || "AI generation failed.");
  if (data?.error) throw new Error(data.error);
  return data.text;
}
