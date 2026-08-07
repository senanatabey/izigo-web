import { useMemo, useState } from "react";
import {
  MapPin, Wallet, Users, CalendarDays, MessageCircle, Home as HomeIcon,
  Heart, Users as FriendsIcon, Briefcase, User, Gift, Sparkles, Car,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { submitTripRequest } from "../../lib/tripRequests";
import { COUNTRY_CODES } from "../../lib/countryCodes";

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

// Future Offer System: each option maps to a `requestedServices` entry so the
// upcoming matching engine can route a request to the right provider type.
const SERVICE_NEEDS = [
  { key: "villa", icon: HomeIcon },
  { key: "transfer", icon: Car },
  { key: "completePlanning", icon: Sparkles },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const dayAfter = (isoDate) => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  return diff > 0 ? diff : 0;
};

export default function PlanMyTripForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [guests, setGuests] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [whatsappCountry, setWhatsappCountry] = useState("+994");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [travelerType, setTravelerType] = useState("");
  const [occasion, setOccasion] = useState("");
  // Future Offer System: which provider types this request should be routed to.
  const [requestedServices, setRequestedServices] = useState(["completePlanning"]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);

  // "Complete Trip Planning" is exclusive with the other two — picking villa
  // or transfer clears it, and it can only be turned off that way (clicking
  // it directly does nothing while it's active). If villa and transfer both
  // end up deselected, "Complete Trip Planning" turns back on automatically
  // so a selection always exists.
  const toggleService = (key) => {
    setRequestedServices((prev) => {
      if (key === "completePlanning") {
        return prev.includes(key) ? prev : ["completePlanning"];
      }
      const withoutComplete = prev.filter((k) => k !== "completePlanning");
      const next = withoutComplete.includes(key)
        ? withoutComplete.filter((k) => k !== key)
        : [...withoutComplete, key];
      return next.length === 0 ? ["completePlanning"] : next;
    });
  };

  const canSubmit = name && destination && budget && guests && checkIn && checkOut && nights > 0 && whatsapp;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitTripRequest({
        guest_name: name,
        whatsapp: `${whatsappCountry}${whatsapp}`,
        city: destination,
        budget: Number(budget),
        guests_count: Number(guests),
        check_in: checkIn,
        check_out: checkOut,
        trip_length_days: nights,
        traveler_type: travelerType || null,
        occasion: occasion || null,
        special_requests: notes || null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(t("planTrip.submitError"));
    } finally {
      setSubmitting(false);
    }
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
        <div className="pt-field full">
          <label><User size={13} />{t("planTrip.name")}</label>
          <input type="text" placeholder={t("planTrip.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
          <label><CalendarDays size={13} />{t("planTrip.checkIn")}</label>
          <input
            type="date"
            min={todayISO()}
            value={checkIn}
            onChange={(e) => {
              const value = e.target.value;
              setCheckIn(value);
              if (checkOut && value && checkOut <= value) setCheckOut("");
            }}
          />
        </div>
        <div className="pt-field">
          <label><CalendarDays size={13} />{t("planTrip.checkOut")}</label>
          <input
            type="date"
            min={checkIn ? dayAfter(checkIn) : todayISO()}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            disabled={!checkIn}
          />
        </div>
        <div className="pt-field">
          <label><Users size={13} />{t("planTrip.guests")}</label>
          <input type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} />
        </div>
        <div className="pt-field full">
          <label><MessageCircle size={13} />{t("planTrip.whatsapp")}</label>
          <div className="pt-phone-input">
            <select value={whatsappCountry} onChange={(e) => setWhatsappCountry(e.target.value)}>
              {COUNTRY_CODES.map(({ code, country }) => (
                <option key={country} value={code}>{code} {country}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="55 123 45 67"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
        </div>
        <div className="pt-field full">
          <label>{t("planTrip.notes")}</label>
          <textarea placeholder={t("planTrip.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <p className="pt-notes-hint">{t("planTrip.notesHint")}</p>
        </div>
      </div>

      <p className="pt-section-title">{t("planTrip.needsHeading")} <span className="pt-section-subtitle">{t("planTrip.needsSubtitle")}</span></p>
      <div className="pt-chips">
        {SERVICE_NEEDS.map(({ key, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`pt-chip${requestedServices.includes(key) ? " active" : ""}`}
            onClick={() => toggleService(key)}
          >
            <Icon size={14} />{t(`planTrip.needs.${key}`)}
          </button>
        ))}
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

      {error && <p className="pt-submit-error">{error}</p>}
      <button type="submit" className="pt-submit" disabled={!canSubmit || submitting}>
        {submitting ? t("planTrip.submitting") : t("planTrip.submit")}
      </button>
      <p className="pt-submit-note">{t("planTrip.submitNote")}</p>
    </form>
  );
}
