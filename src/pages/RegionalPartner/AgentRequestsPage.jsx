import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  fetchMyPartnerProfile, fetchAgentRequests, fetchListingCountsByHost,
  approveAgentRequest, rejectAgentRequest,
} from "../../lib/regionalPartner";

export default function AgentRequestsPage() {
  const { t } = useLanguage();
  const [region, setRegion] = useState(null);
  const [requests, setRequests] = useState([]);
  const [listingCounts, setListingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const partner = await fetchMyPartnerProfile();
    if (!partner) {
      setLoading(false);
      return;
    }
    setRegion(partner.region);
    const rows = await fetchAgentRequests(partner.region);
    setRequests(rows);
    setListingCounts(await fetchListingCountsByHost(rows.map((r) => r.id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (row) => {
    if (!window.confirm(t("regionalPartner.agentApproveConfirm"))) return;
    setActingId(row.id);
    try {
      await approveAgentRequest(row.id);
      await load();
    } catch (err) {
      window.alert(err.message || "Failed to approve.");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (row) => {
    if (!window.confirm(t("regionalPartner.agentRejectConfirm"))) return;
    setActingId(row.id);
    try {
      await rejectAgentRequest(row.id);
      await load();
    } catch (err) {
      window.alert(err.message || "Failed to reject.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <style>{`
        .agent-requests-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .agent-requests-table th, .agent-requests-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .agent-requests-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .agent-requests-actions { display: flex; gap: 8px; }
        .agent-requests-actions button {
          border-radius: 8px; padding: 8px 14px; font-weight: 700; font-size: 12.5px; cursor: pointer; border: none;
        }
        .btn-approve { background: var(--izigo-green); color: #fff; }
        .btn-reject { background: #F1F1F1; color: #333; }
        .agent-requests-actions button:disabled { opacity: 0.5; cursor: not-allowed; }

        .agent-requests-cards { display: none; flex-direction: column; gap: 14px; }
        .agent-request-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
        .agent-request-card .arc-name { font-size: 15px; font-weight: 800; margin-bottom: 8px; }
        .agent-request-card .arc-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-soft); padding: 4px 0; }
        .agent-request-card .arc-row span:last-child { color: var(--text); font-weight: 600; }
        .agent-request-card .agent-requests-actions { margin-top: 12px; }
        .agent-request-card .agent-requests-actions button { flex: 1; min-height: 44px; }

        @media (max-width: 720px) {
          .agent-requests-table { display: none; }
          .agent-requests-cards { display: flex; }
        }
      `}</style>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t("regionalPartner.agentRequestsHeading")}</h1>
      {region && <p style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 20 }}>{t("regionalPartner.regionLabel")}: {region}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>{t("regionalPartner.noAgentRequests")}</p>
      ) : (
        <>
          <table className="agent-requests-table">
            <thead>
              <tr>
                <th>{t("regionalPartner.agentRequestName")}</th>
                <th>{t("regionalPartner.agentRequestJoined")}</th>
                <th>{t("regionalPartner.agentRequestAgency")}</th>
                <th>{t("regionalPartner.agentRequestClaimedCount")}</th>
                <th>{t("regionalPartner.agentRequestRealCount")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name || "—"}</td>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td>{row.agency_name || "—"}</td>
                  <td>{row.managed_properties_count ?? "—"}</td>
                  <td>{listingCounts[row.id] || 0}</td>
                  <td>
                    <div className="agent-requests-actions">
                      <button className="btn-approve" disabled={actingId === row.id} onClick={() => approve(row)}>{t("regionalPartner.approve")}</button>
                      <button className="btn-reject" disabled={actingId === row.id} onClick={() => reject(row)}>{t("regionalPartner.reject")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="agent-requests-cards">
            {requests.map((row) => (
              <div className="agent-request-card" key={row.id}>
                <div className="arc-name">{row.full_name || "—"}</div>
                <div className="arc-row"><span>{t("regionalPartner.agentRequestJoined")}</span><span>{new Date(row.created_at).toLocaleDateString()}</span></div>
                <div className="arc-row"><span>{t("regionalPartner.agentRequestAgency")}</span><span>{row.agency_name || "—"}</span></div>
                <div className="arc-row"><span>{t("regionalPartner.agentRequestClaimedCount")}</span><span>{row.managed_properties_count ?? "—"}</span></div>
                <div className="arc-row"><span>{t("regionalPartner.agentRequestRealCount")}</span><span>{listingCounts[row.id] || 0}</span></div>
                <div className="agent-requests-actions">
                  <button className="btn-approve" disabled={actingId === row.id} onClick={() => approve(row)}>{t("regionalPartner.approve")}</button>
                  <button className="btn-reject" disabled={actingId === row.id} onClick={() => reject(row)}>{t("regionalPartner.reject")}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
