import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Settings2, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { MOCK_CARS, DEMO_HOST_PHONE } from "../../data/mockListings";
import PhoneReveal from "../../components/PhoneReveal";

export default function CarDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const car = MOCK_CARS.find((c) => c.id === id);

  if (!car) {
    return (
      <div className="car-detail">
        <style>{`.car-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("carDetail.notFound")}</p>
        <Link to="/cars">{t("carDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="car-detail">
      <style>{`
        .car-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .car-detail .cd-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .car-detail .cd-gallery { border-radius: 16px; overflow: hidden; height: 380px; margin-bottom: 32px; }
        .car-detail .cd-thumb { width: 100%; height: 100%; }
        .car-detail .cd-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .car-detail .cd-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .car-detail .cd-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }

        .car-detail .cd-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .car-detail .cd-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .car-detail .cd-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .car-detail .cd-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .car-detail .cd-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .car-detail .cd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .car-detail .cd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); }

        .car-detail .cd-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .car-detail .cd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .car-detail .cd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .car-detail .cd-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .car-detail .cd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .car-detail .cd-host-name { font-size: 14px; font-weight: 700; }
        .car-detail .cd-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }

        @media (max-width: 900px) {
          .car-detail .cd-layout { grid-template-columns: 1fr; }
          .car-detail .cd-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .car-detail { padding: 20px 5vw 56px; }
          .car-detail .cd-gallery { height: 220px; }
        }
      `}</style>

      <Link to="/cars" className="cd-back">{t("carDetail.back")}</Link>

      <div className="cd-gallery">
        <div className={`cd-thumb ${car.tone}`} />
      </div>

      <div className="cd-layout">
        <div className="cd-main">
          <div className="cd-city"><MapPin size={13} />{car.city}</div>
          <h1 className="cd-title">{car.title[language] || car.title.en}</h1>
          <div className="cd-meta">
            <span><Users size={15} />{car.seats} {t("carsPage.seatsUnit")}</span>
            <span><Settings2 size={15} />{car.transmission[language] || car.transmission.en}</span>
          </div>

          <h2>{t("carDetail.aboutHeading")}</h2>
          <p className="cd-desc">{car.description[language] || car.description.en}</p>
        </div>

        <aside className="cd-sidebar">
          <div className="cd-price">{car.price} AZN <span>{t("carsPage.perDay")}</span></div>

          <div className="cd-host">
            <div className="cd-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="cd-host-name">{t("villaDetail.hostName")}</div>
              <div className="cd-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </div>

          <PhoneReveal phone={DEMO_HOST_PHONE} />
        </aside>
      </div>
    </div>
  );
}
