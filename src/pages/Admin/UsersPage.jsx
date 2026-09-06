import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { tryGrantFounderStatus } from "../../lib/founder";
import { approveAgentRequest, rejectAgentRequest } from "../../lib/regionalPartner";

const ROLE_LABELS = { admin: "Admin", host: "Host", regional_partner: "Regional Partnyor" };
const AGENT_STATUS_LABELS = { none: "—", pending: "Gözləyir", approved: "Təsdiqlənib", rejected: "Rədd edilib" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [actingAgentId, setActingAgentId] = useState(null);
  const [hostTypeFilter, setHostTypeFilter] = useState("all");
  const [agentStatusFilter, setAgentStatusFilter] = useState("all");

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

  const filteredUsers = users
    .filter((u) => hostTypeFilter === "all" || (u.host_type || "owner") === hostTypeFilter)
    .filter((u) => agentStatusFilter === "all" || (u.agent_status || "none") === agentStatusFilter);

  // Same RPCs the Regional Partner panel uses (supabase/030_agent_status_approval.sql)
  // — admin is authorized for every region, not just one, but the underlying
  // agent_status write path is identical either way.
  const approveAgent = async (id) => {
    setActingAgentId(id);
    try {
      await approveAgentRequest(id);
      load();
    } catch (err) {
      window.alert(err.message || "Failed to approve agent request.");
    } finally {
      setActingAgentId(null);
    }
  };

  const rejectAgent = async (id) => {
    setActingAgentId(id);
    try {
      await rejectAgentRequest(id);
      load();
    } catch (err) {
      window.alert(err.message || "Failed to reject agent request.");
    } finally {
      setActingAgentId(null);
    }
  };

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
      window.alert(err.message || "E-poçt təsdiqlənmədi — yenidən cəhd edin.");
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
        .agent-status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .agent-status-pill.none { background: var(--bg-soft); color: var(--text-soft); }
        .agent-status-pill.pending { background: rgba(255,180,0,0.16); color: #B87700; }
        .agent-status-pill.approved { background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange); }
        .agent-status-pill.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
        .admin-users-filter { margin-bottom: 16px; font-size: 13px; display: flex; gap: 20px; }
        .admin-users-filter select { padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; }
        .agent-action-btns { display: flex; gap: 6px; }
        .agent-action-btns button { border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .agent-action-btns .approve { background: var(--izigo-green); color: #fff; }
        .agent-action-btns .reject { background: #F1F1F1; color: #333; }
        .agent-action-btns button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>İstifadəçilər</h1>
      <div className="admin-users-filter">
        <div>
          <label>Host tipi: </label>
          <select value={hostTypeFilter} onChange={(e) => setHostTypeFilter(e.target.value)}>
            <option value="all">Hamısı</option>
            <option value="owner">Sahib</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <div>
          <label>Vasitəçi statusu: </label>
          <select value={agentStatusFilter} onChange={(e) => setAgentStatusFilter(e.target.value)}>
            <option value="all">Hamısı</option>
            <option value="pending">Gözləyir</option>
            <option value="approved">Təsdiqlənib</option>
            <option value="rejected">Rədd edilib</option>
            <option value="none">Müraciət etməyib</option>
          </select>
        </div>
      </div>
      {loading ? <p>Yüklənir...</p> : filteredUsers.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>İstifadəçi yoxdur.</p>
      ) : (
        <table className="admin-users-table">
          <thead>
            <tr><th>Ad</th><th>Telefon</th><th>Rol</th><th>Host Tipi</th><th>Vasitəçi statusu</th><th>Elanlar</th><th>Təsdiqlənib</th><th>Founder</th><th>Qoşulub</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name || "—"}</td>
                <td>{u.phone || "—"}</td>
                <td><span className={`role-pill ${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                <td><span className={`host-type-pill ${u.host_type || "owner"}`}>{u.host_type === "agent" ? "Agent" : "Sahib"}</span></td>
                <td>
                  <span className={`agent-status-pill ${u.agent_status || "none"}`}>{AGENT_STATUS_LABELS[u.agent_status || "none"]}</span>
                  {u.agent_status === "pending" && (
                    <div className="agent-action-btns" style={{ marginTop: 4 }}>
                      <button className="approve" disabled={actingAgentId === u.id} onClick={() => approveAgent(u.id)}>Təsdiqlə</button>
                      <button className="reject" disabled={actingAgentId === u.id} onClick={() => rejectAgent(u.id)}>Rədd et</button>
                    </div>
                  )}
                </td>
                <td>{u.listingCount}</td>
                <td>
                  <button className="toggle" onClick={() => toggleVerified(u.id, u.verified)}>
                    <span className={`verified-pill ${u.verified ? "yes" : "no"}`}>{u.verified ? "Təsdiqlənib" : "Təsdiqlənməyib"}</span>
                  </button>
                </td>
                <td>{u.founder_host ? <span className="founder-pill">🏅 Founder</span> : "—"}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td><button className="toggle" onClick={() => toggleRole(u.id, u.role)}>{u.role === "admin" ? "Admin rolunu ləğv et" : "Admin et"}</button></td>
                <td>
                  <button className="toggle" disabled={confirmingId === u.id} onClick={() => confirmEmail(u.id)}>
                    {confirmingId === u.id ? "..." : "E-poçtu təsdiqlə"}
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
