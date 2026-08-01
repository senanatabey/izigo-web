import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Users, BedDouble, Waves, Thermometer, Flame } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchApprovedListings, toneForId } from "../../lib/listings";
import { useSeo } from "../../lib/seo";
import SaveHeart from "../../components/SaveHeart";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";

const CITIES = ALL_DESTINATIONS;
const GUEST_OPTIONS = [2, 4, 6, 8];
const PRICE_OPTIONS = [80, 100, 150, 200];
const AMENITY_QUICK_FILTERS = [
  { key: "pool", icon: Waves },
  { key: "heated_pool", icon: Thermometer },
  { key: "fireplace", icon: Flame },
];

export default function VillasPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  useSeo({
    title: "Villas & Homes in Azerbaijan",
    description: "Verified villas and homes in Baku, Gabala and Guba — with or without a pool — contact the host directly on WhatsApp, no commission.",
    path: "/villas",
  });

  const [guests, setGuests] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [amenityFilter, setAmenityFilter] = useState("");
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedListings("villa")
      .then((rows) => setVillas(rows.map((row) => ({
        id: row.id,
        city: row.city,
        tone: toneForId(row.id),
        title: row.title,
        price: row.price,
        discount: row.discount,
        guests: row.details?.guests || 0,
        bedrooms: row.details?.bedrooms || 0,
        amenities: row.details?.amenities || [],
        image: row.images?.[0],
      }))))
      .finally(() => setLoading(false));
  }, []);

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setGuests("");
    setMaxPrice("");
    setAmenityFilter("");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return villas.filter((v) => {
      if (cityParam && v.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (guests && v.guests < Number(guests)) return false;
      if (maxPrice && v.price > Number(maxPrice)) return false;
      if (amenityFilter && !v.amenities.includes(amenityFilter)) return false;
      return true;
    });
  }, [villas, cityParam, guests, maxPrice, amenityFilter]);

  return (
    <div className="villas-page">
      <style>{`
        .villas-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .villas-page .vp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .villas-page .vp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .villas-page .vp-quick-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
        .villas-page .vp-quick-chip {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; border-radius: 999px;
          border: 1.5px solid var(--border); background: #fff; color: var(--text); font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s ease;
        }
        .villas-page .vp-quick-chip.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .villas-page .vp-quick-chip:hover:not(.active) { border-color: var(--izigo-green); color: var(--izigo-green); }

        .villas-page .vp-filters {
          display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px;
          border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 28px;
        }
        .villas-page .vp-field { display: flex; flex-direction: column; gap: 6px; }
        .villas-page .vp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .villas-page .vp-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
        }
        .villas-page .vp-reset {
          border: none; background: none; color: var(--izigo-green); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .villas-page .vp-count { font-size: 14px; color: var(--text-soft); margin-bottom: 20px; }

        .villas-page .vp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .villas-page .vp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .villas-page .vp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .villas-page .vp-thumb { aspect-ratio: 4 / 2.8; background-size: cover; background-position: center; }
        .villas-page .vp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .villas-page .vp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .villas-page .vp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .villas-page .vp-body { padding: 18px; }
        .villas-page .vp-city { display: flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--izigo-green); margin-bottom: 6px; }
        .villas-page .vp-title { font-size: 15.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.4; }
        .villas-page .vp-meta { display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--text-soft); margin-bottom: 14px; flex-wrap: wrap; }
        .villas-page .vp-meta span { display: flex; align-items: center; gap: 5px; }
        .villas-page .vp-meta span.vp-amenity-badge { color: var(--izigo-green); font-weight: 700; }
        .villas-page .vp-footer { display: flex; align-items: center; justify-content: space-between; }
        .villas-page .vp-price { font-size: 16px; font-weight: 800; color: var(--text); }
        .villas-page .vp-price span { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
        .villas-page .vp-price-old { font-size: 12.5px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .villas-page .vp-link { font-size: 13px; font-weight: 700; color: var(--izigo-green); }

        .villas-page .vp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .villas-page .vp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .villas-page { padding: 32px 5vw 56px; }
          .villas-page .vp-grid { grid-template-columns: 1fr; }
          .villas-page .vp-filters { flex-direction: column; align-items: stretch; }
          .villas-page .vp-quick-chip { padding: 9px 14px; font-size: 13px; }
          .villas-page .vp-field select { width: 100%; }
        }
      `}</style>

      <div className="vp-head">
        <h1>{t("villasPage.heading")}</h1>
        <p>{t("villasPage.subtitle")}</p>
      </div>

      <div className="vp-quick-filters">
        <button
          type="button"
          className={`vp-quick-chip${amenityFilter === "" ? " active" : ""}`}
          onClick={() => setAmenityFilter("")}
        >
          {t("villasPage.allAmenities")}
        </button>
        {AMENITY_QUICK_FILTERS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`vp-quick-chip${amenityFilter === key ? " active" : ""}`}
            onClick={() => setAmenityFilter(amenityFilter === key ? "" : key)}
          >
            <Icon size={16} />{t(`amenities.${key}`)}
          </button>
        ))}
      </div>

      <div className="vp-filters">
        <div className="vp-field">
          <label>{t("villasPage.filterCity")}</label>
          <select value={cityParam} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t("villasPage.allCities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{cityLabel(c, language)}</option>)}
          </select>
        </div>
        <div className="vp-field">
          <label>{t("villasPage.filterGuests")}</label>
          <select value={guests} onChange={(e) => setGuests(e.target.value)}>
            <option value="">{t("villasPage.anyGuests")}</option>
            {GUEST_OPTIONS.map((g) => <option key={g} value={g}>{g}+</option>)}
          </select>
        </div>
        <div className="vp-field">
          <label>{t("villasPage.filterPrice")}</label>
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t("villasPage.anyPrice")}</option>
            {PRICE_OPTIONS.map((p) => <option key={p} value={p}>≤ {p} AZN</option>)}
          </select>
        </div>
        <button type="button" className="vp-reset" onClick={resetFilters}>{t("villasPage.resetFilters")}</button>
      </div>

      <p className="vp-count">{t("villasPage.resultsCount").replace("{count}", filtered.length)}</p>

      {loading ? null : filtered.length === 0 ? (
        <div className="vp-empty">{t("villasPage.noResults")}</div>
      ) : (
        <div className="vp-grid">
          {filtered.map((v) => (
            <Link to={`/villas/${v.id}`} className="vp-card" key={v.id}>
              <SaveHeart type="villa" id={v.id} />
              <div className={`vp-thumb ${v.image ? "" : v.tone}`} style={v.image ? { backgroundImage: `url("${v.image}")` } : undefined} />
              <div className="vp-body">
                <div className="vp-city"><MapPin size={12} />{cityLabel(v.city, language)}</div>
                <div className="vp-title">{v.title[language] || v.title.en}</div>
                <div className="vp-meta">
                  <span><Users size={14} />{v.guests} {t("villasPage.guestsUnit")}</span>
                  <span><BedDouble size={14} />{v.bedrooms} {t("villasPage.bedroomsUnit")}</span>
                  {v.amenities.includes("heated_pool") ? (
                    <span className="vp-amenity-badge"><Thermometer size={14} />{t("amenities.heated_pool")}</span>
                  ) : v.amenities.includes("pool") ? (
                    <span className="vp-amenity-badge"><Waves size={14} />{t("amenities.pool")}</span>
                  ) : null}
                </div>
                <div className="vp-footer">
                  <div className="vp-price">
                    {v.discount ? (<><span className="vp-price-old">{v.price} AZN</span> {Math.round(v.price * (1 - v.discount / 100))} AZN</>) : `${v.price} AZN`} <span>{t("villasPage.perNight")}</span>
                  </div>
                  <span className="vp-link">{t("villasPage.viewDetails")} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
