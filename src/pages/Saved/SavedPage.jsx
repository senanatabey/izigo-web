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

const PRICE_UNITS = { villa: "villasPage.perNight", car: "carsPage.perDay", transfer: "transfersPage.perPerson", experience: "transfersPage.perPerson", event: null, service: null };
const CATEGORY_TO_PATH = { villa: "villas", car: "cars", transfer: "transfers", event: "events", service: "concierge" };
const CATEGORIES = [
  { key: "villa", label: "nav.villas" },
  { key: "car", label: "nav.cars" },
  { key: "transfer", label: "nav.transfers" },
  { key: "event", label: "nav.events" },
  { key: "service", label: "nav.concierge" },
];

function toPath(row) {
  return `/${CATEGORY_TO_PATH[row.category]}/${row.id}`;
}

export default function SavedPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { saved } = useSaved();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  const counts = items.reduce((acc, item) => {
    acc[item.saveType] = (acc[item.saveType] || 0) + 1;
    return acc;
  }, {});
  const filteredItems = categoryFilter ? items.filter((item) => item.saveType === categoryFilter) : items;

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
        code: shortListingCode(row),
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

        .saved-page .sp-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
        .saved-page .sp-tab {
          display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 999px;
          border: 1.5px solid var(--izigo-green); background: #fff; color: var(--izigo-green); font-size: 13.5px; font-weight: 700;
          cursor: pointer; transition: all 0.15s ease;
        }
        .saved-page .sp-tab.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .saved-page .sp-tab:hover:not(.active) { background: rgba(0,200,151,0.08); }

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
          .saved-page .sp-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .saved-page .sp-tabs { gap: 8px; margin-bottom: 16px; }
          .saved-page .sp-tab { padding: 8px 13px; font-size: 12.5px; }
          .saved-page .sp-body { padding: 10px; }
          .saved-page .sp-title { font-size: 12.5px; margin-bottom: 6px; min-height: 32px; }
          .saved-page .sp-price { font-size: 13px; }
          .saved-page .sp-meta { font-size: 10px; margin-top: 4px; }
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
        <>
          <div className="sp-tabs">
            <button
              type="button"
              className={`sp-tab${categoryFilter === "" ? " active" : ""}`}
              onClick={() => setCategoryFilter("")}
            >
              {t("savedPage.all")} {items.length}
            </button>
            {CATEGORIES.filter((c) => counts[c.key] > 0).map((c) => (
              <button
                key={c.key}
                type="button"
                className={`sp-tab${categoryFilter === c.key ? " active" : ""}`}
                onClick={() => setCategoryFilter(c.key)}
              >
                {t(c.label)} {counts[c.key]}
              </button>
            ))}
          </div>
          <div className="sp-grid">
            {filteredItems.map((item) => (
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
        </>
      )}
    </div>
  );
}
