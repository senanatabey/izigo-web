import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Home as HomeIcon, Car, ArrowLeftRight, Compass, UtensilsCrossed, PartyPopper, MapPinOff } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useSeo, schema } from "../../lib/seo";
import { fetchPublishedPlaceBySlug, fetchPlacesByCity } from "../../lib/cms";
import { fetchApprovedListingsByCity } from "../../lib/listings";

const LISTING_SECTIONS = [
  { key: "villas", icon: HomeIcon, category: "villa", to: "/villas" },
  { key: "transfers", icon: ArrowLeftRight, category: "transfer", filterType: "transfer", to: "/transfers" },
  { key: "tours", icon: Compass, category: "transfer", filterType: "tour", to: "/transfers" },
  { key: "events", icon: PartyPopper, category: "event", to: "/events" },
];

function PlaceNotFound() {
  const { t } = useLanguage();
  useSeo({ title: "Place not found" });
  return (
    <div className="place-not-found">
      <style>{`
        .place-not-found { max-width: 520px; margin: 0 auto; padding: 96px 6vw; text-align: center; }
        .place-not-found .pnf-icon {
          width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 20px; display: flex;
          align-items: center; justify-content: center; background: var(--bg-soft); color: var(--text-soft);
        }
        .place-not-found h1 { font-size: 22px; font-weight: 800; margin: 0 0 10px; }
        .place-not-found p { font-size: 14.5px; color: var(--text-soft); margin: 0 0 24px; }
        .place-not-found a {
          display: inline-flex; align-items: center; gap: 6px; background: var(--izigo-green); color: #fff;
          border-radius: 10px; padding: 11px 22px; font-weight: 700; font-size: 14px;
        }
      `}</style>
      <div className="pnf-icon"><MapPinOff size={24} /></div>
      <h1>{t("placeDetail.notFoundHeading")}</h1>
      <p>{t("placeDetail.notFoundText")}</p>
      <Link to="/places">{t("placeDetail.notFoundCta")}</Link>
    </div>
  );
}

export default function PlaceDetail() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [place, setPlace] = useState(undefined); // undefined = loading, null = not found
  const [restaurants, setRestaurants] = useState([]);
  const [listingsBySection, setListingsBySection] = useState({});

  useEffect(() => {
    setPlace(undefined);
    fetchPublishedPlaceBySlug(slug, language).then(setPlace);
  }, [slug, language]);

  useEffect(() => {
    if (!place) return;
    fetchPlacesByCity(place.city, language, { category: "restaurant", excludeId: place.id }).then(setRestaurants);
    Promise.all(
      LISTING_SECTIONS.map(({ key, category, filterType }) =>
        fetchApprovedListingsByCity(category, place.city).then((rows) => [
          key,
          filterType ? rows.filter((r) => (r.details?.type || "transfer") === filterType) : rows,
        ])),
    ).then((entries) => setListingsBySection(Object.fromEntries(entries)));
  }, [place, language]);

  useSeo({
    title: place ? (place.seo_title || place.name) : undefined,
    description: place ? place.meta_description : undefined,
    path: `/places/${slug}`,
    image: place?.hero_image_url || undefined,
    structuredData: place ? [
      schema.touristAttraction({
        name: place.name,
        description: place.meta_description || place.content,
        url: `https://izigo.az/places/${slug}`,
        image: place.hero_image_url || undefined,
        city: place.city,
      }),
      ...(place.faq?.length > 0 ? [schema.faqPage(place.faq)] : []),
    ] : null,
  });

  if (place === undefined) return null;
  if (place === null) return <PlaceNotFound />;

  return (
    <div className="place-detail">
      <style>{`
        .place-detail .pd-hero {
          height: 320px; background-size: cover; background-position: center; background-color: var(--bg-soft);
          display: flex; align-items: flex-end; padding: 32px 6vw; color: #fff;
          background-image: linear-gradient(0deg, rgba(5,22,20,0.75), rgba(5,22,20,0.05))${place.hero_image_url ? `, url("${place.hero_image_url}")` : ""};
        }
        .place-detail .pd-hero-inner { max-width: 1280px; margin: 0 auto; width: 100%; }
        .place-detail .pd-city { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange); text-transform: capitalize; margin-bottom: 6px; }
        .place-detail .pd-hero h1 { font-size: 32px; font-weight: 800; margin: 0; }

        .place-detail .pd-body { max-width: 900px; margin: 0 auto; padding: 40px 6vw 20px; }
        .place-detail .pd-content { font-size: 15px; line-height: 1.7; color: var(--text-soft); white-space: pre-wrap; }

        .place-detail .pd-faq { margin-top: 32px; }
        .place-detail .pd-faq h2 { font-size: 18px; font-weight: 800; margin: 0 0 14px; }
        .place-detail .pd-faq-item { border-top: 1px solid var(--border); padding: 14px 0; }
        .place-detail .pd-faq-item h3 { font-size: 14.5px; font-weight: 700; margin: 0 0 6px; }
        .place-detail .pd-faq-item p { font-size: 13.5px; color: var(--text-soft); margin: 0; line-height: 1.6; }

        .place-detail .pd-section { max-width: 1280px; margin: 0 auto; padding: 8px 6vw 40px; }
        .place-detail .pd-section h2 { font-size: 18px; font-weight: 800; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
        .place-detail .pd-section-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .place-detail .pd-card { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .place-detail .pd-card-thumb { aspect-ratio: 4/3; background-size: cover; background-position: center; background-color: var(--bg-soft); }
        .place-detail .pd-card-body { padding: 12px 14px; }
        .place-detail .pd-card-title { font-size: 13.5px; font-weight: 700; margin-bottom: 4px; }
        .place-detail .pd-card-price { font-size: 13px; font-weight: 800; color: var(--text); }
      `}</style>

      <div className="pd-hero">
        <div className="pd-hero-inner">
          <div className="pd-city"><MapPin size={12} />{place.city}{place.region ? ` · ${place.region}` : ""}</div>
          <h1>{place.name}</h1>
        </div>
      </div>

      <div className="pd-body">
        <div className="pd-content">{place.content}</div>

        {place.faq?.length > 0 && (
          <div className="pd-faq">
            <h2>{t("placeDetail.faqHeading")}</h2>
            {place.faq.map((item, i) => (
              <div className="pd-faq-item" key={i}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {LISTING_SECTIONS.map(({ key, icon: Icon, to }) => {
        const items = listingsBySection[key] || [];
        if (items.length === 0) return null;
        return (
          <div className="pd-section" key={key}>
            <h2><Icon size={17} />{t(`placeDetail.section.${key}`)}</h2>
            <div className="pd-section-grid">
              {items.map((item) => (
                <Link to={`${to}/${item.id}`} className="pd-card" key={item.id}>
                  <div className="pd-card-thumb" style={item.images?.[0] ? { backgroundImage: `url("${item.images[0]}")` } : undefined} />
                  <div className="pd-card-body">
                    <div className="pd-card-title">{item.title?.[language] || item.title?.en}</div>
                    <div className="pd-card-price">{formatPrice(item.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {restaurants.length > 0 && (
        <div className="pd-section">
          <h2><UtensilsCrossed size={17} />{t("placeDetail.section.restaurants")}</h2>
          <div className="pd-section-grid">
            {restaurants.map((r) => (
              <Link to={`/places/${r.slug}`} className="pd-card" key={r.id}>
                <div className="pd-card-thumb" style={r.hero_image_url ? { backgroundImage: `url("${r.hero_image_url}")` } : undefined} />
                <div className="pd-card-body">
                  <div className="pd-card-title">{r.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
