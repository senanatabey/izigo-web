import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, Car, Footprints, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";
import { fetchListingById, toneForId, shortListingCode, relativeDate } from "../../lib/listings";
import { cityLabel } from "../../data/azerbaijanDestinations";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";

export default function ExperienceDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingById(id).then((data) => {
      setRow(data && data.details?.type === "tour" ? data : null);
    }).finally(() => setLoading(false));
  }, [id]);

  const item = row ? {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    description: row.description,
    price: row.price,
    discount: row.discount,
    hasVehicle: !!row.details?.hasVehicle,
    seats: row.details?.seats || 0,
    phone: row.whatsapp_phone,
    host: row.host,
    code: shortListingCode(row.id),
    postedAt: relativeDate(row.created_at, language),
    image: row.images?.[0],
  } : null;

  if (loading) return null;

  if (!item) {
    return (
      <div className="experience-detail">
        <style>{`.experience-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("experienceDetail.notFound")}</p>
        <Link to="/experiences">{t("experienceDetail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="experience-detail">
      <style>{`
        .experience-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .experience-detail .xd-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .experience-detail .xd-gallery { border-radius: 16px; overflow: hidden; height: 320px; margin-bottom: 32px; }
        .experience-detail .xd-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .experience-detail .xd-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .experience-detail .xd-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .experience-detail .xd-thumb { width: 100%; height: 100%; background-size: cover; background-position: center; }

        .experience-detail .xd-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .experience-detail .xd-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .experience-detail .xd-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .experience-detail .xd-listing-meta { font-size: 12.5px; color: var(--text-soft); margin: -10px 0 16px; }
        .experience-detail .xd-edit-link { color: var(--izigo-green); font-weight: 700; }
        .experience-detail .xd-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .experience-detail .xd-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .experience-detail .xd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .experience-detail .xd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }
        .experience-detail .xd-vehicle {
          display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700;
          color: var(--izigo-green); background: var(--bg-soft); padding: 8px 14px; border-radius: 999px;
        }

        .experience-detail .xd-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .experience-detail .xd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .experience-detail .xd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .experience-detail .xd-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .experience-detail .xd-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .experience-detail .detail-save-btn { position: static; }
        .experience-detail .xd-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .experience-detail .xd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .experience-detail .xd-host-name { font-size: 14px; font-weight: 700; }
        .experience-detail .xd-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }

        @media (max-width: 900px) {
          .experience-detail .xd-layout { grid-template-columns: 1fr; }
          .experience-detail .xd-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .experience-detail { padding: 20px 5vw 56px; }
          .experience-detail .xd-gallery { height: 200px; }
        }
      `}</style>

      <Link to="/experiences" className="xd-back">{t("experienceDetail.back")}</Link>

      <div className="xd-gallery">
        <div className={`xd-thumb ${item.image ? "" : item.tone}`} style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined} />
      </div>

      <div className="xd-layout">
        <div className="xd-main">
          <div className="xd-city"><MapPin size={13} />{cityLabel(item.city, language)}</div>
          <h1 className="xd-title">{item.title[language] || item.title.en}</h1>
          <div className="xd-listing-meta">
            {item.code} · {item.postedAt}
            {user?.id === row.host_id && <Link to={`/edit-listing/${item.id}`} className="xd-edit-link"> · {t("myListingsPage.edit")}</Link>}
          </div>
          <div className="xd-meta">
            <span><Users size={15} />{item.seats} {t("transfersPage.seatsUnit")}</span>
          </div>

          <h2>{t("experienceDetail.aboutHeading")}</h2>
          <p className="xd-desc">{item.description[language] || item.description.en}</p>

          <div className="xd-vehicle">
            {item.hasVehicle ? <Car size={15} /> : <Footprints size={15} />}
            {item.hasVehicle ? t("transferDetail.withVehicleNote") : t("transferDetail.withoutVehicleNote")}
          </div>

          <ListingReviews listingId={item.id} />
        </div>

        <aside className="xd-sidebar">
          <div className="xd-price-row">
            <div className="xd-price">
              {item.discount ? (<><span className="xd-price-old">{item.price} AZN</span> {Math.round(item.price * (1 - item.discount / 100))} AZN</>) : `${item.price} AZN`} <span>{t("transfersPage.perPerson")}</span>
            </div>
            <SaveHeart type="experience" id={item.id} className="detail-save-btn" />
          </div>

          <Link to={`/host/${item.host?.id}`} className="xd-host">
            <div className="xd-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="xd-host-name">{item.host?.full_name || t("villaDetail.hostName")}</div>
              <div className="xd-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </Link>

          <PhoneReveal phone={item.phone} />
        </aside>
      </div>
    </div>
  );
}
