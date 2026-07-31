import { supabase } from "./supabaseClient";

export async function fetchActiveCampaign() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("hero_campaigns")
    .select("*")
    .in("status", ["published", "scheduled"])
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0];
}

export async function fetchSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error || !data) return null;
  return data;
}

export async function updateDefaultHeroImages({ desktopUrl, mobileUrl }) {
  const payload = {};
  if (desktopUrl) payload.default_hero_desktop_url = desktopUrl;
  if (mobileUrl) payload.default_hero_mobile_url = mobileUrl;
  const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
  if (error) throw error;
}
