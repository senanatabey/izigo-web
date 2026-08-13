import { supabase } from "./supabaseClient";

// Fire-and-forget — records the first WhatsApp contact for (user, listing).
// ON CONFLICT DO NOTHING means a second/third click never overwrites the
// original contacted_at, which is what the review cool-down is measured from.
export async function recordListingContact(listingId, userId) {
  if (!userId || !listingId) return;
  const { error } = await supabase
    .from("listing_contacts")
    .upsert({ user_id: userId, listing_id: listingId }, { onConflict: "user_id,listing_id", ignoreDuplicates: true });
  if (error) console.error("recordListingContact failed:", error);
}

/** { eligible: boolean, reason?: string, available_at?: string } */
export async function canReviewListing(userId, listingId) {
  const { data, error } = await supabase.rpc("can_review_listing", { p_user_id: userId, p_listing_id: listingId });
  if (error) {
    console.error("canReviewListing failed:", error);
    return { eligible: false, reason: "error" };
  }
  return data;
}

/** { eligible: boolean, status?: string, review_id?: string, reason?: string } */
export async function submitReview(listingId, rating, text) {
  const { data, error } = await supabase.rpc("submit_review", { p_listing_id: listingId, p_rating: rating, p_text: text });
  if (error) {
    console.error("submitReview failed:", error);
    return { eligible: false, reason: "error" };
  }
  return data;
}

export async function fetchPublishedReviews(listingId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("listing_id", listingId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchPublishedReviews failed:", error);
    return [];
  }
  return data || [];
}

/** Every review across every listing this host owns — any status, since the
 *  host should see pending/queued ones too, not just what guests see. */
export async function fetchHostReviews(hostId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchHostReviews failed:", error);
    return [];
  }
  return data || [];
}

export async function replyToReview(reviewId, reply) {
  const { error } = await supabase.from("reviews").update({ host_reply: reply }).eq("id", reviewId);
  if (error) throw error;
}

export async function fetchPendingModerationReviews() {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "pending_moderation")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchPendingModerationReviews failed:", error);
    return [];
  }
  if (!reviews?.length) return [];

  const listingIds = [...new Set(reviews.map((r) => r.listing_id))];
  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const [{ data: listings }, { data: profiles }] = await Promise.all([
    supabase.from("listings").select("id, title, category").in("id", listingIds),
    supabase.from("profiles").select("id, full_name").in("id", reviewerIds),
  ]);
  const listingById = Object.fromEntries((listings || []).map((l) => [l.id, l]));
  const nameById = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));

  return reviews.map((r) => ({
    ...r,
    listingTitle: listingById[r.listing_id]?.title,
    listingCategory: listingById[r.listing_id]?.category,
    reviewerName: nameById[r.reviewer_id],
  }));
}

export async function moderateReview(reviewId, approve) {
  const { error } = await supabase
    .from("reviews")
    .update(approve ? { status: "published", published_at: new Date().toISOString() } : { status: "rejected" })
    .eq("id", reviewId);
  if (error) throw error;
}
