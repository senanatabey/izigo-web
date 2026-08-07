import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Small, lightweight "Become a Host" teaser for the homepage — intentionally
 * NOT the large Founder block (that lives on the dedicated /become-a-host
 * page via FounderBenefits). Just a nudge with a link to learn more.
 */
export default function BecomeHostCta() {
  const { t } = useLanguage();

  return (
    <section className="become-host-cta-block">
      <style>{`
        .become-host-cta-block .bhc-card {
          max-width: 860px; margin: 0 auto; text-align: center;
          border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; background: var(--bg-soft);
        }
        .become-host-cta-block h2 { font-size: 19px; font-weight: 800; margin: 0 0 8px; color: var(--text); }
        .become-host-cta-block p { font-size: 13.5px; color: var(--text-soft); line-height: 1.55; margin: 0 auto 18px; max-width: 520px; }
        .become-host-cta-block a {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--izigo-green); font-weight: 700; font-size: 14px;
        }
      `}</style>
      <div className="bhc-card">
        <h2>{t("becomeHostCta.title")}</h2>
        <p>{t("becomeHostCta.text")}</p>
        <Link to="/become-a-host">{t("becomeHostCta.button")}<ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}
