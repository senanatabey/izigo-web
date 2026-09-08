import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Calendar, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { fetchListingById, toneForId, shortListingCode, relativeDate, fetchAgentPrice } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";
import ListingGallery from "../../components/ListingGallery";

export default function EventDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentPrice, setAgentPrice] = useState(null);

  useEffect(() => {
    fetchListingById(id).then(setRow).finally(() => setLoading(false));
  }, [id]);

  // B2B agent price — separate RLS-guarded query, only for logged-in users;
  // null (badge hidden) for anyone not eligible.
  useEffect(() => {
    if (!user || !id) return undefined;
    let cancelled = false;
    fetchAgentPrice(id).then((p) => { if (!cancelled) setAgentPrice(p); });
    return () => { cancelled = true; };
  }, [id, user]);

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
    code: shortListingCode(row),
    postedAt: relativeDate(row.created_at, language),
    images: row.images || [],
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

        .event-detail .ed-header { margin-bottom: 20px; }
        .event-detail .ed-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .event-detail .ed-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; letter-spacing: 0.2px; }
        .event-detail .ed-badge-founder { background: var(--izigo-green); color: #fff; }
        .event-detail .ed-badge-agent { background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange); }
        .event-detail .ed-title { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .event-detail .ed-city { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: var(--text-soft); }
        .event-detail .ed-city svg { color: var(--izigo-orange); flex-shrink: 0; }

        .event-detail .ed-layout { display: grid; grid-template-columns: 1fr 340px; column-gap: 48px; align-items: start; }
        .event-detail .ed-gallery-col { grid-column: 1; grid-row: 1; min-width: 0; }
        .event-detail .ed-main { grid-column: 1; grid-row: 2; min-width: 0; }
        .event-detail .ed-sidebar { grid-column: 2; grid-row: 1 / span 2; align-self: start; position: sticky; top: 88px; }
        .event-detail .ed-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .event-detail .ed-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); }

        .event-detail .ed-footer-meta {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          font-size: 12.5px; color: var(--text-soft);
          margin: 32px 0 8px; padding-top: 16px; border-top: 1px solid var(--border);
        }
        .event-detail .ed-edit-btn { font-size: 12.5px; font-weight: 700; color: var(--izigo-green); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; }

        .event-detail .ed-sidebar { border: 1px solid var(--border); border-radius: 16px; padding: 24px; background: var(--bg); }
        .event-detail .ed-facts { display: flex; flex-wrap: wrap; row-gap: 8px; column-gap: 16px; }
        .event-detail .ed-facts span { display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--text-soft); }
        .event-detail .ed-facts svg { color: var(--izigo-green); flex-shrink: 0; }
        .event-detail .ed-sb-divider { border-top: 1px solid var(--border); margin: 18px 0; }
        .event-detail .ed-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .event-detail .ed-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .event-detail .ed-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .event-detail .ed-agent-price {
          margin-top: 12px; padding: 8px 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 700;
          background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange);
        }
        .event-detail .detail-save-btn { position: static; }
        .event-detail .ed-host { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .event-detail .ed-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .event-detail .ed-host-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .event-detail .ed-host-name { font-size: 14px; font-weight: 700; }
        .event-detail .ed-host-type { font-size: 11.5px; font-weight: 700; color: var(--text-soft); }
        .event-detail .ed-agency-name { font-size: 12px; color: var(--text-soft); margin-top: 2px; }

        @media (max-width: 900px) {
          .event-detail .ed-layout { grid-template-columns: 1fr; }
          .event-detail .ed-gallery-col { grid-column: 1; grid-row: 1; }
          .event-detail .ed-sidebar { grid-column: 1; grid-row: 2; position: static; }
          .event-detail .ed-main { grid-column: 1; grid-row: 3; }
        }
        @media (max-width: 640px) {
          .event-detail { padding: 20px 5vw 56px; }
        }
      `}</style>

      <Link to="/events" className="ed-back">{t("eventDetail.back")}</Link>

      <div className="ed-header">
        {(event.host?.founder_host || event.host?.agent_status === "approved") && (
          <div className="ed-badges">
            {event.host?.founder_host && <span className="ed-badge ed-badge-founder">{t("villaDetail.founderBadge")}</span>}
            {event.host?.agent_status === "approved" && <span className="ed-badge ed-badge-agent">{t("villaDetail.agentBadge")}</span>}
          </div>
        )}
        <h1 className="ed-title">{event.title[language] || event.title.en}</h1>
        <div className="ed-city"><MapPin size={14} />{cityLabel(event.city, language)}</div>
      </div>

      <div className="ed-layout">
        <div className="ed-gallery-col">
          <ListingGallery
            images={event.images} tone={event.tone}
            alt={event.title[language] || event.title.en}
            priceLabel={event.price === 0 ? t("eventsPage.free") : formatPrice(event.discount ? Math.round(event.price * (1 - event.discount / 100)) : event.price)}
            phone={event.phone} listingId={event.id}
          />
        </div>

        <div className="ed-main">
          <h2>{t("eventDetail.aboutHeading")}</h2>
          <p className="ed-desc">{event.description[language] || event.description.en}</p>

          <div className="ed-footer-meta">
            <span>{event.code} · {event.postedAt}</span>
            {user?.id === row.host_id && (
              <Link to={`/edit-listing/${event.id}`} className="ed-edit-btn">{t("myListingsPage.edit")}</Link>
            )}
          </div>

          <ListingReviews listingId={event.id} />
        </div>

        <aside className="ed-sidebar">
          <div className="ed-facts">
            <span><Calendar size={15} />{formatDate(event.date)}</span>
          </div>

          <div className="ed-sb-divider" />

          <div className="ed-price-row">
            <div className="ed-price">
              {event.price === 0 ? t("eventsPage.free") : event.discount ? (<><span className="ed-price-old">{formatPrice(event.price)}</span> {formatPrice(Math.round(event.price * (1 - event.discount / 100)))}</>) : formatPrice(event.price)}
            </div>
            <SaveHeart type="event" id={event.id} className="detail-save-btn" />
          </div>

          {agentPrice != null && (
            <div className="ed-agent-price">
              {t("villaDetail.agentPriceLabel")}: {formatPrice(agentPrice)}
            </div>
          )}

          <div className="ed-sb-divider" />

          <Link to={`/host/${event.host?.id}`} className="ed-host">
            <div className="ed-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="ed-host-name-row">
                <span className="ed-host-name">{event.host?.full_name || t("villaDetail.hostName")}</span>
                <span className="ed-host-type">
                  {event.host?.host_type === "agent" ? t("villaDetail.hostAgent") : t("villaDetail.hostOwner")}
                </span>
              </div>
              {event.host?.agent_status === "approved" && event.host?.agency_name && (
                <div className="ed-agency-name">{event.host.agency_name}</div>
              )}
            </div>
          </Link>

          <PhoneReveal phone={event.phone} listingId={event.id} />
        </aside>
      </div>
    </div>
  );
}
