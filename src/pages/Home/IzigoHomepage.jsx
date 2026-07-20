import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin, Search, Home as HomeIcon, Car, ArrowLeftRight,
  PartyPopper, ShieldCheck, MessageCircle, Tag, Headphones, Mail, Send,
  Percent, BadgeCheck, PlusCircle,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

/* lucide-react no longer ships brand/logo glyphs — small inline outlines instead */
function InstagramGlyph(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookGlyph(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 3h-2a5 5 0 0 0-5 5v3H6v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function YoutubeGlyph(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const CATEGORIES = [
  { icon: HomeIcon, tone: "green", key: "villas", to: "/villas" },
  { icon: Car, tone: "orange", key: "cars", to: "/cars" },
  { icon: ArrowLeftRight, tone: "green", key: "transfers", to: "/transfers" },
  { icon: PartyPopper, tone: "orange", key: "events", to: "/events" },
];

const DESTINATIONS = [
  { city: "Baku", file: "baku.webp", to: "/villas?city=Baku" },
  { city: "Gabala", file: "gabala.webp", to: "/villas?city=Gabala" },
  { city: "Guba", file: "guba.webp", to: "/villas?city=Guba" },
];

const CITY_OPTIONS = ["baku", "gabala", "guba"];

const COMPARISON_ROWS = ["commission", "hiddenFees", "directContact", "verified", "focus", "freeToList"];
const COMPARISON_COLUMNS = ["izigo", "airbnb", "booking", "vrbo"];

const TRUST_BADGES = [
  { icon: Percent, key: "zeroCommission" },
  { icon: MessageCircle, key: "whatsapp" },
  { icon: BadgeCheck, key: "verifiedStay" },
  { icon: MapPin, key: "localHosts" },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, key: "verified" },
  { icon: MessageCircle, key: "direct" },
  { icon: Tag, key: "prices" },
  { icon: Headphones, key: "support" },
];

export default function IzigoHomepage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [service, setService] = useState("villas");
  const [where, setWhere] = useState("");
  const [citySlug, setCitySlug] = useState(null);
  const [whereOpen, setWhereOpen] = useState(false);

  const cityLabel = (slug) => t(`cities.${slug}.name`);
  const filteredCities = CITY_OPTIONS.filter((slug) =>
    cityLabel(slug).toLowerCase().includes(where.trim().toLowerCase())
  );

  const pickCity = (slug) => {
    setWhere(cityLabel(slug));
    setCitySlug(slug);
    setWhereOpen(false);
  };

  const handleWhereChange = (e) => {
    setWhere(e.target.value);
    setCitySlug(null);
    setWhereOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = where.trim() ? `?city=${encodeURIComponent(where.trim())}` : "";
    navigate(`/${service}${params}`);
  };

  return (
    <div className="izigo-home">
      <style>{`
        .izigo-home .hero {
          position: relative;
          padding: 130px 6vw 72px;
          display: flex;
          flex-direction: column;
          background:
            linear-gradient(90deg, rgba(5, 22, 20, 0.78) 0%, rgba(5, 22, 20, 0.45) 32%, rgba(5, 22, 20, 0.08) 58%, rgba(5, 22, 20, 0) 78%),
            linear-gradient(0deg, rgba(4, 16, 15, 0.35) 0%, rgba(4, 16, 15, 0) 30%),
            url("/images/izigo-hero.webp");
          background-size: cover;
          background-position: center;
          color: #fff;
        }
        .izigo-home .hero-inner { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; }
        .izigo-home .hero-content { max-width: 680px; }
        .izigo-home .hero h1 { font-size: 56px; font-weight: 800; line-height: 1.15; letter-spacing: -0.5px; margin: 0; color: #fff; }
        .izigo-home .hero p { margin-top: 18px; font-size: 18px; line-height: 1.5; color: rgba(255,255,255,0.92); max-width: 520px; }

        .izigo-home .search-card {
          margin: 48px 0 0;
          background: #fff;
          border-radius: 16px;
          box-shadow: var(--shadow-md);
          padding: 20px 24px;
          position: relative;
          z-index: 5;
        }
        .izigo-home .search-tabs {
          display: flex; gap: 8px; overflow-x: auto;
          padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--border);
        }
        .izigo-home .search-tab {
          flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          min-width: 142px; padding: 9px 16px; border-radius: 999px; border: 1px solid var(--border);
          background: #fff; color: var(--text-soft); font-size: 13.5px; font-weight: 600;
          cursor: pointer; white-space: nowrap; transition: all 0.15s ease;
        }
        .izigo-home .search-tab.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }
        .izigo-home .search-row { display: flex; align-items: stretch; gap: 0; }
        .izigo-home .search-field-wrap { flex: 1; position: relative; }
        .izigo-home .search-field {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 24px 4px 4px;
        }
        .izigo-home .search-field label { display: block; font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .izigo-home .search-field input {
          border: none; outline: none; font-size: 15.5px; color: var(--text-soft);
          width: 100%; font-family: var(--sans); background: transparent;
        }
        .izigo-home .search-dropdown {
          position: absolute; top: calc(100% + 8px); left: 0; right: 24px;
          background: #fff; border: 1px solid var(--border); border-radius: 12px;
          box-shadow: var(--shadow-md); overflow: hidden; z-index: 30;
        }
        .izigo-home .search-dropdown button {
          display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
          padding: 11px 16px; border: none; background: none; font-size: 14px;
          color: var(--text); cursor: pointer;
        }
        .izigo-home .search-dropdown button:hover { background: var(--bg-soft); }
        .izigo-home .search-guide-slot {
          margin-top: 12px; height: 18px; line-height: 18px;
        }
        .izigo-home .search-guide-link {
          display: inline-block; font-size: 13px; font-weight: 700; color: var(--izigo-green);
          opacity: 0; visibility: hidden; transition: opacity 0.15s ease;
        }
        .izigo-home .search-guide-link.visible { opacity: 1; visibility: visible; }
        .izigo-home .search-submit {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          min-width: 150px;
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 0 34px; font-weight: 700; font-size: 16px; cursor: pointer;
          white-space: nowrap; transition: filter 0.15s ease;
        }
        .izigo-home .search-submit:hover { filter: brightness(0.94); }

        .izigo-home .trust-badges { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
        .izigo-home .trust-badge {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          min-width: 236px;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(4px); color: #fff;
          border-radius: 999px; padding: 9px 16px; font-size: 13.5px; font-weight: 600;
        }
        .izigo-home .trust-badge svg { color: var(--izigo-orange); flex-shrink: 0; }

        .izigo-home section { padding: 84px 6vw; }
        .izigo-home .section-head { max-width: 1280px; margin: 0 auto 36px; display: flex; align-items: baseline; justify-content: space-between; }
        .izigo-home .section-head h2 { font-size: 30px; font-weight: 800; }
        .izigo-home .section-head a { font-size: 15px; font-weight: 700; color: var(--izigo-green); display: flex; align-items: center; gap: 4px; }

        .izigo-home .category-grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding-top: 56px; }
        .izigo-home .category-card {
          border: 1px solid var(--border); border-radius: 16px; padding: 32px;
          background: #fff; transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .izigo-home .category-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .izigo-home .category-icon {
          width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
        }
        .izigo-home .category-icon.green { background: rgba(0, 200, 151, 0.12); color: var(--izigo-green); }
        .izigo-home .category-icon.orange { background: rgba(255, 122, 0, 0.12); color: var(--izigo-orange); }
        .izigo-home .category-card h3 { font-size: 19px; font-weight: 700; margin-bottom: 8px; }
        .izigo-home .category-card p { font-size: 14.5px; color: var(--text-soft); line-height: 1.45; margin-bottom: 22px; min-height: 42px; }
        .izigo-home .category-btn {
          display: inline-flex; align-items: center; justify-content: center; width: 100%;
          border: none; border-radius: 10px; padding: 13px; font-weight: 700; font-size: 14.5px;
          color: #fff; cursor: pointer;
        }
        .izigo-home .category-btn.green { background: var(--izigo-green); }
        .izigo-home .category-btn.orange { background: var(--izigo-orange); }

        .izigo-home .destinations { background: var(--bg); }
        .izigo-home .destination-grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .izigo-home .destination-card {
          display: block; border-radius: 16px; overflow: hidden; transition: transform 0.15s ease;
        }
        .izigo-home .destination-card:hover { transform: translateY(-2px); }
        .izigo-home .destination-card img { width: 100%; height: auto; display: block; }

        .izigo-home .comparison { background: var(--bg); }
        .izigo-home .comparison-card {
          max-width: 1280px; margin: 0 auto;
          background: var(--izigo-green); color: #fff;
          border-radius: 20px; padding: 48px; box-shadow: var(--shadow-md);
        }
        .izigo-home .comparison-card h2 { font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 32px; }
        .izigo-home .comparison-scroll { overflow-x: auto; }
        .izigo-home .comparison-table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .izigo-home .comparison-table th, .izigo-home .comparison-table td {
          padding: 14px 12px; text-align: left; font-size: 14px; white-space: nowrap;
        }
        .izigo-home .comparison-table thead th {
          font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.75);
          text-transform: uppercase; letter-spacing: 0.3px;
          border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 12px;
        }
        .izigo-home .comparison-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.14); }
        .izigo-home .comparison-table tbody tr:last-child { border-bottom: none; }
        .izigo-home .comparison-table td.feature-cell { font-weight: 600; color: rgba(255,255,255,0.9); white-space: normal; }
        .izigo-home .comparison-table .col-izigo { color: #FFD447; text-align: center; }
        .izigo-home .comparison-table td.col-izigo { font-weight: 700; }
        .izigo-home .comparison-footnote { margin-top: 20px; font-size: 12.5px; color: rgba(255,255,255,0.65); text-align: center; }

        .izigo-home .trust { background: var(--bg-soft); }
        .izigo-home .trust-grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; }
        .izigo-home .trust-item { display: flex; align-items: flex-start; gap: 16px; }
        .izigo-home .trust-icon {
          width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; background: rgba(0, 200, 151, 0.12); color: var(--izigo-green);
        }
        .izigo-home .trust-item:nth-child(2n) .trust-icon { background: rgba(255, 122, 0, 0.12); color: var(--izigo-orange); }
        .izigo-home .trust-item h4 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .izigo-home .trust-item p { font-size: 13.5px; color: var(--text-soft); }

        .izigo-home .host-cta { background: var(--bg-soft); }
        .izigo-home .host-cta-card {
          background: #fff; border: 1px solid var(--border); border-radius: 16px;
          padding: 48px; text-align: center; max-width: 720px; margin: 0 auto;
        }
        .izigo-home .host-cta-card h2 { font-size: 28px; font-weight: 800; margin-bottom: 14px; }
        .izigo-home .host-cta-card p { font-size: 15px; color: var(--text-soft); line-height: 1.6; margin: 0 auto 24px; max-width: 560px; }
        .izigo-home .host-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 13px 28px; font-weight: 700; font-size: 15px; cursor: pointer;
        }

        .izigo-home .newsletter {
          background: var(--izigo-green); color: #fff;
          padding: 40px 6vw;
        }
        .izigo-home .newsletter-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap;
        }
        .izigo-home .newsletter-copy { display: flex; align-items: center; gap: 16px; }
        .izigo-home .newsletter-copy h4 { font-size: 17px; font-weight: 800; }
        .izigo-home .newsletter-copy p { font-size: 14px; color: rgba(255,255,255,0.85); }
        .izigo-home .newsletter-form { display: flex; gap: 10px; flex: 1; max-width: 440px; min-width: 260px; }
        .izigo-home .newsletter-form input {
          flex: 1; border: none; border-radius: 10px; padding: 13px 16px; font-size: 15px; outline: none;
        }
        .izigo-home .newsletter-form button {
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 0 20px; font-weight: 700; font-size: 15px; cursor: pointer; white-space: nowrap;
        }
        .izigo-home .newsletter-social { display: flex; align-items: center; gap: 16px; }
        .izigo-home .newsletter-social span { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .izigo-home .newsletter-social a {
          width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.16);
          display: flex; align-items: center; justify-content: center;
        }

        @media (max-width: 1024px) {
          .izigo-home .category-grid { grid-template-columns: repeat(2, 1fr); }
          .izigo-home .destination-grid { grid-template-columns: repeat(2, 1fr); }
          .izigo-home .trust-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .izigo-home .hero { padding: 56px 5vw 32px; }
          .izigo-home .hero h1 { font-size: 30px; }
          .izigo-home .search-card { margin: 28px 0 0; padding: 16px; }
          .izigo-home .search-row { flex-direction: column; gap: 12px; }
          .izigo-home .search-field { padding: 4px; }
          .izigo-home .search-submit { width: 100%; padding: 12px; }
          .izigo-home section { padding: 44px 5vw; }
          .izigo-home .category-grid { grid-template-columns: 1fr; }
          .izigo-home .destination-grid { grid-template-columns: 1fr; }
          .izigo-home .trust-grid { grid-template-columns: 1fr; }
          .izigo-home .host-cta-card { padding: 32px 24px; }
          .izigo-home .comparison-card { padding: 28px 20px; border-radius: 16px; }
          .izigo-home .newsletter-inner { flex-direction: column; align-items: stretch; text-align: center; }
          .izigo-home .newsletter-copy { flex-direction: column; text-align: center; }
          .izigo-home .newsletter-form { max-width: none; }
        }
      `}</style>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1>{t("hero.title")}</h1>
            <p>{t("hero.subtitle")}</p>
          </div>

          <form className="search-card" onSubmit={handleSearch}>
            <div className="search-tabs">
              {CATEGORIES.map(({ icon: Icon, key }) => (
                <button
                  key={key}
                  type="button"
                  className={`search-tab${service === key ? " active" : ""}`}
                  onClick={() => setService(key)}
                >
                  <Icon size={15} />{t(`nav.${key}`)}
                </button>
              ))}
            </div>
            <div className="search-row">
              <div className="search-field-wrap">
                <div className="search-field">
                  <MapPin size={18} color="var(--text-soft)" />
                  <div>
                    <label>{t("search.where")}</label>
                    <input
                      type="text"
                      placeholder={t("search.wherePlaceholder")}
                      value={where}
                      onChange={handleWhereChange}
                      onFocus={() => setWhereOpen(true)}
                      onBlur={() => setTimeout(() => setWhereOpen(false), 150)}
                    />
                  </div>
                </div>
                {whereOpen && filteredCities.length > 0 && (
                  <div className="search-dropdown">
                    {filteredCities.map((slug) => (
                      <button key={slug} type="button" onMouseDown={() => pickCity(slug)}>
                        <MapPin size={14} color="var(--text-soft)" />{cityLabel(slug)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="search-submit"><Search size={16} />{t("search.search")}</button>
            </div>
            <div className="search-guide-slot">
              <Link
                to={citySlug ? `/destinations/${citySlug}` : "#"}
                tabIndex={citySlug ? 0 : -1}
                className={`search-guide-link${citySlug ? " visible" : ""}`}
              >
                {citySlug ? `${t("search2.guideLink").replace("{city}", cityLabel(citySlug))} →` : " "}
              </Link>
            </div>
          </form>

          <div className="trust-badges">
            {TRUST_BADGES.map(({ icon: Icon, key }) => (
              <span className="trust-badge" key={key}><Icon size={15} />{t(`trustBadges.${key}`)}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="categories">
        <div className="category-grid">
          {CATEGORIES.map(({ icon: Icon, tone, key, to }) => (
            <div className="category-card" key={key}>
              <div className={`category-icon ${tone}`}><Icon size={24} /></div>
              <h3>{t(`categories.${key}.title`)}</h3>
              <p>{t(`categories.${key}.text`)}</p>
              <Link to={to} className={`category-btn ${tone}`}>{t(`categories.${key}.cta`)}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="destinations">
        <div className="section-head">
          <h2>{t("destinations.heading")}</h2>
          <Link to="/villas">{t("destinations.viewAll")} →</Link>
        </div>
        <div className="destination-grid">
          {DESTINATIONS.map(({ city, file, to }) => (
            <Link to={to} className="destination-card" key={city}>
              <img src={`/images/${file}`} alt={city} />
            </Link>
          ))}
        </div>
      </section>

      <section className="comparison">
        <div className="comparison-card">
          <h2>{t("comparison.heading")}</h2>
          <div className="comparison-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th></th>
                  {COMPARISON_COLUMNS.map((col) => (
                    <th key={col} className={col === "izigo" ? "col-izigo" : ""}>{t(`comparison.columns.${col}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row}>
                    <td className="feature-cell">{t(`comparison.rows.${row}.feature`)}</td>
                    {COMPARISON_COLUMNS.map((col) => (
                      <td key={col} className={col === "izigo" ? "col-izigo" : ""}>{t(`comparison.rows.${row}.${col}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="comparison-footnote">{t("comparison.footnote")}</p>
        </div>
      </section>

      <section className="trust">
        <div className="trust-grid">
          {TRUST_ITEMS.map(({ icon: Icon, key }) => (
            <div className="trust-item" key={key}>
              <div className="trust-icon"><Icon size={20} /></div>
              <div>
                <h4>{t(`trust.${key}.title`)}</h4>
                <p>{t(`trust.${key}.text`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="host-cta">
        <div className="host-cta-card">
          <h2>{t("hostCta.title")}</h2>
          <p>{t("hostCta.text")}</p>
          <Link to="/add-listing" className="host-cta-btn"><PlusCircle size={17} />{t("hostCta.button")}</Link>
        </div>
      </section>

      <section className="newsletter">
        <div className="newsletter-inner">
          <div className="newsletter-copy">
            <Mail size={22} />
            <div>
              <h4>{t("newsletter.title")}</h4>
              <p>{t("newsletter.subtitle")}</p>
            </div>
          </div>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder={t("newsletter.placeholder")} />
            <button type="submit">{t("newsletter.subscribe")}</button>
          </form>
          <div className="newsletter-social">
            <span>{t("newsletter.followUs")}</span>
            <a href="#" aria-label="Instagram"><InstagramGlyph /></a>
            <a href="#" aria-label="Facebook"><FacebookGlyph /></a>
            <a href="#" aria-label="YouTube"><YoutubeGlyph /></a>
            <a href="#" aria-label="Telegram"><Send size={16} /></a>
          </div>
        </div>
      </section>
    </div>
  );
}
