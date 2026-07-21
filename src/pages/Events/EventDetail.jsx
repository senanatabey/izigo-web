import { useParams, Link } from "react-router-dom";
import { MapPin, Calendar, ShieldCheck, MessageCircle } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { MOCK_EVENTS } from "../../data/mockListings";

export default function EventDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const event = MOCK_EVENTS.find((v) => v.id === id);

  if (!event) {
    return (
      <div className="event-detail">
        <style>{`.event-detail { max-width: 720px; margin: 0 auto; padding: 64px 6vw; text-align: center; }`}</style>
        <p>{t("eventDetail.notFound")}</p>
        <Link to="/events">{t("eventDetail.back")}</Link>
      </div>
    );
  }

  const formatDate = (iso) => new Date(iso).toLocaleDateString(language === "az" ? "az-AZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="event-detail">
      <style>{`
        .event-detail { max-width: 1280px; margin: 0 auto; padding: 32px 6vw 80px; }
        .event-detail .ed-back { display: inline-block; font-size: 13.5px; font-weight: 600; color: var(--text-soft); margin-bottom: 20px; }
        .event-detail .ed-gallery { border-radius: 16px; overflow: hidden; height: 320px; margin-bottom: 32px; }
        .event-detail .ed-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .event-detail .ed-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .event-detail .ed-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .event-detail .ed-thumb { width: 100%; height: 100%; }

        .event-detail .ed-layout { display: grid; grid-template-columns: 1fr 340px; gap: 48px; align-items: start; }
        .event-detail .ed-city { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: var(--izigo-green); margin-bottom: 8px; }
        .event-detail .ed-title { font-size: 28px; font-weight: 800; margin: 0 0 16px; }
        .event-detail .ed-meta { display: flex; gap: 20px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border); }
        .event-detail .ed-meta span { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-soft); }
        .event-detail .ed-main h2 { font-size: 19px; font-weight: 800; margin: 0 0 12px; }
        .event-detail .ed-desc { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 32px; }

        .event-detail .ed-sidebar { position: sticky; top: 90px; border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
        .event-detail .ed-price { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .event-detail .ed-host { display: flex; align-items: center; gap: 10px; margin: 20px 0; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .event-detail .ed-host-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; color: var(--izigo-green); flex-shrink: 0; }
        .event-detail .ed-host-name { font-size: 14px; font-weight: 700; }
        .event-detail .ed-host-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--izigo-green); font-weight: 600; }
        .event-detail .ed-whatsapp {
          display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-weight: 700; font-size: 14.5px; cursor: not-allowed; opacity: 0.9;
        }
        .event-detail .ed-contact-note { font-size: 12px; color: var(--text-soft); text-align: center; margin-top: 10px; line-height: 1.5; }

        @media (max-width: 900px) {
          .event-detail .ed-layout { grid-template-columns: 1fr; }
          .event-detail .ed-sidebar { position: static; }
        }
        @media (max-width: 640px) {
          .event-detail { padding: 20px 5vw 56px; }
          .event-detail .ed-gallery { height: 200px; }
        }
      `}</style>

      <Link to="/events" className="ed-back">{t("eventDetail.back")}</Link>

      <div className="ed-gallery">
        <div className={`ed-thumb ${event.tone}`} />
      </div>

      <div className="ed-layout">
        <div className="ed-main">
          <div className="ed-city"><MapPin size={13} />{event.city}</div>
          <h1 className="ed-title">{event.title[language] || event.title.en}</h1>
          <div className="ed-meta">
            <span><Calendar size={15} />{formatDate(event.date)}</span>
          </div>

          <h2>{t("eventDetail.aboutHeading")}</h2>
          <p className="ed-desc">{event.description[language] || event.description.en}</p>
        </div>

        <aside className="ed-sidebar">
          <div className="ed-price">{event.price === 0 ? t("eventsPage.free") : `${event.price} AZN`}</div>

          <div className="ed-host">
            <div className="ed-host-avatar"><ShieldCheck size={20} /></div>
            <div>
              <div className="ed-host-name">{t("villaDetail.hostName")}</div>
              <div className="ed-host-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</div>
            </div>
          </div>

          <button type="button" className="ed-whatsapp" disabled>
            <MessageCircle size={17} />{t("villaDetail.contactWhatsapp")}
          </button>
          <p className="ed-contact-note">{t("villaDetail.contactNote")}</p>
        </aside>
      </div>
    </div>
  );
}
