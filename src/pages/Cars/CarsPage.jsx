import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Users, Settings2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { MOCK_CARS } from "../../data/mockListings";

const CITIES = ["Baku", "Gabala", "Guba"];
const SEAT_OPTIONS = [2, 5, 7];
const PRICE_OPTIONS = [40, 50, 60, 80];

export default function CarsPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  const [seats, setSeats] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSeats("");
    setMaxPrice("");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return MOCK_CARS.filter((c) => {
      if (cityParam && c.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (seats && c.seats < Number(seats)) return false;
      if (maxPrice && c.price > Number(maxPrice)) return false;
      return true;
    });
  }, [cityParam, seats, maxPrice]);

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
        .cars-page .cp-reset {
          border: none; background: none; color: var(--izigo-orange); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .cars-page .cp-count { font-size: 14px; color: var(--text-soft); margin-bottom: 20px; }

        .cars-page .cp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .cars-page .cp-card { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .cars-page .cp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .cars-page .cp-thumb { aspect-ratio: 4 / 2.8; }
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
        .cars-page .cp-link { font-size: 13px; font-weight: 700; color: var(--izigo-orange); }

        .cars-page .cp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .cars-page .cp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .cars-page { padding: 32px 5vw 56px; }
          .cars-page .cp-grid { grid-template-columns: 1fr; }
          .cars-page .cp-filters { flex-direction: column; align-items: stretch; }
          .cars-page .cp-field select { width: 100%; }
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
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>{t("carsPage.filterSeats")}</label>
          <select value={seats} onChange={(e) => setSeats(e.target.value)}>
            <option value="">{t("carsPage.anySeats")}</option>
            {SEAT_OPTIONS.map((s) => <option key={s} value={s}>{s}+</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>{t("carsPage.filterPrice")}</label>
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t("carsPage.anyPrice")}</option>
            {PRICE_OPTIONS.map((p) => <option key={p} value={p}>≤ {p} AZN</option>)}
          </select>
        </div>
        <button type="button" className="cp-reset" onClick={resetFilters}>{t("carsPage.resetFilters")}</button>
      </div>

      <p className="cp-count">{t("carsPage.resultsCount").replace("{count}", filtered.length)}</p>

      {filtered.length === 0 ? (
        <div className="cp-empty">{t("carsPage.noResults")}</div>
      ) : (
        <div className="cp-grid">
          {filtered.map((c) => (
            <Link to={`/cars/${c.id}`} className="cp-card" key={c.id}>
              <div className={`cp-thumb ${c.tone}`} />
              <div className="cp-body">
                <div className="cp-city"><MapPin size={12} />{c.city}</div>
                <div className="cp-title">{c.title[language] || c.title.en}</div>
                <div className="cp-meta">
                  <span><Users size={14} />{c.seats} {t("carsPage.seatsUnit")}</span>
                  <span><Settings2 size={14} />{c.transmission[language] || c.transmission.en}</span>
                </div>
                <div className="cp-footer">
                  <div className="cp-price">{c.price} AZN <span>{t("carsPage.perDay")}</span></div>
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
