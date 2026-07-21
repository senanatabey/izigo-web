import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { MOCK_EVENTS } from "../../data/mockListings";

const CITIES = ["Baku", "Gabala", "Guba"];

export default function EventsPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => setSearchParams({});

  const filtered = useMemo(() => {
    return MOCK_EVENTS.filter((e) => {
      if (cityParam && e.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      return true;
    });
  }, [cityParam]);

  const formatDate = (iso) => new Date(iso).toLocaleDateString(language === "az" ? "az-AZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="events-page">
      <style>{`
        .events-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .events-page .ep-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .events-page .ep-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 32px; }

        .events-page .ep-filters {
          display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px;
          border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 28px;
        }
        .events-page .ep-field { display: flex; flex-direction: column; gap: 6px; }
        .events-page .ep-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .events-page .ep-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 160px; font-family: var(--sans);
        }
        .events-page .ep-reset {
          border: none; background: none; color: var(--izigo-orange); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .events-page .ep-count { font-size: 14px; color: var(--text-soft); margin-bottom: 20px; }

        .events-page .ep-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .events-page .ep-card { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .events-page .ep-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .events-page .ep-thumb { aspect-ratio: 4 / 2.8; }
        .events-page .ep-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .events-page .ep-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .events-page .ep-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .events-page .ep-body { padding: 18px; }
        .events-page .ep-city { display: flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange); margin-bottom: 6px; }
        .events-page .ep-title { font-size: 15.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.4; }
        .events-page .ep-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-soft); margin-bottom: 14px; }
        .events-page .ep-footer { display: flex; align-items: center; justify-content: space-between; }
        .events-page .ep-price { font-size: 16px; font-weight: 800; color: var(--text); }
        .events-page .ep-link { font-size: 13px; font-weight: 700; color: var(--izigo-orange); }

        .events-page .ep-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; }

        @media (max-width: 1024px) { .events-page .ep-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .events-page { padding: 32px 5vw 56px; }
          .events-page .ep-grid { grid-template-columns: 1fr; }
          .events-page .ep-filters { flex-direction: column; align-items: stretch; }
          .events-page .ep-field select { width: 100%; }
        }
      `}</style>

      <div className="ep-head">
        <h1>{t("eventsPage.heading")}</h1>
        <p>{t("eventsPage.subtitle")}</p>
      </div>

      <div className="ep-filters">
        <div className="ep-field">
          <label>{t("eventsPage.filterCity")}</label>
          <select value={cityParam} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t("eventsPage.allCities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button type="button" className="ep-reset" onClick={resetFilters}>{t("eventsPage.resetFilters")}</button>
      </div>

      <p className="ep-count">{t("eventsPage.resultsCount").replace("{count}", filtered.length)}</p>

      {filtered.length === 0 ? (
        <div className="ep-empty">{t("eventsPage.noResults")}</div>
      ) : (
        <div className="ep-grid">
          {filtered.map((e) => (
            <Link to={`/events/${e.id}`} className="ep-card" key={e.id}>
              <div className={`ep-thumb ${e.tone}`} />
              <div className="ep-body">
                <div className="ep-city"><MapPin size={12} />{e.city}</div>
                <div className="ep-title">{e.title[language] || e.title.en}</div>
                <div className="ep-meta"><Calendar size={13} />{formatDate(e.date)}</div>
                <div className="ep-footer">
                  <div className="ep-price">{e.price === 0 ? t("eventsPage.free") : `${e.price} AZN`}</div>
                  <span className="ep-link">{t("eventsPage.viewDetails")} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
