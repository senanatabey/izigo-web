import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home as HomeIcon, ClipboardList, Users, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]).then(([total, pending, approved, users]) => setStats({
      total: total.count || 0,
      pending: pending.count || 0,
      approved: approved.count || 0,
      users: users.count || 0,
    }));
  }, []);

  const cards = stats ? [
    { label: "Total listings", value: stats.total, icon: HomeIcon, to: "/admin/listings" },
    { label: "Pending approval", value: stats.pending, icon: ClipboardList, to: "/admin/listings/pending" },
    { label: "Approved listings", value: stats.approved, icon: CheckCircle2, to: "/admin/listings" },
    { label: "Registered users", value: stats.users, icon: Users, to: "/admin/users" },
  ] : [];

  return (
    <div>
      <style>{`
        .admin-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .admin-kpi-card {
          border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 10px;
        }
        .admin-kpi-card svg { color: var(--izigo-green); }
        .admin-kpi-value { font-size: 26px; font-weight: 800; }
        .admin-kpi-label { font-size: 13px; color: var(--text-soft); }
        @media (max-width: 900px) { .admin-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Dashboard</h1>
      {!stats ? <p>Loading...</p> : (
        <div className="admin-kpi-grid">
          {cards.map(({ label, value, icon: Icon, to }) => (
            <Link to={to} className="admin-kpi-card" key={label}>
              <Icon size={20} />
              <div className="admin-kpi-value">{value}</div>
              <div className="admin-kpi-label">{label}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
