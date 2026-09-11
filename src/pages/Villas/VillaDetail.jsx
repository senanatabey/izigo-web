import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Users, BedDouble, Bath, User, Wifi, UtensilsCrossed, Snowflake, ParkingCircle, Flame, Trees, Waves, Thermometer, Ruler, Layers, Clock, CheckCircle2, XCircle, X, Check, Mountain, Building2, Sprout, Eye } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { useSeo, schema } from "../../lib/seo";
import {
  fetchListingById, fetchApprovedListings, mapVillaListing, rankSimilarVillas,
  toneForId, shortListingCode, relativeDate, fetchAgentPrice,
} from "../../lib/listings";
import { cityLabel, cityLocative } from "../../data/azerbaijanDestinations";
import { isLongStayDiscountActive, longStayDiscountedPrice } from "../../lib/pricing";
import PhoneReveal from "../../components/PhoneReveal";
import SaveHeart from "../../components/SaveHeart";
import ListingReviews from "../../components/ListingReviews";
import ListingGallery from "../../components/ListingGallery";
import VillaCard from "../../components/VillaCard";

// Must stay in sync with AMENITY_ICONS in AddListingFormPage — a key the host
// can pick there but that is missing here would render as `undefined` and
// crash the whole page. Check is the fallback for any future unmapped key.
const AMENITY_ICONS = { wifi: Wifi, kitchen: UtensilsCrossed, ac: Snowflake, parking: ParkingCircle, fireplace: Flame, garden: Trees, pool: Waves, heated_pool: Thermometer };
const VIEW_ICONS = { mountain: Mountain, sea: Waves, forest: Trees, city: Building2, garden: Sprout };
// View-type labels carry a leading emoji in the AZ strings ("🏔 Dağ mənzərəsi")
// — strip it so the combined pill grid reads uniformly with a lucide icon.
const stripEmoji = (s) => s.replace(/^[^\p{L}]+/u, "");
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
  const [agentPrice, setAgentPrice] = useState(null);

  useEffect(() => {
    fetchListingById(id).then(setRow).finally(() => setLoading(false));
  }, [id]);

  // B2B agent price — a separate, RLS-guarded query, fired only for a
  // logged-in user. Returns null for anyone not eligible (ordinary guests,
  // unapproved agents), so the badge simply never renders for them.
  useEffect(() => {
    if (!user || !id) return undefined;
    let cancelled = false;
    fetchAgentPrice(id).then((p) => { if (!cancelled) setAgentPrice(p); });
    return () => { cancelled = true; };
  }, [id, user]);

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

        .villa-detail .vd-header { margin-bottom: 20px; }
        .villa-detail .vd-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .villa-detail .vd-badge { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; letter-spacing: 0.2px; }
        .villa-detail .vd-badge-founder { background: var(--izigo-green); color: #fff; }
        .villa-detail .vd-badge-agent { background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange); }
        .villa-detail .vd-title { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .villa-detail .vd-city {
          display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600;
          color: var(--text-soft); background: none; border: none; padding: 0; cursor: pointer;
          font-family: var(--sans);
        }
        .villa-detail .vd-city:hover { color: var(--izigo-green); text-decoration: underline; }
        .villa-detail .vd-city svg { color: var(--izigo-orange); flex-shrink: 0; }

        /* Gallery + amenities in the left column, sidebar in the right column
           spanning the full height and sticking as you scroll. */
        .villa-detail .vd-layout { display: grid; grid-template-columns: 1fr 340px; column-gap: 48px; align-items: start; }
        .villa-detail .vd-gallery-col { grid-column: 1; grid-row: 1; min-width: 0; }
        .villa-detail .vd-main { grid-column: 1; grid-row: 2; min-width: 0; }
        .villa-detail .vd-sidebar { grid-column: 2; grid-row: 1 / span 2; align-self: start; position: sticky; top: 88px; }

        /* Compact amenities inside the sidebar: a borderless 2-column grid. */
        .villa-detail .vd-sb-amenities-label { font-size: 12px; font-weight: 800; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 10px; }
        .villa-detail .vd-sb-amenities-grid { column-count: 2; column-gap: 12px; }
        .villa-detail .vd-sb-amenity { display: flex; align-items: flex-start; gap: 7px; font-size: 12.5px; line-height: 1.35; color: var(--text); margin-bottom: 9px; break-inside: avoid; -webkit-column-break-inside: avoid; }
        .villa-detail .vd-sb-amenity svg { color: var(--izigo-green); flex-shrink: 0; margin-top: 1px; }

        .villa-detail .vd-bedtypes { margin-top: 10px; }
        .villa-detail .vd-bedtypes-line { font-size: 13px; color: var(--text); margin-bottom: 3px; }
        .villa-detail .vd-bedcapacity-line { font-size: 11.5px; color: var(--text-soft); }
        .villa-detail .vd-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 14px; }
        .villa-detail .vd-main h2.vd-subheading { margin: 8px 0 14px; }
        .villa-detail .vd-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }

        .villa-detail .vd-footer-meta {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          font-size: 12.5px; color: var(--text-soft);
          margin: 32px 0 8px; padding-top: 16px; border-top: 1px solid var(--border);
        }
        .villa-detail .vd-edit-btn {
          font-size: 12.5px; font-weight: 700; color: var(--izigo-green);
          border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px;
        }


        .villa-detail .vd-checkinout { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 32px; }
        .villa-detail .vd-checkinout div { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-soft); }
        .villa-detail .vd-checkinout svg { color: var(--izigo-green); flex-shrink: 0; }

        .villa-detail .vd-houserules-grid { display: grid; grid-template-columns: repeat(2, 1fr); row-gap: 14px; column-gap: 14px; margin-bottom: 32px; }
        .villa-detail .vd-houserule { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text); line-height: 1.4; }
        .villa-detail .vd-rule-yes { color: var(--izigo-green); flex-shrink: 0; }
        .villa-detail .vd-rule-no { color: #E0553F; flex-shrink: 0; }
        .villa-detail .vd-houserules-notes { font-size: 13px; color: var(--text-soft); margin: -20px 0 32px; line-height: 1.6; }

        .villa-detail .vd-sidebar { border: 1px solid var(--border); border-radius: 16px; padding: 24px; background: var(--bg); }
        .villa-detail .vd-facts { display: flex; flex-wrap: wrap; row-gap: 8px; column-gap: 16px; }
        .villa-detail .vd-facts span { display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--text-soft); }
        .villa-detail .vd-facts svg { color: var(--izigo-green); flex-shrink: 0; }
        .villa-detail .vd-sb-divider { border-top: 1px solid var(--border); margin: 18px 0; }
        .villa-detail .vd-price { font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: -0.3px; margin-bottom: 4px; }
        .villa-detail .vd-price span { font-size: 13px; font-weight: 500; color: var(--text-soft); }
        .villa-detail .vd-price-old { font-size: 13px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .villa-detail .vd-price-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; background: rgba(0, 200, 151, 0.08); border-radius: 12px; padding: 14px 16px; margin: 4px 0 16px; }
        .villa-detail .vd-price-block { flex: 1; min-width: 0; }
        .villa-detail .vd-longstay-note { font-size: 12px; font-weight: 600; color: var(--izigo-green); margin-top: 4px; }
        .villa-detail .vd-agent-price {
          margin-top: 12px; margin-bottom: 16px; padding: 8px 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 700;
          background: rgba(186, 91, 46, 0.14); color: var(--izigo-orange);
        }
        .villa-detail .detail-save-btn { position: static; }
        .villa-detail .vd-host { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 0; }
        .villa-detail .vd-host-name { font-size: 14px; font-weight: 700; line-height: 1.3; }
        .villa-detail .vd-host-type { font-size: 11.5px; font-weight: 700; color: var(--text-soft); line-height: 1.3; }
        .villa-detail .vd-host-avatar { width: 38px; height: 38px; border-radius: 10px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--text-soft); flex-shrink: 0; }
        .villa-detail .vd-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }
        .villa-detail .vd-host-all-listings { display: block; font-size: 12.5px; font-weight: 400; color: var(--izigo-green); margin: 0 0 16px; }
        .villa-detail .vd-host-all-listings:hover { text-decoration: underline; }

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
          /* Single column, no sticky: gallery, then the sidebar card
             (facts / price / amenities / contact), then the description. */
          .villa-detail .vd-gallery-col { grid-column: 1; grid-row: 1; }
          .villa-detail .vd-sidebar { grid-column: 1; grid-row: 2; position: static; }
          .villa-detail .vd-main { grid-column: 1; grid-row: 3; }
        }
        @media (max-width: 1024px) {
          .villa-detail .vd-related-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .villa-detail { padding: 20px 5vw 56px; }
          .villa-detail .vd-related-grid { grid-template-columns: 1fr; }
          .villa-detail .vd-houserules-grid { grid-template-columns: 1fr; }
          .villa-detail .vd-checkinout { font-size: 13px; }
          .villa-detail .vd-checkinout div { font-size: 13px; }
        }
      `}</style>

      <Link to="/villas" className="vd-back">{t("villaDetail.back")}</Link>

      <div className="vd-header">
        {/* Agent status already shows next to the host's name in the sidebar
            (vd-host-type) — a second "Vasitəçi" pill up here was pure
            duplication. The founder badge has no sidebar equivalent, so it
            stays. */}
        {villa.host?.founder_host && (
          <div className="vd-badges">
            <span className="vd-badge vd-badge-founder">{t("villaDetail.founderBadge")}</span>
          </div>
        )}
        <h1 className="vd-title">{villa.title[language] || villa.title.en}</h1>
        <button type="button" className="vd-city" onClick={() => setMapOpen(true)}>
          <MapPin size={14} />{cityLabel(villa.city, language)}
        </button>
      </div>

      <div className="vd-layout">
        <div className="vd-gallery-col">
          <ListingGallery
            images={villa.images} tone={villa.tone}
            alt={villa.title[language] || villa.title.en}
            priceLabel={`${formatPrice(villa.discount ? Math.round(villa.price * (1 - villa.discount / 100)) : villa.price)} ${t("villaDetail.perNight")}`}
            phone={villa.phone} listingId={villa.id}
          />
        </div>

        <div className="vd-main">
          <h2>{t("villaDetail.aboutHeading")}</h2>
          <p className="vd-desc">{villa.description[language] || villa.description.en}</p>

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

          <div className="vd-footer-meta">
            <span>{villa.code} · {villa.postedAt}</span>
            {user?.id === row.host_id && (
              <Link to={`/edit-listing/${villa.id}`} className="vd-edit-btn">{t("myListingsPage.edit")}</Link>
            )}
          </div>

          <ListingReviews listingId={villa.id} />
        </div>

        <aside className="vd-sidebar">
          <div className="vd-facts">
            <span><Users size={15} />{villa.guests} {t("villaDetail.guestsUnit")}</span>
            <span><BedDouble size={15} />{villa.bedrooms} {t("villaDetail.bedroomsUnit")}</span>
            {villa.bathrooms != null && <span><Bath size={15} />{villa.bathrooms} {t("villaDetail.bathroomsUnit")}</span>}
            {villa.areaSqm != null && <span><Ruler size={15} />{villa.areaSqm} {t("villaDetail.areaUnit")}</span>}
            {villa.floorCount != null && <span><Layers size={15} />{villa.floorCount} {t("villaDetail.floorsUnit")}</span>}
          </div>
          {villa.bedTypes?.length > 0 && (
            <div className="vd-bedtypes">
              <div className="vd-bedtypes-line">
                🛏️ {villa.bedTypes.map((bt) => `${bt.count} ${t(`bedTypes.${bt.type}`)}`).join(" · ")}
              </div>
              <div className="vd-bedcapacity-line">
                {t("villaDetail.bedCapacityLabel").replace("{count}", villa.bedCapacity)}
              </div>
            </div>
          )}

          {(villa.amenities.length > 0 || villa.viewType?.some((k) => k !== "none")) && (
            <>
              <div className="vd-sb-divider" />
              <div className="vd-sb-amenities-label">{t("villaDetail.amenitiesAndViewHeading")}</div>
              <div className="vd-sb-amenities-grid">
                {villa.amenities.map((key) => {
                  const Icon = AMENITY_ICONS[key] || Check;
                  return <div className="vd-sb-amenity" key={`a-${key}`}><Icon size={14} />{t(`amenities.${key}`)}</div>;
                })}
                {(villa.viewType || []).filter((key) => key !== "none").map((key) => {
                  const Icon = VIEW_ICONS[key] || Eye;
                  return <div className="vd-sb-amenity" key={`v-${key}`}><Icon size={14} />{stripEmoji(t(`viewTypes.${key}`))}</div>;
                })}
              </div>
            </>
          )}

          <div className="vd-sb-divider" />

          <div className="vd-price-row">
            <div className="vd-price-block">
              {/* Main price is always the 1-night rate — a long-stay discount
                  is conditional on a minimum number of nights, so it must
                  never be the number shown as "the price" by default. It
                  gets its own smaller line underneath instead. */}
              <div className="vd-price">
                {villa.discount ? (<><span className="vd-price-old">{formatPrice(villa.price)}</span> {formatPrice(Math.round(villa.price * (1 - villa.discount / 100)))}</>) : formatPrice(villa.price)} <span>{t("villaDetail.perNight")}</span>
              </div>
              {longStayActive && (
                <div className="vd-longstay-note">
                  {t("villaDetail.longStayNote").replace("{nights}", villa.longStayMinNights)}: {formatPrice(longStayPrice)} {t("villaDetail.perNight")}
                </div>
              )}
            </div>
            <SaveHeart type="villa" id={villa.id} className="detail-save-btn" />
          </div>

          {agentPrice != null && (
            <div className="vd-agent-price">
              {t("villaDetail.agentPriceLabel")}: {formatPrice(agentPrice)}
            </div>
          )}

          <div className="vd-sb-divider" />

          <Link to={`/host/${villa.host?.id}`} className="vd-host">
            <div>
              <div className="vd-host-name">{villa.host?.full_name || t("villaDetail.hostName")}</div>
              <div className="vd-host-type">
                {villa.host?.host_type === "agent" ? t("villaDetail.hostAgent") : t("villaDetail.hostOwner")}
              </div>
            </div>
            <div className="vd-host-avatar"><User size={18} /></div>
          </Link>
          <Link to={`/host/${villa.host?.id}`} className="vd-host-all-listings">
            {t("villaDetail.viewAllListings")} →
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
    </div>
  );
}
