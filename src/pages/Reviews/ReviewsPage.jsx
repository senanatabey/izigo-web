import { useState } from "react";
import { Star, MessageCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const STAYS_TO_REVIEW = [
  { id: "v1", title: { en: "Seafront apartment near the Boulevard", az: "Bulvar yaxınlığında dənizkənarı mənzil" } },
];

const RECEIVED_REVIEWS = [
  {
    id: "r1", guest: "Kamran M.", rating: 5,
    text: { en: "Great location and very responsive host. Would stay again!", az: "Əla yerləşmə və çox operativ ev sahibi. Yenidən qalardım!" },
    reply: null,
  },
  {
    id: "r2", guest: "Aysel R.", rating: 4,
    text: { en: "Clean and comfortable, exactly as described.", az: "Təmiz və rahat, təsvir olunduğu kimi." },
    reply: null,
  },
];

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
          <Star size={18} color="#FFB800" fill={n <= value ? "#FFB800" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState("guest");

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittedIds, setSubmittedIds] = useState([]);

  const [replies, setReplies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});

  const submitReview = (id) => {
    if (!rating || !reviewText.trim()) return;
    setSubmittedIds((prev) => [...prev, id]);
  };

  const submitReply = (id) => {
    const draft = (replyDrafts[id] || "").trim();
    if (!draft) return;
    setReplies((prev) => ({ ...prev, [id]: draft }));
  };

  return (
    <div className="reviews-page">
      <style>{`
        .reviews-page .rp-head { margin-bottom: 20px; }
        .reviews-page .rp-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
        .reviews-page .rp-head p { font-size: 13.5px; color: var(--text-soft); margin: 0; }

        .reviews-page .rp-tabs { display: flex; gap: 6px; background: var(--bg-soft); border-radius: 10px; padding: 4px; margin-bottom: 24px; max-width: 320px; }
        .reviews-page .rp-tab { flex: 1; border: none; background: none; padding: 9px; border-radius: 8px; font-size: 13px; font-weight: 700; color: var(--text-soft); cursor: pointer; }
        .reviews-page .rp-tab.active { background: #fff; color: var(--izigo-green); box-shadow: var(--shadow-sm); }

        .reviews-page .rp-card { border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 16px; max-width: 560px; }
        .reviews-page .rp-card-title { font-size: 14.5px; font-weight: 700; margin-bottom: 12px; }
        .reviews-page .rp-textarea {
          width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px; font-size: 14px;
          font-family: var(--sans); resize: vertical; min-height: 80px; margin: 12px 0;
        }
        .reviews-page .rp-submit {
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 10px 20px; font-weight: 700; font-size: 13.5px; cursor: pointer;
        }
        .reviews-page .rp-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .reviews-page .rp-done { display: flex; align-items: center; gap: 8px; color: var(--izigo-green); font-weight: 700; font-size: 14px; }

        .reviews-page .rp-guest-name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
        .reviews-page .rp-review-text { font-size: 13.5px; color: var(--text-soft); line-height: 1.6; margin: 8px 0 12px; }
        .reviews-page .rp-reply { background: var(--bg-soft); border-radius: 10px; padding: 12px 14px; margin-top: 10px; font-size: 13px; }
        .reviews-page .rp-reply strong { color: var(--izigo-green); }
        .reviews-page .rp-reply-form { display: flex; gap: 8px; margin-top: 10px; }
        .reviews-page .rp-reply-form input {
          flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13px; font-family: var(--sans);
        }
        .reviews-page .rp-reply-btn {
          border: none; background: var(--izigo-green); color: #fff; border-radius: 8px; padding: 0 16px; font-size: 13px; font-weight: 700; cursor: pointer;
        }

        .reviews-page .rp-empty { color: var(--text-soft); font-size: 14px; }
      `}</style>

      <div className="rp-head">
        <h1>{t("reviewsPage.heading")}</h1>
        <p>{t("reviewsPage.subtitle")}</p>
      </div>

      <div className="rp-tabs">
        <button type="button" className={`rp-tab${tab === "guest" ? " active" : ""}`} onClick={() => setTab("guest")}>{t("reviewsPage.guestTab")}</button>
        <button type="button" className={`rp-tab${tab === "host" ? " active" : ""}`} onClick={() => setTab("host")}>{t("reviewsPage.hostTab")}</button>
      </div>

      {tab === "guest" ? (
        STAYS_TO_REVIEW.length === 0 ? (
          <p className="rp-empty">{t("reviewsPage.noStays")}</p>
        ) : (
          STAYS_TO_REVIEW.map((stay) => (
            <div className="rp-card" key={stay.id}>
              <div className="rp-card-title">{stay.title[language] || stay.title.en}</div>
              {submittedIds.includes(stay.id) ? (
                <div className="rp-done"><CheckCircle2 size={17} />{t("reviewsPage.thanks")}</div>
              ) : (
                <>
                  <StarRow value={rating} onChange={setRating} />
                  <textarea
                    className="rp-textarea"
                    placeholder={t("reviewsPage.placeholder")}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                  <button type="button" className="rp-submit" disabled={!rating || !reviewText.trim()} onClick={() => submitReview(stay.id)}>
                    {t("reviewsPage.submit")}
                  </button>
                </>
              )}
            </div>
          ))
        )
      ) : (
        RECEIVED_REVIEWS.map((review) => (
          <div className="rp-card" key={review.id}>
            <div className="rp-guest-name">{review.guest}</div>
            <StarRow value={review.rating} />
            <p className="rp-review-text">{review.text[language] || review.text.en}</p>
            {replies[review.id] ? (
              <div className="rp-reply"><strong>{t("reviewsPage.yourReply")}:</strong> {replies[review.id]}</div>
            ) : (
              <div className="rp-reply-form">
                <input
                  type="text"
                  placeholder={t("reviewsPage.replyPlaceholder")}
                  value={replyDrafts[review.id] || ""}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                />
                <button type="button" className="rp-reply-btn" onClick={() => submitReply(review.id)}>
                  <MessageCircle size={13} />
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
