import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function PendingApprovalsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }) => setListings(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setStatus = async (id, status) => {
    await supabase.from("listings").update({ status }).eq("id", id);
    load();
  };

  return (
    <div>
      <style>{`
        .pending-list { display: flex; flex-direction: column; gap: 14px; }
        .pending-card { border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
        .pending-card h3 { margin: 0 0 6px; font-size: 16px; }
        .pending-card p { margin: 0 0 10px; font-size: 13px; color: var(--text-soft); }
        .pending-actions { display: flex; gap: 10px; }
        .pending-actions button {
          border-radius: 8px; padding: 8px 16px; font-weight: 700; font-size: 13px; cursor: pointer; border: none;
        }
        .btn-approve { background: var(--izigo-green); color: #fff; }
        .btn-reject { background: #F1F1F1; color: #333; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Pending approvals</h1>
      {loading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No pending listings.</p>
      ) : (
        <div className="pending-list">
          {listings.map((l) => (
            <div className="pending-card" key={l.id}>
              <h3>{l.title?.en || l.title?.az} — {l.category}</h3>
              <p>{l.city} · {l.price} AZN · submitted {new Date(l.created_at).toLocaleDateString()}</p>
              <div className="pending-actions">
                <button className="btn-approve" onClick={() => setStatus(l.id, "approved")}>Approve</button>
                <button className="btn-reject" onClick={() => setStatus(l.id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
