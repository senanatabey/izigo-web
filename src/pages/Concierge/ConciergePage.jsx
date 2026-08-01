import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Snowflake, Flame, Trees, Wind, ShoppingBasket, Droplet, UtensilsCrossed,
  Camera, Drone, Compass, Pill, Stethoscope, WashingMachine, Baby, Tent,
  ChefHat, Flower2, Coffee, Cake, ArrowLeftRight,
  MessageCircle, MapPin,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";
import { fetchApprovedListings } from "../../lib/listings";
import { useSeo } from "../../lib/seo";
import PhoneReveal from "../../components/PhoneReveal";

const CITIES = ALL_DESTINATIONS;

const IZIGO_HELPER_PHONE = "+994516175624";

export const SERVICES = [
  { key: "ice", icon: Snowflake },
  { key: "coal", icon: Flame },
  { key: "firewood", icon: Trees },
  { key: "hookah", icon: Wind },
  { key: "bbq", icon: UtensilsCrossed },
  { key: "privateChef", icon: ChefHat },
  { key: "flowers", icon: Flower2 },
  { key: "breakfast", icon: Coffee },
  { key: "market", icon: ShoppingBasket },
  { key: "honey", icon: Droplet },
  { key: "restaurant", icon: UtensilsCrossed },
  { key: "photographer", icon: Camera },
  { key: "drone", icon: Drone },
  { key: "guide", icon: Compass },
  { key: "airportTransfer", icon: ArrowLeftRight },
  { key: "pharmacy", icon: Pill },
  { key: "doctor", icon: Stethoscope },
  { key: "laundry", icon: WashingMachine },
  { key: "babysitter", icon: Baby },
  { key: "babyBed", icon: Baby },
  { key: "birthdayDecor", icon: Cake },
  { key: "campGear", icon: Tent },
];

export default function ConciergePage() {
  const { t, language } = useLanguage();

  useSeo({
    title: "Local Services in Azerbaijan — Bring",
    description: "Ice, firewood, private chefs, photographers and more — arranged by verified locals in Baku, Gabala and Guba, something Airbnb and Booking don't offer.",
    path: "/concierge",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  const [serviceFilter, setServiceFilter] = useState("");
  const [note, setNote] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedListings("service")
      .then((rows) => setListings(rows))
      .finally(() => setLoading(false));
  }, []);

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setServiceFilter("");
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return listings.filter((row) => {
      if (cityParam && row.city.toLowerCase() !== cityParam.toLowerCase()) return false;
      if (serviceFilter && row.details?.serviceType !== serviceFilter) return false;
      return true;
    });
  }, [listings, cityParam, serviceFilter]);

  const canRequest = cityParam && serviceFilter;

  const whatsappHref = useMemo(() => {
    if (!canRequest) return "#";
    const serviceText = t(`conciergePage.services.${serviceFilter}`);
    const cityText = cityLabel(cityParam, language);
    let message = `${t("conciergePage.whatsappIntro")} ${cityText} — ${serviceText}.`;
    if (note.trim()) message += ` ${note.trim()}`;
    const digits = IZIGO_HELPER_PHONE.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }, [canRequest, serviceFilter, cityParam, note, t, language]);

  return (
    <div className="concierge-page">
      <style>{`
        .concierge-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .concierge-page .cg-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .concierge-page .cg-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 8px; max-width: 640px; line-height: 1.6; }
        .concierge-page .cg-note {
          display: inline-block; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange);
          background: var(--bg-soft); padding: 6px 14px; border-radius: 999px; margin-bottom: 28px;
        }

        .concierge-page .cg-filters {
          display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px;
          border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin-bottom: 28px;
        }
        .concierge-page .cg-field { display: flex; flex-direction: column; gap: 6px; }
        .concierge-page .cg-field label { font-size: 12.5px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 5px; }
        .concierge-page .cg-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; min-width: 200px; font-family: var(--sans);
        }
        .concierge-page .cg-reset {
          border: none; background: none; color: var(--izigo-green); font-weight: 700;
          font-size: 13.5px; cursor: pointer; padding: 10px 0;
        }

        .concierge-page .cg-count { font-size: 14px; color: var(--text-soft); margin-bottom: 20px; }

        .concierge-page .cg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .concierge-page .cg-item { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .concierge-page .cg-item-thumb { aspect-ratio: 4 / 2.6; background-size: cover; background-position: center; background-color: var(--bg-soft); }
        .concierge-page .cg-item-body { padding: 16px; }
        .concierge-page .cg-item-service { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--izigo-green); margin-bottom: 6px; }
        .concierge-page .cg-item-title { font-size: 14.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; line-height: 1.4; }

        .concierge-page .cg-empty { text-align: center; padding: 60px 20px; color: var(--text-soft); border: 1px dashed var(--border); border-radius: 16px; margin-bottom: 40px; }

        .concierge-page .cg-cta {
          border: 1px solid var(--border); border-radius: 16px; padding: 28px; text-align: center;
        }
        .concierge-page .cg-cta h2 { font-size: 18px; font-weight: 800; margin: 0 0 8px; }
        .concierge-page .cg-cta p { font-size: 14px; color: var(--text-soft); margin: 0 0 18px; }
        .concierge-page .cg-note-field {
          width: 100%; max-width: 480px; margin: 0 auto 18px; display: block;
          border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px;
          font-size: 14px; font-family: var(--sans); resize: vertical; min-height: 70px;
        }
        .concierge-page .cg-whatsapp {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
          padding: 13px 24px; font-weight: 700; font-size: 14.5px; text-decoration: none;
          transition: filter 0.15s ease;
        }
        .concierge-page .cg-whatsapp:hover { filter: brightness(0.95); }
        .concierge-page .cg-whatsapp.disabled { cursor: not-allowed; opacity: 0.5; pointer-events: none; }
        .concierge-page .cg-contact-note { font-size: 12px; color: var(--text-soft); margin-top: 10px; }

        @media (max-width: 1024px) { .concierge-page .cg-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .concierge-page { padding: 32px 5vw 56px; }
          .concierge-page .cg-grid { grid-template-columns: 1fr; }
          .concierge-page .cg-filters { flex-direction: column; align-items: stretch; }
          .concierge-page .cg-field select { width: 100%; }
        }
      `}</style>

      <div className="cg-head">
        <h1>{t("conciergePage.heading")}</h1>
        <p>{t("conciergePage.subtitle")}</p>
        <div className="cg-note">{t("conciergePage.exclusiveNote")}</div>
      </div>

      <div className="cg-filters">
        <div className="cg-field">
          <label><MapPin size={13} />{t("conciergePage.filterCity")}</label>
          <select value={cityParam} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t("conciergePage.allCities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{cityLabel(c, language)}</option>)}
          </select>
        </div>
        <div className="cg-field">
          <label>{t("conciergePage.filterService")}</label>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="">{t("conciergePage.allServices")}</option>
            {SERVICES.map(({ key }) => <option key={key} value={key}>{t(`conciergePage.services.${key}`)}</option>)}
          </select>
        </div>
        <button type="button" className="cg-reset" onClick={resetFilters}>{t("conciergePage.resetFilters")}</button>
      </div>

      <p className="cg-count">{t("conciergePage.resultsCount").replace("{count}", filtered.length)}</p>

      {loading ? null : filtered.length === 0 ? (
        <div className="cg-empty">{t("conciergePage.noResults")}</div>
      ) : (
        <div className="cg-grid">
          {filtered.map((item) => (
            <div className="cg-item" key={item.id}>
              {item.images?.[0] && (
                <div className="cg-item-thumb" style={{ backgroundImage: `url("${item.images[0]}")` }} />
              )}
              <div className="cg-item-body">
                <div className="cg-item-service">
                  <MapPin size={12} />{cityLabel(item.city, language)}
                  {item.details?.serviceType ? ` · ${t(`conciergePage.services.${item.details.serviceType}`)}` : ""}
                </div>
                <div className="cg-item-title">{item.title?.[language] || item.title?.en}</div>
                <PhoneReveal phone={item.whatsapp_phone} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cg-cta">
        <h2>{t("conciergePage.ctaHeading2")}</h2>
        <p>{t("conciergePage.ctaSubtitle2")}</p>

        <textarea
          className="cg-note-field"
          placeholder={t("conciergePage.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`cg-whatsapp${!canRequest ? " disabled" : ""}`}>
          <MessageCircle size={17} />{t("conciergePage.contactWhatsapp")}
        </a>
        <p className="cg-contact-note">
          {!canRequest ? t("conciergePage.requestHint") : t("villaDetail.contactNote")}
        </p>
      </div>
    </div>
  );
}
