import { useEffect, useState } from "react";
import { Star, MessageSquareText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import AdminEmptyState from "../../components/AdminEmptyState";
import { fetchPendingModerationReviews, moderateReview } from "../../lib/reviews";

export default function PendingReviewsPage() {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchPendingModerationReviews().then(setReviews).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (reviewId, approve) => {
    setActingId(reviewId);
    try {
      await moderateReview(reviewId, approve);
      load();
    } catch (err) {
      window.alert(err.message || "Failed.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <style>{`
        .pending-reviews-list { display: flex; flex-direction: column; gap: 14px; }
        .pending-review-card { border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
        .pending-review-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
        .pending-review-listing { font-size: 15px; font-weight: 700; }
        .pending-review-meta { font-size: 12.5px; color: var(--text-soft); margin-top: 2px; }
        .pending-review-stars { color: #FFB800; display: flex; gap: 2px; margin-bottom: 8px; }
        .pending-review-text { font-size: 13.5px; color: var(--text); line-height: 1.6; margin-bottom: 14px; white-space: pre-wrap; }
        .pending-review-actions { display: flex; gap: 10px; }
        .pending-review-actions button {
          border-radius: 8px; padding: 8px 16px; font-weight: 700; font-size: 13px; cursor: pointer; border: none;
        }
        .btn-approve { background: var(--izigo-green); color: #fff; }
        .btn-reject { background: #F1F1F1; color: #333; }
        .pending-review-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t("adminPendingReviews.heading")}</h1>
      {loading ? (
        <p>Yüklənir...</p>
      ) : reviews.length === 0 ? (
        <AdminEmptyState icon={MessageSquareText} message={t("adminPendingReviews.empty")} />
      ) : (
        <div className="pending-reviews-list">
          {reviews.map((r) => (
            <div className="pending-review-card" key={r.id}>
              <div className="pending-review-head">
                <div>
                  <div className="pending-review-listing">
                    {t("adminPendingReviews.listingLabel")}: {r.listingTitle?.[language] || r.listingTitle?.en || "—"}
                  </div>
                  <div className="pending-review-meta">
                    {t("adminPendingReviews.reviewerLabel")}: {r.reviewerName || "—"} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="pending-review-stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={15} fill={i < r.rating ? "#FFB800" : "none"} />
                ))}
              </div>
              <p className="pending-review-text">{r.text}</p>
              <div className="pending-review-actions">
                <button className="btn-approve" disabled={actingId === r.id} onClick={() => act(r.id, true)}>
                  {t("adminPendingReviews.approve")}
                </button>
                <button className="btn-reject" disabled={actingId === r.id} onClick={() => act(r.id, false)}>
                  {t("adminPendingReviews.reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
