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
    .select("*, host:profiles(id, full_name)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export function shortListingCode(id) {
  return `IZ-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function relativeDate(dateStr, language) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return language === "az" ? "Bu gün" : "Today";
  if (days === 1) return language === "az" ? "Dünən" : "Yesterday";
  return language === "az" ? `${days} gün əvvəl` : `${days} days ago`;
}
