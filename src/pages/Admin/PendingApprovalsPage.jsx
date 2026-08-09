import { useEffect, useState } from "react";
import { ClipboardList, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useCurrency } from "../../i18n/CurrencyContext";
import AdminEmptyState from "../../components/AdminEmptyState";
import { tryGrantFounderStatus } from "../../lib/founder";

// Public detail route per category, so an admin can open the exact page a
// visitor would see (RLS already lets admins view pending listings there
// too) instead of only judging a title/price summary. "service" has no
// standalone detail page yet, so it's simply omitted.
const CATEGORY_DETAIL_PATH = { villa: "/villas", car: "/cars", transfer: "/transfers", event: "/events" };

const AMENITY_LABELS = {
  wifi: "Wi-Fi", kitchen: "Mətbəx", ac: "Kondisioner", parking: "Parkinq",
  fireplace: "Şömünə", garden: "Bağça", pool: "Hovuz", heated_pool: "İsti hovuz",
};

/** Category-specific fields worth showing to an admin reviewing a listing —
 *  mirrors exactly what AddListingFormPage collects per category. */
function specRows(listing) {
  const d = listing.details || {};
  if (listing.category === "villa") {
    const rows = [
      { label: "Qonaq sayı", value: d.guests },
      { label: "Yataq otağı sayı", value: d.bedrooms },
      { label: "Hamam sayı", value: d.bathrooms },
      { label: "Şərait", value: (d.amenities || []).map((k) => AMENITY_LABELS[k] || k).join(", ") || "—" },
    ];
    if (listing.long_stay_discount_enabled) {
      rows.push({
        label: "Uzunmüddətli endirim",
        value: listing.long_stay_discount_type === "percentage"
          ? `${listing.long_stay_min_nights}+ gecə: -${listing.long_stay_discount_value}%`
          : `${listing.long_stay_min_nights}+ gecə: ${listing.long_stay_discount_value} AZN/gecə`,
      });
    }
    return rows;
  }
  if (listing.category === "car") {
    return [
      { label: "Yer sayı", value: d.seats },
      { label: "Sürətlər qutusu", value: d.transmission === "automatic" ? "Avtomat" : "Mexaniki" },
    ];
  }
  if (listing.category === "transfer") {
    return [
      { label: "Növ", value: d.type === "tour" ? "Tur" : "Transfer" },
      { label: "Nəqliyyat", value: d.hasVehicle ? "Var" : "Yoxdur" },
      { label: "Yer sayı", value: d.seats },
    ];
  }
  if (listing.category === "event") {
    return [
      { label: "Tarix", value: d.date },
      { label: "Pulsuz", value: d.isFree ? "Bəli" : "Xeyr" },
    ];
  }
  if (listing.category === "service") {
    return [{ label: "Xidmət növü", value: d.serviceType }];
  }
  return [];
}

export default function PendingApprovalsPage() {
  const { formatPrice } = useCurrency();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }) => setListings(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const notifyHost = async (hostId, message, link) => {
    await supabase.from("notifications").insert({ user_id: hostId, message, link });
  };

  const approve = async (listing) => {
    const { error } = await supabase.from("listings").update({ status: "approved", reject_reason: null }).eq("id", listing.id);
    if (error) {
      console.error("Failed to approve listing:", error);
      window.alert("Failed to approve listing — please try again.");
      return;
    }
    await notifyHost(listing.host_id, `"${listing.title?.en || listing.title?.az}" was approved and is now live.`, "/my-listings");
    await tryGrantFounderStatus(listing.host_id);
    load();
  };

  const reject = async (listing) => {
    const reason = window.prompt("Rədd səbəbini yazın (host görəcək):");
    if (reason === null) return;
    const { error } = await supabase.from("listings").update({ status: "rejected", reject_reason: reason || null }).eq("id", listing.id);
    if (error) {
      console.error("Failed to reject listing:", error);
      window.alert("Failed to reject listing — please try again.");
      return;
    }
    await notifyHost(listing.host_id, `"${listing.title?.en || listing.title?.az}" was rejected${reason ? `: ${reason}` : "."}`, "/my-listings");
    load();
  };

  return (
    <div>
      <style>{`
        .pending-list { display: flex; flex-direction: column; gap: 14px; }
        .pending-card { border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
        .pending-card h3 { margin: 0 0 6px; font-size: 16px; }
        .pending-card p { margin: 0 0 10px; font-size: 13px; color: var(--text-soft); }
        .pending-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .pending-preview-link {
          display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700;
          color: var(--izigo-green); white-space: nowrap; flex-shrink: 0;
        }
        .pending-photos { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .pending-photo { width: 72px; height: 72px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); }
        .pending-photo-empty {
          width: 72px; height: 72px; border-radius: 8px; border: 1px dashed var(--border);
          display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--text-soft);
        }
        .pending-desc { font-size: 13.5px; color: var(--text); line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap; }
        .pending-specs { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px 16px; margin-bottom: 12px; }
        .pending-spec { font-size: 12.5px; color: var(--text-soft); }
        .pending-spec strong { color: var(--text); font-weight: 700; }
        .pending-whatsapp { font-size: 13px; color: var(--text-soft); margin-bottom: 12px; }
        .pending-actions { display: flex; gap: 10px; }
        .pending-actions button {
          border-radius: 8px; padding: 8px 16px; font-weight: 700; font-size: 13px; cursor: pointer; border: none;
        }
        .btn-approve { background: var(--izigo-green); color: #fff; }
        .btn-reject { background: #F1F1F1; color: #333; }
      `}</style>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Pending approvals</h1>
      {loading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <AdminEmptyState icon={ClipboardList} message="No pending approvals." actionLabel="View listings" actionTo="/admin/listings" />
      ) : (
        <div className="pending-list">
          {listings.map((l) => {
            const detailPath = CATEGORY_DETAIL_PATH[l.category];
            const specs = specRows(l).filter((s) => s.value !== undefined && s.value !== null && s.value !== "");
            return (
              <div className="pending-card" key={l.id}>
                <div className="pending-head">
                  <div>
                    <h3>{l.title?.en || l.title?.az} — {l.category}</h3>
                    <p>{l.city} · {formatPrice(l.price)}{l.discount ? ` (-${l.discount}%)` : ""} · submitted {new Date(l.created_at).toLocaleDateString()}</p>
                  </div>
                  {detailPath && (
                    <a className="pending-preview-link" href={`${detailPath}/${l.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={13} />Tam səhifədə bax
                    </a>
                  )}
                </div>

                <div className="pending-photos">
                  {(l.images || []).length > 0 ? (
                    l.images.map((url, i) => <img className="pending-photo" src={url} alt="" key={i} loading="lazy" />)
                  ) : (
                    <div className="pending-photo-empty">Şəkil yoxdur</div>
                  )}
                </div>

                <p className="pending-desc">{l.description?.en || l.description?.az || "—"}</p>

                {specs.length > 0 && (
                  <div className="pending-specs">
                    {specs.map((s) => <div className="pending-spec" key={s.label}><strong>{s.label}:</strong> {String(s.value)}</div>)}
                  </div>
                )}

                <p className="pending-whatsapp">WhatsApp: {l.whatsapp_phone || "—"}</p>

                <div className="pending-actions">
                  <button className="btn-approve" onClick={() => approve(l)}>Approve</button>
                  <button className="btn-reject" onClick={() => reject(l)}>Reject</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
