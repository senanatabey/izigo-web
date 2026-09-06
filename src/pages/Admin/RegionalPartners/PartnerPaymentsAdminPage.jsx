import { useEffect, useState } from "react";
import { fetchAllPartners, fetchAllPartnerPayments, createPartnerPayment, updatePartnerPaymentStatus } from "../../../lib/regionalPartner";

// The only place regional_partner_payments rows get written or their status
// changed — RLS backs this up (only is_admin() may insert/update that
// table), so this isn't just a UI convention.
const PAYMENT_STATUS_LABELS = { paid: "Ödənilib", pending: "Gözləmədə" };

export default function PartnerPaymentsAdminPage() {
  const [payments, setPayments] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [paymentRows, partnerRows] = await Promise.all([fetchAllPartnerPayments(), fetchAllPartners()]);
    setPayments(paymentRows);
    setPartners(partnerRows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!partnerId || !amount) return;
    setSaving(true);
    setError("");
    try {
      await createPartnerPayment({
        partner_id: partnerId,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        amount: Number(amount) || 0,
        status: "pending",
      });
      setShowForm(false);
      setPartnerId(""); setPeriodStart(""); setPeriodEnd(""); setAmount("");
      load();
    } catch (err) {
      setError(err.message || "Ödənişi yaratmaq mümkün olmadı.");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (p) => {
    const reference = window.prompt("Ödəniş nömrəsi (istəyə bağlı):", p.payment_reference || "");
    if (reference === null) return;
    await updatePartnerPaymentStatus(p.id, "paid", reference);
    load();
  };

  const markPending = async (p) => {
    await updatePartnerPaymentStatus(p.id, "pending");
    load();
  };

  return (
    <div>
      <style>{`
        .pp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 24px; }
        .pp-table th, .pp-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .pp-table th { color: var(--text-soft); font-weight: 700; font-size: 12px; text-transform: uppercase; }
        .status-pill { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
        .status-pill.paid { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .status-pill.pending { background: rgba(255,180,0,0.16); color: #B87700; }
        .pp-table button.toggle { border: none; background: none; color: var(--izigo-green); font-weight: 700; cursor: pointer; font-size: 12.5px; }
        .pp-new-btn { border: none; background: var(--izigo-green); color: #fff; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-size: 13.5px; cursor: pointer; margin-bottom: 20px; }
        .pp-form { border: 1px solid var(--border); border-radius: 14px; padding: 20px; max-width: 420px; margin-bottom: 24px; }
        .pp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .pp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .pp-field input, .pp-field select { border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 13.5px; font-family: var(--sans); }
        .pp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pp-save-btn { border: none; background: var(--izigo-orange); color: #fff; border-radius: 8px; padding: 9px 18px; font-weight: 700; font-size: 13.5px; cursor: pointer; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Partnyor Ödənişləri</h1>

      <button className="pp-new-btn" onClick={() => setShowForm((v) => !v)}>{showForm ? "Ləğv et" : "+ Yeni ödəniş"}</button>

      {showForm && (
        <form className="pp-form" onSubmit={submit}>
          <div className="pp-field">
            <label>Partnyor</label>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} required>
              <option value="">Partnyor seçin</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.profile?.full_name || p.user_id} — {p.region}</option>
              ))}
            </select>
          </div>
          <div className="pp-row">
            <div className="pp-field">
              <label>Dövrün başlanğıcı</label>
              <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="pp-field">
              <label>Dövrün bitməsi</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div className="pp-field">
            <label>Məbləğ (AZN)</label>
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          {error && <p style={{ color: "#E0553F", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="pp-save-btn" type="submit" disabled={saving}>{saving ? "Yadda saxlanılır..." : "Ödəniş yarat (gözləmədə)"}</button>
        </form>
      )}

      {loading ? <p>Yüklənir...</p> : payments.length === 0 ? (
        <p style={{ color: "var(--text-soft)" }}>Hələ ödəniş qeydə alınmayıb.</p>
      ) : (
        <table className="pp-table">
          <thead>
            <tr><th>Partnyor</th><th>Region</th><th>Dövr</th><th>Məbləğ</th><th>Status</th><th>Nömrə</th><th></th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.partner?.profile?.full_name || "—"}</td>
                <td>{p.partner?.region || "—"}</td>
                <td>{p.period_start || "—"} → {p.period_end || "—"}</td>
                <td>{p.amount} AZN</td>
                <td><span className={`status-pill ${p.status}`}>{PAYMENT_STATUS_LABELS[p.status] || p.status}</span></td>
                <td>{p.payment_reference || "—"}</td>
                <td>
                  {p.status === "pending" ? (
                    <button className="toggle" onClick={() => markPaid(p)}>Ödənilib kimi qeyd et</button>
                  ) : (
                    <button className="toggle" onClick={() => markPending(p)}>Gözləmədə kimi qeyd et</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
