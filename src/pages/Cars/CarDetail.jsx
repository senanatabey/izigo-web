import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Settings2, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { fetchListingById, toneForId, shortListingCode, relativeDate } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";

export default function CarDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingById(id).then(setRow).finally(() => setLoading(false));
  }, [id]);

  const car = row ? {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    description: row.description,
    price: row.price,
    seats: row.details?.seats || 0,
    discount: row.discount,
    transmission: row.details?.transmission || "automatic",
    phone: row.whatsapp_phone,
    host: row.host,
    code: shortListingCode(row.id),
    postedAt: relativeDate(row.created_at, language),
    image: row.images?.[0],
  } : null;

  if (loading) return null;

  if (!car) {
    return (
      <div className="car-detail">
        <style>{`.car-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("carDetail.notFound")}</p>
        <Link to="/cars">{t("carDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="car-detail">
      <style>{`
        .car-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .car-detail .cd-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .car-detail .cd-gallery { border-radius: 16px; overflow: hidden; height: 380px; margin-bottom: 32px; }
        .car-detail .cd-thumb { width: 100%; height: 100%; background-size: cover; background-position: center; }
        .car-detail .cd-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .car-detail .cd-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .car-detail .cd-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }

        .car-detail .cd-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .car-detail .cd-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .car-detail .cd-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .car-detail .cd-listing-meta { font-size: 12.5px; color: var(--text-soft); margin: -10px 0 16px; }
        .car-detail .cd-edit-link { color: var(--izigo-green); font-weight: 700; }
        .car-detail .cd-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .car-detail .cd-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .car-detail .cd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .car-detail .cd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); }

        .car-detail .cd-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .car-detail .cd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .car-detail .cd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .car-detail .cd-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .car-detail .cd-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .car-detail .detail-save-btn { position: static; }
        .car-detail .cd-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .car-detail .cd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .car-detail .cd-host-name { font-size: 14px; font-weight: 700; }
        .car-detail .cd-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }

        @media (max-width: 900px) {
          .car-detail .cd-layout { grid-template-columns: 1fr; }
          .car-detail .cd-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .car-detail { padding: 20px 5vw 56px; }
          .car-detail .cd-gallery { height: 220px; }
        }
      `}</style>

      <Link to="/cars" className="cd-back">{t("carDetail.back")}</Link>

      <div className="cd-gallery">
        <div className={`cd-thumb ${car.image ? "" : car.tone}`} style={car.image ? { backgroundImage: `url("${car.image}")` } : undefined} />
      </div>

      <div className="cd-layout">
        <div className="cd-main">
          <div className="cd-city"><MapPin size={13} />{cityLabel(car.city, language)}</div>
          <h1 className="cd-title">{car.title[language] || car.title.en}</h1>
          <div className="cd-listing-meta">
            {car.code} · {car.postedAt}
            {user?.id === row.host_id && <Link to={`/edit-listing/${car.id}`} className="cd-edit-link"> · {t("myListingsPage.edit")}</Link>}
          </div>
          <div className="cd-meta">
            <span><Users size={15} />{car.seats} {t("carsPage.seatsUnit")}</span>
            <span><Settings2 size={15} />{t(`addListing.${car.transmission}`)}</span>
          </div>

          <h2>{t("carDetail.aboutHeading")}</h2>
          <p className="cd-desc">{car.description[language] || car.description.en}</p>

          <ListingReviews listingId={car.id} />
        </div>

        <aside className="cd-sidebar">
          <div className="cd-price-row">
            <div className="cd-price">
              {car.discount ? (<><span className="cd-price-old">{formatPrice(car.price)}</span> {formatPrice(Math.round(car.price * (1 - car.discount / 100)))}</>) : formatPrice(car.price)} <span>{t("carsPage.perDay")}</span>
            </div>
            <SaveHeart type="car" id={car.id} className="detail-save-btn" />
          </div>

          <Link to={`/host/${car.host?.id}`} className="cd-host">
            <div className="cd-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="cd-host-name">{car.host?.full_name || t("villaDetail.hostName")}</div>
              <div className="cd-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </Link>

          <PhoneReveal phone={car.phone} />
        </aside>
      </div>
    </div>
  );
}
