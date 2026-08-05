import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { fetchFounderCampaign, fetchFounderCount, updateFounderCampaign } from "../../lib/founder";

export default function FounderCampaignPage() {
  const [campaign, setCampaign] = useState(null);
  const [count, setCount] = useState(0);
  const [maxInput, setMaxInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([fetchFounderCampaign(), fetchFounderCount()]).then(([c, n]) => {
      setCampaign(c);
      setMaxInput(String(c.max_founder_hosts));
      setCount(n);
    });
  };

  useEffect(load, []);

  const toggleStatus = async () => {
    await updateFounderCampaign({ status: campaign.status === "active" ? "inactive" : "active" });
    load();
  };

  const saveMax = async () => {
    const max = Number(maxInput);
    if (!max || max < count) return;
    setSaving(true);
    await updateFounderCampaign({ max_founder_hosts: max });
    setSaving(false);
    load();
  };

  if (!campaign) return <p>Loading...</p>;

  const percent = Math.min(100, Math.round((count / campaign.max_founder_hosts) * 100));

  return (
    <div className="founder-campaign-page">
      <style>{`
        .founder-campaign-page { max-width: 640px; }
        .fc-card { border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 20px; background: #fff; }
        .fc-card h2 { font-size: 15px; font-weight: 800; margin: 0 0 16px; }
        .fc-status-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .fc-status-pill { font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; }
        .fc-status-pill.active { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .fc-status-pill.inactive { background: rgba(0,0,0,0.08); color: var(--text-soft); }
        .fc-toggle-btn {
          border: 1px solid var(--border); background: #fff; border-radius: 8px; padding: 8px 16px;
          font-weight: 700; font-size: 13px; cursor: pointer;
        }
        .fc-progress-label { display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 700; margin-bottom: 8px; }
        .fc-progress-bar { height: 10px; border-radius: 999px; background: var(--bg-soft); overflow: hidden; margin-bottom: 4px; }
        .fc-progress-fill { height: 100%; background: var(--izigo-green); border-radius: 999px; transition: width 0.2s ease; }
        .fc-max-row { display: flex; align-items: center; gap: 10px; margin-top: 20px; }
        .fc-max-row label { font-size: 12.5px; font-weight: 700; color: var(--text-soft); }
        .fc-max-row input {
          border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13.5px; width: 100px;
        }
        .fc-max-row button {
          background: var(--izigo-green); color: #fff; border: none; border-radius: 8px; padding: 8px 16px;
          font-weight: 700; font-size: 13px; cursor: pointer;
        }
        .fc-note { font-size: 12px; color: var(--text-soft); margin-top: 14px; line-height: 1.5; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}><Trophy size={20} style={{ verticalAlign: "-4px", marginRight: 8 }} />Founder Campaign</h1>

      <div className="fc-card">
        <div className="fc-status-row">
          <h2 style={{ margin: 0 }}>Status</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className={`fc-status-pill ${campaign.status}`}>{campaign.status}</span>
            <button className="fc-toggle-btn" onClick={toggleStatus}>
              {campaign.status === "active" ? "Disable campaign" : "Enable campaign"}
            </button>
          </div>
        </div>

        <div className="fc-progress-label">
          <span>Current Founder Hosts</span>
          <span>{count} / {campaign.max_founder_hosts}</span>
        </div>
        <div className="fc-progress-bar"><div className="fc-progress-fill" style={{ width: `${percent}%` }} /></div>

        <div className="fc-max-row">
          <label>Maximum Founder Hosts</label>
          <input type="number" min={count} value={maxInput} onChange={(e) => setMaxInput(e.target.value)} />
          <button onClick={saveMax} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>

        <p className="fc-note">
          Only VERIFIED hosts with an approved listing count toward this cap, each host counts once.
          The campaign automatically switches to Inactive the moment the cap is reached — existing
          Founder Hosts keep their benefits regardless of campaign status.
        </p>
      </div>
    </div>
  );
}
