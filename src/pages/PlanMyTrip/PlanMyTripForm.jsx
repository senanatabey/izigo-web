import { useState } from "react";
import {
  MapPin, Wallet, Users, CalendarDays, MessageCircle, Home as HomeIcon,
  Heart, Users as FriendsIcon, Briefcase, User, Gift, Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const CITIES = ["Baku", "Gabala", "Guba"];

const TRAVELER_TYPES = [
  { key: "family", icon: HomeIcon },
  { key: "couple", icon: Heart },
  { key: "friends", icon: FriendsIcon },
  { key: "business", icon: Briefcase },
  { key: "solo", icon: User },
];

const OCCASIONS = [
  { key: "birthday", icon: Gift },
  { key: "honeymoon", icon: Heart },
  { key: "anniversary", icon: Sparkles },
  { key: "weekend", icon: CalendarDays },
  { key: "businessTrip", icon: Briefcase },
  { key: "other", icon: Gift },
];

export default function PlanMyTripForm() {
  const { t } = useLanguage();
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [guests, setGuests] = useState("");
  const [days, setDays] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [travelerType, setTravelerType] = useState("");
  const [occasion, setOccasion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = destination && budget && guests && days && whatsapp;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-success">
        <CheckCircle2 size={40} className="pt-success-icon" />
        <h3>{t("planTrip.successHeading")}</h3>
        <p>{t("planTrip.successText")}</p>
      </div>
    );
  }

  return (
    <form className="pt-form" onSubmit={handleSubmit}>
      <div className="pt-row">
        <div className="pt-field">
          <label><MapPin size={13} />{t("planTrip.destination")}</label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)}>
            <option value="">{t("planTrip.chooseCity")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="pt-field">
          <label><Wallet size={13} />{t("planTrip.budget")}</label>
          <input type="number" min="0" placeholder="AZN" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div className="pt-field">
          <label><Users size={13} />{t("planTrip.guests")}</label>
          <input type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} />
        </div>
        <div className="pt-field">
          <label><CalendarDays size={13} />{t("planTrip.days")}</label>
          <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
        <div className="pt-field full">
          <label><MessageCircle size={13} />{t("planTrip.whatsapp")}</label>
          <input type="tel" placeholder="+994 55 123 45 67" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <div className="pt-field full">
          <label>{t("planTrip.notes")}</label>
          <textarea placeholder={t("planTrip.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <p className="pt-section-title">{t("planTrip.travelerTypeHeading")}</p>
      <div className="pt-chips">
        {TRAVELER_TYPES.map(({ key, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`pt-chip${travelerType === key ? " active" : ""}`}
            onClick={() => setTravelerType(travelerType === key ? "" : key)}
          >
            <Icon size={14} />{t(`planTrip.travelerTypes.${key}`)}
          </button>
        ))}
      </div>

      <p className="pt-section-title">{t("planTrip.occasionHeading")}</p>
      <div className="pt-chips">
        {OCCASIONS.map(({ key, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`pt-chip${occasion === key ? " active" : ""}`}
            onClick={() => setOccasion(occasion === key ? "" : key)}
          >
            <Icon size={14} />{t(`planTrip.occasions.${key}`)}
          </button>
        ))}
      </div>

      <button type="submit" className="pt-submit" disabled={!canSubmit}>
        {t("planTrip.submit")}
      </button>
      <p className="pt-submit-note">{t("planTrip.submitNote")}</p>
    </form>
  );
}
