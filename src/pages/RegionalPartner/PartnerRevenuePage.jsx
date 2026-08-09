import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { fetchMyPartnerProfile, fetchMyRevenueSummary, fetchRegionAdCampaigns } from "../../lib/regionalPartner";

const STATUS_KEY = { active: "statusActive", completed: "statusCompleted", cancelled: "statusCancelled" };

function periodLabel(t, start, end) {
  if (!start || !end) return "—";
  const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000));
  return `${days} ${t("regionalPartner.days")}`;
}

export default function PartnerRevenuePage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [region, setRegion] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyPartnerProfile().then(async (partner) => {
      if (cancelled || !partner) { setLoading(false); return; }
      setRegion(partner.region);
      const [rev, camp] = await Promise.all([fetchMyRevenueSummary(), fetchRegionAdCampaigns(partner.region)]);
      if (cancelled) return;
      setRevenue(rev);
      setCampaigns(camp);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p>Loading...</p>;

  const r = revenue || { gross_revenue: 0, revenue_share_percent: 0, partner_earnings: 0, paid_amount: 0, pending_amount: 0 };

  return (
    <div>
      <style>{`
        .partner-revenue-metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 28px; }
        .partner-revenue-metric { border: 1px solid var(--border); border-radius: 14px; padding: 18px 16px; text-align: center; }
        .partner-revenue-metric-label { font-size: 11.5px; font-weight: 700; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
        .partner-revenue-metric-value { font-size: 19px; font-weight: 800; color: var(--text); }
        .partner-revenue-note {
          display: flex; gap: 10px; align-items: flex-start; border: 1px solid var(--border); border-radius: 12px;
          padding: 14px 16px; background: var(--bg-soft); margin-bottom: 32px; font-size: 13px; color: var(--text-soft); line-height: 1.6;
        }
        .partner-revenue-note svg { color: var(--izigo-green); flex-shrink: 0; margin-top: 1px; }
        .partner-breakdown-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .partner-breakdown-table th, .partner-breakdown-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .partner-breakdown-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .status-pill.active { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.completed { background: var(--bg-soft); color: var(--text-soft); }
        .status-pill.cancelled { background: rgba(224,85,63,0.14); color: #E0553F; }
        @media (max-width: 900px) { .partner-revenue-metrics { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t("regionalPartner.revenueHeading")}</h1>

      <div className="partner-revenue-metrics">
        <div className="partner-revenue-metric">
          <div className="partner-revenue-metric-label">{t("regionalPartner.grossRevenueLabel")}</div>
          <div className="partner-revenue-metric-value">{formatPrice(r.gross_revenue)}</div>
        </div>
        <div className="partner-revenue-metric">
          <div className="partner-revenue-metric-label">{t("regionalPartner.partnerShareLabel")}</div>
          <div className="partner-revenue-metric-value">{r.revenue_share_percent}%</div>
        </div>
        <div className="partner-revenue-metric">
          <div className="partner-revenue-metric-label">{t("regionalPartner.earningsLabel")}</div>
          <div className="partner-revenue-metric-value">{formatPrice(r.partner_earnings)}</div>
        </div>
        <div className="partner-revenue-metric">
          <div className="partner-revenue-metric-label">{t("regionalPartner.paidLabel")}</div>
          <div className="partner-revenue-metric-value">{formatPrice(r.paid_amount)}</div>
        </div>
        <div className="partner-revenue-metric">
          <div className="partner-revenue-metric-label">{t("regionalPartner.pendingAmountLabel")}</div>
          <div className="partner-revenue-metric-value">{formatPrice(r.pending_amount)}</div>
        </div>
      </div>

      <div className="partner-revenue-note">
        <Info size={16} />
        <div>
          <strong>{t("regionalPartner.howCalculatedTitle")}</strong>
          <div>
            {t("regionalPartner.howCalculatedText")
              .replace("{percent}", r.revenue_share_percent)
              .replace("{region}", region || "—")}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>{t("regionalPartner.breakdownHeading")}</h2>
      {campaigns.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>{t("regionalPartner.noCampaigns")}</p>
      ) : (
        <table className="partner-breakdown-table">
          <thead>
            <tr>
              <th>{t("regionalPartner.breakdownCampaign")}</th>
              <th>{t("regionalPartner.breakdownPeriod")}</th>
              <th>{t("regionalPartner.breakdownRevenue")}</th>
              <th>{t("regionalPartner.breakdownStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.title?.en || c.title?.az || "—"}</td>
                <td>{periodLabel(t, c.period_start, c.period_end)}</td>
                <td>{formatPrice(c.gross_revenue)}</td>
                <td><span className={`status-pill ${c.status}`}>{t(`regionalPartner.${STATUS_KEY[c.status] || "statusActive"}`)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
