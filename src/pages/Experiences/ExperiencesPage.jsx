import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Users, Car, Footprints } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchApprovedListings, toneForId } from "../../lib/listings";
import SaveHeart from "../../components/SaveHeart";

const CITIES = ["Baku", "Gabala", "Guba"];
const PRICE_OPTIONS = [30, 50, 75, 100];

export default function ExperiencesPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  const [vehicle, setVehicle] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedListings("transfer")
      .then((rows) => setTours(rows
        .filter((row) => row.details?.type === "tour")
        .map((row) => ({
          id: row.id,
          city: row.city,
          tone: toneForId(row.id),
          title: row.title,
          price: row.price,
          discount: row.discount,
          hasVehicle: !!row.details?.hasVehicle,
          seats: row.details?.seats || 0,
        }))))
      .finally(() => setLoading(false));
  }, []);

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setVehicle("");
    setMaxPrice("");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return tours.filter((item) => {
      if (cityParam && item.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (vehicle === "with" && !item.hasVehicle) return false;
      if (vehicle === "without" && item.hasVehicle) return false;
      if (maxPrice && item.price > Number(maxPrice)) return false;
      return true;
    });
  }, [tours, cityParam, vehicle, maxPrice]);

  return (
    <div className="experiences-page">
      <style>{`
        .experiences-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .experiences-page .xp-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .experiences-page .xp-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .experiences-page .xp-filters {
          display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px;
          border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 28px;
        }
        .experiences-page .xp-field { display: flex; flex-direction: column; gap: 6px; }
        .experiences-page .xp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .experiences-page .xp-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
        }
        .experiences-page .xp-reset {
          border: none; background: none; color: var(--izigo-orange); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .experiences-page .xp-count { font-size: 14px; color: var(--text-soft); margin-bottom: 20px; }

        .experiences-page .xp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .experiences-page .xp-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .experiences-page .xp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .experiences-page .xp-thumb { aspect-ratio: 4 / 2.8; position: relative; }
        .experiences-page .xp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .experiences-page .xp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .experiences-page .xp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .experiences-page .xp-badge {
          position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.92); color: var(--text); font-size: 11.5px; font-weight: 700;
          padding: 5px 10px; border-radius: 999px;
        }
        .experiences-page .xp-body { padding: 18px; }
        .experiences-page .xp-city { display: flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange); margin-bottom: 6px; }
        .experiences-page .xp-title { font-size: 15.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.4; }
        .experiences-page .xp-meta { display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--text-soft); margin-bottom: 14px; }
        .experiences-page .xp-meta span { display: flex; align-items: center; gap: 5px; }
        .experiences-page .xp-footer { display: flex; align-items: center; justify-content: space-between; }
        .experiences-page .xp-price { font-size: 16px; font-weight: 800; color: var(--text); }
        .experiences-page .xp-price span { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
        .experiences-page .xp-price-old { font-size: 12.5px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .experiences-page .xp-link { font-size: 13px; font-weight: 700; color: var(--izigo-orange); }

        .experiences-page .xp-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .experiences-page .xp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .experiences-page { padding: 32px 5vw 56px; }
          .experiences-page .xp-grid { grid-template-columns: 1fr; }
          .experiences-page .xp-filters { flex-direction: column; align-items: stretch; }
          .experiences-page .xp-field select { width: 100%; }
        }
      `}</style>

      <div className="xp-head">
        <h1>{t("experiencesPage.heading")}</h1>
        <p>{t("experiencesPage.subtitle")}</p>
      </div>

      <div className="xp-filters">
        <div className="xp-field">
          <label>{t("transfersPage.filterCity")}</label>
          <select value={cityParam} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t("transfersPage.allCities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="xp-field">
          <label>{t("transfersPage.filterVehicle")}</label>
          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="">{t("transfersPage.anyVehicle")}</option>
            <option value="with">{t("transfersPage.withVehicle")}</option>
            <option value="without">{t("transfersPage.withoutVehicle")}</option>
          </select>
        </div>
        <div className="xp-field">
          <label>{t("transfersPage.filterPrice")}</label>
          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">{t("transfersPage.anyPrice")}</option>
            {PRICE_OPTIONS.map((p) => <option key={p} value={p}>≤ {p} AZN</option>)}
          </select>
        </div>
        <button type="button" className="xp-reset" onClick={resetFilters}>{t("transfersPage.resetFilters")}</button>
      </div>

      <p className="xp-count">{t("experiencesPage.resultsCount").replace("{count}", filtered.length)}</p>

      {loading ? null : filtered.length === 0 ? (
        <div className="xp-empty">{t("experiencesPage.noResults")}</div>
      ) : (
        <div className="xp-grid">
          {filtered.map((item) => (
            <Link to={`/experiences/${item.id}`} className="xp-card" key={item.id}>
              <SaveHeart type="experience" id={item.id} />
              <div className={`xp-thumb ${item.tone}`}>
                <span className="xp-badge">
                  {item.hasVehicle ? <Car size={12} /> : <Footprints size={12} />}
                  {item.hasVehicle ? t("transfersPage.withVehicle") : t("transfersPage.withoutVehicle")}
                </span>
              </div>
              <div className="xp-body">
                <div className="xp-city"><MapPin size={12} />{item.city}</div>
                <div className="xp-title">{item.title[language] || item.title.en}</div>
                <div className="xp-meta">
                  <span><Users size={14} />{item.seats} {t("transfersPage.seatsUnit")}</span>
                </div>
                <div className="xp-footer">
                  <div className="xp-price">
                    {item.discount ? (<><span className="xp-price-old">{item.price} AZN</span> {Math.round(item.price * (1 - item.discount / 100))} AZN</>) : `${item.price} AZN`} <span>{t("transfersPage.perPerson")}</span>
                  </div>
                  <span className="xp-link">{t("transfersPage.viewDetails")} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
