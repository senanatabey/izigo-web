import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../App";
import { canReviewListing, fetchPublishedReviews, submitReview } from "../lib/reviews";

function StarRow({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          style={{ border: "none", background: "none", cursor: onChange ? "pointer" : "default", padding: 0 }}
        >
          <Star size={onChange ? 22 : 13} color="#FFB800" fill={n <= value ? "#FFB800" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function ListingReviews({ listingId }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(null);

  const loadReviews = () => fetchPublishedReviews(listingId).then(setReviews);

  useEffect(() => {
    setLoading(true);
    loadReviews().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    if (!user?.id) {
      setEligibility(null);
      return;
    }
    canReviewListing(user.id, listingId).then(setEligibility);
  }, [user?.id, listingId]);

  const handleSubmit = async () => {
    if (!rating || !text.trim()) return;
    setSubmitting(true);
    const result = await submitReview(listingId, rating, text.trim());
    setSubmitting(false);
    if (result.eligible) {
      setSubmittedStatus(result.status);
      setRating(0);
      setText("");
      setEligibility({ eligible: false, reason: "already_reviewed" });
      if (result.status === "published") loadReviews();
    } else {
      setEligibility(result);
    }
  };

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
        .listing-reviews .lr-contact-badge { font-size: 11.5px; color: var(--text-soft); opacity: 0.8; margin-top: 6px; }
        .listing-reviews .lr-reply { background: var(--bg-soft); border-radius: 10px; padding: 10px 14px; margin-top: 8px; font-size: 13px; }

        .listing-reviews .lr-form { border: 1px solid var(--border); border-radius: 14px; padding: 18px; margin-top: 16px; }
        .listing-reviews .lr-form-title { font-size: 14.5px; font-weight: 700; margin-bottom: 12px; }
        .listing-reviews .lr-textarea {
          width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px; font-size: 14px;
          font-family: var(--sans); resize: vertical; min-height: 80px; margin: 12px 0;
        }
        .listing-reviews .lr-submit {
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 10px 20px; font-weight: 700; font-size: 13.5px; cursor: pointer;
        }
        .listing-reviews .lr-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .listing-reviews .lr-limit-note, .listing-reviews .lr-thanks {
          font-size: 13px; color: var(--text-soft); margin-top: 16px;
        }
        .listing-reviews .lr-thanks { color: var(--izigo-green); font-weight: 700; }
      `}</style>
      <h2>
        <Star size={18} fill="#FFB800" color="#FFB800" />
        {avg ? `${avg} (${reviews.length})` : t("listingReviews.heading")}
      </h2>
      {reviews.length === 0 ? (
        <p className="lr-empty">{t("listingReviews.empty")}</p>
      ) : (
        reviews.map((r) => (
          <div className="lr-item" key={r.id}>
            <div className="lr-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <p className="lr-text">{r.text}</p>
            <p className="lr-contact-badge">{t("listingReviews.contactBadge")}</p>
            {r.host_reply && <div className="lr-reply"><strong>{t("listingReviews.hostReplyLabel")}:</strong> {r.host_reply}</div>}
          </div>
        ))
      )}

      {submittedStatus ? (
        <p className="lr-thanks">{t("listingReviews.thanks")}</p>
      ) : eligibility?.eligible ? (
        <div className="lr-form">
          <div className="lr-form-title">{t("listingReviews.formHeading")}</div>
          <StarRow value={rating} onChange={setRating} />
          <textarea
            className="lr-textarea"
            placeholder={t("listingReviews.placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="button" className="lr-submit" disabled={!rating || !text.trim() || submitting} onClick={handleSubmit}>
            {submitting ? "..." : t("listingReviews.submit")}
          </button>
        </div>
      ) : eligibility?.reason === "reviewer_limit" ? (
        <p className="lr-limit-note">{t("listingReviews.limitReached")}</p>
      ) : null}
    </div>
  );
}
