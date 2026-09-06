import { supabase } from "./supabaseClient";

// Short-lived in-memory cache — the Home page unmounts/remounts every time
// someone navigates away and back within one session, which otherwise
// re-fetches the hero campaign/settings and flashes the default image for a
// moment while waiting on the network. Caching them (same pattern as
// listings.js) lets the hero render the correct image immediately on remount.
const HERO_CACHE_TTL_MS = 60_000;
let campaignCache = null; // { data, expiresAt }
let siteSettingsCache = null; // { data, expiresAt }

export function getCachedActiveCampaign() {
  return campaignCache && campaignCache.expiresAt > Date.now() ? campaignCache.data : null;
}

export function getCachedSiteSettings() {
  return siteSettingsCache && siteSettingsCache.expiresAt > Date.now() ? siteSettingsCache.data : null;
}

export async function fetchActiveCampaign() {
  const cached = campaignCache && campaignCache.expiresAt > Date.now() ? campaignCache : null;
  if (cached) return cached.data;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("hero_campaigns")
    .select("*")
    .in("status", ["published", "scheduled"])
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1);
  const result = error || !data || data.length === 0 ? null : data[0];
  campaignCache = { data: result, expiresAt: Date.now() + HERO_CACHE_TTL_MS };
  return result;
}

export async function fetchSiteSettings() {
  const cached = siteSettingsCache && siteSettingsCache.expiresAt > Date.now() ? siteSettingsCache : null;
  if (cached) return cached.data;

  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  const result = error || !data ? null : data;
  siteSettingsCache = { data: result, expiresAt: Date.now() + HERO_CACHE_TTL_MS };
  return result;
}

export async function updateDefaultHeroImages({ desktopUrl, mobileUrl }) {
  const payload = {};
  if (desktopUrl) payload.default_hero_desktop_url = desktopUrl;
  if (mobileUrl) payload.default_hero_mobile_url = mobileUrl;
  const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
  if (error) throw error;
  siteSettingsCache = null;
}

export async function updateLocalServiceImage(key, url) {
  const current = (await fetchSiteSettings())?.local_service_images || {};
  const { error } = await supabase
    .from("site_settings")
    .update({ local_service_images: { ...current, [key]: url } })
    .eq("id", 1);
  if (error) throw error;
  siteSettingsCache = null;
}

// Admin hero campaign CRUD (HeroCampaignsPage) writes to hero_campaigns
// directly via supabase, bypassing this module — call this after any such
// write so the Home page doesn't keep serving a stale cached campaign.
export function invalidateHeroCampaignCache() {
  campaignCache = null;
}
