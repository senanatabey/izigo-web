import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Settings2, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { fetchListingById, toneForId, shortListingCode, relativeDate, fetchAgentPrice } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";
import ListingGallery from "../../components/ListingGallery";

export default function CarDetail() {
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
    code: shortListingCode(row),
    postedAt: relativeDate(row.created_at, language),
    images: row.images || [],
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

        .car-detail .cd-header { margin-bottom: 20px; }
        .car-detail .cd-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .car-detail .cd-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; letter-spacing: 0.2px; }
        .car-detail .cd-badge-founder { background: var(--izigo-green); color: #fff; }
        .car-detail .cd-badge-agent { background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange); }
        .car-detail .cd-title { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .car-detail .cd-city { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: var(--text-soft); }
        .car-detail .cd-city svg { color: var(--izigo-orange); flex-shrink: 0; }

        .car-detail .cd-layout { display: grid; grid-template-columns: 1fr 340px; column-gap: 48px; align-items: start; }
        .car-detail .cd-gallery-col { grid-column: 1; grid-row: 1; min-width: 0; }
        .car-detail .cd-main { grid-column: 1; grid-row: 2; min-width: 0; }
        .car-detail .cd-sidebar { grid-column: 2; grid-row: 1 / span 2; align-self: start; position: sticky; top: 88px; }
        .car-detail .cd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .car-detail .cd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); }

        .car-detail .cd-footer-meta {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          font-size: 12.5px; color: var(--text-soft);
          margin: 32px 0 8px; padding-top: 16px; border-top: 1px solid var(--border);
        }
        .car-detail .cd-edit-btn { font-size: 12.5px; font-weight: 700; color: var(--izigo-green); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; }

        .car-detail .cd-sidebar { border: 1px solid var(--border); border-radius: 16px; padding: 24px; background: var(--bg); }
        .car-detail .cd-facts { display: flex; flex-wrap: wrap; row-gap: 8px; column-gap: 16px; }
        .car-detail .cd-facts span { display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--text-soft); }
        .car-detail .cd-facts svg { color: var(--izigo-green); flex-shrink: 0; }
        .car-detail .cd-sb-divider { border-top: 1px solid var(--border); margin: 18px 0; }
        .car-detail .cd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .car-detail .cd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .car-detail .cd-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .car-detail .cd-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .car-detail .cd-agent-price {
          margin-top: 12px; padding: 8px 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 700;
          background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange);
        }
        .car-detail .detail-save-btn { position: static; }
        .car-detail .cd-host { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .car-detail .cd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .car-detail .cd-host-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .car-detail .cd-host-name { font-size: 14px; font-weight: 700; }
        .car-detail .cd-host-type { font-size: 11.5px; font-weight: 700; color: var(--text-soft); }
        .car-detail .cd-agency-name { font-size: 12px; color: var(--text-soft); margin-top: 2px; }

        @media (max-width: 900px) {
          .car-detail .cd-layout { grid-template-columns: 1fr; }
          .car-detail .cd-gallery-col { grid-column: 1; grid-row: 1; }
          .car-detail .cd-sidebar { grid-column: 1; grid-row: 2; position: static; }
          .car-detail .cd-main { grid-column: 1; grid-row: 3; }
        }
        @media (max-width: 640px) {
          .car-detail { padding: 20px 5vw 56px; }
        }
      `}</style>

      <Link to="/cars" className="cd-back">{t("carDetail.back")}</Link>

      <div className="cd-header">
        {(car.host?.founder_host || car.host?.agent_status === "approved") && (
          <div className="cd-badges">
            {car.host?.founder_host && <span className="cd-badge cd-badge-founder">{t("villaDetail.founderBadge")}</span>}
            {car.host?.agent_status === "approved" && <span className="cd-badge cd-badge-agent">{t("villaDetail.agentBadge")}</span>}
          </div>
        )}
        <h1 className="cd-title">{car.title[language] || car.title.en}</h1>
        <div className="cd-city"><MapPin size={14} />{cityLabel(car.city, language)}</div>
      </div>

      <div className="cd-layout">
        <div className="cd-gallery-col">
          <ListingGallery
            images={car.images} tone={car.tone}
            alt={car.title[language] || car.title.en}
            priceLabel={`${formatPrice(car.discount ? Math.round(car.price * (1 - car.discount / 100)) : car.price)} ${t("carsPage.perDay")}`}
            phone={car.phone} listingId={car.id}
          />
        </div>

        <div className="cd-main">
          <h2>{t("carDetail.aboutHeading")}</h2>
          <p className="cd-desc">{car.description[language] || car.description.en}</p>

          <div className="cd-footer-meta">
            <span>{car.code} · {car.postedAt}</span>
            {user?.id === row.host_id && (
              <Link to={`/edit-listing/${car.id}`} className="cd-edit-btn">{t("myListingsPage.edit")}</Link>
            )}
          </div>

          <ListingReviews listingId={car.id} />
        </div>

        <aside className="cd-sidebar">
          <div className="cd-facts">
            <span><Users size={15} />{car.seats} {t("carsPage.seatsUnit")}</span>
            <span><Settings2 size={15} />{t(`addListing.${car.transmission}`)}</span>
          </div>

          <div className="cd-sb-divider" />

          <div className="cd-price-row">
            <div className="cd-price">
              {car.discount ? (<><span className="cd-price-old">{formatPrice(car.price)}</span> {formatPrice(Math.round(car.price * (1 - car.discount / 100)))}</>) : formatPrice(car.price)} <span>{t("carsPage.perDay")}</span>
            </div>
            <SaveHeart type="car" id={car.id} className="detail-save-btn" />
          </div>

          {agentPrice != null && (
            <div className="cd-agent-price">
              {t("villaDetail.agentPriceLabel")}: {formatPrice(agentPrice)}
            </div>
          )}

          <div className="cd-sb-divider" />

          <Link to={`/host/${car.host?.id}`} className="cd-host">
            <div className="cd-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="cd-host-name-row">
                <span className="cd-host-name">{car.host?.full_name || t("villaDetail.hostName")}</span>
                <span className="cd-host-type">
                  {car.host?.host_type === "agent" ? t("villaDetail.hostAgent") : t("villaDetail.hostOwner")}
                </span>
              </div>
              {car.host?.agent_status === "approved" && car.host?.agency_name && (
                <div className="cd-agency-name">{car.host.agency_name}</div>
              )}
            </div>
          </Link>

          <PhoneReveal phone={car.phone} listingId={car.id} />
        </aside>
      </div>
    </div>
  );
}
