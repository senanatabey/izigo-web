import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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
    await supabase.from("reviews").update({ status }).eq("id", id);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Bu rəyi silmək istədiyinizə əminsiniz?")) return;
    await supabase.from("reviews").delete().eq("id", id);
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
        .btn-flag { background: rgba(255,180,0,0.16); color: #B87700; }
        .btn-hide { background: rgba(224,85,63,0.14); color: #E0553F; }
        .btn-restore { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .btn-delete { background: none; color: #E0553F; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Reviews</h1>
      {loading ? <p>Loading...</p> : reviews.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No reviews.</p>
      ) : (
        <div className="admin-reviews-list">
          {reviews.map((r) => (
            <div className="admin-review-card" key={r.id}>
              <div className="admin-review-head">
                <div>
                  <div className="admin-review-title">{r.listing?.title?.en || r.listing?.title?.az}</div>
                  <span className="admin-review-rating">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  {" "}<span className={`status-pill ${r.status}`}>{r.status}</span>
                </div>
              </div>
              <p className="admin-review-text">{r.text}</p>
              {r.host_reply && <p className="admin-review-text"><strong>Host reply:</strong> {r.host_reply}</p>}
              <div className="admin-review-actions">
                {r.status !== "flagged" && <button className="btn-flag" onClick={() => setStatus(r.id, "flagged")}>Flag</button>}
                {r.status !== "hidden" && <button className="btn-hide" onClick={() => setStatus(r.id, "hidden")}>Hide</button>}
                {r.status !== "published" && <button className="btn-restore" onClick={() => setStatus(r.id, "published")}>Restore</button>}
                <button className="btn-delete" onClick={() => remove(r.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
