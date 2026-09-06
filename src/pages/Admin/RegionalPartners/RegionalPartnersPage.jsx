import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { ALL_DESTINATIONS } from "../../../data/azerbaijanDestinations";
import { fetchAllPartners, assignRegionalPartner, updatePartner } from "../../../lib/regionalPartner";

// Assigning a Regional Partner touches two things together: the
// regional_partners row (region + revenue share) and profiles.role — both
// are needed for RequireRegionalPartner + the RLS policies in
// supabase/023_regional_partners.sql to actually grant access. The dropdown
// below already excludes admins as a first line of defense, but the real
// protection is server-side: assignRegionalPartner() refuses outright (and
// a profiles trigger backs it up) if the target user is an admin — see
// supabase/025_regional_partner_admin_protection.sql.
const PARTNER_STATUS_LABELS = { active: "Aktiv", inactive: "Qeyri-aktiv" };

export default function RegionalPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("");
  const [region, setRegion] = useState("Gabala");
  const [sharePercent, setSharePercent] = useState("20");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [partnerRows, { data: profiles }] = await Promise.all([
      fetchAllPartners(),
      supabase.from("profiles").select("id, full_name, role").in("role", ["host", "regional_partner"]).order("full_name"),
    ]);
    setPartners(partnerRows);
    setCandidates(profiles || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!userId || !region) return;
    setSaving(true);
    setError("");
    try {
      await assignRegionalPartner(userId, region, Number(sharePercent) || 0);
      setShowForm(false);
      setUserId("");
      setSharePercent("20");
      load();
    } catch (err) {
      setError(err.message || "Regional partnyoru yaratmaq mümkün olmadı.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p) => {
    await updatePartner(p.id, { status: p.status === "active" ? "inactive" : "active" });
    load();
  };

  return (
    <div>
      <style>{`
        .rp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 24px; }
        .rp-table th, .rp-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .rp-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .status-pill.active { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.inactive { background: var(--bg-soft); color: var(--text-soft); }
        .rp-table button.toggle { border: none; background: none; color: var(--izigo-green); font-weight: 700; cursor: pointer; font-size: 12.5px; }
        .rp-new-btn { border: none; background: var(--izigo-green); color: #fff; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-size: 13.5px; cursor: pointer; margin-bottom: 20px; }
        .rp-form { border: 1px solid var(--border); border-radius: 14px; padding: 20px; max-width: 420px; margin-bottom: 24px; }
        .rp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .rp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .rp-field input, .rp-field select { border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13.5px; font-family: var(--sans); }
        .rp-save-btn { border: none; background: var(--izigo-orange); color: #fff; border-radius: 8px; padding: 9px 18px; font-weight: 700; font-size: 13.5px; cursor: pointer; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Regional Partnyorlar</h1>

      <button className="rp-new-btn" onClick={() => setShowForm((v) => !v)}>{showForm ? "Ləğv et" : "+ Yeni partnyor təyin et"}</button>

      {showForm && (
        <form className="rp-form" onSubmit={submit}>
          <div className="rp-field">
            <label>İstifadəçi</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
              <option value="">İstifadəçi seçin</option>
              {candidates.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.id}</option>)}
            </select>
          </div>
          <div className="rp-field">
            <label>Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {ALL_DESTINATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="rp-field">
            <label>Gəlir payı (%)</label>
            <input type="number" min="0" max="100" value={sharePercent} onChange={(e) => setSharePercent(e.target.value)} />
          </div>
          {error && <p style={{ color: "#E0553F", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="rp-save-btn" type="submit" disabled={saving}>{saving ? "Yadda saxlanılır..." : "Partnyor təyin et"}</button>
        </form>
      )}

      {loading ? <p>Yüklənir...</p> : partners.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>Hələ regional partnyor yoxdur.</p>
      ) : (
        <table className="rp-table">
          <thead>
            <tr><th>İstifadəçi</th><th>Region</th><th>Gəlir Payı</th><th>Status</th><th>Təyin edilib</th><th></th></tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td>{p.profile?.full_name || p.user_id}</td>
                <td>{p.region}</td>
                <td>{p.revenue_share_percent}%</td>
                <td><span className={`status-pill ${p.status}`}>{PARTNER_STATUS_LABELS[p.status] || p.status}</span></td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td><button className="toggle" onClick={() => toggleStatus(p)}>{p.status === "active" ? "Deaktiv et" : "Aktiv et"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
