import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useSaved } from "../../App";
import { supabase } from "../../lib/supabaseClient";
import { toneForId, shortListingCode } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import SaveHeart from "../../components/SaveHeart";

const PRICE_UNITS = { villa: "villasPage.perNight", car: "carsPage.perDay", transfer: "transfersPage.perPerson", experience: "transfersPage.perPerson", event: null };
const CATEGORY_TO_PATH = { villa: "villas", car: "cars", transfer: "transfers", event: "events" };

function toPath(row) {
  return `/${CATEGORY_TO_PATH[row.category]}/${row.id}`;
}

export default function SavedPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { saved } = useSaved();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (saved.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    supabase
      .from("listings")
      .select("*, host:profiles(full_name)")
      .in("id", saved.map((s) => s.id))
      .then(({ data }) => setItems((data || []).map((row) => ({
        id: row.id,
        city: row.city,
        tone: toneForId(row.id),
        title: row.title,
        price: row.price,
        saveType: saved.find((s) => s.id === row.id)?.type,
        to: toPath(row),
        priceUnit: PRICE_UNITS[saved.find((s) => s.id === row.id)?.type],
        code: shortListingCode(row.id),
        hostName: row.host?.full_name,
        image: row.images?.[0],
      }))))
      .finally(() => setLoading(false));
  }, [saved]);

  return (
    <div className="saved-page">
      <style>{`
        .saved-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .saved-page .sp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .saved-page .sp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .saved-page .sp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .saved-page .sp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .saved-page .sp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .saved-page .sp-thumb { aspect-ratio: 4 / 3; background-size: cover; background-position: center; }
        .saved-page .sp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .saved-page .sp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .saved-page .sp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .saved-page .sp-body { padding: 16px; }
        .saved-page .sp-city { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; margin-bottom: 5px; color: var(--izigo-orange); }
        .saved-page .sp-title { font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 8px; line-height: 1.35; min-height: 36px; }
        .saved-page .sp-price { font-size: 14px; font-weight: 800; color: var(--text); }
        .saved-page .sp-price span { font-size: 11.5px; font-weight: 500; color: var(--text-soft); }
        .saved-page .sp-meta { font-size: 11px; color: var(--text-soft); margin-top: 6px; }

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

      {loading ? null : items.length === 0 ? (
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
              <div className={`sp-thumb ${item.image ? "" : item.tone}`} style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined} />
              <div className="sp-body">
                <div className="sp-city"><MapPin size={12} />{cityLabel(item.city, language)}</div>
                <div className="sp-title">{item.title[language] || item.title.en}</div>
                <div className="sp-price">
                  {item.priceUnit
                    ? <>{formatPrice(item.price)} <span>{t(item.priceUnit)}</span></>
                    : (item.price === 0 ? t("eventsPage.free") : formatPrice(item.price))}
                </div>
                <div className="sp-meta">{item.code}{item.hostName ? ` · ${item.hostName}` : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
