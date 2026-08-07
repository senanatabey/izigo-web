import { Star, Award, Crown, Rocket } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

// Extracted from the homepage's old "host-cta" section — same markup/CSS,
// minus the action buttons (the page that renders this owns its own CTA).
// Self-contained so it can be dropped onto any page without duplicating code.
const HOST_PERKS = [
  { icon: Award, key: "badge" },
  { icon: Crown, key: "vip" },
  { icon: Rocket, key: "priority" },
];

export default function FounderBenefits({ counterText }) {
  const { t } = useLanguage();

  return (
    <section className="founder-benefits-block">
      <style>{`
        .founder-benefits-block .fb-card {
          background: linear-gradient(180deg, rgba(0,200,151,0.08) 0%, rgba(0,200,151,0.02) 100%);
          border: 1px solid rgba(0,200,151,0.25); border-radius: 18px;
          padding: 32px; text-align: center; max-width: 860px; margin: 0 auto;
        }
        .founder-benefits-block .fb-counter {
          display: inline-flex; align-items: center; font-size: 12px; font-weight: 800; letter-spacing: 0.2px;
          color: var(--izigo-green); background: rgba(0,200,151,0.12); border: 1px solid rgba(0,200,151,0.25);
          border-radius: 999px; padding: 6px 16px; margin-bottom: 16px;
        }
        .founder-benefits-block .fb-icon {
          width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 14px;
          display: flex; align-items: center; justify-content: center;
          background: var(--izigo-green); color: #fff;
        }
        .founder-benefits-block .fb-card h2 { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
        .founder-benefits-block .fb-card > p { font-size: 14.5px; color: var(--text-soft); line-height: 1.55; margin: 0 auto; max-width: 600px; }
        .founder-benefits-block .fb-perks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 22px; }
        .founder-benefits-block .fb-perk { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 16px 14px; }
        .founder-benefits-block .fb-perk svg { color: var(--izigo-green); margin-bottom: 10px; }
        .founder-benefits-block .fb-perk h4 { font-size: 14.5px; font-weight: 700; margin-bottom: 4px; }
        .founder-benefits-block .fb-perk p { font-size: 12.5px; color: var(--text-soft); }

        @media (max-width: 640px) {
          .founder-benefits-block .fb-card { padding: 22px 18px; }
          .founder-benefits-block .fb-perks { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="fb-card">
        {counterText && <div className="fb-counter">{counterText}</div>}
        <div className="fb-icon"><Star size={30} /></div>
        <h2>{t("hostCta.title")}</h2>
        <p>{t("hostCta.text")}</p>

        <div className="fb-perks">
          {HOST_PERKS.map(({ icon: Icon, key }) => (
            <div className="fb-perk" key={key}>
              <Icon size={22} />
              <h4>{t(`hostCta.perks.${key}.title`)}</h4>
              <p>{t(`hostCta.perks.${key}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
