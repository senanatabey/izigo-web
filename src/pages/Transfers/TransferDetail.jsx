import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Car, Footprints, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { fetchListingById, toneForId, shortListingCode, relativeDate, fetchAgentPrice } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";
import ListingGallery from "../../components/ListingGallery";

export default function TransferDetail() {
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

  const item = row ? {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    description: row.description,
    price: row.price,
    discount: row.discount,
    type: row.details?.type || "transfer",
    hasVehicle: !!row.details?.hasVehicle,
    seats: row.details?.seats || 0,
    phone: row.whatsapp_phone,
    host: row.host,
    code: shortListingCode(row),
    postedAt: relativeDate(row.created_at, language),
    images: row.images || [],
  } : null;

  if (loading) return null;

  if (!item) {
    return (
      <div className="transfer-detail">
        <style>{`.transfer-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("transferDetail.notFound")}</p>
        <Link to="/transfers">{t("transferDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="transfer-detail">
      <style>{`
        .transfer-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .transfer-detail .td-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .transfer-detail .td-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .transfer-detail .td-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .transfer-detail .td-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .transfer-detail .td-listing-meta { font-size: 12.5px; color: var(--text-soft); margin: -10px 0 16px; }
        .transfer-detail .td-edit-link { color: var(--izigo-green); font-weight: 700; }
        .transfer-detail .td-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .transfer-detail .td-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .transfer-detail .td-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .transfer-detail .td-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }
        .transfer-detail .td-vehicle {
          display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700;
          color: var(--izigo-green); background: var(--bg-soft); padding: 8px 14px; border-radius: 999px;
        }

        .transfer-detail .td-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .transfer-detail .td-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .transfer-detail .td-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .transfer-detail .td-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .transfer-detail .td-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .transfer-detail .td-agent-price {
          margin-top: 12px; padding: 8px 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 700;
          background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange);
        }
        .transfer-detail .detail-save-btn { position: static; }
        .transfer-detail .td-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .transfer-detail .td-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .transfer-detail .td-host-name { font-size: 14px; font-weight: 700; }
        .transfer-detail .td-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }

        @media (max-width: 900px) {
          .transfer-detail .td-layout { grid-template-columns: 1fr; }
          .transfer-detail .td-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .transfer-detail { padding: 20px 5vw 56px; }
        }
      `}</style>

      <Link to="/transfers" className="td-back">{t("transferDetail.back")}</Link>

      <ListingGallery images={item.images} tone={item.tone} alt={item.title[language] || item.title.en} />

      <div className="td-layout">
        <div className="td-main">
          <div className="td-city"><MapPin size={13} />{cityLabel(item.city, language)}</div>
          <h1 className="td-title">{item.title[language] || item.title.en}</h1>
          <div className="td-listing-meta">
            {item.code} · {item.postedAt}
            {user?.id === row.host_id && <Link to={`/edit-listing/${item.id}`} className="td-edit-link"> · {t("myListingsPage.edit")}</Link>}
          </div>
          <div className="td-meta">
            <span>{item.type === "tour" ? t("transfersPage.typeTour") : t("transfersPage.typeTransfer")}</span>
            <span><Users size={15} />{item.seats} {t("transfersPage.seatsUnit")}</span>
          </div>

          <h2>{t("transferDetail.aboutHeading")}</h2>
          <p className="td-desc">{item.description[language] || item.description.en}</p>

          <div className="td-vehicle">
            {item.hasVehicle ? <Car size={15} /> : <Footprints size={15} />}
            {item.hasVehicle ? t("transferDetail.withVehicleNote") : t("transferDetail.withoutVehicleNote")}
          </div>

          <ListingReviews listingId={item.id} />
        </div>

        <aside className="td-sidebar">
          <div className="td-price-row">
            <div className="td-price">
              {item.discount ? (<><span className="td-price-old">{formatPrice(item.price)}</span> {formatPrice(Math.round(item.price * (1 - item.discount / 100)))}</>) : formatPrice(item.price)} <span>{t("transfersPage.perPerson")}</span>
            </div>
            <SaveHeart type="transfer" id={item.id} className="detail-save-btn" />
          </div>

          {agentPrice != null && (
            <div className="td-agent-price">
              {t("villaDetail.agentPriceLabel")}: {formatPrice(agentPrice)}
            </div>
          )}

          <Link to={`/host/${item.host?.id}`} className="td-host">
            <div className="td-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="td-host-name">{item.host?.full_name || t("villaDetail.hostName")}</div>
            </div>
          </Link>

          <PhoneReveal phone={item.phone} listingId={item.id} />
        </aside>
      </div>
    </div>
  );
}
