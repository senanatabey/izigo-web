import { useParams, Link, Navigate } from "react-router-dom";
import { MapPin, Sparkles, UtensilsCrossed, Compass, Home as HomeIcon, Car, ArrowLeftRight, PartyPopper } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const BROWSE_LINKS = [
  { icon: HomeIcon, key: "villas", to: "/villas" },
  { icon: Car, key: "cars", to: "/cars" },
  { icon: ArrowLeftRight, key: "transfers", to: "/transfers" },
  { icon: PartyPopper, key: "events", to: "/events" },
];

export default function CityGuide() {
  const { city } = useParams();
  const { t } = useLanguage();
  const data = t(`cities.${city}`);

  if (!data || typeof data !== "object") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="city-guide">
      <style>{`
        .city-guide .guide-hero {
          padding: 64px 6vw 56px;
          background: linear-gradient(120deg, #0B3D3B 0%, var(--izigo-green) 55%, var(--izigo-orange) 130%);
          color: #fff;
        }
        .city-guide .guide-hero-inner { max-width: 1280px; margin: 0 auto; }
        .city-guide .guide-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 16px; }
        .city-guide .guide-hero h1 { font-size: 40px; font-weight: 800; margin: 0; }
        .city-guide .guide-hero p { margin-top: 8px; font-size: 16px; color: rgba(255,255,255,0.9); }

        .city-guide .guide-body { max-width: 1280px; margin: 0 auto; padding: 48px 6vw; display: grid; grid-template-columns: 260px 1fr; gap: 40px; align-items: start; }

        .city-guide .catalog { border: 1px solid var(--border); border-radius: 16px; padding: 24px; position: sticky; top: 90px; }
        .city-guide .catalog h2 { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 16px; }
        .city-guide .catalog-group { margin-bottom: 20px; }
        .city-guide .catalog-group:last-child { margin-bottom: 0; }
        .city-guide .catalog-group-head { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .city-guide .catalog-list { list-style: none; margin: 0; padding: 0; }
        .city-guide .catalog-list li { font-size: 13.5px; color: var(--text-soft); padding: 5px 0; }
        .city-guide .catalog-empty { font-size: 12.5px; color: var(--text-soft); font-style: italic; }

        .city-guide .guide-main h2 { font-size: 20px; font-weight: 800; margin: 0 0 12px; }
        .city-guide .guide-intro { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 36px; }

        .city-guide .news-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px; }
        .city-guide .news-card { display: flex; align-items: flex-start; gap: 12px; border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .city-guide .news-icon { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255, 122, 0, 0.12); color: var(--izigo-orange); }
        .city-guide .news-card h3 { font-size: 14.5px; font-weight: 700; margin: 0 0 3px; }
        .city-guide .news-card span { font-size: 12.5px; color: var(--text-soft); }

        .city-guide .browse-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .city-guide .browse-pill {
          display: inline-flex; align-items: center; gap: 6px;
          border: 1.5px solid var(--izigo-green); color: var(--izigo-green);
          border-radius: 999px; padding: 9px 16px; font-size: 13.5px; font-weight: 700;
        }
        .city-guide .browse-pill:hover { background: var(--izigo-green); color: #fff; }

        @media (max-width: 860px) {
          .city-guide .guide-body { grid-template-columns: 1fr; }
          .city-guide .catalog { position: static; }
        }
      `}</style>

      <section className="guide-hero">
        <div className="guide-hero-inner">
          <Link to="/" className="guide-back">{t("cityGuide.backHome")}</Link>
          <h1>{data.name}</h1>
          <p>{data.tagline}</p>
        </div>
      </section>

      <div className="guide-body">
        <aside className="catalog">
          <h2>{t("cityGuide.catalogHeading")}</h2>

          <div className="catalog-group">
            <div className="catalog-group-head"><Compass size={15} />{t("cityGuide.sightseeing")}</div>
            <ul className="catalog-list">
              {data.sightseeing.map((item) => <li key={item}><MapPin size={11} style={{ marginRight: 6 }} />{item}</li>)}
            </ul>
          </div>

          <div className="catalog-group">
            <div className="catalog-group-head"><Sparkles size={15} />{t("cityGuide.attractions")}</div>
            <ul className="catalog-list">
              {data.attractions.map((item) => <li key={item}><MapPin size={11} style={{ marginRight: 6 }} />{item}</li>)}
            </ul>
          </div>

          <div className="catalog-group">
            <div className="catalog-group-head"><UtensilsCrossed size={15} />{t("cityGuide.restaurants")}</div>
            <p className="catalog-empty">{t("cityGuide.comingSoon")}</p>
          </div>
        </aside>

        <main className="guide-main">
          <h2>{data.name}</h2>
          <p className="guide-intro">{data.intro}</p>

          <h2>{t("cityGuide.newsHeading")}</h2>
          <div className="news-list">
            {data.news.map(({ title, date }) => (
              <div className="news-card" key={title}>
                <div className="news-icon"><Sparkles size={16} /></div>
                <div>
                  <h3>{title}</h3>
                  <span>{date}</span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
            {t("cityGuide.browseListings")} {data.name}
          </p>
          <div className="browse-row">
            {BROWSE_LINKS.map(({ icon: Icon, key, to }) => (
              <Link key={key} to={`${to}?city=${encodeURIComponent(data.name)}`} className="browse-pill">
                <Icon size={15} />{t(`nav.${key}`)}
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
