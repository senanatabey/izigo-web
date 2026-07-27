import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const MY_LISTINGS = [
  { id: "v1", type: "villa", city: "Baku", tone: "dusk", status: "approved", price: 90, inquiries: 3, title: { en: "Seafront apartment near the Boulevard", az: "Bulvar yaxınlığında dənizkənarı mənzil" } },
  { id: "c2", type: "car", city: "Baku", tone: "forest", status: "pending", price: 65, inquiries: 0, title: { en: "Kia Sportage 2023", az: "Kia Sportage 2023" } },
  { id: "t4", type: "transfer", city: "Gabala", tone: "dusk", status: "approved", price: 90, inquiries: 5, title: { en: "Gabala & Tufandag day tour with driver", az: "Sürücü ilə Qəbələ və Tufandağ günlük turu" } },
  { id: "v4", type: "villa", city: "Gabala", tone: "dusk", status: "rejected", price: 110, inquiries: 0, title: { en: "Cosy cottage near Tufandag", az: "Tufandağa yaxın rahat kottec" } },
];

const TYPE_TO_PATH = { villa: "villas", car: "cars", transfer: "transfers", experience: "experiences", event: "events" };

export default function MyListingsPage() {
  const { t, language } = useLanguage();
  const [confirmed, setConfirmed] = useState([]);

  return (
    <div className="my-listings-page">
      <style>{`
        .my-listings-page .mlp-head { margin-bottom: 24px; }
        .my-listings-page .mlp-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
        .my-listings-page .mlp-head p { font-size: 13.5px; color: var(--text-soft); margin: 0; }

        .my-listings-page .mlp-list { display: flex; flex-direction: column; gap: 14px; }
        .my-listings-page .mlp-row {
          display: flex; align-items: center; gap: 16px; border: 1px solid var(--border); border-radius: 14px; padding: 14px;
        }
        .my-listings-page .mlp-thumb { width: 76px; height: 60px; border-radius: 10px; flex-shrink: 0; }
        .my-listings-page .mlp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .my-listings-page .mlp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .my-listings-page .mlp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .my-listings-page .mlp-body { flex: 1; min-width: 0; }
        .my-listings-page .mlp-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .my-listings-page .mlp-meta { display: flex; align-items: center; gap: 4px; font-size: 12.5px; color: var(--text-soft); }
        .my-listings-page .mlp-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
        .my-listings-page .mlp-badge {
          font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: capitalize;
        }
        .my-listings-page .mlp-badge.approved { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
        .my-listings-page .mlp-badge.pending { background: rgba(255,180,0,0.16); color: #B87700; }
        .my-listings-page .mlp-badge.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
        .my-listings-page .mlp-inquiries { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-soft); }
        .my-listings-page .mlp-confirm {
          display: flex; align-items: center; gap: 5px; border: none; background: var(--izigo-green); color: #fff;
          border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .my-listings-page .mlp-confirm:disabled { opacity: 0.6; cursor: default; }

        @media (max-width: 560px) {
          .my-listings-page .mlp-row { flex-wrap: wrap; }
          .my-listings-page .mlp-side { align-items: flex-start; flex-direction: row; width: 100%; justify-content: space-between; }
        }
      `}</style>

      <div className="mlp-head">
        <h1>{t("myListingsPage.heading")}</h1>
        <p>{t("myListingsPage.subtitle")}</p>
      </div>

      <div className="mlp-list">
        {MY_LISTINGS.map((item) => (
          <div className="mlp-row" key={item.id}>
            <Link to={`/${TYPE_TO_PATH[item.type]}/${item.id}`} className={`mlp-thumb ${item.tone}`} />
            <div className="mlp-body">
              <div className="mlp-title">{item.title[language] || item.title.en}</div>
              <div className="mlp-meta"><MapPin size={12} />{item.city} · {item.price} AZN</div>
            </div>
            <div className="mlp-side">
              <span className={`mlp-badge ${item.status}`}>{t(`myListingsPage.status.${item.status}`)}</span>
              <span className="mlp-inquiries"><MessageCircle size={12} />{item.inquiries} {t("myListingsPage.inquiries")}</span>
              {item.status === "approved" && (
                <button
                  type="button"
                  className="mlp-confirm"
                  disabled={confirmed.includes(item.id)}
                  onClick={() => setConfirmed((prev) => [...prev, item.id])}
                >
                  <CheckCircle2 size={13} />
                  {confirmed.includes(item.id) ? t("myListingsPage.confirmed") : t("myListingsPage.confirmStay")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
