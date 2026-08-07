import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Percent, MessageCircle, BadgeCheck, MapPin } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useSeo } from "../../lib/seo";
import FounderBanner from "../../components/FounderBanner";
import ComparisonTable from "../../components/ComparisonTable";
import FounderBenefits from "../../components/FounderBenefits";
import FaqAccordion from "../../components/FaqAccordion";
import { fetchFounderCampaign, fetchFounderCount } from "../../lib/founder";

const WHY_CARDS = [
  { icon: Percent, key: "commission", tone: "green" },
  { icon: MessageCircle, key: "whatsapp", tone: "orange" },
  { icon: BadgeCheck, key: "verified", tone: "green" },
  { icon: MapPin, key: "marketplace", tone: "orange" },
];

export default function BecomeAHostPage() {
  const { t } = useLanguage();

  useSeo({
    title: "Become a Host",
    description: "List your villa, car or transfer on IZIGO — 0% commission, direct WhatsApp bookings, and exclusive Founder Host benefits during our launch period.",
    path: "/become-a-host",
  });

  // Same fail-open visibility rule as the homepage used to have: only hide
  // Founder Benefits once the campaign is positively confirmed inactive.
  const [founderVisible, setFounderVisible] = useState(true);
  const [founderCounts, setFounderCounts] = useState(null);

  useEffect(() => {
    Promise.all([fetchFounderCampaign(), fetchFounderCount()])
      .then(([c, count]) => {
        setFounderVisible(c.status === "active" && count < c.max_founder_hosts);
        setFounderCounts({ count, max: c.max_founder_hosts });
      })
      .catch(() => {
        setFounderVisible(true);
        setFounderCounts(null);
      });
  }, []);

  const faqItems = ["q1", "q2", "q3", "q4", "q5"].map((key) => ({
    q: t(`becomeAHost.faq.${key}.q`),
    a: t(`becomeAHost.faq.${key}.a`),
  }));

  return (
    <div className="become-a-host-page">
      <style>{`
        .become-a-host-page section { padding: 45px 6vw; }
        .become-a-host-page .why-grid {
          max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
        }
        .become-a-host-page .why-card {
          display: flex; flex-direction: column; gap: 12px; background: #fff; border: 1px solid var(--border);
          border-radius: 16px; padding: 22px 20px;
        }
        .become-a-host-page .why-icon {
          width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .become-a-host-page .why-icon.green { background: rgba(0, 200, 151, 0.12); color: var(--izigo-green); }
        .become-a-host-page .why-icon.orange { background: rgba(255, 122, 0, 0.12); color: var(--izigo-orange); }
        .become-a-host-page .why-card h3 { font-size: 15.5px; font-weight: 700; margin: 0; color: var(--text); }
        .become-a-host-page .why-card p { font-size: 13px; color: var(--text-soft); line-height: 1.5; margin: 0; }
        .become-a-host-page .section-heading { text-align: center; font-size: 26px; font-weight: 800; margin: 0 0 24px; color: var(--text); }

        .become-a-host-page .final-cta { text-align: center; }
        .become-a-host-page .final-cta h2 { font-size: 22px; font-weight: 800; margin: 0 0 8px; color: var(--text); }
        .become-a-host-page .final-cta p { font-size: 14px; color: var(--text-soft); margin: 0 0 20px; }
        .become-a-host-page .final-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 13px 28px; font-weight: 700; font-size: 15px; text-decoration: none;
        }

        .become-a-host-page .secondary-cta { text-align: center; padding-top: 0; padding-bottom: 24px; }
        .become-a-host-page .secondary-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--izigo-green); border: 1.5px solid var(--izigo-green); border-radius: 10px;
          padding: 10px 20px; font-weight: 700; font-size: 13.5px; text-decoration: none;
        }
        .become-a-host-page .secondary-cta-btn:hover { background: rgba(0,200,151,0.08); }

        @media (max-width: 1024px) {
          .become-a-host-page .why-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .become-a-host-page section { padding: 32px 5vw; }
          .become-a-host-page .why-grid { grid-template-columns: 1fr; }
          .become-a-host-page .section-heading { font-size: 21px; }
        }
      `}</style>

      <FounderBanner />

      <section className="why-izigo">
        <h2 className="section-heading">{t("becomeAHost.whyHeading")}</h2>
        <div className="why-grid">
          {WHY_CARDS.map(({ icon: Icon, key, tone }) => (
            <div className="why-card" key={key}>
              <div className={`why-icon ${tone}`}><Icon size={20} /></div>
              <h3>{t(`becomeAHost.why.${key}.title`)}</h3>
              <p>{t(`becomeAHost.why.${key}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <ComparisonTable />

      {founderVisible && (
        <FounderBenefits
          counterText={founderCounts ? `Founder Program — ${founderCounts.count}/${founderCounts.max} Founder Hosts Joined` : null}
        />
      )}

      <section className="secondary-cta">
        <Link to="/add-listing" className="secondary-cta-btn">{t("becomeAHost.secondaryCtaButton")}</Link>
      </section>

      <section className="faq">
        <h2 className="section-heading">{t("becomeAHost.faqHeading")}</h2>
        <FaqAccordion items={faqItems} />
      </section>

      <section className="final-cta">
        <h2>{t("becomeAHost.finalCtaHeading")}</h2>
        <p>{t("becomeAHost.finalCtaText")}</p>
        <Link to="/add-listing" className="final-cta-btn">{t("hostCta.publishButton")}</Link>
      </section>
    </div>
  );
}
