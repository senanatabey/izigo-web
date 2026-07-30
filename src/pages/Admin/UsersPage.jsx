import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("listings").select("host_id"),
    ]).then(([{ data: profiles }, { data: listings }]) => {
      const counts = {};
      (listings || []).forEach((l) => { counts[l.host_id] = (counts[l.host_id] || 0) + 1; });
      setUsers((profiles || []).map((u) => ({ ...u, listingCount: counts[u.id] || 0 })));
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleRole = async (id, currentRole) => {
    const nextRole = currentRole === "admin" ? "host" : "admin";
    if (!window.confirm(`${nextRole === "admin" ? "Admin et" : "Admin rolunu ləğv et"}?`)) return;
    await supabase.from("profiles").update({ role: nextRole }).eq("id", id);
    load();
  };

  return (
    <div>
      <style>{`
        .admin-users-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .admin-users-table th, .admin-users-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .admin-users-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .role-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .role-pill.admin { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .role-pill.host { background: var(--bg-soft); color: var(--text-soft); }
        .admin-users-table button.toggle { border: none; background: none; color: var(--izigo-green); font-weight: 700; cursor: pointer; font-size: 12.5px; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Users</h1>
      {loading ? <p>Loading...</p> : users.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No users.</p>
      ) : (
        <table className="admin-users-table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Role</th><th>Listings</th><th>Joined</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name || "—"}</td>
                <td>{u.phone || "—"}</td>
                <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                <td>{u.listingCount}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td><button className="toggle" onClick={() => toggleRole(u.id, u.role)}>{u.role === "admin" ? "Revoke admin" : "Make admin"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
