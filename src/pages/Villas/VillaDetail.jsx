import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, BedDouble, Bath, ShieldCheck, Wifi, UtensilsCrossed, Snowflake, ParkingCircle, Flame, Trees, Ruler, Layers, Clock, CheckCircle2, XCircle, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { useSeo, schema } from "../../lib/seo";
import {
  fetchListingById, fetchApprovedListings, mapVillaListing, rankSimilarVillas,
  toneForId, shortListingCode, relativeDate,
} from "../../lib/listings";
import { cityLabel, cityLocative } from "../../data/azerbaijanDestinations";
import { isLongStayDiscountActive, longStayDiscountedPrice } from "../../lib/pricing";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";
import VillaCard from "../../components/VillaCard";

const AMENITY_ICONS = { wifi: Wifi, kitchen: UtensilsCrossed, ac: Snowflake, parking: ParkingCircle, fireplace: Flame, garden: Trees };
const HOUSE_RULE_KEYS = ["smoking", "pets", "parties"];
// Purely a mathematical rollup of the host's declared bed types — never a
// booking guarantee, never merged with the official "guests" count above.
const BED_TYPE_SLEEPS = { double: 2, single: 1, sofa_bed: 2, bunk: 2 };

export default function VillaDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarVillas, setSimilarVillas] = useState([]);
  const [moreInCity, setMoreInCity] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    fetchListingById(id).then(setRow).finally(() => setLoading(false));
  }, [id]);

  // Similar/more-listings sections read from the same approved-villas list
  // (mapVillaListing gives every villa the shape VillaCard expects), so no
  // new fetch helpers or fake data — just ranking on top of existing rows.
  useEffect(() => {
    if (!row || row.category !== "villa") return;
    let cancelled = false;
    fetchApprovedListings("villa").then((rows) => {
      if (cancelled) return;
      const mapped = rows.map(mapVillaListing);
      const current = mapVillaListing(row);
      setSimilarVillas(rankSimilarVillas(current, mapped, 4));
      setMoreInCity(
        mapped
          .filter((v) => v.city === current.city && v.id !== current.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4)
      );
    });
    return () => { cancelled = true; };
  }, [row]);

  const villa = row ? {
    id: row.id,
    city: row.city,
    tone: toneForId(row.id),
    title: row.title,
    description: row.description,
    price: row.price,
    guests: row.details?.guests || 0,
    bedrooms: row.details?.bedrooms || 0,
    // Older listings were created before bathrooms existed — leave it
    // null rather than defaulting to 0, so it's simply not shown.
    bathrooms: row.details?.bathrooms ?? null,
    amenities: row.details?.amenities || [],
    areaSqm: row.details?.area_sqm ?? null,
    floorCount: row.details?.floor_count ?? null,
    bedTypes: row.details?.bed_types || null,
    bedCapacity: (row.details?.bed_types || []).reduce((sum, r) => sum + (BED_TYPE_SLEEPS[r.type] || 0) * (r.count || 0), 0),
    checkInTime: row.details?.check_in_time || null,
    checkOutTime: row.details?.check_out_time || null,
    houseRules: row.details?.house_rules || null,
    viewType: row.details?.view_type || null,
    discount: row.discount,
    longStayEnabled: row.long_stay_discount_enabled || false,
    longStayMinNights: row.long_stay_min_nights || 2,
    longStayDiscountType: row.long_stay_discount_type || null,
    longStayDiscountValue: row.long_stay_discount_value ?? null,
    phone: row.whatsapp_phone,
    host: row.host,
    code: shortListingCode(row),
    postedAt: relativeDate(row.created_at, language),
    images: row.images || [],
  } : null;

  const longStayActive = villa ? isLongStayDiscountActive(villa) : false;
  const longStayPrice = longStayActive ? longStayDiscountedPrice(villa) : null;

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
        .villa-detail .vd-meta { display: flex; flex-wrap: wrap; row-gap: 8px; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .villa-detail .vd-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .villa-detail .vd-bedtypes { margin: -16px 0 24px; }
        /* pulls up under vd-meta's own 24px bottom margin so the two related
           lines (guest stats, then bed breakdown) read as one connected block */
        .villa-detail .vd-bedtypes-line { font-size: 13.5px; color: var(--text); margin-bottom: 3px; }
        .villa-detail .vd-bedcapacity-line { font-size: 11.5px; color: var(--text-soft); }
        .villa-detail .vd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 14px; }
        .villa-detail .vd-main h2.vd-subheading { margin: 8px 0 14px; }
        .villa-detail .vd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 16px; }
        .villa-detail .vd-viewtype-chips { margin: 0 0 32px; }
        .villa-detail .vd-viewtype-chip { display: inline-flex; align-items: center; font-size: 12.5px; font-weight: 600; color: var(--text); background: var(--bg-soft); border: 1px solid var(--border); border-radius: 999px; padding: 6px 14px; }
        .villa-detail .vd-amenities { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 32px; }
        .villa-detail .vd-amenity { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text); }
        .villa-detail .vd-amenity svg { color: var(--izigo-green); }


        .villa-detail .vd-checkinout { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 32px; }
        .villa-detail .vd-checkinout div { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-soft); }
        .villa-detail .vd-checkinout svg { color: var(--izigo-green); flex-shrink: 0; }

        .villa-detail .vd-houserules-grid { display: grid; grid-template-columns: repeat(2, 1fr); row-gap: 14px; column-gap: 14px; margin-bottom: 32px; }
        .villa-detail .vd-houserule { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text); line-height: 1.4; }
        .villa-detail .vd-rule-yes { color: var(--izigo-green); flex-shrink: 0; }
        .villa-detail .vd-rule-no { color: #E0553F; flex-shrink: 0; }
        .villa-detail .vd-houserules-notes { font-size: 13px; color: var(--text-soft); margin: -20px 0 32px; line-height: 1.6; }

        .villa-detail .vd-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .villa-detail .vd-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .villa-detail .vd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .villa-detail .vd-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .villa-detail .vd-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .villa-detail .vd-price-block { flex: 1; min-width: 0; }
        .villa-detail .vd-price-regular { font-size: 13px; font-weight: 500; color: var(--text-soft); text-decoration: line-through; margin-bottom: 2px; }
        .villa-detail .vd-price-regular span { font-size: 12px; }
        .villa-detail .vd-longstay-note { font-size: 12px; font-weight: 600; color: var(--izigo-green); margin-top: 4px; }
        .villa-detail .detail-save-btn { position: static; }
        .villa-detail .vd-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .villa-detail .vd-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .villa-detail .vd-host-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .villa-detail .vd-host-name { font-size: 14px; font-weight: 700; }
        .villa-detail .vd-agent-badge {
          font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 999px;
          background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange);
        }
        .villa-detail .vd-agency-name { font-size: 12px; color: var(--text-soft); margin-top: 2px; }
        .villa-detail .vd-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }

        .villa-detail .vd-location { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
        .villa-detail .vd-location-place { display: flex; align-items: center; gap: 8px; font-size: 15px; color: var(--text); font-weight: 600; }
        .villa-detail .vd-location-place svg { color: var(--izigo-orange); flex-shrink: 0; }
        .villa-detail .vd-map-link { font-size: 13.5px; font-weight: 700; color: var(--izigo-green); white-space: nowrap; background: none; border: none; cursor: pointer; padding: 0; font-family: var(--sans); }

        .villa-detail .vd-map-overlay {
          position: fixed; inset: 0; background: rgba(11, 61, 59, 0.55); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .villa-detail .vd-map-modal {
          position: relative; width: 100%; max-width: 720px; height: min(520px, 80vh);
          background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .villa-detail .vd-map-close {
          position: absolute; top: 12px; right: 12px; z-index: 1; width: 32px; height: 32px; border-radius: 50%;
          border: none; background: #fff; color: var(--text); display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .villa-detail .vd-map-iframe { width: 100%; height: 100%; border: none; display: block; }
        @media (max-width: 640px) {
          .villa-detail .vd-map-overlay { padding: 0; }
          .villa-detail .vd-map-modal { max-width: 100%; height: 100%; border-radius: 0; }
        }

        .villa-detail .vd-related { max-width: 1280px; margin: 48px auto 0; padding-top: 32px; border-top: 1px solid var(--border); }
        .villa-detail .vd-related h2 { font-size: 19px; font-weight: 800; margin: 0 0 18px; }
        /* Fixed-width columns + justify-content: start instead of a plain
           repeat(4, 1fr): 4 cards sit evenly in one row at full card width,
           and when there are fewer than 4 the cards keep that same width
           and line up from the left instead of stretching or leaving a
           visible empty trailing column. 260px keeps 4 columns fitting even
           at a plain 1280px window (container is ~1113px after the page's
           6vw side padding) without shrinking further at wider screens. */
        .villa-detail .vd-related-grid { display: grid; grid-template-columns: repeat(auto-fill, 260px); gap: 20px; justify-content: start; }

        @media (max-width: 900px) {
          .villa-detail .vd-layout { grid-template-columns: 1fr; }
          .villa-detail .vd-sidebar { position: static; }
        }
        @media (max-width: 1024px) {
          .villa-detail .vd-related-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .villa-detail { padding: 20px 5vw 56px; }
          .villa-detail .vd-gallery { grid-template-columns: 1fr; height: auto; }
          .villa-detail .vd-gallery-main { height: 220px; }
          .villa-detail .vd-gallery-side { display: none; }
          .villa-detail .vd-amenities { grid-template-columns: 1fr; }
          .villa-detail .vd-related-grid { grid-template-columns: 1fr; }
          .villa-detail .vd-houserules-grid { grid-template-columns: 1fr; }
          .villa-detail .vd-checkinout { font-size: 13px; }
          .villa-detail .vd-checkinout div { font-size: 13px; }
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
            {villa.bathrooms != null && <span><Bath size={15} />{villa.bathrooms} {t("villaDetail.bathroomsUnit")}</span>}
            {villa.areaSqm != null && <span><Ruler size={15} />{villa.areaSqm} {t("villaDetail.areaUnit")}</span>}
            {villa.floorCount != null && <span><Layers size={15} />{villa.floorCount} {t("villaDetail.floorsUnit")}</span>}
          </div>

          {villa.bedTypes?.length > 0 && (
            <div className="vd-bedtypes">
              <div className="vd-bedtypes-line">
                🛏️ {villa.bedTypes.map((row) => `${row.count} ${t(`bedTypes.${row.type}`)}`).join(" · ")}
              </div>
              <div className="vd-bedcapacity-line">
                {t("villaDetail.bedCapacityLabel").replace("{count}", villa.bedCapacity)}
              </div>
            </div>
          )}

          <h2>{t("villaDetail.aboutHeading")}</h2>
          <p className="vd-desc">{villa.description[language] || villa.description.en}</p>
          {villa.viewType?.length > 0 && (
            <div className="vd-viewtype-chips">
              {villa.viewType.map((key) => <span className="vd-viewtype-chip" key={key}>{t(`viewTypes.${key}`)}</span>)}
            </div>
          )}

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


          {(villa.checkInTime || villa.checkOutTime) && (
            <>
              <h2 className="vd-subheading">{t("villaDetail.checkInOutHeading")}</h2>
              <div className="vd-checkinout">
                <div><Clock size={15} />{t("villaDetail.checkInText").replace("{time}", villa.checkInTime || "14:00")}</div>
                <div><Clock size={15} />{t("villaDetail.checkOutText").replace("{time}", villa.checkOutTime || "12:00")}</div>
              </div>
            </>
          )}

          {villa.houseRules && (
            <>
              <h2 className="vd-subheading">{t("villaDetail.houseRulesHeading")}</h2>
              <div className="vd-houserules-grid">
                {HOUSE_RULE_KEYS.filter((key) => villa.houseRules[key] !== null && villa.houseRules[key] !== undefined).map((key) => (
                  <div className="vd-houserule" key={key}>
                    {villa.houseRules[key] ? <CheckCircle2 size={16} className="vd-rule-yes" /> : <XCircle size={16} className="vd-rule-no" />}
                    {villa.houseRules[key]
                      ? t("villaDetail.houseRuleAllowed").replace("{rule}", t(`houseRules.${key}`))
                      : t("villaDetail.houseRuleNotAllowed").replace("{rule}", t(`houseRules.${key}`))}
                  </div>
                ))}
                {villa.houseRules.quiet_hours && (
                  <div className="vd-houserule">
                    <Clock size={16} />
                    {t("villaDetail.quietHoursText").replace("{from}", villa.houseRules.quiet_hours.from).replace("{to}", villa.houseRules.quiet_hours.to)}
                  </div>
                )}
              </div>
              {villa.houseRules.additional_notes && <p className="vd-houserules-notes">{villa.houseRules.additional_notes}</p>}
            </>
          )}

          <h2>{t("villaDetail.locationHeading")}</h2>
          <div className="vd-location">
            <div className="vd-location-place"><MapPin size={17} />{cityLabel(villa.city, language)}, Azerbaijan</div>
            <button type="button" className="vd-map-link" onClick={() => setMapOpen(true)}>
              {t("villaDetail.viewOnMap")}
            </button>
          </div>

          {mapOpen && (
            <div className="vd-map-overlay" onClick={() => setMapOpen(false)}>
              <div className="vd-map-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="vd-map-close" onClick={() => setMapOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
                <iframe
                  title="map"
                  className="vd-map-iframe"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(`${cityLabel(villa.city, language)}, Azerbaijan`)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

          <ListingReviews listingId={villa.id} />
        </div>

        <aside className="vd-sidebar">
          <div className="vd-price-row">
            <div className="vd-price-block">
              {longStayActive ? (
                <>
                  <div className="vd-price-regular">{formatPrice(villa.price)} <span>{t("villaDetail.perNight")}</span></div>
                  <div className="vd-price">{formatPrice(longStayPrice)} <span>{t("villaDetail.perNight")}</span></div>
                  <div className="vd-longstay-note">{t("villaDetail.longStayNote").replace("{nights}", villa.longStayMinNights)}</div>
                </>
              ) : (
                <div className="vd-price">
                  {villa.discount ? (<><span className="vd-price-old">{formatPrice(villa.price)}</span> {formatPrice(Math.round(villa.price * (1 - villa.discount / 100)))}</>) : formatPrice(villa.price)} <span>{t("villaDetail.perNight")}</span>
                </div>
              )}
            </div>
            <SaveHeart type="villa" id={villa.id} className="detail-save-btn" />
          </div>

          <Link to={`/host/${villa.host?.id}`} className="vd-host">
            <div className="vd-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="vd-host-name-row">
                <span className="vd-host-name">{villa.host?.full_name || t("villaDetail.hostName")}</span>
                {villa.host?.agent_status === "approved" && <span className="vd-agent-badge">{t("villaDetail.agentBadge")}</span>}
              </div>
              {villa.host?.agent_status === "approved" && villa.host?.agency_name && (
                <div className="vd-agency-name">{villa.host.agency_name}</div>
              )}
            </div>
          </Link>

          <PhoneReveal phone={villa.phone} listingId={villa.id} />
        </aside>
      </div>

      {similarVillas.length > 0 && (
        <div className="vd-related">
          <h2>{t("villaDetail.similarListingsHeading")}</h2>
          <div className="vd-related-grid">
            {similarVillas.map((v) => <VillaCard villa={v} key={v.id} />)}
          </div>
        </div>
      )}

      {moreInCity.length > 0 && (
        <div className="vd-related">
          <h2>{t("villaDetail.moreListingsHeading").replace("{city}", cityLocative(villa.city, language))}</h2>
          <div className="vd-related-grid">
            {moreInCity.map((v) => <VillaCard villa={v} key={v.id} />)}
          </div>
        </div>
      )}
    </div>
  );
}
