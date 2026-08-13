import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REVIEW_STATUS_LABEL = {
  published: "Dərc edilib", flagged: "Bildirilib", hidden: "Gizli",
  pending_moderation: "Baxılır", queued: "Növbədə", rejected: "Rədd edilib",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    supabase
      .from("reviews")
      .select("*, listing:listings(title, category)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setStatus = async (id, status) => {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) {
      console.error("Failed to update review status:", error);
      window.alert("Rəyi yeniləmək mümkün olmadı — yenidən cəhd edin.");
      return;
    }
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Bu rəyi silmək istədiyinizə əminsiniz?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete review:", error);
      window.alert("Rəyi silmək mümkün olmadı — yenidən cəhd edin.");
      return;
    }
    load();
  };

  return (
    <div>
      <style>{`
        .admin-reviews-list { display: flex; flex-direction: column; gap: 14px; }
        .admin-review-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
        .admin-review-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .admin-review-title { font-weight: 700; font-size: 14px; }
        .admin-review-rating { color: #FFB800; font-weight: 700; font-size: 13px; }
        .admin-review-text { font-size: 13.5px; color: var(--text-soft); margin: 0 0 10px; line-height: 1.6; }
        .admin-review-actions { display: flex; gap: 10px; }
        .admin-review-actions button {
          border: none; border-radius: 8px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
        }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .status-pill.published { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.flagged { background: rgba(255,180,0,0.16); color: #B87700; }
        .status-pill.hidden { background: rgba(224,85,63,0.14); color: #E0553F; }
        .status-pill.pending_moderation { background: rgba(255,180,0,0.16); color: #B87700; }
        .status-pill.queued { background: rgba(0,150,255,0.14); color: #0A6EBD; }
        .status-pill.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
        .btn-flag { background: rgba(255,180,0,0.16); color: #B87700; }
        .btn-hide { background: rgba(224,85,63,0.14); color: #E0553F; }
        .btn-restore { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .btn-delete { background: none; color: #E0553F; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Rəylər</h1>
      {loading ? <p>Yüklənir...</p> : reviews.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>Rəy yoxdur.</p>
      ) : (
        <div className="admin-reviews-list">
          {reviews.map((r) => (
            <div className="admin-review-card" key={r.id}>
              <div className="admin-review-head">
                <div>
                  <div className="admin-review-title">{r.listing?.title?.en || r.listing?.title?.az}</div>
                  <span className="admin-review-rating">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  {" "}<span className={`status-pill ${r.status}`}>{REVIEW_STATUS_LABEL[r.status] || r.status}</span>
                </div>
              </div>
              <p className="admin-review-text">{r.text}</p>
              {r.host_reply && <p className="admin-review-text"><strong>Host cavabı:</strong> {r.host_reply}</p>}
              <div className="admin-review-actions">
                {r.status !== "flagged" && <button className="btn-flag" onClick={() => setStatus(r.id, "flagged")}>Bildir</button>}
                {r.status !== "hidden" && <button className="btn-hide" onClick={() => setStatus(r.id, "hidden")}>Gizlət</button>}
                {r.status !== "published" && <button className="btn-restore" onClick={() => setStatus(r.id, "published")}>Bərpa et</button>}
                <button className="btn-delete" onClick={() => remove(r.id)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
