import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Sparkles, UtensilsCrossed, Compass, Home as HomeIcon, Car, ArrowLeftRight, PartyPopper, MapPinOff } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSeo, schema } from "../../lib/seo";
import { cityFromSlug, cityLabel } from "../../data/azerbaijanDestinations";
import { getDestinationContent } from "../../data/destinations";
import { fetchPublishedGuideBySlug, fetchPlacesByCity } from "../../lib/cms";

const BROWSE_LINKS = [
  { icon: HomeIcon, key: "villas", to: "/villas" },
  { icon: Car, key: "cars", to: "/cars" },
  { icon: ArrowLeftRight, key: "transfers", to: "/transfers" },
  { icon: PartyPopper, key: "events", to: "/events" },
];

function DestinationNotFound() {
  const { t } = useLanguage();

  return (
    <div className="city-guide-not-found">
      <style>{`
        .city-guide-not-found {
          max-width: 520px; margin: 0 auto; padding: 96px 6vw; text-align: center;
        }
        .city-guide-not-found .cgnf-icon {
          width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 20px; display: flex;
          align-items: center; justify-content: center; background: var(--bg-soft); color: var(--text-soft);
        }
        .city-guide-not-found h1 { font-size: 22px; font-weight: 800; margin: 0 0 10px; }
        .city-guide-not-found p { font-size: 14.5px; color: var(--text-soft); margin: 0 0 24px; }
        .city-guide-not-found a {
          display: inline-flex; align-items: center; gap: 6px; background: var(--izigo-green); color: #fff;
          border-radius: 10px; padding: 11px 22px; font-weight: 700; font-size: 14px;
        }
      `}</style>
      <div className="cgnf-icon"><MapPinOff size={24} /></div>
      <h1>{t("cityGuide.notFoundHeading")}</h1>
      <p>{t("cityGuide.notFoundText")}</p>
      <Link to="/destinations">{t("cityGuide.notFoundCta")}</Link>
    </div>
  );
}

export default function CityGuide() {
  const { city: slug } = useParams();
  const { t, language } = useLanguage();

  // undefined = still loading from Supabase, null = no CMS guide for this slug
  const [cmsGuide, setCmsGuide] = useState(undefined);
  const [mustVisitPlaces, setMustVisitPlaces] = useState([]);

  useEffect(() => {
    setCmsGuide(undefined);
    fetchPublishedGuideBySlug(slug, language).then(setCmsGuide);
  }, [slug, language]);

  const city = cityFromSlug(slug);
  const staticArticle = city ? getDestinationContent(slug, language) : null;
  const displayCity = city || cmsGuide?.city || null;
  const cmsReady = cmsGuide !== undefined;

  // CMS content wins when published; static src/data/destinations/*.js content
  // (Stage 1) is the fallback for cities that don't have a CMS entry yet, and
  // also backfills fields the CMS doesn't model (sightseeing/attractions/news).
  const article = cmsGuide ? {
    name: cmsGuide.title || (displayCity ? cityLabel(displayCity, language) : slug),
    tagline: cmsGuide.meta_description || staticArticle?.tagline || "",
    intro: cmsGuide.content || staticArticle?.intro || "",
    sightseeing: staticArticle?.sightseeing || [],
    attractions: staticArticle?.attractions || [],
    news: staticArticle?.news || [],
    heroImage: cmsGuide.hero_image_url || null,
  } : staticArticle ? {
    name: displayCity ? cityLabel(displayCity, language) : slug,
    tagline: staticArticle.tagline,
    intro: staticArticle.intro,
    sightseeing: staticArticle.sightseeing,
    attractions: staticArticle.attractions,
    news: staticArticle.news,
    heroImage: null,
  } : null;

  const isValid = !!article;
  const stillLoading = !cmsReady && !staticArticle;

  useEffect(() => {
    if (!displayCity) { setMustVisitPlaces([]); return; }
    fetchPlacesByCity(displayCity, language, { limit: 6 }).then(setMustVisitPlaces);
  }, [displayCity, language]);

  useSeo({
    title: isValid ? `${article.name} Travel Guide — History, Sightseeing & Attractions` : "Destination not found",
    description: isValid ? article.intro : undefined,
    path: `/destinations/${slug}`,
    image: isValid ? article.heroImage || undefined : undefined,
    structuredData: isValid ? schema.touristDestination({
      name: article.name,
      description: article.intro,
      url: `https://izigo.az/destinations/${slug}`,
      image: article.heroImage || undefined,
    }) : null,
  });

  if (stillLoading) return null;
  if (!isValid) return <DestinationNotFound />;

  const data = article;

  return (
    <div className="city-guide">
      <style>{`
        .city-guide .guide-hero {
          padding: 64px 6vw 56px;
          background: linear-gradient(120deg, #0B3D3B 0%, var(--izigo-green) 55%, var(--izigo-orange) 130%);
          background-size: cover;
          background-position: center;
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
        .city-guide .guide-intro { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 36px; white-space: pre-wrap; }

        .city-guide .news-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px; }
        .city-guide .news-card { display: flex; align-items: flex-start; gap: 12px; border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .city-guide .news-icon { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255, 122, 0, 0.12); color: var(--izigo-orange); }
        .city-guide .news-card h3 { font-size: 14.5px; font-weight: 700; margin: 0 0 3px; }
        .city-guide .news-card span { font-size: 12.5px; color: var(--text-soft); }

        .city-guide .must-visit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 36px; }
        .city-guide .must-visit-card { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .city-guide .must-visit-thumb { aspect-ratio: 4/3; background-size: cover; background-position: center; background-color: var(--bg-soft); }
        .city-guide .must-visit-name { padding: 10px 12px; font-size: 13px; font-weight: 700; }

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

      <section
        className="guide-hero"
        style={data.heroImage ? { backgroundImage: `linear-gradient(120deg, rgba(11,61,59,0.75) 0%, rgba(0,200,151,0.55) 55%, rgba(255,122,0,0.55) 130%), url("${data.heroImage}")` } : undefined}
      >
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
            {data.sightseeing.length > 0 ? (
              <ul className="catalog-list">
                {data.sightseeing.map((item) => <li key={item}><MapPin size={11} style={{ marginRight: 6 }} />{item}</li>)}
              </ul>
            ) : <p className="catalog-empty">{t("cityGuide.comingSoon")}</p>}
          </div>

          <div className="catalog-group">
            <div className="catalog-group-head"><Sparkles size={15} />{t("cityGuide.attractions")}</div>
            {data.attractions.length > 0 ? (
              <ul className="catalog-list">
                {data.attractions.map((item) => <li key={item}><MapPin size={11} style={{ marginRight: 6 }} />{item}</li>)}
              </ul>
            ) : <p className="catalog-empty">{t("cityGuide.comingSoon")}</p>}
          </div>

          <div className="catalog-group">
            <div className="catalog-group-head"><UtensilsCrossed size={15} />{t("cityGuide.restaurants")}</div>
            <p className="catalog-empty">{t("cityGuide.comingSoon")}</p>
          </div>
        </aside>

        <main className="guide-main">
          <h2>{data.name}</h2>
          <p className="guide-intro">{data.intro}</p>

          {mustVisitPlaces.length > 0 && (
            <>
              <h2>{t("cityGuide.mustVisitHeading")}</h2>
              <div className="must-visit-grid">
                {mustVisitPlaces.map((p) => (
                  <Link to={`/places/${p.slug}`} className="must-visit-card" key={p.id}>
                    <div className="must-visit-thumb" style={p.hero_image_url ? { backgroundImage: `url("${p.hero_image_url}")` } : undefined} />
                    <div className="must-visit-name">{p.name}</div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {data.news.length > 0 && (
            <>
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
            </>
          )}

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
