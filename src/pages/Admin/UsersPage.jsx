import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { tryGrantFounderStatus } from "../../lib/founder";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [hostTypeFilter, setHostTypeFilter] = useState("all");

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

  const filteredUsers = hostTypeFilter === "all" ? users : users.filter((u) => (u.host_type || "owner") === hostTypeFilter);

  const toggleRole = async (id, currentRole) => {
    const nextRole = currentRole === "admin" ? "host" : "admin";
    if (!window.confirm(`${nextRole === "admin" ? "Admin et" : "Admin rolunu ləğv et"}?`)) return;
    await supabase.from("profiles").update({ role: nextRole }).eq("id", id);
    load();
  };

  const toggleVerified = async (id, currentlyVerified) => {
    await supabase.from("profiles").update({ verified: !currentlyVerified }).eq("id", id);
    if (!currentlyVerified) await tryGrantFounderStatus(id);
    load();
  };

  // Requires the confirm-user-email edge function to be deployed (it needs
  // the service_role key, which never touches the browser — see
  // supabase/functions/confirm-user-email/index.ts for why this can't just
  // be a direct table update).
  const confirmEmail = async (id) => {
    if (!window.confirm("Bu istifadəçinin e-poçtunu təsdiqlənmiş kimi işarələmək istəyirsiniz?")) return;
    setConfirmingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-user-email", { body: { user_id: id } });
      if (error || data?.error) throw new Error(data?.error || error.message);
      window.alert("E-poçt təsdiqləndi.");
    } catch (err) {
      window.alert(err.message || "Failed to confirm email — please try again.");
    } finally {
      setConfirmingId(null);
    }
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
        .verified-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .verified-pill.yes { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .verified-pill.no { background: var(--bg-soft); color: var(--text-soft); }
        .founder-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: rgba(255,180,0,0.16); color: #B87700; }
        .host-type-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .host-type-pill.owner { background: var(--bg-soft); color: var(--text-soft); }
        .host-type-pill.agent { background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange); }
        .admin-users-filter { margin-bottom: 16px; font-size: 13px; }
        .admin-users-filter select { padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Users</h1>
      <div className="admin-users-filter">
        <label>Host type: </label>
        <select value={hostTypeFilter} onChange={(e) => setHostTypeFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="owner">Owner</option>
          <option value="agent">Agent</option>
        </select>
      </div>
      {loading ? <p>Loading...</p> : filteredUsers.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No users.</p>
      ) : (
        <table className="admin-users-table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Role</th><th>Host Type</th><th>Listings</th><th>Verified</th><th>Founder</th><th>Joined</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name || "—"}</td>
                <td>{u.phone || "—"}</td>
                <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                <td><span className={`host-type-pill ${u.host_type || "owner"}`}>{u.host_type === "agent" ? "Agent" : "Owner"}</span></td>
                <td>{u.listingCount}</td>
                <td>
                  <button className="toggle" onClick={() => toggleVerified(u.id, u.verified)}>
                    <span className={`verified-pill ${u.verified ? "yes" : "no"}`}>{u.verified ? "Verified" : "Not verified"}</span>
                  </button>
                </td>
                <td>{u.founder_host ? <span className="founder-pill">🏅 Founder</span> : "—"}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td><button className="toggle" onClick={() => toggleRole(u.id, u.role)}>{u.role === "admin" ? "Revoke admin" : "Make admin"}</button></td>
                <td>
                  <button className="toggle" disabled={confirmingId === u.id} onClick={() => confirmEmail(u.id)}>
                    {confirmingId === u.id ? "..." : "Confirm email"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
