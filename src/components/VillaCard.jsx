import { Link } from "react-router-dom";
import { MapPin, Users, BedDouble, Waves, Thermometer } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCurrency } from "../i18n/CurrencyContext";
import { cityLabel } from "../data/azerbaijanDestinations";
import { isLongStayDiscountActive, longStayDiscountedPrice } from "../lib/pricing";
import SaveHeart from "./SaveHeart";

// The single villa card design — used by the Villas grid, and by the
// "Similar listings" / "More listings in <city>" sections on the villa
// detail page, so every villa card on the site looks and behaves the same.
export default function VillaCard({ villa }) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const longStayActive = isLongStayDiscountActive(villa);
  const longStayPrice = longStayActive ? longStayDiscountedPrice(villa) : null;

  return (
    <Link to={`/villas/${villa.id}`} className="villa-card">
      <style>{`
        .villa-card { position: relative; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; display: block; transition: box-shadow 0.15s ease, transform 0.15s ease; background: var(--bg); }
        .villa-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .villa-card .vc-thumb { aspect-ratio: 4 / 2.8; background-size: cover; background-position: center; }
        .villa-card .vc-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .villa-card .vc-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .villa-card .vc-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .villa-card .vc-body { padding: 18px; }
        .villa-card .vc-city { display: flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 700; color: var(--izigo-green); margin-bottom: 6px; }
        .villa-card .vc-title { font-size: 15.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.4; }
        .villa-card .vc-meta { display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--text-soft); margin-bottom: 14px; flex-wrap: wrap; }
        .villa-card .vc-meta span { display: flex; align-items: center; gap: 5px; }
        .villa-card .vc-meta span.vc-amenity-badge { color: var(--izigo-green); font-weight: 700; }
        .villa-card .vc-footer { display: flex; align-items: center; justify-content: space-between; }
        .villa-card .vc-price { font-size: 16px; font-weight: 800; color: var(--text); }
        .villa-card .vc-price span { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
        .villa-card .vc-price-old { font-size: 12.5px; font-weight: 500; color: #E0553F !important; text-decoration: line-through; }
        .villa-card .vc-longstay-tag { font-size: 11px; font-weight: 700; color: var(--izigo-green); margin-top: 2px; }
        .villa-card .vc-link { font-size: 13px; font-weight: 700; color: var(--izigo-green); }
      `}</style>
      <SaveHeart type="villa" id={villa.id} />
      <div className={`vc-thumb ${villa.image ? "" : villa.tone}`} style={villa.image ? { backgroundImage: `url("${villa.image}")` } : undefined} />
      <div className="vc-body">
        <div className="vc-city"><MapPin size={12} />{cityLabel(villa.city, language)}</div>
        <div className="vc-title">{villa.title[language] || villa.title.en}</div>
        <div className="vc-meta">
          <span><Users size={14} />{villa.guests} {t("villasPage.guestsUnit")}</span>
          <span><BedDouble size={14} />{villa.bedrooms} {t("villasPage.bedroomsUnit")}</span>
          {villa.amenities?.includes("heated_pool") ? (
            <span className="vc-amenity-badge"><Thermometer size={14} />{t("amenities.heated_pool")}</span>
          ) : villa.amenities?.includes("pool") ? (
            <span className="vc-amenity-badge"><Waves size={14} />{t("amenities.pool")}</span>
          ) : null}
        </div>
        <div className="vc-footer">
          <div className="vc-price">
            {longStayActive ? (
              <>
                <span className="vc-price-old">{formatPrice(villa.price)}</span> {formatPrice(longStayPrice)} <span>{t("villasPage.perNight")}</span>
                <div className="vc-longstay-tag">{t("villasPage.longStayTag").replace("{nights}", villa.longStayMinNights)}</div>
              </>
            ) : villa.discount ? (
              <><span className="vc-price-old">{formatPrice(villa.price)}</span> {formatPrice(Math.round(villa.price * (1 - villa.discount / 100)))} <span>{t("villasPage.perNight")}</span></>
            ) : (
              <>{formatPrice(villa.price)} <span>{t("villasPage.perNight")}</span></>
            )}
          </div>
          <span className="vc-link">{t("villasPage.viewDetails")} →</span>
        </div>
      </div>
    </Link>
  );
}
