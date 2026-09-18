import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Waves, Thermometer, Flame, Mountain, Wind, Gamepad2, CloudFog, Droplets, TreePine, Building2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchApprovedListings, mapVillaListing } from "../../lib/listings";
import { useSeo } from "../../lib/seo";
import VillaCard from "../../components/VillaCard";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";

const CITIES = ALL_DESTINATIONS;
const GUEST_OPTIONS = [2, 4, 6, 8];
const PRIMARY_AMENITY_FILTERS = [
  { key: "pool", icon: Waves },
  { key: "heated_pool", icon: Thermometer },
];
const MORE_AMENITY_FILTERS = [
  { key: "fireplace", icon: Flame },
  { key: "mountain_view", icon: Mountain },
  { key: "swing", icon: Wind },
  { key: "kids_attraction", icon: Gamepad2 },
  { key: "steam_room", icon: CloudFog },
  { key: "jacuzzi", icon: Droplets },
  { key: "riverside", icon: Waves },
  { key: "in_mountains", icon: TreePine },
  { key: "downtown", icon: Building2 },
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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceOpen, setPriceOpen] = useState(false);
  const [amenityFilters, setAmenityFilters] = useState([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const priceRef = useRef(null);
  const moreRef = useRef(null);

  const toggleAmenity = (key) => {
    setAmenityFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  useEffect(() => {
    fetchApprovedListings("villa")
      .then((rows) => setVillas(rows.map(mapVillaListing)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!priceOpen) return;
    const onClick = (e) => { if (priceRef.current && !priceRef.current.contains(e.target)) setPriceOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setPriceOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [priceOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setMoreOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setGuests("");
    setMinPrice("");
    setMaxPrice("");
    setAmenityFilters([]);
    setMoreOpen(false);
    setSortBy("newest");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return villas.filter((v) => {
      if (cityParam && v.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (guests && v.guests < Number(guests)) return false;
      if (minPrice && v.price < Number(minPrice)) return false;
      if (maxPrice && v.price > Number(maxPrice)) return false;
      for (const key of amenityFilters) {
        if (key === "mountain_view") {
          if (!v.viewTypes?.includes("mountain")) return false;
        } else if (!v.amenities.includes(key)) {
          return false;
        }
      }
      return true;
    });
  }, [villas, cityParam, guests, minPrice, maxPrice, amenityFilters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "priceAsc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceDesc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [filtered, sortBy]);

  return (
    <div className="villas-page">
      <style>{`
        .villas-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .villas-page .vp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .villas-page .vp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .villas-page .vp-quick-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
        .villas-page .vp-quick-chip {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; border-radius: 999px;
          border: 1.5px solid var(--izigo-green); background: #fff; color: var(--izigo-green); font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s ease;
        }
        .villas-page .vp-quick-chip.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .villas-page .vp-quick-chip:hover:not(.active) { background: rgba(0,200,151,0.08); }
        .villas-page .vp-more-chip { gap: 6px; }
        .villas-page .vp-more-panel {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px 16px;
          border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; margin-bottom: 18px; background: #fafafa;
        }
        .villas-page .vp-more-item { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text); cursor: pointer; }
        .villas-page .vp-more-item input { width: 16px; height: 16px; accent-color: var(--izigo-green); cursor: pointer; }

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
        .villas-page .vp-field-price { position: relative; }
        .villas-page .vp-price-trigger {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
          text-align: left; cursor: pointer;
        }
        .villas-page .vp-price-trigger.active { border-color: var(--izigo-green); color: var(--izigo-green); font-weight: 700; }
        .villas-page .vp-price-backdrop { display: none; }
        .villas-page .vp-price-popover {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 20;
          background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 14px;
          box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: 10px; min-width: 220px;
        }
        .villas-page .vp-price-inputs { display: flex; align-items: center; gap: 8px; }
        .villas-page .vp-price-inputs input {
          width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 9px 10px;
          font-size: 13.5px; font-family: var(--sans); color: var(--text);
        }
        .villas-page .vp-price-sep { color: var(--text-soft); font-weight: 700; }
        .villas-page .vp-price-apply {
          border: none; border-radius: 10px; background: var(--izigo-green); color: #fff;
          font-weight: 700; font-size: 13.5px; padding: 10px; cursor: pointer;
        }
        .villas-page .vp-reset {
          border: none; background: none; color: var(--izigo-green); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .villas-page .vp-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .villas-page .vp-count { font-size: 14px; color: var(--text-soft); margin-bottom: 0; }
        .villas-page .vp-meta-actions { display: flex; align-items: center; gap: 14px; }
        .villas-page .vp-sort {
          border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px;
          font-size: 13px; color: var(--text); background: #fff; font-family: var(--sans);
        }

        .villas-page .vp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

        .villas-page .vp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .villas-page .vp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .villas-page { padding: 32px 5vw 56px; }
          .villas-page .vp-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .villas-page .vp-filters {
            flex-direction: row; flex-wrap: wrap; align-items: center; border: none; padding: 2px 0 4px; margin-bottom: 14px; gap: 8px;
          }
          .villas-page .vp-quick-chip { padding: 9px 14px; font-size: 13px; }
          .villas-page .vp-more-panel { grid-template-columns: repeat(2, 1fr); gap: 10px 12px; padding: 14px; }
          .villas-page .vp-more-item { font-size: 12.5px; }
          .villas-page .vp-field { flex: 0 0 auto; flex-direction: row; gap: 0; }
          .villas-page .vp-field label { display: none; }
          .villas-page .vp-field select { width: auto; min-width: 0; white-space: nowrap; padding: 7px 20px 7px 10px; font-size: 11.5px; border-radius: 999px; }
          .villas-page .vp-price-trigger { width: auto; min-width: 0; white-space: nowrap; padding: 7px 10px; font-size: 11.5px; border-radius: 999px; }
          .villas-page .vp-price-backdrop { display: block; position: fixed; inset: 0; background: rgba(15,23,20,0.35); z-index: 30; }
          .villas-page .vp-price-popover { position: fixed; top: 50%; left: 16px; right: 16px; transform: translateY(-50%); z-index: 31; width: auto; min-width: 0; }
          .villas-page .vp-meta-row { margin-bottom: 14px; }
          .villas-page .vp-count { font-size: 12.5px; }
          .villas-page .vp-meta-actions { gap: 10px; }
          .villas-page .vp-sort { padding: 6px 22px 6px 10px; font-size: 11.5px; border-radius: 999px; }
          .villas-page .vp-reset { padding: 0; font-size: 11.5px; }
          .villas-page .vc-body { padding: 8px !important; }
          .villas-page .vc-title { font-size: 13px !important; margin-bottom: 3px !important; min-height: 32px !important; line-height: 1.3 !important; }
          .villas-page .vc-city { font-size: 10px !important; margin-bottom: 2px !important; }
          .villas-page .vc-meta { font-size: 10px !important; gap: 6px !important; margin-bottom: 3px !important; flex-wrap: wrap; }
          .villas-page .vc-meta span { gap: 3px !important; }
          .villas-page .vc-meta svg { width: 11px !important; height: 11px !important; }
          .villas-page .vc-price { font-size: 14px !important; }
          .villas-page .vc-footer { margin-top: 4px !important; }
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

      <div ref={moreRef}>
        <div className="vp-quick-filters">
          {PRIMARY_AMENITY_FILTERS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`vp-quick-chip${amenityFilters.includes(key) ? " active" : ""}`}
              onClick={() => toggleAmenity(key)}
            >
              <Icon size={16} />{t(`amenities.${key}`)}
            </button>
          ))}
          <button
            type="button"
            className={`vp-quick-chip vp-more-chip${moreOpen ? " active" : ""}`}
            onClick={() => setMoreOpen((o) => !o)}
          >
            {t("villasPage.moreFilters")} {moreOpen ? "▲" : "▼"}
          </button>
        </div>

        {moreOpen && (
          <div className="vp-more-panel">
            {MORE_AMENITY_FILTERS.map(({ key, icon: Icon }) => (
              <label className="vp-more-item" key={key}>
                <input
                  type="checkbox"
                  checked={amenityFilters.includes(key)}
                  onChange={() => toggleAmenity(key)}
                />
                <Icon size={16} />
                <span>{t(`amenities.${key}`)}</span>
              </label>
            ))}
          </div>
        )}
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
            <option value="">{t("villasPage.filterGuests")}</option>
            {GUEST_OPTIONS.map((g) => <option key={g} value={g}>{g}+</option>)}
          </select>
        </div>
        <div className="vp-field vp-field-price" ref={priceRef}>
          <label>{t("villasPage.filterPrice")}</label>
          <button
            type="button"
            className={`vp-price-trigger${minPrice || maxPrice ? " active" : ""}`}
            onClick={() => setPriceOpen((o) => !o)}
          >
            {minPrice || maxPrice ? `${minPrice || "0"}–${maxPrice || "∞"} AZN` : t("villasPage.priceLabel")}
          </button>
          {priceOpen && (
            <>
              <div className="vp-price-backdrop" onClick={() => setPriceOpen(false)} />
              <div className="vp-price-popover">
                <div className="vp-price-inputs">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder={t("villasPage.priceMin")}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="vp-price-sep">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder={t("villasPage.priceMax")}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <button type="button" className="vp-price-apply" onClick={() => setPriceOpen(false)}>
                  {t("villasPage.applyPrice")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="vp-meta-row">
        <p className="vp-count">{t("villasPage.resultsCount").replace("{count}", sorted.length)}</p>
        <div className="vp-meta-actions">
          <select className="vp-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">{t("sort.label")}</option>
            <option value="priceAsc">{t("sort.priceAsc")}</option>
            <option value="priceDesc">{t("sort.priceDesc")}</option>
          </select>
          <button type="button" className="vp-reset" onClick={resetFilters}>{t("villasPage.resetFilters")}</button>
        </div>
      </div>

      {loading ? null : sorted.length === 0 ? (
        <div className="vp-empty">{t("villasPage.noResults")}</div>
      ) : (
        <div className="vp-grid">
          {sorted.map((v) => <VillaCard villa={v} key={v.id} />)}
        </div>
      )}
    </div>
  );
}
