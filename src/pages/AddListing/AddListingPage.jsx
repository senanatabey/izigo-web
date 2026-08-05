import { Link } from "react-router-dom";
import { Home as HomeIcon, Car, ArrowLeftRight, PartyPopper, ShoppingBasket, ArrowRight } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import FounderBanner from "../../components/FounderBanner";

const CATEGORIES = [
  { key: "villa", icon: HomeIcon, tone: "green" },
  { key: "car", icon: Car, tone: "orange" },
  { key: "transfer", icon: ArrowLeftRight, tone: "green" },
  { key: "event", icon: PartyPopper, tone: "orange" },
  { key: "service", icon: ShoppingBasket, tone: "green" },
];

export default function AddListingPage() {
  const { t } = useLanguage();

  return (
    <div className="add-listing-page">
      <style>{`
        .add-listing-page { max-width: 1280px; margin: 0 auto; padding: 40px 5vw 80px; }
        .add-listing-page .alp-founder-banner-wrap { margin: -40px -5vw 32px; }
        .add-listing-page .alp-head { margin-bottom: 28px; }
        .add-listing-page .alp-head h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px; }
        .add-listing-page .alp-head p { font-size: 14px; color: var(--text-soft); line-height: 1.5; margin: 0; }

        .add-listing-page .alp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .add-listing-page .alp-card {
          display: flex; align-items: center; gap: 16px; border: 1px solid var(--border); border-radius: 16px;
          padding: 20px; background: #fff; transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
        }
        .add-listing-page .alp-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--izigo-green); }
        .add-listing-page .alp-icon {
          width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .add-listing-page .alp-icon.green { background: rgba(0, 200, 151, 0.12); color: var(--izigo-green); }
        .add-listing-page .alp-icon.orange { background: rgba(255, 122, 0, 0.12); color: var(--izigo-orange); }
        .add-listing-page .alp-card-body h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
        .add-listing-page .alp-card-body p { font-size: 13px; color: var(--text-soft); margin: 0; line-height: 1.4; }
        .add-listing-page .alp-card-arrow { margin-left: auto; color: var(--text-soft); flex-shrink: 0; }

        @media (max-width: 640px) {
          .add-listing-page .alp-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="alp-founder-banner-wrap"><FounderBanner /></div>

      <div className="alp-head">
        <h1>{t("addListing.pickHeading")}</h1>
        <p>{t("addListing.pickSubtitle")}</p>
      </div>

      <div className="alp-grid">
        {CATEGORIES.map(({ key, icon: Icon, tone }) => (
          <Link to={`/add-listing/${key}`} className="alp-card" key={key}>
            <div className={`alp-icon ${tone}`}><Icon size={24} /></div>
            <div className="alp-card-body">
              <h3>{t(`addListing.categories.${key}.title`)}</h3>
              <p>{t(`addListing.categories.${key}.text`)}</p>
            </div>
            <ArrowRight size={18} className="alp-card-arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
}
