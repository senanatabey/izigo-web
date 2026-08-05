import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Calendar, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { fetchListingById, toneForId, shortListingCode, relativeDate } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";

export default function EventDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingById(id).then(setRow).finally(() => setLoading(false));
  }, [id]);

  const event = row ? {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    description: row.description,
    price: row.price,
    date: row.details?.date,
    discount: row.discount,
    phone: row.whatsapp_phone,
    host: row.host,
    code: shortListingCode(row.id),
    postedAt: relativeDate(row.created_at, language),
    image: row.images?.[0],
  } : null;

  if (loading) return null;

  if (!event) {
    return (
      <div className="event-detail">
        <style>{`.event-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("eventDetail.notFound")}</p>
        <Link to="/events">{t("eventDetail.back")}</Link>
      </div>
    );
  }

  const formatDate = (iso) => new Date(iso).toLocaleDateString(language === "az" ? "az-AZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="event-detail">
      <style>{`
        .event-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .event-detail .ed-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .event-detail .ed-gallery { border-radius: 16px; overflow: hidden; height: 320px; margin-bottom: 32px; }
        .event-detail .ed-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .event-detail .ed-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .event-detail .ed-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .event-detail .ed-thumb { width: 100%; height: 100%; background-size: cover; background-position: center; }

        .event-detail .ed-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .event-detail .ed-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .event-detail .ed-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .event-detail .ed-listing-meta { font-size: 12.5px; color: var(--text-soft); margin: -10px 0 16px; }
        .event-detail .ed-edit-link { color: var(--izigo-green); font-weight: 700; }
        .event-detail .ed-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .event-detail .ed-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .event-detail .ed-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .event-detail .ed-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }

        .event-detail .ed-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .event-detail .ed-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .event-detail .ed-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .event-detail .ed-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .event-detail .detail-save-btn { position: static; }
        .event-detail .ed-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .event-detail .ed-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .event-detail .ed-host-name { font-size: 14px; font-weight: 700; }
        .event-detail .ed-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }

        @media (max-width: 900px) {
          .event-detail .ed-layout { grid-template-columns: 1fr; }
          .event-detail .ed-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .event-detail { padding: 20px 5vw 56px; }
          .event-detail .ed-gallery { height: 200px; }
        }
      `}</style>

      <Link to="/events" className="ed-back">{t("eventDetail.back")}</Link>

      <div className="ed-gallery">
        <div className={`ed-thumb ${event.image ? "" : event.tone}`} style={event.image ? { backgroundImage: `url("${event.image}")` } : undefined} />
      </div>

      <div className="ed-layout">
        <div className="ed-main">
          <div className="ed-city"><MapPin size={13} />{cityLabel(event.city, language)}</div>
          <h1 className="ed-title">{event.title[language] || event.title.en}</h1>
          <div className="ed-listing-meta">
            {event.code} · {event.postedAt}
            {user?.id === row.host_id && <Link to={`/edit-listing/${event.id}`} className="ed-edit-link"> · {t("myListingsPage.edit")}</Link>}
          </div>
          <div className="ed-meta">
            <span><Calendar size={15} />{formatDate(event.date)}</span>
          </div>

          <h2>{t("eventDetail.aboutHeading")}</h2>
          <p className="ed-desc">{event.description[language] || event.description.en}</p>

          <ListingReviews listingId={event.id} />
        </div>

        <aside className="ed-sidebar">
          <div className="ed-price-row">
            <div className="ed-price">
              {event.price === 0 ? t("eventsPage.free") : event.discount ? (<><span className="ed-price-old">{formatPrice(event.price)}</span> {formatPrice(Math.round(event.price * (1 - event.discount / 100)))}</>) : formatPrice(event.price)}
            </div>
            <SaveHeart type="event" id={event.id} className="detail-save-btn" />
          </div>

          <Link to={`/host/${event.host?.id}`} className="ed-host">
            <div className="ed-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="ed-host-name">{event.host?.full_name || t("villaDetail.hostName")}</div>
              <div className="ed-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </Link>

          <PhoneReveal phone={event.phone} />
        </aside>
      </div>
    </div>
  );
}
