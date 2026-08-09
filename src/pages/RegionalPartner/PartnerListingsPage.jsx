import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { fetchMyPartnerProfile, fetchRegionListings, approveRegionalListing, rejectRegionalListing } from "../../lib/regionalPartner";

export default function PartnerListingsPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [region, setRegion] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const partner = await fetchMyPartnerProfile();
    if (!partner) {
      setLoading(false);
      return;
    }
    setRegion(partner.region);
    const rows = await fetchRegionListings(partner.region);
    setListings(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (l) => {
    try {
      await approveRegionalListing(l.id);
      load();
    } catch (err) {
      window.alert(err.message || "Failed to approve listing.");
    }
  };

  const reject = async (l) => {
    const reason = window.prompt(t("regionalPartner.reasonPrompt"));
    if (reason === null) return;
    try {
      await rejectRegionalListing(l.id, reason);
      load();
    } catch (err) {
      window.alert(err.message || "Failed to reject listing.");
    }
  };

  return (
    <div>
      <style>{`
        .partner-listings-list { display: flex; flex-direction: column; gap: 14px; }
        .partner-listing-card { border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
        .partner-listing-card h3 { margin: 0 0 6px; font-size: 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .partner-listing-card p { margin: 0 0 10px; font-size: 13px; color: var(--text-soft); }
        .partner-listing-actions { display: flex; gap: 10px; }
        .partner-listing-actions button {
          border-radius: 8px; padding: 8px 16px; font-weight: 700; font-size: 13px; cursor: pointer; border: none;
        }
        .btn-approve { background: var(--izigo-green); color: #fff; }
        .btn-reject { background: #F1F1F1; color: #333; }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .status-pill.pending { background: rgba(255,180,0,0.16); color: #B87700; }
        .status-pill.approved { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t("regionalPartner.listingsHeading")}</h1>
      {region && <p style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 20 }}>{t("regionalPartner.regionLabel")}: {region}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>{t("regionalPartner.noListings")}</p>
      ) : (
        <div className="partner-listings-list">
          {listings.map((l) => (
            <div className="partner-listing-card" key={l.id}>
              <h3>
                {l.title?.en || l.title?.az} — {l.category}
                <span className={`status-pill ${l.status}`}>{l.status}</span>
              </h3>
              <p>{l.city} · {formatPrice(l.price)} · submitted {new Date(l.created_at).toLocaleDateString()}</p>
              {l.status === "pending" && (
                <div className="partner-listing-actions">
                  <button className="btn-approve" onClick={() => approve(l)}>{t("regionalPartner.approve")}</button>
                  <button className="btn-reject" onClick={() => reject(l)}>{t("regionalPartner.reject")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
