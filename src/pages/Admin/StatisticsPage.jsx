import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const CATEGORIES = ["villa", "car", "transfer", "event", "service"];
const STATUSES = ["pending", "approved", "rejected"];

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      Promise.all(CATEGORIES.map((c) =>
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("category", c).then((r) => [c, r.count || 0])
      )),
      Promise.all(STATUSES.map((s) =>
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", s).then((r) => [s, r.count || 0])
      )),
      supabase.from("reviews").select("rating"),
    ]).then(([byCategory, byStatus, { data: ratings }]) => {
      const ratingValues = (ratings || []).map((r) => r.rating);
      const avgRating = ratingValues.length ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1) : "—";
      setStats({
        byCategory: Object.fromEntries(byCategory),
        byStatus: Object.fromEntries(byStatus),
        totalReviews: ratingValues.length,
        avgRating,
      });
    });
  }, []);

  return (
    <div>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .stats-card { border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
        .stats-card h3 { font-size: 14px; font-weight: 800; margin: 0 0 14px; }
        .stats-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13.5px; text-transform: capitalize; }
        .stats-row:last-child { border-bottom: none; }
        .stats-row strong { font-size: 15px; }
        .stats-kpi { font-size: 30px; font-weight: 800; }
        .stats-kpi-label { font-size: 13px; color: var(--text-soft); margin-top: 4px; }
        @media (max-width: 900px) { .stats-grid { grid-template-columns: 1fr; } }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Statistics</h1>
      {!stats ? <p>Loading...</p> : (
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Listings by category</h3>
            {CATEGORIES.map((c) => (
              <div className="stats-row" key={c}><span>{c}</span><strong>{stats.byCategory[c]}</strong></div>
            ))}
          </div>
          <div className="stats-card">
            <h3>Listings by status</h3>
            {STATUSES.map((s) => (
              <div className="stats-row" key={s}><span>{s}</span><strong>{stats.byStatus[s]}</strong></div>
            ))}
          </div>
          <div className="stats-card">
            <div className="stats-kpi">{stats.totalReviews}</div>
            <div className="stats-kpi-label">Total reviews</div>
          </div>
          <div className="stats-card">
            <div className="stats-kpi">{stats.avgRating}</div>
            <div className="stats-kpi-label">Average rating</div>
          </div>
        </div>
      )}
    </div>
  );
}
