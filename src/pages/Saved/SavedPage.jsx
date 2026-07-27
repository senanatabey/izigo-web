import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSaved } from "../../App";
import { MOCK_VILLAS, MOCK_CARS, MOCK_TRANSFERS, MOCK_EVENTS } from "../../data/mockListings";
import SaveHeart from "../../components/SaveHeart";

const SOURCES = {
  villa: { items: MOCK_VILLAS, to: (id) => `/villas/${id}`, priceUnit: "villasPage.perNight" },
  car: { items: MOCK_CARS, to: (id) => `/cars/${id}`, priceUnit: "carsPage.perDay" },
  transfer: { items: MOCK_TRANSFERS.filter((t) => t.type === "transfer"), to: (id) => `/transfers/${id}`, priceUnit: "transfersPage.perPerson" },
  experience: { items: MOCK_TRANSFERS.filter((t) => t.type === "tour"), to: (id) => `/experiences/${id}`, priceUnit: "transfersPage.perPerson" },
  event: { items: MOCK_EVENTS, to: (id) => `/events/${id}`, priceUnit: null },
};

export default function SavedPage() {
  const { t, language } = useLanguage();
  const { saved } = useSaved();

  const items = saved
    .map(({ type, id }) => {
      const source = SOURCES[type];
      const item = source?.items.find((i) => i.id === id);
      return item ? { ...item, saveType: type, to: source.to(id), priceUnit: source.priceUnit } : null;
    })
    .filter(Boolean);

  return (
    <div className="saved-page">
      <style>{`
        .saved-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .saved-page .sp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .saved-page .sp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .saved-page .sp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .saved-page .sp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .saved-page .sp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .saved-page .sp-thumb { aspect-ratio: 4 / 3; }
        .saved-page .sp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .saved-page .sp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .saved-page .sp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .saved-page .sp-body { padding: 16px; }
        .saved-page .sp-city { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; margin-bottom: 5px; color: var(--izigo-orange); }
        .saved-page .sp-title { font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 8px; line-height: 1.35; min-height: 36px; }
        .saved-page .sp-price { font-size: 14px; font-weight: 800; color: var(--text); }
        .saved-page .sp-price span { font-size: 11.5px; font-weight: 500; color: var(--text-soft); }

        .saved-page .sp-empty { text-align: center; padding: 60px 20px; border: 1px dashed var(--border); border-radius: 16px; }
        .saved-page .sp-empty svg { color: var(--border); margin-bottom: 12px; }
        .saved-page .sp-empty p { color: var(--text-soft); font-size: 14.5px; margin: 0 0 16px; }
        .saved-page .sp-empty a { color: var(--izigo-green); font-weight: 700; font-size: 14px; }

        @media (max-width: 1024px) { .saved-page .sp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .saved-page { padding: 32px 5vw 56px; }
          .saved-page .sp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sp-head">
        <h1>{t("savedPage.heading")}</h1>
        <p>{t("savedPage.subtitle")}</p>
      </div>

      {items.length === 0 ? (
        <div className="sp-empty">
          <Heart size={32} />
          <p>{t("savedPage.empty")}</p>
          <Link to="/villas">{t("savedPage.browseLink")} →</Link>
        </div>
      ) : (
        <div className="sp-grid">
          {items.map((item) => (
            <Link to={item.to} className="sp-card" key={`${item.saveType}-${item.id}`}>
              <SaveHeart type={item.saveType} id={item.id} />
              <div className={`sp-thumb ${item.tone}`} />
              <div className="sp-body">
                <div className="sp-city"><MapPin size={12} />{item.city}</div>
                <div className="sp-title">{item.title[language] || item.title.en}</div>
                <div className="sp-price">
                  {item.priceUnit
                    ? <>{item.price} AZN <span>{t(item.priceUnit)}</span></>
                    : (item.price === 0 ? t("eventsPage.free") : `${item.price} AZN`)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
