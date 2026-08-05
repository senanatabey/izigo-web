import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home as HomeIcon, ClipboardList, Users, CheckCircle2, Sparkles, PlusCircle,
  FileClock, UserPlus, Star, CheckCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const QUICK_ACTIONS = [
  { label: "Approve listings", to: "/admin/listings/pending", icon: ClipboardList },
  { label: "Create hero campaign", to: "/admin/hero", icon: Sparkles },
  { label: "Add listing", to: "/add-listing", icon: PlusCircle },
  { label: "View users", to: "/admin/users", icon: Users },
];

const ACTIVITY_ICONS = {
  submitted: FileClock,
  approved: CheckCircle,
  user: UserPlus,
  review: Star,
};

const ACTIVITY_LABELS = {
  submitted: (a) => `New listing submitted: "${a.title}"`,
  approved: (a) => `Listing approved: "${a.title}"`,
  user: (a) => `New user registered: ${a.title}`,
  review: (a) => `Review received (${a.rating}★)`,
};

async function fetchRecentActivity() {
  const [submitted, approved, users, reviews] = await Promise.all([
    supabase.from("listings").select("id, title, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(4),
    supabase.from("listings").select("id, title, created_at").eq("status", "approved").order("created_at", { ascending: false }).limit(4),
    supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("reviews").select("id, rating, created_at").order("created_at", { ascending: false }).limit(4),
  ]);

  const items = [
    ...(submitted.data || []).map((l) => ({ type: "submitted", id: `s-${l.id}`, title: l.title?.en || l.title?.az, at: l.created_at })),
    ...(approved.data || []).map((l) => ({ type: "approved", id: `a-${l.id}`, title: l.title?.en || l.title?.az, at: l.created_at })),
    ...(users.data || []).map((u) => ({ type: "user", id: `u-${u.id}`, title: u.full_name, at: u.created_at })),
    ...(reviews.data || []).map((r) => ({ type: "review", id: `r-${r.id}`, rating: r.rating, at: r.created_at })),
  ];

  return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);

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

    fetchRecentActivity().then(setActivity);
  }, []);

  const cards = stats ? [
    { label: "Total listings", value: stats.total, icon: HomeIcon, to: "/admin/listings" },
    { label: "Pending approval", value: stats.pending, icon: ClipboardList, to: "/admin/listings/pending", priority: stats.pending > 0 },
    { label: "Approved listings", value: stats.approved, icon: CheckCircle2, to: "/admin/listings" },
    { label: "Registered users", value: stats.users, icon: Users, to: "/admin/users" },
  ] : [];

  return (
    <div>
      <style>{`
        .admin-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .admin-kpi-card {
          border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 10px;
          background: var(--bg); cursor: pointer; position: relative;
          transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
        }
        .admin-kpi-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .admin-kpi-card svg { color: var(--izigo-green); }
        .admin-kpi-value { font-size: 26px; font-weight: 800; }
        .admin-kpi-label { font-size: 13px; color: var(--text-soft); }
        .admin-kpi-card.priority { border-color: var(--izigo-orange); background: rgba(255, 122, 0, 0.05); }
        .admin-kpi-card.priority svg { color: var(--izigo-orange); }
        .admin-kpi-badge {
          position: absolute; top: 14px; right: 14px; background: var(--izigo-orange); color: #fff;
          font-size: 11px; font-weight: 800; border-radius: 999px; padding: 2px 8px;
        }
        @media (max-width: 900px) { .admin-kpi-grid { grid-template-columns: repeat(2, 1fr); } }

        .admin-section-title { font-size: 15px; font-weight: 800; margin: 32px 0 12px; }
        .admin-quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .admin-quick-action {
          display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 12px;
          padding: 14px 16px; font-size: 13.5px; font-weight: 700; color: var(--text); background: var(--bg);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .admin-quick-action:hover { border-color: var(--izigo-green); background: rgba(0, 200, 151, 0.06); }
        .admin-quick-action svg { color: var(--izigo-green); flex-shrink: 0; }
        @media (max-width: 900px) { .admin-quick-actions { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .admin-quick-actions { grid-template-columns: 1fr; } }

        .admin-activity-card { border: 1px solid var(--border); border-radius: 14px; padding: 8px 20px; }
        .admin-activity-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; font-size: 13.5px; }
        .admin-activity-row + .admin-activity-row { border-top: 1px solid var(--border); }
        .admin-activity-icon {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; background: var(--bg-soft); color: var(--text-soft);
        }
        .admin-activity-text { flex: 1; color: var(--text); }
        .admin-activity-time { font-size: 12px; color: var(--text-soft); white-space: nowrap; }
        .admin-activity-empty { padding: 20px 0; font-size: 13.5px; color: var(--text-soft); text-align: center; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Dashboard</h1>

      {!stats ? <p>Loading...</p> : (
        <div className="admin-kpi-grid">
          {cards.map(({ label, value, icon: Icon, to, priority }) => (
            <Link to={to} className={`admin-kpi-card${priority ? " priority" : ""}`} key={label}>
              {priority && <span className="admin-kpi-badge">{value}</span>}
              <Icon size={20} />
              <div className="admin-kpi-value">{value}</div>
              <div className="admin-kpi-label">{label}</div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="admin-section-title">Quick actions</h2>
      <div className="admin-quick-actions">
        {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
          <Link key={label} to={to} className="admin-quick-action">
            <Icon size={17} />{label}
          </Link>
        ))}
      </div>

      <h2 className="admin-section-title">Recent activity</h2>
      <div className="admin-activity-card">
        {activity === null ? (
          <p className="admin-activity-empty">Loading...</p>
        ) : activity.length === 0 ? (
          <p className="admin-activity-empty">No recent activity.</p>
        ) : (
          activity.map((a) => {
            const Icon = ACTIVITY_ICONS[a.type];
            return (
              <div className="admin-activity-row" key={a.id}>
                <span className="admin-activity-icon"><Icon size={15} /></span>
                <span className="admin-activity-text">{ACTIVITY_LABELS[a.type](a)}</span>
                <span className="admin-activity-time">{new Date(a.at).toLocaleDateString()}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
