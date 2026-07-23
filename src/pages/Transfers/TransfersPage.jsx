import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Users, Car, Footprints } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { MOCK_TRANSFERS } from "../../data/mockListings";

const CITIES = ["Baku", "Gabala", "Guba"];
const PRICE_OPTIONS = [30, 50, 75, 100];

export default function TransfersPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  const [type, setType] = useState(() => searchParams.get("type") || "");
  const [vehicle, setVehicle] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setType("");
    setVehicle("");
    setMaxPrice("");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return MOCK_TRANSFERS.filter((item) => {
      if (cityParam && item.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (type && item.type !== type) return false;
      if (vehicle === "with" && !item.hasVehicle) return false;
      if (vehicle === "without" && item.hasVehicle) return false;
      if (maxPrice && item.price > Number(maxPrice)) return false;
      return true;
    });
  }, [cityParam, type, vehicle, maxPrice]);

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
        .transfers-page .tp-reset {
          border: none; background: none; color: var(--izigo-orange); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .transfers-page .tp-count { font-size: 14px; color: var(--text-soft); margin-bottom: 20px; }

        .transfers-page .tp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .transfers-page .tp-card { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .transfers-page .tp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .transfers-page .tp-thumb { aspect-ratio: 4 / 2.8; position: relative; }
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
        .transfers-page .tp-link { font-size: 13px; font-weight: 700; color: var(--izigo-orange); }

        .transfers-page .tp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .transfers-page .tp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .transfers-page { padding: 32px 5vw 56px; }
          .transfers-page .tp-grid { grid-template-columns: 1fr; }
          .transfers-page .tp-filters { flex-direction: column; align-items: stretch; }
          .transfers-page .tp-field select { width: 100%; }
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
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
        <div className="tp-field">
          <label>{t("transfersPage.filterPrice")}</label>
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t("transfersPage.anyPrice")}</option>
            {PRICE_OPTIONS.map((p) => <option key={p} value={p}>≤ {p} AZN</option>)}
          </select>
        </div>
        <button type="button" className="tp-reset" onClick={resetFilters}>{t("transfersPage.resetFilters")}</button>
      </div>

      <p className="tp-count">{t("transfersPage.resultsCount").replace("{count}", filtered.length)}</p>

      {filtered.length === 0 ? (
        <div className="tp-empty">{t("transfersPage.noResults")}</div>
      ) : (
        <div className="tp-grid">
          {filtered.map((item) => (
            <Link to={`/transfers/${item.id}`} className="tp-card" key={item.id}>
              <div className={`tp-thumb ${item.tone}`}>
                <span className="tp-badge">
                  {item.hasVehicle ? <Car size={12} /> : <Footprints size={12} />}
                  {item.hasVehicle ? t("transfersPage.withVehicle") : t("transfersPage.withoutVehicle")}
                </span>
              </div>
              <div className="tp-body">
                <div className="tp-city"><MapPin size={12} />{item.city}</div>
                <div className="tp-title">{item.title[language] || item.title.en}</div>
                <div className="tp-meta">
                  <span>{item.type === "tour" ? t("transfersPage.typeTour") : t("transfersPage.typeTransfer")}</span>
                  <span><Users size={14} />{item.seats} {t("transfersPage.seatsUnit")}</span>
                </div>
                <div className="tp-footer">
                  <div className="tp-price">{item.price} AZN <span>{t("transfersPage.perPerson")}</span></div>
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
