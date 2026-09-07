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
  if (error) {
    console.error("fetchApprovedListingsByCity failed:", error);
    return [];
  }
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
    .select("*, host:profiles(id, full_name, host_type, agency_name, agent_status)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

/** Shapes a raw `listings` row into the flat object VillaCard/VillasPage
 *  expect — used everywhere a villa grid is built so the mapping only lives
 *  in one place. */
/**
 * Fetches the B2B "agent price" for one listing from listing_agent_prices —
 * a SEPARATE query from the listing itself, never folded into select("*").
 * RLS returns a row only for admins, approved agents, active regional
 * partners, and the listing's own host; everyone else (including anon) gets
 * null, so a non-eligible viewer never receives the number in any response.
 * Call this only when there is a logged-in user — there is nothing to show
 * an anonymous visitor and no reason to fire the request.
 */
export async function fetchAgentPrice(listingId) {
  if (!listingId) return null;
  const { data, error } = await supabase
    .from("listing_agent_prices")
    .select("agent_price")
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error || !data) return null;
  return data.agent_price;
}

export function mapVillaListing(row) {
  return {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    price: row.price,
    discount: row.discount,
    guests: row.details?.guests || 0,
    bedrooms: row.details?.bedrooms || 0,
    amenities: row.details?.amenities || [],
    image: row.images?.[0],
    createdAt: row.created_at,
    longStayEnabled: row.long_stay_discount_enabled || false,
    longStayMinNights: row.long_stay_min_nights || 2,
    longStayDiscountType: row.long_stay_discount_type || null,
    longStayDiscountValue: row.long_stay_discount_value ?? null,
  };
}

/**
 * Scores how similar `candidate` is to `current` (both shaped by
 * mapVillaListing) so "Similar listings" can be ranked instead of random —
 * same city first, then price/bedroom/guest closeness, then amenity
 * overlap. Every candidate gets a score (never a hard filter), so if the
 * city has few villas the ranking still returns the closest matches rather
 * than an empty/incomplete section.
 */
function villaSimilarityScore(current, candidate) {
  let score = 0;
  if (candidate.city === current.city) score += 50;

  const price = current.price || 0;
  const priceDiff = Math.abs((candidate.price || 0) - price);
  const priceTolerance = Math.max(price * 0.3, 20);
  score += priceDiff <= priceTolerance ? 20 : Math.max(0, 20 - (priceDiff / (price || 1)) * 20);

  const bedroomDiff = Math.abs((candidate.bedrooms || 0) - (current.bedrooms || 0));
  score += Math.max(0, 15 - bedroomDiff * 5);

  const guestDiff = Math.abs((candidate.guests || 0) - (current.guests || 0));
  score += Math.max(0, 10 - guestDiff * 2);

  if (current.amenities?.length && candidate.amenities?.length) {
    const overlap = candidate.amenities.filter((a) => current.amenities.includes(a)).length;
    score += overlap * 3;
  }

  return score;
}

/** Ranks `candidates` (shaped by mapVillaListing) by similarity to `current`,
 *  excluding `current` itself, and returns the top `limit`. */
export function rankSimilarVillas(current, candidates, limit = 4) {
  return candidates
    .filter((c) => c.id !== current.id)
    .map((c) => ({ item: c, score: villaSimilarityScore(current, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}

export function shortListingCode(row) {
  if (row?.listing_number) return `IZ-${row.listing_number}`;
  const id = typeof row === "string" ? row : row?.id;
  return `IZ-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function relativeDate(dateStr, language) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return language === "az" ? "Bu gün" : "Today";
  if (days === 1) return language === "az" ? "Dünən" : "Yesterday";
  return language === "az" ? `${days} gün əvvəl` : `${days} days ago`;
}
