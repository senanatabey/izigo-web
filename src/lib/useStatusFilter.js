import { useState } from "react";

/* Shared "all / approved / pending / rejected" filter for a host's own
   listings, used by /my-listings and the profile "my listings" block so the
   statuses, counts and filtering live in one place. Filtering is client-side;
   the listings are already loaded. The tab markup is in
   components/ListingStatusTabs.jsx. */

export const STATUS_TABS = ["all", "approved", "pending", "rejected"];

export function useStatusFilter(listings) {
  const [filter, setFilter] = useState("all");
  const counts = {
    all: listings.length,
    approved: listings.filter((l) => l.status === "approved").length,
    pending: listings.filter((l) => l.status === "pending").length,
    rejected: listings.filter((l) => l.status === "rejected").length,
  };
  const filtered = filter === "all" ? listings : listings.filter((l) => l.status === filter);
  return { filter, setFilter, counts, filtered };
}
