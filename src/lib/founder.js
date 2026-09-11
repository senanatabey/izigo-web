import { supabase } from "./supabaseClient";

// Founder Host onboarding program — a one-time launch incentive, not a
// subscription. This file is the single place that reasons about the
// campaign and about granting founder status, so a future paid VIP tier can
// hook in here (see tryGrantFounderStatus) without touching callers.

export async function fetchFounderCampaign() {
  const { data, error } = await supabase.from("founder_campaign").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function updateFounderCampaign(fields) {
  const { error } = await supabase.from("founder_campaign").update(fields).eq("id", 1);
  if (error) throw error;
}

export async function fetchFounderCount() {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("founder_host", true);
  if (error) throw error;
  return count || 0;
}

/**
 * Campaign is joinable if the admin has it enabled AND the cap hasn't been
 * reached yet. Fails open (assumes joinable) on a fetch error — an
 * infrastructure hiccup must never be mistaken for "the campaign ended" and
 * silently hide Founder messaging that should still be showing.
 */
export async function isFounderCampaignJoinable() {
  try {
    const [campaign, count] = await Promise.all([fetchFounderCampaign(), fetchFounderCount()]);
    return campaign.status === "active" && count < campaign.max_founder_hosts;
  } catch {
    return true;
  }
}

/**
 * Called after either of the two events that can complete a host's founder
 * eligibility: a listing getting approved, or a host getting verified.
 * Grants founder status only when every condition is met, and auto-closes
 * the campaign the moment the cap is reached. Safe to call repeatedly —
 * it's a no-op once a host is already a founder.
 *
 * Returns `true` on a successful grant, or a reason string when it did
 * nothing: "not_found", "already_founder", "not_verified",
 * "no_approved_listing", "campaign_inactive", or "cap_reached". A host that
 * met the criteria before this flow existed (e.g. a listing approved or a
 * host verified directly in the database, bypassing the admin UI) never had
 * this function run for them — the reason string is what lets an admin
 * retroactively grant it and know why it doesn't fire, rather than the
 * badge just silently never appearing.
 */
export async function tryGrantFounderStatus(hostId) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("verified, founder_host")
    .eq("id", hostId)
    .single();
  if (profileError) throw profileError;
  if (!profile) return "not_found";
  if (profile.founder_host) return "already_founder";
  if (!profile.verified) return "not_verified";

  const campaign = await fetchFounderCampaign();
  if (campaign.status !== "active") return "campaign_inactive";

  const count = await fetchFounderCount();
  if (count >= campaign.max_founder_hosts) {
    await updateFounderCampaign({ status: "inactive" });
    return "cap_reached";
  }

  const { data: approvedListing } = await supabase
    .from("listings")
    .select("id")
    .eq("host_id", hostId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (!approvedListing) return "no_approved_listing";

  const vipExpiresAt = new Date();
  vipExpiresAt.setFullYear(vipExpiresAt.getFullYear() + 1);

  await supabase
    .from("profiles")
    .update({ founder_host: true, founder_granted_at: new Date().toISOString(), vip_expires_at: vipExpiresAt.toISOString() })
    .eq("id", hostId);

  // This host just took the last spot — close the campaign for everyone else.
  if (count + 1 >= campaign.max_founder_hosts) {
    await updateFounderCampaign({ status: "inactive" });
  }
  return true;
}
