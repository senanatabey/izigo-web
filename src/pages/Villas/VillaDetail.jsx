import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, BedDouble, ShieldCheck, Wifi, UtensilsCrossed, Snowflake, ParkingCircle, Flame, Trees } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { useSeo, schema } from "../../lib/seo";
import { fetchListingById, toneForId, shortListingCode, relativeDate } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";

const AMENITY_ICONS = { wifi: Wifi, kitchen: UtensilsCrossed, ac: Snowflake, parking: ParkingCircle, fireplace: Flame, garden: Trees };

export default function VillaDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingById(id).then(setRow).finally(() => setLoading(false));
  }, [id]);

  const villa = row ? {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    description: row.description,
    price: row.price,
    guests: row.details?.guests || 0,
    bedrooms: row.details?.bedrooms || 0,
    amenities: row.details?.amenities || [],
    discount: row.discount,
    phone: row.whatsapp_phone,
    host: row.host,
    code: shortListingCode(row.id),
    postedAt: relativeDate(row.created_at, language),
    images: row.images || [],
  } : null;

  useSeo({
    title: villa ? `${villa.title?.[language] || villa.title?.en} — ${villa.city}` : undefined,
    description: villa ? (villa.description?.[language] || villa.description?.en) : undefined,
    path: `/villas/${id}`,
    image: villa?.images?.[0],
    ogType: "product",
    structuredData: villa ? schema.product({
      name: villa.title?.[language] || villa.title?.en,
      description: villa.description?.[language] || villa.description?.en,
      url: `https://izigo.az/villas/${id}`,
      image: villa.images?.[0],
      price: villa.discount ? Math.round(villa.price * (1 - villa.discount / 100)) : villa.price,
    }) : null,
  });

  if (loading) return null;

  if (!villa) {
    return (
      <div className="villa-detail">
        <style>{`.villa-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("villaDetail.notFound")}</p>
        <Link to="/villas">{t("villaDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="villa-detail">
      <style>{`
        .villa-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .villa-detail .vd-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .villa-detail .vd-gallery { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 32px; border-radius: 16px; overflow: hidden; height: 380px; }
        .villa-detail .vd-gallery-main { grid-row: span 2; }
        .villa-detail .vd-gallery-side { display: grid; grid-template-rows: 1fr 1fr; gap: 12px; }
        .villa-detail .vd-thumb { background-size: cover; background-position: center; }
        .villa-detail .vd-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .villa-detail .vd-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .villa-detail .vd-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .villa-detail .vd-gallery-side .vd-thumb { opacity: 0.82; }
        .villa-detail .vd-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .villa-detail .vd-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .villa-detail .vd-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .villa-detail .vd-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .villa-detail .vd-listing-meta { font-size: 12.5px; color: var(--text-soft); margin: -10px 0 16px; }
        .villa-detail .vd-edit-link { color: var(--izigo-green); font-weight: 700; }
        .villa-detail .vd-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .villa-detail .vd-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .villa-detail .vd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .villa-detail .vd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }
        .villa-detail .vd-amenities { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .villa-detail .vd-amenity { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text); }
        .villa-detail .vd-amenity svg { color: var(--izigo-green); }

        .villa-detail .vd-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .villa-detail .vd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .villa-detail .vd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .villa-detail .vd-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .villa-detail .vd-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .villa-detail .detail-save-btn { position: static; }
        .villa-detail .vd-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .villa-detail .vd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .villa-detail .vd-host-name { font-size: 14px; font-weight: 700; }
        .villa-detail .vd-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }

        @media (max-width: 900px) {
          .villa-detail .vd-layout { grid-template-columns: 1fr; }
          .villa-detail .vd-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .villa-detail { padding: 20px 5vw 56px; }
          .villa-detail .vd-gallery { grid-template-columns: 1fr; height: auto; }
          .villa-detail .vd-gallery-main { height: 220px; }
          .villa-detail .vd-gallery-side { display: none; }
          .villa-detail .vd-amenities { grid-template-columns: 1fr; }
        }
      `}</style>

      <Link to="/villas" className="vd-back">{t("villaDetail.back")}</Link>

      <div className="vd-gallery">
        <div
          className={`vd-thumb vd-gallery-main ${villa.images[0] ? "" : villa.tone}`}
          style={villa.images[0] ? { backgroundImage: `url("${villa.images[0]}")` } : undefined}
        />
        <div className="vd-gallery-side">
          <div className={`vd-thumb ${villa.images[1] ? "" : villa.tone}`}>
            {villa.images[1] && <img className="vd-thumb-img" src={villa.images[1]} alt="" loading="lazy" decoding="async" />}
          </div>
          <div className={`vd-thumb ${villa.images[2] ? "" : villa.tone}`}>
            {villa.images[2] && <img className="vd-thumb-img" src={villa.images[2]} alt="" loading="lazy" decoding="async" />}
          </div>
        </div>
      </div>

      <div className="vd-layout">
        <div className="vd-main">
          <div className="vd-city"><MapPin size={13} />{cityLabel(villa.city, language)}</div>
          <h1 className="vd-title">{villa.title[language] || villa.title.en}</h1>
          <div className="vd-listing-meta">
            {villa.code} · {villa.postedAt}
            {user?.id === row.host_id && <Link to={`/edit-listing/${villa.id}`} className="vd-edit-link"> · {t("myListingsPage.edit")}</Link>}
          </div>
          <div className="vd-meta">
            <span><Users size={15} />{villa.guests} {t("villaDetail.guestsUnit")}</span>
            <span><BedDouble size={15} />{villa.bedrooms} {t("villaDetail.bedroomsUnit")}</span>
          </div>

          <h2>{t("villaDetail.aboutHeading")}</h2>
          <p className="vd-desc">{villa.description[language] || villa.description.en}</p>

          <h2>{t("villaDetail.amenitiesHeading")}</h2>
          <div className="vd-amenities">
            {villa.amenities.map((key) => {
              const Icon = AMENITY_ICONS[key];
              return (
                <div className="vd-amenity" key={key}>
                  <Icon size={17} />{t(`amenities.${key}`)}
                </div>
              );
            })}
          </div>

          <ListingReviews listingId={villa.id} />
        </div>

        <aside className="vd-sidebar">
          <div className="vd-price-row">
            <div className="vd-price">
              {villa.discount ? (<><span className="vd-price-old">{formatPrice(villa.price)}</span> {formatPrice(Math.round(villa.price * (1 - villa.discount / 100)))}</>) : formatPrice(villa.price)} <span>{t("villaDetail.perNight")}</span>
            </div>
            <SaveHeart type="villa" id={villa.id} className="detail-save-btn" />
          </div>

          <Link to={`/host/${villa.host?.id}`} className="vd-host">
            <div className="vd-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="vd-host-name">{villa.host?.full_name || t("villaDetail.hostName")}</div>
              <div className="vd-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </Link>

          <PhoneReveal phone={villa.phone} />
        </aside>
      </div>
    </div>
  );
}
