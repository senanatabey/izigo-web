import { supabase } from "./supabaseClient";

const TONES = ["dusk", "forest", "meadow"];

export function toneForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

// Short-lived in-memory cache — the same category grid is fetched over and
// over as someone browses Home → Villas → back → Villas again within one
// session; this avoids the repeat network round trip without risking a
// host's fresh listing being stale for more than a minute.
const LISTINGS_CACHE_TTL_MS = 60_000;
const listingsCache = new Map(); // category -> { data, expiresAt }

export async function fetchApprovedListings(category) {
  const cached = listingsCache.get(category);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("category", category)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;

  listingsCache.set(category, { data, expiresAt: Date.now() + LISTINGS_CACHE_TTL_MS });
  return data;
}

/** Same as fetchApprovedListings, scoped to one city — used by Place pages
 *  ("Villas near you", etc.), which filter by city only per Stage 2 scope. */
export async function fetchApprovedListingsByCity(category, city, limit = 6) {
  if (!city) return [];
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("category", category)
    .eq("status", "approved")
    .eq("city", city)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

/**
 * Aggregates published review ratings per listing id. Returns a map
 * { [listingId]: { rating: number, reviewCount: number } } — ids with no
 * reviews are simply absent from the map, so callers can treat that as
 * "new listing, no rating yet".
 */
export async function fetchListingRatings(listingIds) {
  if (!listingIds?.length) return {};
  const { data, error } = await supabase
    .from("reviews")
    .select("listing_id, rating")
    .eq("status", "published")
    .in("listing_id", listingIds);
  if (error || !data) return {};

  const byListing = {};
  for (const row of data) {
    if (!byListing[row.listing_id]) byListing[row.listing_id] = [];
    byListing[row.listing_id].push(row.rating);
  }
  return Object.fromEntries(
    Object.entries(byListing).map(([id, ratings]) => [
      id,
      {
        rating: Math.round((ratings.reduce((a, r) => a + r, 0) / ratings.length) * 10) / 10,
        reviewCount: ratings.length,
      },
    ]),
  );
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
