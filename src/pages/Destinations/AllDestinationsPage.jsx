import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSeo } from "../../lib/seo";
import { FEATURED_DESTINATIONS, ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";

export default function AllDestinationsPage() {
  const { t, language } = useLanguage();

  useSeo({
    title: "Destinations in Azerbaijan",
    description: "Explore Baku, Gabala, Guba and every region of Azerbaijan — travel guides, sightseeing and verified local listings.",
    path: "/destinations",
  });

  const rest = ALL_DESTINATIONS.filter((c) => !FEATURED_DESTINATIONS.includes(c));

  return (
    <div className="all-destinations-page">
      <style>{`
        .all-destinations-page { max-width: 900px; margin: 0 auto; padding: 48px 6vw 80px; }
        .all-destinations-page h1 { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .all-destinations-page > p { font-size: 14.5px; color: var(--text-soft); margin: 0 0 36px; }
        .all-destinations-page h2 { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-soft); margin: 0 0 16px; }
        .all-destinations-page .featured-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 40px; }
        .all-destinations-page .featured-chip {
          display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid var(--izigo-green); color: var(--izigo-green);
          border-radius: 999px; padding: 8px 16px; font-size: 13.5px; font-weight: 700;
        }
        .all-destinations-page .destination-list {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 20px;
        }
        .all-destinations-page .destination-list a {
          padding: 8px 0; font-size: 14px; color: var(--text); border-bottom: 1px solid var(--border);
        }
        .all-destinations-page .destination-list a:hover { color: var(--izigo-green); }
        @media (max-width: 640px) {
          .all-destinations-page .destination-list { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <h1>{t("destinations.heading")}</h1>
      <p>{t("destinations.exploreAllSubtitle")}</p>

      <h2>{t("destinations.featuredLabel")}</h2>
      <div className="featured-row">
        {FEATURED_DESTINATIONS.map((city) => (
          <Link to={`/villas?city=${encodeURIComponent(city)}`} className="featured-chip" key={city}>
            <MapPin size={13} />{cityLabel(city, language)}
          </Link>
        ))}
      </div>

      <h2>{t("destinations.allLabel")}</h2>
      <div className="destination-list">
        {rest.map((city) => (
          <Link to={`/villas?city=${encodeURIComponent(city)}`} key={city}>{cityLabel(city, language)}</Link>
        ))}
      </div>
    </div>
  );
}
