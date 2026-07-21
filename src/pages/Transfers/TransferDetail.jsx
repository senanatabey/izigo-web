import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Car, Footprints, ShieldCheck, MessageCircle } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { MOCK_TRANSFERS } from "../../data/mockListings";

export default function TransferDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const item = MOCK_TRANSFERS.find((v) => v.id === id);

  if (!item) {
    return (
      <div className="transfer-detail">
        <style>{`.transfer-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("transferDetail.notFound")}</p>
        <Link to="/transfers">{t("transferDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="transfer-detail">
      <style>{`
        .transfer-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .transfer-detail .td-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .transfer-detail .td-gallery { border-radius: 16px; overflow: hidden; height: 320px; margin-bottom: 32px; }
        .transfer-detail .td-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .transfer-detail .td-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .transfer-detail .td-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .transfer-detail .td-thumb { width: 100%; height: 100%; }

        .transfer-detail .td-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .transfer-detail .td-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .transfer-detail .td-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .transfer-detail .td-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .transfer-detail .td-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .transfer-detail .td-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .transfer-detail .td-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }
        .transfer-detail .td-vehicle {
          display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700;
          color: var(--izigo-green); background: var(--bg-soft); padding: 8px 14px; border-radius: 999px;
        }

        .transfer-detail .td-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .transfer-detail .td-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .transfer-detail .td-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .transfer-detail .td-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .transfer-detail .td-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .transfer-detail .td-host-name { font-size: 14px; font-weight: 700; }
        .transfer-detail .td-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }
        .transfer-detail .td-whatsapp {
          display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-weight: 700; font-size: 14.5px; cursor: not-allowed; opacity: 0.9;
        }
        .transfer-detail .td-contact-note { font-size: 12px; color: var(--text-soft); text-align: center; margin-top: 10px; line-height: 1.5; }

        @media (max-width: 900px) {
          .transfer-detail .td-layout { grid-template-columns: 1fr; }
          .transfer-detail .td-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .transfer-detail { padding: 20px 5vw 56px; }
          .transfer-detail .td-gallery { height: 200px; }
        }
      `}</style>

      <Link to="/transfers" className="td-back">{t("transferDetail.back")}</Link>

      <div className="td-gallery">
        <div className={`td-thumb ${item.tone}`} />
      </div>

      <div className="td-layout">
        <div className="td-main">
          <div className="td-city"><MapPin size={13} />{item.city}</div>
          <h1 className="td-title">{item.title[language] || item.title.en}</h1>
          <div className="td-meta">
            <span>{item.type === "tour" ? t("transfersPage.typeTour") : t("transfersPage.typeTransfer")}</span>
            <span><Users size={15} />{item.seats} {t("transfersPage.seatsUnit")}</span>
          </div>

          <h2>{t("transferDetail.aboutHeading")}</h2>
          <p className="td-desc">{item.description[language] || item.description.en}</p>

          <div className="td-vehicle">
            {item.hasVehicle ? <Car size={15} /> : <Footprints size={15} />}
            {item.hasVehicle ? t("transferDetail.withVehicleNote") : t("transferDetail.withoutVehicleNote")}
          </div>
        </div>

        <aside className="td-sidebar">
          <div className="td-price">{item.price} AZN <span>{t("transfersPage.perPerson")}</span></div>

          <div className="td-host">
            <div className="td-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="td-host-name">{t("villaDetail.hostName")}</div>
              <div className="td-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </div>

          <button type="button" className="td-whatsapp" disabled>
            <MessageCircle size={17} />{t("villaDetail.contactWhatsapp")}
          </button>
          <p className="td-contact-note">{t("villaDetail.contactNote")}</p>
        </aside>
      </div>
    </div>
  );
}
