import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Users, Car, Footprints } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { fetchApprovedListings, toneForId } from "../../lib/listings";
import { useSeo } from "../../lib/seo";
import SaveHeart from "../../components/SaveHeart";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";

const CITIES = ALL_DESTINATIONS;

export default function TransfersPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  useSeo({
    title: "Transfers & Tours in Azerbaijan",
    description: "Airport transfers, intercity rides and guided tours in Azerbaijan — booked directly with local drivers and guides on WhatsApp.",
    path: "/transfers",
  });

  const [type, setType] = useState(() => searchParams.get("type") || "");
  const [vehicle, setVehicle] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceOpen, setPriceOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const priceRef = useRef(null);

  useEffect(() => {
    fetchApprovedListings("transfer")
      .then((rows) => setItems(rows.map((row) => ({
        id: row.id,
        city: row.city,
        tone: toneForId(row.id),
        title: row.title,
        price: row.price,
        type: row.details?.type || "transfer",
        hasVehicle: !!row.details?.hasVehicle,
        seats: row.details?.seats || 0,
        discount: row.discount,
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
    setType("");
    setVehicle("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (cityParam && item.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (type && item.type !== type) return false;
      if (vehicle === "with" && !item.hasVehicle) return false;
      if (vehicle === "without" && item.hasVehicle) return false;
      if (minPrice && item.price < Number(minPrice)) return false;
      if (maxPrice && item.price > Number(maxPrice)) return false;
      return true;
    });
  }, [items, cityParam, type, vehicle, minPrice, maxPrice]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "priceAsc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceDesc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [filtered, sortBy]);

  return (
    <div className="transfers-page">
      <style>{`
        .transfers-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .transfers-page .tp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .transfers-page .tp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .transfers-page .tp-filters {
          display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px;
          border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 28px;
        }
        .transfers-page .tp-field { display: flex; flex-direction: column; gap: 6px; }
        .transfers-page .tp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .transfers-page .tp-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
        }
        .transfers-page .tp-field-price { position: relative; }
        .transfers-page .tp-price-trigger {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
          text-align: left; cursor: pointer;
        }
        .transfers-page .tp-price-trigger.active { border-color: var(--izigo-orange); color: var(--izigo-orange); font-weight: 700; }
        .transfers-page .tp-price-backdrop { display: none; }
        .transfers-page .tp-price-popover {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 20;
          background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 14px;
          box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: 10px; min-width: 220px;
        }
        .transfers-page .tp-price-inputs { display: flex; align-items: center; gap: 8px; }
        .transfers-page .tp-price-inputs input {
          width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 9px 10px;
          font-size: 13.5px; font-family: var(--sans); color: var(--text);
        }
        .transfers-page .tp-price-sep { color: var(--text-soft); font-weight: 700; }
        .transfers-page .tp-price-apply {
          border: none; border-radius: 10px; background: var(--izigo-orange); color: #fff;
          font-weight: 700; font-size: 13.5px; padding: 10px; cursor: pointer;
        }
        .transfers-page .tp-reset {
          border: none; background: none; color: var(--izigo-orange); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .transfers-page .tp-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .transfers-page .tp-count { font-size: 14px; color: var(--text-soft); margin-bottom: 0; }
        .transfers-page .tp-meta-actions { display: flex; align-items: center; gap: 14px; }
        .transfers-page .tp-sort {
          border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px;
          font-size: 13px; color: var(--text); background: #fff; font-family: var(--sans);
        }

        .transfers-page .tp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .transfers-page .tp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .transfers-page .tp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .transfers-page .tp-thumb { aspect-ratio: 4 / 2.8; position: relative; background-size: cover; background-position: center; }
        .transfers-page .tp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .transfers-page .tp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .transfers-page .tp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .transfers-page .tp-badge {
          position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.92); color: var(--text); font-size: 11.5px; font-weight: 700;
          padding: 5px 10px; border-radius: 999px;
        }
        .transfers-page .tp-body { padding: 18px; }
        .transfers-page .tp-city { display: flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange); margin-bottom: 6px; }
        .transfers-page .tp-title { font-size: 15.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.4; }
        .transfers-page .tp-meta { display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--text-soft); margin-bottom: 14px; }
        .transfers-page .tp-meta span { display: flex; align-items: center; gap: 5px; }
        .transfers-page .tp-footer { display: flex; align-items: center; justify-content: space-between; }
        .transfers-page .tp-price { font-size: 16px; font-weight: 800; color: var(--text); }
        .transfers-page .tp-price span { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
        .transfers-page .tp-price-old { font-size: 12.5px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .transfers-page .tp-link { font-size: 13px; font-weight: 700; color: var(--izigo-orange); }

        .transfers-page .tp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .transfers-page .tp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .transfers-page { padding: 32px 5vw 56px; }
          .transfers-page .tp-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .transfers-page .tp-filters {
            flex-direction: row; flex-wrap: wrap; align-items: center; border: none; padding: 2px 0 4px; margin-bottom: 14px; gap: 8px;
          }
          .transfers-page .tp-field { flex: 0 0 auto; flex-direction: row; gap: 0; }
          .transfers-page .tp-field label { display: none; }
          .transfers-page .tp-field select { width: auto; min-width: 0; white-space: nowrap; padding: 7px 20px 7px 10px; font-size: 11.5px; border-radius: 999px; }
          .transfers-page .tp-price-trigger { width: auto; min-width: 0; white-space: nowrap; padding: 7px 10px; font-size: 11.5px; border-radius: 999px; }
          .transfers-page .tp-price-backdrop { display: block; position: fixed; inset: 0; background: rgba(15,23,20,0.35); z-index: 30; }
          .transfers-page .tp-price-popover { position: fixed; top: 50%; left: 16px; right: 16px; transform: translateY(-50%); z-index: 31; width: auto; min-width: 0; }
          .transfers-page .tp-meta-row { margin-bottom: 14px; }
          .transfers-page .tp-count { font-size: 12.5px; }
          .transfers-page .tp-meta-actions { gap: 10px; }
          .transfers-page .tp-sort { padding: 6px 22px 6px 10px; font-size: 11.5px; border-radius: 999px; }
          .transfers-page .tp-reset { padding: 0; font-size: 11.5px; }
          .transfers-page .tp-badge { font-size: 10px; padding: 4px 8px; }
          .transfers-page .tp-body { padding: 8px; }
          .transfers-page .tp-title { font-size: 13px; margin-bottom: 3px; line-height: 1.3; }
          .transfers-page .tp-city { font-size: 10px; margin-bottom: 2px; }
          .transfers-page .tp-meta { font-size: 10px; gap: 6px; margin-bottom: 3px; flex-wrap: wrap; }
          .transfers-page .tp-meta span { gap: 3px; }
          .transfers-page .tp-meta svg { width: 11px; height: 11px; }
          .transfers-page .tp-price { font-size: 14px; }
          .transfers-page .tp-footer { margin-top: 4px; }
          .transfers-page .tp-link { display: none; }
          .transfers-page .tp-card .save-heart {
            width: 30px; height: 30px; top: 6px; right: 6px;
            background: none; box-shadow: none;
          }
          .transfers-page .tp-card .save-heart svg {
            width: 22px; height: 22px; color: #fff;
            filter: drop-shadow(0 0 2px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.5));
          }
          .transfers-page .tp-card .save-heart.active svg { color: var(--izigo-orange); }
        }
      `}</style>

      <div className="tp-head">
        <h1>{t("transfersPage.heading")}</h1>
        <p>{t("transfersPage.subtitle")}</p>
      </div>

      <div className="tp-filters">
        <div className="tp-field">
          <label>{t("transfersPage.filterCity")}</label>
          <select value={cityParam} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t("transfersPage.allCities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{cityLabel(c, language)}</option>)}
          </select>
        </div>
        <div className="tp-field">
          <label>{t("transfersPage.filterType")}</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t("transfersPage.allTypes")}</option>
            <option value="transfer">{t("transfersPage.typeTransfer")}</option>
            <option value="tour">{t("transfersPage.typeTour")}</option>
          </select>
        </div>
        <div className="tp-field">
          <label>{t("transfersPage.filterVehicle")}</label>
          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="">{t("transfersPage.anyVehicle")}</option>
            <option value="with">{t("transfersPage.withVehicle")}</option>
            <option value="without">{t("transfersPage.withoutVehicle")}</option>
          </select>
        </div>
        <div className="tp-field tp-field-price" ref={priceRef}>
          <label>{t("transfersPage.filterPrice")}</label>
          <button
            type="button"
            className={`tp-price-trigger${minPrice || maxPrice ? " active" : ""}`}
            onClick={() => setPriceOpen((o) => !o)}
          >
            {minPrice || maxPrice ? `${minPrice || "0"}–${maxPrice || "∞"} AZN` : t("transfersPage.priceLabel")}
          </button>
          {priceOpen && (
            <>
              <div className="tp-price-backdrop" onClick={() => setPriceOpen(false)} />
              <div className="tp-price-popover">
                <div className="tp-price-inputs">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder={t("transfersPage.priceMin")}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="tp-price-sep">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder={t("transfersPage.priceMax")}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <button type="button" className="tp-price-apply" onClick={() => setPriceOpen(false)}>
                  {t("transfersPage.applyPrice")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="tp-meta-row">
        <p className="tp-count">{t("transfersPage.resultsCount").replace("{count}", sorted.length)}</p>
        <div className="tp-meta-actions">
          <select className="tp-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">{t("sort.label")}</option>
            <option value="priceAsc">{t("sort.priceAsc")}</option>
            <option value="priceDesc">{t("sort.priceDesc")}</option>
          </select>
          <button type="button" className="tp-reset" onClick={resetFilters}>{t("transfersPage.resetFilters")}</button>
        </div>
      </div>

      {loading ? null : sorted.length === 0 ? (
        <div className="tp-empty">{t("transfersPage.noResults")}</div>
      ) : (
        <div className="tp-grid">
          {sorted.map((item) => (
            <Link to={`/transfers/${item.id}`} className="tp-card" key={item.id}>
              <SaveHeart type="transfer" id={item.id} />
              <div className={`tp-thumb ${item.image ? "" : item.tone}`} style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined}>
                <span className="tp-badge">
                  {item.hasVehicle ? <Car size={12} /> : <Footprints size={12} />}
                  {item.hasVehicle ? t("transfersPage.withVehicle") : t("transfersPage.withoutVehicle")}
                </span>
              </div>
              <div className="tp-body">
                <div className="tp-city"><MapPin size={12} />{cityLabel(item.city, language)}</div>
                <div className="tp-title">{item.title[language] || item.title.en}</div>
                <div className="tp-meta">
                  <span>{item.type === "tour" ? t("transfersPage.typeTour") : t("transfersPage.typeTransfer")}</span>
                  <span><Users size={14} />{item.seats} {t("transfersPage.seatsUnit")}</span>
                </div>
                <div className="tp-footer">
                  <div className="tp-price">
                    {item.discount ? (<><span className="tp-price-old">{formatPrice(item.price)}</span> {formatPrice(Math.round(item.price * (1 - item.discount / 100)))}</>) : formatPrice(item.price)} <span>{t("transfersPage.perPerson")}</span>
                  </div>
                  <span className="tp-link">{t("transfersPage.viewDetails")} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
