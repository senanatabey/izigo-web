import { useEffect, useState } from "react";
import { ALL_DESTINATIONS } from "../../../data/azerbaijanDestinations";
import { fetchAllAdCampaigns, createAdCampaign, updateAdCampaign, deleteAdCampaign } from "../../../lib/regionalPartner";

const STATUSES = ["active", "completed", "cancelled"];

// Internal revenue bookkeeping only — this is not a payment processor. Admin
// records what a region's ad inventory earned; the Regional Partner
// dashboard's revenue view reads from these rows.
export default function AdCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("Gabala");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [grossRevenue, setGrossRevenue] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllAdCampaigns().then(setCampaigns).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!title || !region || !grossRevenue) return;
    setSaving(true);
    setError("");
    try {
      await createAdCampaign({
        region,
        title: { en: title, az: title },
        period_start: periodStart || null,
        period_end: periodEnd || null,
        gross_revenue: Number(grossRevenue) || 0,
        status,
      });
      setShowForm(false);
      setTitle(""); setPeriodStart(""); setPeriodEnd(""); setGrossRevenue(""); setStatus("active");
      load();
    } catch (err) {
      setError(err.message || "Failed to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  const setCampaignStatus = async (c, next) => {
    await updateAdCampaign(c.id, { status: next });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this ad campaign?")) return;
    await deleteAdCampaign(id);
    load();
  };

  return (
    <div>
      <style>{`
        .ac-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 24px; }
        .ac-table th, .ac-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .ac-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .status-pill.active { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.completed { background: var(--bg-soft); color: var(--text-soft); }
        .status-pill.cancelled { background: rgba(224,85,63,0.14); color: #E0553F; }
        .ac-table select.inline { border: 1px solid var(--border); border-radius: 6px; padding: 3px 6px; font-size: 12px; }
        .ac-table button.delete { border: none; background: none; color: #E0553F; font-weight: 700; cursor: pointer; font-size: 12.5px; }
        .ac-new-btn { border: none; background: var(--izigo-green); color: #fff; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-size: 13.5px; cursor: pointer; margin-bottom: 20px; }
        .ac-form { border: 1px solid var(--border); border-radius: 14px; padding: 20px; max-width: 460px; margin-bottom: 24px; }
        .ac-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .ac-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .ac-field input, .ac-field select { border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13.5px; font-family: var(--sans); }
        .ac-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ac-save-btn { border: none; background: var(--izigo-orange); color: #fff; border-radius: 8px; padding: 9px 18px; font-weight: 700; font-size: 13.5px; cursor: pointer; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Ad Campaigns</h1>

      <button className="ac-new-btn" onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New ad campaign"}</button>

      {showForm && (
        <form className="ac-form" onSubmit={submit}>
          <div className="ac-field">
            <label>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="ac-field">
            <label>Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {ALL_DESTINATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="ac-row">
            <div className="ac-field">
              <label>Period start</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="ac-field">
              <label>Period end</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div className="ac-field">
            <label>Gross revenue (AZN)</label>
            <input type="number" min="0" value={grossRevenue} onChange={(e) => setGrossRevenue(e.target.value)} required />
          </div>
          <div className="ac-field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <p style={{ color: "#E0553F", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="ac-save-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save campaign"}</button>
        </form>
      )}

      {loading ? <p>Loading...</p> : campaigns.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>No ad campaigns yet.</p>
      ) : (
        <table className="ac-table">
          <thead>
            <tr><th>Title</th><th>Region</th><th>Period</th><th>Gross Revenue</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.title?.en || c.title?.az}</td>
                <td>{c.region}</td>
                <td>{c.period_start || "—"} → {c.period_end || "—"}</td>
                <td>{c.gross_revenue} AZN</td>
                <td>
                  <select className="inline" value={c.status} onChange={(e) => setCampaignStatus(c, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="delete" onClick={() => remove(c.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
