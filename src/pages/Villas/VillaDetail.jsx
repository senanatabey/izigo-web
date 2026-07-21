import { useParams, Link } from "react-router-dom";
import { MapPin, Users, BedDouble, ShieldCheck, MessageCircle, Wifi, UtensilsCrossed, Snowflake, ParkingCircle, Flame, Trees } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { MOCK_VILLAS } from "../../data/mockListings";

const AMENITY_ICONS = { wifi: Wifi, kitchen: UtensilsCrossed, ac: Snowflake, parking: ParkingCircle, fireplace: Flame, garden: Trees };

export default function VillaDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const villa = MOCK_VILLAS.find((v) => v.id === id);

  if (!villa) {
    return (
      <div className="villa-detail">
        <style>{`.villa-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("villaDetail.notFound")}</p>
        <Link to="/villas">{t("villaDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="villa-detail">
      <style>{`
        .villa-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .villa-detail .vd-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .villa-detail .vd-gallery { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 32px; border-radius: 16px; overflow: hidden; height: 380px; }
        .villa-detail .vd-gallery-main { grid-row: span 2; }
        .villa-detail .vd-gallery-side { display: grid; grid-template-rows: 1fr 1fr; gap: 12px; }
        .villa-detail .vd-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .villa-detail .vd-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .villa-detail .vd-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .villa-detail .vd-gallery-side .vd-thumb { opacity: 0.82; }

        .villa-detail .vd-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .villa-detail .vd-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .villa-detail .vd-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .villa-detail .vd-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .villa-detail .vd-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .villa-detail .vd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .villa-detail .vd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }
        .villa-detail .vd-amenities { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .villa-detail .vd-amenity { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text); }
        .villa-detail .vd-amenity svg { color: var(--izigo-green); }

        .villa-detail .vd-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .villa-detail .vd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .villa-detail .vd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .villa-detail .vd-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .villa-detail .vd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .villa-detail .vd-host-name { font-size: 14px; font-weight: 700; }
        .villa-detail .vd-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }
        .villa-detail .vd-whatsapp {
          display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-weight: 700; font-size: 14.5px; cursor: not-allowed; opacity: 0.9;
        }
        .villa-detail .vd-contact-note { font-size: 12px; color: var(--text-soft); text-align: center; margin-top: 10px; line-height: 1.5; }

        @media (max-width: 900px) {
          .villa-detail .vd-layout { grid-template-columns: 1fr; }
          .villa-detail .vd-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .villa-detail { padding: 20px 5vw 56px; }
          .villa-detail .vd-gallery { grid-template-columns: 1fr; height: auto; }
          .villa-detail .vd-gallery-main { height: 220px; }
          .villa-detail .vd-gallery-side { display: none; }
          .villa-detail .vd-amenities { grid-template-columns: 1fr; }
        }
      `}</style>

      <Link to="/villas" className="vd-back">{t("villaDetail.back")}</Link>

      <div className="vd-gallery">
        <div className={`vd-thumb vd-gallery-main ${villa.tone}`} />
        <div className="vd-gallery-side">
          <div className={`vd-thumb ${villa.tone}`} />
          <div className={`vd-thumb ${villa.tone}`} />
        </div>
      </div>

      <div className="vd-layout">
        <div className="vd-main">
          <div className="vd-city"><MapPin size={13} />{villa.city}</div>
          <h1 className="vd-title">{villa.title[language] || villa.title.en}</h1>
          <div className="vd-meta">
            <span><Users size={15} />{villa.guests} {t("villaDetail.guestsUnit")}</span>
            <span><BedDouble size={15} />{villa.bedrooms} {t("villaDetail.bedroomsUnit")}</span>
          </div>

          <h2>{t("villaDetail.aboutHeading")}</h2>
          <p className="vd-desc">{villa.description[language] || villa.description.en}</p>

          <h2>{t("villaDetail.amenitiesHeading")}</h2>
          <div className="vd-amenities">
            {villa.amenities.map((key) => {
              const Icon = AMENITY_ICONS[key];
              return (
                <div className="vd-amenity" key={key}>
                  <Icon size={17} />{t(`amenities.${key}`)}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="vd-sidebar">
          <div className="vd-price">{villa.price} AZN <span>{t("villaDetail.perNight")}</span></div>

          <div className="vd-host">
            <div className="vd-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="vd-host-name">{t("villaDetail.hostName")}</div>
              <div className="vd-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </div>

          <button type="button" className="vd-whatsapp" disabled>
            <MessageCircle size={17} />{t("villaDetail.contactWhatsapp")}
          </button>
          <p className="vd-contact-note">{t("villaDetail.contactNote")}</p>
        </aside>
      </div>
    </div>
  );
}
