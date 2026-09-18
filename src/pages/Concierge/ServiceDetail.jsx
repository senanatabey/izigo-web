import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { useSeo, schema } from "../../lib/seo";
import { fetchListingById, toneForId, shortListingCode, relativeDate } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingGallery from "../../components/ListingGallery";

export default function ServiceDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingById(id).then(setRow).finally(() => setLoading(false));
  }, [id]);

  const item = row ? {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    description: row.description,
    price: row.price,
    serviceType: row.details?.serviceType,
    phone: row.whatsapp_phone,
    host: row.host,
    code: shortListingCode(row),
    postedAt: relativeDate(row.created_at, language),
    images: row.images || [],
  } : null;

  useSeo({
    title: item ? `${t("serviceDetail.seoTitle").replace("{city}", cityLabel(item.city, language))} — ${item.title?.[language] || item.title?.en}` : undefined,
    description: item ? (item.description?.[language] || item.description?.en) : undefined,
    path: `/concierge/${id}`,
    image: item?.images?.[0],
    ogType: "product",
    structuredData: item && item.price ? schema.product({
      name: item.title?.[language] || item.title?.en,
      description: item.description?.[language] || item.description?.en,
      url: `https://izigo.az/concierge/${id}`,
      image: item.images?.[0],
      price: item.price,
    }) : null,
  });

  if (loading) return null;

  if (!item) {
    return (
      <div className="service-detail">
        <style>{`.service-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("serviceDetail.notFound")}</p>
        <Link to="/concierge">{t("serviceDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="service-detail">
      <style>{`
        .service-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .service-detail .sd-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }

        .service-detail .sd-header { margin-bottom: 20px; }
        .service-detail .sd-badge {
          display: inline-flex; align-items: center; font-size: 12px; font-weight: 700; color: var(--izigo-green);
          background: var(--bg-soft); padding: 5px 12px; border-radius: 999px; margin-bottom: 10px;
        }
        .service-detail .sd-title { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .service-detail .sd-city { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: var(--text-soft); }
        .service-detail .sd-city svg { color: var(--izigo-orange); flex-shrink: 0; }

        .service-detail .sd-layout { display: grid; grid-template-columns: 1fr 340px; column-gap: 48px; align-items: start; }
        .service-detail .sd-gallery-col { grid-column: 1; grid-row: 1; min-width: 0; }
        .service-detail .sd-main { grid-column: 1; grid-row: 2; min-width: 0; }
        .service-detail .sd-sidebar { grid-column: 2; grid-row: 1 / span 2; align-self: start; position: sticky; top: 88px; }
        .service-detail .sd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .service-detail .sd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 24px; }

        .service-detail .sd-footer-meta {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          font-size: 12.5px; color: var(--text-soft);
          margin: 32px 0 8px; padding-top: 16px; border-top: 1px solid var(--border);
        }
        .service-detail .sd-edit-btn { font-size: 12.5px; font-weight: 700; color: var(--izigo-green); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; }

        .service-detail .sd-sidebar { border: 1px solid var(--border); border-radius: 16px; padding: 24px; background: var(--bg); }
        .service-detail .sd-sb-divider { border-top: 1px solid var(--border); margin: 18px 0; }
        .service-detail .sd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .service-detail .sd-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .service-detail .detail-save-btn { position: static; }
        .service-detail .sd-host { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .service-detail .sd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .service-detail .sd-host-name { font-size: 14px; font-weight: 700; }

        @media (max-width: 900px) {
          .service-detail .sd-layout { grid-template-columns: 1fr; }
          .service-detail .sd-gallery-col { grid-column: 1; grid-row: 1; }
          .service-detail .sd-sidebar { grid-column: 1; grid-row: 2; position: static; }
          .service-detail .sd-main { grid-column: 1; grid-row: 3; }
        }
        @media (max-width: 640px) {
          .service-detail { padding: 20px 5vw 56px; }
        }
      `}</style>

      <Link to="/concierge" className="sd-back">{t("serviceDetail.back")}</Link>

      <div className="sd-header">
        {item.serviceType && <div className="sd-badge">{t(`conciergePage.services.${item.serviceType}`)}</div>}
        <h1 className="sd-title">{item.title?.[language] || item.title?.en}</h1>
        <div className="sd-city"><MapPin size={14} />{cityLabel(item.city, language)}</div>
      </div>

      <div className="sd-layout">
        <div className="sd-gallery-col">
          <ListingGallery
            images={item.images} tone={item.tone}
            alt={item.title?.[language] || item.title?.en}
            priceLabel={item.price ? formatPrice(item.price) : ""}
            phone={item.phone} listingId={item.id}
          />
        </div>

        <div className="sd-main">
          {(item.description?.[language] || item.description?.en) && (
            <>
              <h2>{t("serviceDetail.aboutHeading")}</h2>
              <p className="sd-desc">{item.description[language] || item.description.en}</p>
            </>
          )}

          <div className="sd-footer-meta">
            <span>{item.code} · {item.postedAt}</span>
            {user?.id === row.host_id && (
              <Link to={`/edit-listing/${item.id}`} className="sd-edit-btn">{t("myListingsPage.edit")}</Link>
            )}
          </div>
        </div>

        <aside className="sd-sidebar">
          <div className="sd-price-row">
            {item.price ? <div className="sd-price">{formatPrice(item.price)}</div> : <div />}
            <SaveHeart type="service" id={item.id} className="detail-save-btn" />
          </div>
          <div className="sd-sb-divider" />

          <Link to={`/host/${item.host?.id}`} className="sd-host">
            <div className="sd-host-avatar"><ShieldCheck size={20} /></div>
            <span className="sd-host-name">{item.host?.full_name || t("villaDetail.hostName")}</span>
          </Link>

          <PhoneReveal phone={item.phone} listingId={item.id} />
        </aside>
      </div>
    </div>
  );
}
