import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Waves, Thermometer, Flame } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchApprovedListings, mapVillaListing } from "../../lib/listings";
import { useSeo } from "../../lib/seo";
import VillaCard from "../../components/VillaCard";
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
    description: "Villas and homes in Baku, Gabala and Guba — with or without a pool — contact the host directly on WhatsApp, no commission.",
    path: "/villas",
  });

  const [guests, setGuests] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [amenityFilter, setAmenityFilter] = useState("");
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedListings("villa")
      .then((rows) => setVillas(rows.map(mapVillaListing)))
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

        .villas-page .vp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .villas-page .vp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .villas-page { padding: 32px 5vw 56px; }
          .villas-page .vp-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .villas-page .vp-filters { flex-direction: column; align-items: stretch; position: relative; padding-top: 46px; }
          .villas-page .vp-reset { position: absolute; top: 16px; right: 16px; padding: 0; font-size: 12.5px; }
          .villas-page .vp-quick-chip { padding: 9px 14px; font-size: 13px; }
          .villas-page .vp-field select { width: 100%; }
          .villas-page .vc-body { padding: 10px; }
          .villas-page .vc-title { font-size: 13.5px; margin-bottom: 4px; min-height: 36px; }
          .villas-page .vc-city { font-size: 10.5px; margin-bottom: 3px; }
          .villas-page .vc-meta { font-size: 10.5px; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
          .villas-page .vc-price { font-size: 14px; }
          .villas-page .vc-link { display: none; }
          .villas-page .vc-amenity-overlay { font-size: 10px; padding: 3px 8px; }
          .villas-page .villa-card .save-heart {
            width: 30px; height: 30px; top: 6px; right: 6px;
            background: none; box-shadow: none;
          }
          .villas-page .villa-card .save-heart svg {
            width: 22px; height: 22px; color: #fff;
            filter: drop-shadow(0 0 2px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.5));
          }
          .villas-page .villa-card .save-heart.active svg { color: var(--izigo-orange); }
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
          {filtered.map((v) => <VillaCard villa={v} key={v.id} />)}
        </div>
      )}
    </div>
  );
}
