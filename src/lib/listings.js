import { supabase } from "./supabaseClient";

const TONES = ["dusk", "forest", "meadow"];

export function toneForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

export async function fetchApprovedListings(category) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("category", category)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchListingById(id) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}
