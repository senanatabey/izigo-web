import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Snowflake, Flame, Trees, Wind, ShoppingBasket, Droplet, UtensilsCrossed,
  Camera, Drone, Compass, Pill, Stethoscope, WashingMachine, Baby, Tent,
  ChefHat, Flower2, Coffee, Cake, ArrowLeftRight,
  MessageCircle, MapPin, Check,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const CITIES = ["Baku", "Gabala", "Guba"];

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
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityParam = searchParams.get("city") || "";

  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");

  const setCity = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("city", value); else next.delete("city");
    setSearchParams(next);
  };

  const toggleService = (key) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const canRequest = cityParam && selected.length > 0;

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

        .concierge-page .cg-city-field { display: flex; flex-direction: column; gap: 6px; max-width: 220px; margin-bottom: 28px; }
        .concierge-page .cg-city-field label { font-size: 12.5px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 5px; }
        .concierge-page .cg-city-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px;
          font-size: 14px; color: var(--text); background: #fff; font-family: var(--sans);
        }

        .concierge-page .cg-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; margin-bottom: 28px; }
        .concierge-page .cg-card {
          border: 1px solid var(--border); border-radius: 16px; padding: 22px 16px; text-align: center;
          transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease; cursor: pointer;
          background: none; position: relative;
        }
        .concierge-page .cg-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .concierge-page .cg-card.selected { border-color: var(--izigo-green); background: var(--bg-soft); }
        .concierge-page .cg-check {
          position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 50%;
          background: var(--izigo-green); color: #fff; display: flex; align-items: center; justify-content: center;
        }
        .concierge-page .cg-icon {
          width: 48px; height: 48px; border-radius: 50%; background: var(--bg-soft); color: var(--izigo-green);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
        }
        .concierge-page .cg-card.selected .cg-icon { background: #fff; }
        .concierge-page .cg-label { font-size: 13.5px; font-weight: 700; color: var(--text); }

        .concierge-page .cg-cta {
          border: 1px solid var(--border); border-radius: 16px; padding: 28px; text-align: center;
        }
        .concierge-page .cg-cta h2 { font-size: 18px; font-weight: 800; margin: 0 0 8px; }
        .concierge-page .cg-cta p { font-size: 14px; color: var(--text-soft); margin: 0 0 18px; }
        .concierge-page .cg-selected-summary { font-size: 13.5px; color: var(--text); margin-bottom: 16px; }
        .concierge-page .cg-selected-summary strong { color: var(--izigo-green); }
        .concierge-page .cg-note-field {
          width: 100%; max-width: 480px; margin: 0 auto 18px; display: block;
          border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px;
          font-size: 14px; font-family: var(--sans); resize: vertical; min-height: 70px;
        }
        .concierge-page .cg-whatsapp {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
          padding: 13px 24px; font-weight: 700; font-size: 14.5px;
        }
        .concierge-page .cg-whatsapp:disabled { cursor: not-allowed; opacity: 0.5; }
        .concierge-page .cg-whatsapp:not(:disabled) { cursor: not-allowed; opacity: 0.9; }
        .concierge-page .cg-contact-note { font-size: 12px; color: var(--text-soft); margin-top: 10px; }

        @media (max-width: 1024px) { .concierge-page .cg-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) {
          .concierge-page { padding: 32px 5vw 56px; }
          .concierge-page .cg-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .concierge-page .cg-card { padding: 16px 10px; }
        }
      `}</style>

      <div className="cg-head">
        <h1>{t("conciergePage.heading")}</h1>
        <p>{t("conciergePage.subtitle")}</p>
        <div className="cg-note">{t("conciergePage.exclusiveNote")}</div>
      </div>

      <div className="cg-city-field">
        <label><MapPin size={13} />{t("conciergePage.filterCity")}</label>
        <select value={cityParam} onChange={(e) => setCity(e.target.value)}>
          <option value="">{t("conciergePage.chooseCity")}</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="cg-grid">
        {SERVICES.map(({ key, icon: Icon }) => {
          const isSelected = selected.includes(key);
          return (
            <button
              type="button"
              className={`cg-card${isSelected ? " selected" : ""}`}
              key={key}
              onClick={() => toggleService(key)}
            >
              {isSelected && <span className="cg-check"><Check size={12} /></span>}
              <div className="cg-icon"><Icon size={22} /></div>
              <div className="cg-label">{t(`conciergePage.services.${key}`)}</div>
            </button>
          );
        })}
      </div>

      <div className="cg-cta">
        <h2>{t("conciergePage.ctaHeading2")}</h2>
        <p>{t("conciergePage.ctaSubtitle2")}</p>

        {selected.length > 0 && (
          <p className="cg-selected-summary">
            {t("conciergePage.selectedLabel")} <strong>{selected.map((k) => t(`conciergePage.services.${k}`)).join(", ")}</strong>
            {cityParam ? ` — ${cityParam}` : ""}
          </p>
        )}

        <textarea
          className="cg-note-field"
          placeholder={t("conciergePage.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button type="button" className="cg-whatsapp" disabled={!canRequest}>
          <MessageCircle size={17} />{t("conciergePage.contactWhatsapp")}
        </button>
        <p className="cg-contact-note">
          {!canRequest ? t("conciergePage.requestHint") : t("villaDetail.contactNote")}
        </p>
      </div>
    </div>
  );
}
