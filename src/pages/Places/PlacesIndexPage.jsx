import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSeo } from "../../lib/seo";
import { supabase } from "../../lib/supabaseClient";

export default function PlacesIndexPage() {
  const { t, language } = useLanguage();
  const [places, setPlaces] = useState(null);

  useSeo({
    title: "Places in Azerbaijan",
    description: "Attractions, restaurants and points of interest across Azerbaijan.",
    path: "/places",
  });

  useEffect(() => {
    supabase
      .from("cms_places")
      .select("*, translations:cms_place_translations(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data || []).map((row) => {
          const translation = row.translations.find((tr) => tr.language === language)
            || row.translations.find((tr) => tr.language === "az")
            || row.translations[0];
          return translation ? { ...row, ...translation } : null;
        }).filter(Boolean);
        setPlaces(rows);
      });
  }, [language]);

  return (
    <div className="places-index-page">
      <style>{`
        .places-index-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .places-index-page h1 { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .places-index-page > p { font-size: 14.5px; color: var(--text-soft); margin: 0 0 36px; }
        .places-index-page .pip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
        .places-index-page .pip-card { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .places-index-page .pip-thumb { aspect-ratio: 4/3; background-size: cover; background-position: center; background-color: var(--bg-soft); }
        .places-index-page .pip-body { padding: 12px 14px; }
        .places-index-page .pip-city { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; color: var(--izigo-orange); margin-bottom: 4px; }
        .places-index-page .pip-name { font-size: 14px; font-weight: 700; }
        .places-index-page .pip-empty { color: var(--text-soft); font-size: 14px; }
      `}</style>

      <h1>{t("placesIndex.heading")}</h1>
      <p>{t("placesIndex.subtitle")}</p>

      {places === null ? null : places.length === 0 ? (
        <p className="pip-empty">{t("placesIndex.empty")}</p>
      ) : (
        <div className="pip-grid">
          {places.map((p) => (
            <Link to={`/places/${p.slug}`} className="pip-card" key={p.id}>
              <div className="pip-thumb" style={p.hero_image_url ? { backgroundImage: `url("${p.hero_image_url}")` } : undefined} />
              <div className="pip-body">
                <div className="pip-city"><MapPin size={11} />{p.city}</div>
                <div className="pip-name">{p.name}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
