import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, DollarSign, Home as HomeIcon, Receipt } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { fetchMyPartnerProfile, fetchRegionListings, fetchMyRevenueSummary } from "../../lib/regionalPartner";

const QUICK_ACTIONS = [
  { label: "Listings", to: "/partner/listings", icon: HomeIcon },
  { label: "Revenue", to: "/partner/revenue", icon: DollarSign },
  { label: "Payments", to: "/partner/payments", icon: Receipt },
];

export default function PartnerDashboardPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [partner, setPartner] = useState(null);
  const [listings, setListings] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyPartnerProfile().then(async (p) => {
      if (cancelled) return;
      setPartner(p);
      if (p) {
        const [rows, rev] = await Promise.all([fetchRegionListings(p.region), fetchMyRevenueSummary()]);
        if (cancelled) return;
        setListings(rows);
        setRevenue(rev);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const pendingCount = listings.filter((l) => l.status === "pending").length;
  const r = revenue || { partner_earnings: 0, paid_amount: 0 };

  const cards = [
    { label: t("regionalPartner.pendingHeading"), value: pendingCount, icon: ClipboardList, to: "/partner/listings", priority: pendingCount > 0 },
    { label: "Total Listings", value: listings.length, icon: HomeIcon, to: "/partner/listings" },
    { label: t("regionalPartner.earningsLabel"), value: formatPrice(r.partner_earnings), icon: DollarSign, to: "/partner/revenue" },
    { label: t("regionalPartner.paidLabel"), value: formatPrice(r.paid_amount), icon: Receipt, to: "/partner/payments" },
  ];

  return (
    <div>
      <style>{`
        .partner-dash-head { margin-bottom: 24px; }
        .partner-dash-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
        .partner-dash-head p { font-size: 13.5px; color: var(--text-soft); margin: 0; }
        .partner-region-badge {
          display: inline-flex; align-items: center; font-size: 12px; font-weight: 700; color: var(--izigo-green);
          background: rgba(0,200,151,0.12); border-radius: 999px; padding: 4px 12px; margin-top: 8px;
        }
        .partner-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .partner-kpi-card {
          border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 10px;
          background: var(--bg); position: relative; text-decoration: none; color: inherit;
          transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
        }
        .partner-kpi-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .partner-kpi-card svg { color: var(--izigo-green); }
        .partner-kpi-value { font-size: 22px; font-weight: 800; }
        .partner-kpi-label { font-size: 13px; color: var(--text-soft); }
        .partner-kpi-card.priority { border-color: var(--izigo-orange); background: rgba(255, 122, 0, 0.05); }
        .partner-kpi-card.priority svg { color: var(--izigo-orange); }
        @media (max-width: 900px) { .partner-kpi-grid { grid-template-columns: repeat(2, 1fr); } }

        .partner-section-title { font-size: 15px; font-weight: 800; margin: 32px 0 12px; }
        .partner-quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .partner-quick-action {
          display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 12px;
          padding: 14px 16px; font-size: 13.5px; font-weight: 700; color: var(--text); background: var(--bg); text-decoration: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .partner-quick-action:hover { border-color: var(--izigo-green); background: rgba(0, 200, 151, 0.06); }
        .partner-quick-action svg { color: var(--izigo-green); flex-shrink: 0; }
        @media (max-width: 640px) { .partner-quick-actions { grid-template-columns: 1fr; } }

        .partner-activity-card { border: 1px solid var(--border); border-radius: 14px; padding: 8px 20px; }
        .partner-activity-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; font-size: 13.5px; }
        .partner-activity-row + .partner-activity-row { border-top: 1px solid var(--border); }
        .partner-activity-title { flex: 1; color: var(--text); font-weight: 600; }
        .partner-activity-time { font-size: 12px; color: var(--text-soft); white-space: nowrap; }
        .partner-activity-empty { padding: 20px 0; font-size: 13.5px; color: var(--text-soft); text-align: center; }
        .status-pill { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; text-transform: capitalize; }
        .status-pill.pending { background: rgba(255,180,0,0.16); color: #B87700; }
        .status-pill.approved { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
      `}</style>
      <div className="partner-dash-head">
        <h1>{t("regionalPartner.dashboardHeading")}</h1>
        <p>{t("regionalPartner.welcomeNote")}</p>
        {partner && <div className="partner-region-badge">{t("regionalPartner.regionLabel")}: {partner.region}</div>}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-soft)" }}>Loading...</p>
      ) : !partner ? (
        <p style={{ color: "var(--text-soft)" }}>No active regional partner assignment found for this account.</p>
      ) : (
        <>
          <div className="partner-kpi-grid">
            {cards.map(({ label, value, icon: Icon, to, priority }) => (
              <Link to={to} className={`partner-kpi-card${priority ? " priority" : ""}`} key={label}>
                <Icon size={20} />
                <div className="partner-kpi-value">{value}</div>
                <div className="partner-kpi-label">{label}</div>
              </Link>
            ))}
          </div>

          <h2 className="partner-section-title">Quick actions</h2>
          <div className="partner-quick-actions">
            {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} className="partner-quick-action">
                <Icon size={17} />{label}
              </Link>
            ))}
          </div>

          <h2 className="partner-section-title">{t("regionalPartner.listingsHeading")}</h2>
          <div className="partner-activity-card">
            {listings.length === 0 ? (
              <p className="partner-activity-empty">{t("regionalPartner.noListings")}</p>
            ) : (
              listings.slice(0, 6).map((l) => (
                <div className="partner-activity-row" key={l.id}>
                  <span className={`status-pill ${l.status}`}>{l.status}</span>
                  <span className="partner-activity-title">{l.title?.en || l.title?.az}</span>
                  <span className="partner-activity-time">{new Date(l.created_at).toLocaleDateString(language)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
