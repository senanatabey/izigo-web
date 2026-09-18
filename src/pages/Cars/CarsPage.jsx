import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Users, Settings2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { fetchApprovedListings, toneForId } from "../../lib/listings";
import { useSeo } from "../../lib/seo";
import SaveHeart from "../../components/SaveHeart";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";

const CITIES = ALL_DESTINATIONS;
const SEAT_OPTIONS = [2, 5, 7];

export default function CarsPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  useSeo({
    title: "Rent a Car in Azerbaijan — No Agency Markup",
    description: "Rent a car directly from local owners in Baku, Gabala and Guba — no agency markup, no hidden fees, contact on WhatsApp.",
    path: "/cars",
  });

  const [seats, setSeats] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceOpen, setPriceOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const priceRef = useRef(null);

  useEffect(() => {
    fetchApprovedListings("car")
      .then((rows) => setCars(rows.map((row) => ({
        id: row.id,
        city: row.city,
        tone: toneForId(row.id),
        title: row.title,
        price: row.price,
        discount: row.discount,
        seats: row.details?.seats || 0,
        transmission: row.details?.transmission || "automatic",
        image: row.images?.[0],
      }))))
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

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSeats("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return cars.filter((c) => {
      if (cityParam && c.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (seats && c.seats < Number(seats)) return false;
      if (minPrice && c.price < Number(minPrice)) return false;
      if (maxPrice && c.price > Number(maxPrice)) return false;
      return true;
    });
  }, [cars, cityParam, seats, minPrice, maxPrice]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "priceAsc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceDesc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [filtered, sortBy]);

  return (
    <div className="cars-page">
      <style>{`
        .cars-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .cars-page .cp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .cars-page .cp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .cars-page .cp-filters {
          display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px;
          border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 28px;
        }
        .cars-page .cp-field { display: flex; flex-direction: column; gap: 6px; }
        .cars-page .cp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .cars-page .cp-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
        }
        .cars-page .cp-field-price { position: relative; }
        .cars-page .cp-price-trigger {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
          text-align: left; cursor: pointer;
        }
        .cars-page .cp-price-trigger.active { border-color: var(--izigo-orange); color: var(--izigo-orange); font-weight: 700; }
        .cars-page .cp-price-backdrop { display: none; }
        .cars-page .cp-price-popover {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 20;
          background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 14px;
          box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: 10px; min-width: 220px;
        }
        .cars-page .cp-price-inputs { display: flex; align-items: center; gap: 8px; }
        .cars-page .cp-price-inputs input {
          width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 9px 10px;
          font-size: 13.5px; font-family: var(--sans); color: var(--text);
        }
        .cars-page .cp-price-sep { color: var(--text-soft); font-weight: 700; }
        .cars-page .cp-price-apply {
          border: none; border-radius: 10px; background: var(--izigo-orange); color: #fff;
          font-weight: 700; font-size: 13.5px; padding: 10px; cursor: pointer;
        }
        .cars-page .cp-reset {
          border: none; background: none; color: var(--izigo-orange); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .cars-page .cp-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .cars-page .cp-count { font-size: 14px; color: var(--text-soft); margin-bottom: 0; }
        .cars-page .cp-meta-actions { display: flex; align-items: center; gap: 14px; }
        .cars-page .cp-sort {
          border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px;
          font-size: 13px; color: var(--text); background: #fff; font-family: var(--sans);
        }

        .cars-page .cp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .cars-page .cp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .cars-page .cp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .cars-page .cp-thumb { aspect-ratio: 4 / 2.8; background-size: cover; background-position: center; }
        .cars-page .cp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .cars-page .cp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .cars-page .cp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .cars-page .cp-body { padding: 18px; }
        .cars-page .cp-city { display: flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange); margin-bottom: 6px; }
        .cars-page .cp-title { font-size: 15.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.4; }
        .cars-page .cp-meta { display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--text-soft); margin-bottom: 14px; }
        .cars-page .cp-meta span { display: flex; align-items: center; gap: 5px; }
        .cars-page .cp-footer { display: flex; align-items: center; justify-content: space-between; }
        .cars-page .cp-price { font-size: 16px; font-weight: 800; color: var(--text); }
        .cars-page .cp-price span { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
        .cars-page .cp-price-old { font-size: 12.5px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .cars-page .cp-link { font-size: 13px; font-weight: 700; color: var(--izigo-orange); }

        .cars-page .cp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .cars-page .cp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .cars-page { padding: 32px 5vw 56px; }
          .cars-page .cp-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .cars-page .cp-filters {
            flex-direction: row; flex-wrap: wrap; align-items: center; border: none; padding: 2px 0 4px; margin-bottom: 14px; gap: 8px;
          }
          .cars-page .cp-field { flex: 0 0 auto; flex-direction: row; gap: 0; }
          .cars-page .cp-field label { display: none; }
          .cars-page .cp-field select { width: auto; min-width: 0; white-space: nowrap; padding: 7px 20px 7px 10px; font-size: 11.5px; border-radius: 999px; }
          .cars-page .cp-price-trigger { width: auto; min-width: 0; white-space: nowrap; padding: 7px 10px; font-size: 11.5px; border-radius: 999px; }
          .cars-page .cp-price-backdrop { display: block; position: fixed; inset: 0; background: rgba(15,23,20,0.35); z-index: 30; }
          .cars-page .cp-price-popover { position: fixed; top: 50%; left: 16px; right: 16px; transform: translateY(-50%); z-index: 31; width: auto; min-width: 0; }
          .cars-page .cp-meta-row { margin-bottom: 14px; }
          .cars-page .cp-count { font-size: 12.5px; }
          .cars-page .cp-meta-actions { gap: 10px; }
          .cars-page .cp-sort { padding: 6px 22px 6px 10px; font-size: 11.5px; border-radius: 999px; }
          .cars-page .cp-reset { padding: 0; font-size: 11.5px; }
          .cars-page .cp-body { padding: 8px; }
          .cars-page .cp-title { font-size: 13px; margin-bottom: 3px; line-height: 1.3; }
          .cars-page .cp-city { font-size: 10px; margin-bottom: 2px; }
          .cars-page .cp-meta { font-size: 10px; gap: 6px; margin-bottom: 3px; flex-wrap: wrap; }
          .cars-page .cp-meta span { gap: 3px; }
          .cars-page .cp-meta svg { width: 11px; height: 11px; }
          .cars-page .cp-price { font-size: 14px; }
          .cars-page .cp-footer { margin-top: 4px; }
          .cars-page .cp-link { display: none; }
          .cars-page .cp-card .save-heart {
            width: 30px; height: 30px; top: 6px; right: 6px;
            background: none; box-shadow: none;
          }
          .cars-page .cp-card .save-heart svg {
            width: 22px; height: 22px; color: #fff;
            filter: drop-shadow(0 0 2px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.5));
          }
          .cars-page .cp-card .save-heart.active svg { color: var(--izigo-orange); }
        }
      `}</style>

      <div className="cp-head">
        <h1>{t("carsPage.heading")}</h1>
        <p>{t("carsPage.subtitle")}</p>
      </div>

      <div className="cp-filters">
        <div className="cp-field">
          <label>{t("carsPage.filterCity")}</label>
          <select value={cityParam} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t("carsPage.allCities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{cityLabel(c, language)}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>{t("carsPage.filterSeats")}</label>
          <select value={seats} onChange={(e) => setSeats(e.target.value)}>
            <option value="">{t("carsPage.anySeats")}</option>
            {SEAT_OPTIONS.map((s) => <option key={s} value={s}>{s}+</option>)}
          </select>
        </div>
        <div className="cp-field cp-field-price" ref={priceRef}>
          <label>{t("carsPage.filterPrice")}</label>
          <button
            type="button"
            className={`cp-price-trigger${minPrice || maxPrice ? " active" : ""}`}
            onClick={() => setPriceOpen((o) => !o)}
          >
            {minPrice || maxPrice ? `${minPrice || "0"}–${maxPrice || "∞"} AZN` : t("carsPage.priceLabel")}
          </button>
          {priceOpen && (
            <>
              <div className="cp-price-backdrop" onClick={() => setPriceOpen(false)} />
              <div className="cp-price-popover">
                <div className="cp-price-inputs">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder={t("carsPage.priceMin")}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="cp-price-sep">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder={t("carsPage.priceMax")}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <button type="button" className="cp-price-apply" onClick={() => setPriceOpen(false)}>
                  {t("carsPage.applyPrice")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="cp-meta-row">
        <p className="cp-count">{t("carsPage.resultsCount").replace("{count}", sorted.length)}</p>
        <div className="cp-meta-actions">
          <select className="cp-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">{t("sort.label")}</option>
            <option value="priceAsc">{t("sort.priceAsc")}</option>
            <option value="priceDesc">{t("sort.priceDesc")}</option>
          </select>
          <button type="button" className="cp-reset" onClick={resetFilters}>{t("carsPage.resetFilters")}</button>
        </div>
      </div>

      {loading ? null : sorted.length === 0 ? (
        <div className="cp-empty">{t("carsPage.noResults")}</div>
      ) : (
        <div className="cp-grid">
          {sorted.map((c) => (
            <Link to={`/cars/${c.id}`} className="cp-card" key={c.id}>
              <SaveHeart type="car" id={c.id} />
              <div className={`cp-thumb ${c.image ? "" : c.tone}`} style={c.image ? { backgroundImage: `url("${c.image}")` } : undefined} />
              <div className="cp-body">
                <div className="cp-city"><MapPin size={12} />{cityLabel(c.city, language)}</div>
                <div className="cp-title">{c.title[language] || c.title.en}</div>
                <div className="cp-meta">
                  <span><Users size={14} />{c.seats} {t("carsPage.seatsUnit")}</span>
                  <span><Settings2 size={14} />{t(`addListing.${c.transmission}`)}</span>
                </div>
                <div className="cp-footer">
                  <div className="cp-price">
                    {c.discount ? (<><span className="cp-price-old">{formatPrice(c.price)}</span> {formatPrice(Math.round(c.price * (1 - c.discount / 100)))}</>) : formatPrice(c.price)} <span>{t("carsPage.perDay")}</span>
                  </div>
                  <span className="cp-link">{t("carsPage.viewDetails")} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
