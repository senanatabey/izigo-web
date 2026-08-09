import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { fetchMyPartnerProfile, fetchMyPayments } from "../../lib/regionalPartner";

export default function PartnerPaymentsPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyPartnerProfile().then(async (partner) => {
      if (cancelled || !partner) { setLoading(false); return; }
      const rows = await fetchMyPayments(partner.id);
      if (cancelled) return;
      setPayments(rows);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const periodText = (p) => {
    if (!p.period_start || !p.period_end) return "—";
    return `${new Date(p.period_start).toLocaleDateString(language)} – ${new Date(p.period_end).toLocaleDateString(language)}`;
  };

  return (
    <div>
      <style>{`
        .partner-payments-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .partner-payments-table th, .partner-payments-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .partner-payments-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .status-pill.paid { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.pending { background: rgba(255,180,0,0.16); color: #B87700; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t("regionalPartner.paymentsHeading")}</h1>
      {loading ? (
        <p>Loading...</p>
      ) : payments.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>{t("regionalPartner.noPayments")}</p>
      ) : (
        <table className="partner-payments-table">
          <thead>
            <tr>
              <th>{t("regionalPartner.paymentDate")}</th>
              <th>{t("regionalPartner.paymentAmount")}</th>
              <th>{t("regionalPartner.paymentPeriod")}</th>
              <th>{t("regionalPartner.paymentStatus")}</th>
              <th>{t("regionalPartner.paymentReference")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleDateString(language)}</td>
                <td>{formatPrice(p.amount)}</td>
                <td>{periodText(p)}</td>
                <td><span className={`status-pill ${p.status}`}>{t(`regionalPartner.status${p.status === "paid" ? "Paid" : "Pending"}`)}</span></td>
                <td>{p.payment_reference || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
