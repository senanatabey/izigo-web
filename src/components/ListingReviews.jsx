import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ListingReviews({ listingId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", listingId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data || []))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) return null;

  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="listing-reviews">
      <style>{`
        .listing-reviews { margin-top: 32px; }
        .listing-reviews h2 { font-size: 19px; font-weight: 800; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
        .listing-reviews .lr-empty { font-size: 14px; color: var(--text-soft); }
        .listing-reviews .lr-item { border-top: 1px solid var(--border); padding: 14px 0; }
        .listing-reviews .lr-stars { color: #FFB800; font-size: 13px; margin-bottom: 6px; letter-spacing: 1px; }
        .listing-reviews .lr-text { font-size: 14px; color: var(--text-soft); line-height: 1.6; margin: 0; }
        .listing-reviews .lr-reply { background: var(--bg-soft); border-radius: 10px; padding: 10px 14px; margin-top: 8px; font-size: 13px; }
      `}</style>
      <h2>
        <Star size={18} fill="#FFB800" color="#FFB800" />
        {avg ? `${avg} (${reviews.length})` : "Reviews"}
      </h2>
      {reviews.length === 0 ? (
        <p className="lr-empty">No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div className="lr-item" key={r.id}>
            <div className="lr-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <p className="lr-text">{r.text}</p>
            {r.host_reply && <div className="lr-reply"><strong>Host reply:</strong> {r.host_reply}</div>}
          </div>
        ))
      )}
    </div>
  );
}
