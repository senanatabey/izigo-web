import { supabase } from "./supabaseClient";

// Phase 1 Travel Concierge — a trip request is created once (by the public
// Plan My Trip form) and then entirely organized by hand by the admin from
// the Trip Details page. No auto-matching, no bidding: this file is just a
// thin data-access layer over the trip_requests / trip_services tables.

export const TRIP_STATUSES = ["new", "in_progress", "offer_sent", "confirmed", "completed", "cancelled"];

export const SERVICE_TYPES = ["villa", "transfer", "tour", "extra"];

// Where the request came from — independent of status/result.
export const TRIP_SOURCES = ["plan_my_trip", "website", "whatsapp", "instagram", "facebook", "manual"];

// Final outcome — independent of `status` (the workflow stage). Null until
// the admin closes the request out one way or another.
export const TRIP_RESULTS = ["completed", "cancelled", "no_reply", "budget_too_low", "guest_changed_mind"];

/** Called from the public Plan My Trip form — anon insert, no read-back. */
export async function submitTripRequest(payload) {
  const { error } = await supabase.from("trip_requests").insert(payload);
  if (error) throw error;
}

export async function fetchTripRequests(statusFilter) {
  let query = supabase.from("trip_requests").select("*").order("created_at", { ascending: false });
  if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchTripRequest(id) {
  const { data, error } = await supabase.from("trip_requests").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateTripRequest(id, fields) {
  const { error } = await supabase.from("trip_requests").update(fields).eq("id", id);
  if (error) throw error;
}

export async function fetchTripServices(tripRequestId) {
  const { data, error } = await supabase
    .from("trip_services")
    .select("*")
    .eq("trip_request_id", tripRequestId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addTripService(tripRequestId, service) {
  const { error } = await supabase.from("trip_services").insert({ trip_request_id: tripRequestId, ...service });
  if (error) throw error;
}

export async function updateTripService(id, fields) {
  const { error } = await supabase.from("trip_services").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteTripService(id) {
  const { error } = await supabase.from("trip_services").delete().eq("id", id);
  if (error) throw error;
}
