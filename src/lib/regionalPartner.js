import { supabase } from "./supabaseClient";

// Regional Partner data access — every read here is RLS-scoped server-side
// (see supabase/023_regional_partners.sql / 024_regional_partner_functions.sql),
// so a partner querying any of these functions only ever gets rows for their
// own region/partner_id, regardless of what the frontend asks for. Revenue
// numbers come from a database view, never computed client-side.

/** The calling user's own regional_partners row, or null if they aren't one. */
export async function fetchMyPartnerProfile() {
  const { data, error } = await supabase
    .from("regional_partners")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("fetchMyPartnerProfile failed:", error);
    return null;
  }
  return data;
}

/** Listings in a region — for a partner this is exactly their own region's
 *  listings (any status) thanks to the RLS policy added in 023; passing a
 *  different region simply returns nothing rather than another region's data. */
export async function fetchRegionListings(region) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("city", region)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchRegionListings failed:", error);
    return [];
  }
  return data || [];
}

export async function approveRegionalListing(listingId) {
  const { error } = await supabase.rpc("regional_partner_approve_listing", { p_listing_id: listingId });
  if (error) throw error;
}

export async function rejectRegionalListing(listingId, reason) {
  const { error } = await supabase.rpc("regional_partner_reject_listing", {
    p_listing_id: listingId,
    p_reason: reason || null,
  });
  if (error) throw error;
}

/** Gross/IZIGO/partner revenue split + paid/pending totals — all computed in
 *  the regional_partner_revenue_summary view, never in the frontend. */
export async function fetchMyRevenueSummary() {
  const { data, error } = await supabase
    .from("regional_partner_revenue_summary")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("fetchMyRevenueSummary failed:", error);
    return null;
  }
  return data;
}

export async function fetchMyPayments(partnerId) {
  if (!partnerId) return [];
  const { data, error } = await supabase
    .from("regional_partner_payments")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchMyPayments failed:", error);
    return [];
  }
  return data || [];
}

export async function fetchRegionAdCampaigns(region) {
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("region", region)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchRegionAdCampaigns failed:", error);
    return [];
  }
  return data || [];
}

/* -------------------------------------------------------------------------
   Admin-only management — RLS still enforces is_admin() server-side even if
   these were ever called by a non-admin, but these are only ever wired up
   from src/pages/Admin/RegionalPartners/*.
   ------------------------------------------------------------------------- */

export async function fetchAllPartners() {
  const { data, error } = await supabase
    .from("regional_partners")
    .select("*, profile:profiles(full_name, id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPartner(fields) {
  const { error } = await supabase.from("regional_partners").insert(fields);
  if (error) throw error;
}

/** The only supported way to make a user a regional partner. Runs as one
 *  atomic SECURITY DEFINER RPC (supabase/025_regional_partner_admin_protection.sql)
 *  that re-checks admin privileges and refuses outright if the target user
 *  is currently an admin — a `profiles` trigger backs this up at the row
 *  level too, so an admin's role can never become "regional_partner"
 *  through this call or any other update path. */
export async function assignRegionalPartner(userId, region, revenueSharePercent) {
  const { data, error } = await supabase.rpc("assign_regional_partner", {
    p_user_id: userId,
    p_region: region,
    p_revenue_share_percent: revenueSharePercent,
  });
  if (error) throw error;
  return data;
}

export async function updatePartner(id, fields) {
  const { error } = await supabase.from("regional_partners").update(fields).eq("id", id);
  if (error) throw error;
}

export async function fetchAllAdCampaigns() {
  const { data, error } = await supabase.from("ad_campaigns").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAdCampaign(fields) {
  const { error } = await supabase.from("ad_campaigns").insert(fields);
  if (error) throw error;
}

export async function updateAdCampaign(id, fields) {
  const { error } = await supabase.from("ad_campaigns").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteAdCampaign(id) {
  const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAllPartnerPayments() {
  const { data, error } = await supabase
    .from("regional_partner_payments")
    .select("*, partner:regional_partners(region, user_id, profile:profiles(full_name))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPartnerPayment(fields) {
  const { error } = await supabase.from("regional_partner_payments").insert(fields);
  if (error) throw error;
}

/** Admin-only: mark a payment paid (or revert to pending) — a partner has no
 *  write policy on this table at all, enforced by RLS, not just by this
 *  function living under Admin/. */
export async function updatePartnerPaymentStatus(id, status, paymentReference) {
  const fields = { status };
  if (status === "paid") {
    fields.paid_at = new Date().toISOString();
    if (paymentReference) fields.payment_reference = paymentReference;
  } else {
    fields.paid_at = null;
  }
  const { error } = await supabase.from("regional_partner_payments").update(fields).eq("id", id);
  if (error) throw error;
}
