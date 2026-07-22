import {
  Snowflake, Flame, Trees, Wind, ShoppingBasket, Droplet, UtensilsCrossed,
  Camera, Drone, Compass, Pill, Stethoscope, WashingMachine, Baby, Tent,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const SERVICES = [
  { key: "ice", icon: Snowflake },
  { key: "coal", icon: Flame },
  { key: "firewood", icon: Trees },
  { key: "hookah", icon: Wind },
  { key: "market", icon: ShoppingBasket },
  { key: "honey", icon: Droplet },
  { key: "restaurant", icon: UtensilsCrossed },
  { key: "photographer", icon: Camera },
  { key: "drone", icon: Drone },
  { key: "guide", icon: Compass },
  { key: "pharmacy", icon: Pill },
  { key: "doctor", icon: Stethoscope },
  { key: "laundry", icon: WashingMachine },
  { key: "babysitter", icon: Baby },
  { key: "campGear", icon: Tent },
];

export default function ConciergePage() {
  const { t } = useLanguage();

  return (
    <div className="concierge-page">
      <style>{`
        .concierge-page { max-width: 1280px; margin: 0 auto; padding: 48px 6vw 80px; }
        .concierge-page .cg-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .concierge-page .cg-head p { font-size: 15px; color: var(--text-soft); margin: 0 0 8px; max-width: 640px; line-height: 1.6; }
        .concierge-page .cg-note {
          display: inline-block; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange);
          background: var(--bg-soft); padding: 6px 14px; border-radius: 999px; margin-bottom: 32px;
        }

        .concierge-page .cg-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; margin-bottom: 40px; }
        .concierge-page .cg-card {
          border: 1px solid var(--border); border-radius: 16px; padding: 22px 16px; text-align: center;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .concierge-page .cg-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .concierge-page .cg-icon {
          width: 48px; height: 48px; border-radius: 50%; background: var(--bg-soft); color: var(--izigo-green);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
        }
        .concierge-page .cg-label { font-size: 13.5px; font-weight: 700; color: var(--text); }

        .concierge-page .cg-cta {
          border: 1px solid var(--border); border-radius: 16px; padding: 28px; text-align: center;
        }
        .concierge-page .cg-cta h2 { font-size: 18px; font-weight: 800; margin: 0 0 8px; }
        .concierge-page .cg-cta p { font-size: 14px; color: var(--text-soft); margin: 0 0 18px; }
        .concierge-page .cg-whatsapp {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
          padding: 13px 24px; font-weight: 700; font-size: 14.5px; cursor: not-allowed; opacity: 0.9;
        }
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

      <div className="cg-grid">
        {SERVICES.map(({ key, icon: Icon }) => (
          <div className="cg-card" key={key}>
            <div className="cg-icon"><Icon size={22} /></div>
            <div className="cg-label">{t(`conciergePage.services.${key}`)}</div>
          </div>
        ))}
      </div>

      <div className="cg-cta">
        <h2>{t("conciergePage.ctaHeading")}</h2>
        <p>{t("conciergePage.ctaSubtitle")}</p>
        <button type="button" className="cg-whatsapp" disabled>
          <MessageCircle size={17} />{t("conciergePage.contactWhatsapp")}
        </button>
        <p className="cg-contact-note">{t("villaDetail.contactNote")}</p>
      </div>
    </div>
  );
}
