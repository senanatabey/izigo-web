import { useState } from "react";
import { Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../App";
import { recordListingContact } from "../lib/reviews";
import { formatPhone } from "../lib/phone";

// listingId is optional so this component still works anywhere it doesn't
// apply (none currently) without becoming required everywhere at once.
export default function PhoneReveal({ phone, listingId }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const digits = phone.replace(/\D/g, "");

  // Invisible, background-only: no UI change, no login prompt for guests —
  // logged-out visitors just don't get a listing_contacts row.
  const recordContact = () => {
    if (user?.id && listingId) recordListingContact(listingId, user.id);
  };

  return (
    <>
      {/* Nömrə sətri indi mobil daxil hər yerdə görünür (tap.az-dakı kimi
          host bloku ilə "Diqqət!" xəbərdarlığı arasında). Mobil zolaqda
          WhatsApp artıq aşağıdakı sabit zolaqda olduğu üçün, bu bloqda
          WhatsApp düyməsi mobildə gizlənir (təkrar olmasın deyə). */}
      <div className="phone-reveal">
        <style>{`
          .phone-reveal .pr-row {
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            background: var(--izigo-green); border: none; border-radius: 10px;
            padding: 12px 14px; margin-bottom: 10px; text-decoration: none;
          }
          .phone-reveal .pr-row.is-hidden { cursor: pointer; }
          .phone-reveal .pr-row.is-hidden:hover { filter: brightness(0.95); }
          .phone-reveal .pr-number {
            display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 700; color: #fff;
            letter-spacing: 0.2px;
          }
          .phone-reveal .pr-number svg { color: #fff; flex-shrink: 0; }
          .phone-reveal .pr-show {
            border: none; background: none; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer;
            flex-shrink: 0;
          }
          .phone-reveal .pr-number-revealed {
            display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 800; color: var(--text);
            text-decoration: none; margin-bottom: 12px; letter-spacing: 0.2px;
          }
          .phone-reveal .pr-number-revealed:hover { color: var(--izigo-green); }
          .phone-reveal .pr-number-revealed svg { color: var(--izigo-green); flex-shrink: 0; }
          .phone-reveal .pr-whatsapp {
            display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
            background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
            padding: 13px; font-weight: 700; font-size: 14.5px; text-decoration: none;
          }
          .phone-reveal .pr-whatsapp:hover { filter: brightness(0.95); }

          @media (max-width: 640px) {
            .phone-reveal .pr-whatsapp { display: none; }
          }
        `}</style>

        {!revealed ? (
          <a
            href={`tel:+${digits}`} className="pr-row is-hidden"
            onClick={() => { setRevealed(true); recordContact(); }}
          >
            <span className="pr-number"><Phone size={15} />{formatPhone(phone, true)}</span>
            <span className="pr-show">{t("phoneReveal.show")}</span>
          </a>
        ) : (
          <>
            <a href={`tel:+${digits}`} className="pr-number-revealed" onClick={recordContact}>
              <Phone size={17} />{formatPhone(phone, false)}
            </a>
            <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="pr-whatsapp" onClick={recordContact}>
              <MessageCircle size={17} />{t("villaDetail.contactWhatsapp")}
            </a>
          </>
        )}
      </div>

      {/* Mobile: fixed bottom bar, always visible — no "Göstər" tap needed.
          Two differently-coloured buttons (tap.az pattern) so Call and
          WhatsApp read as distinct actions instead of two identical pills. */}
      <div className="pr-mobile-bar">
        <style>{`
          .pr-mobile-bar { display: none; }
          @media (max-width: 640px) {
            .pr-mobile-bar {
              display: flex; align-items: stretch; gap: 14px;
              position: fixed; left: 0; right: 0; bottom: 0; z-index: 200;
              background: none; border-top: none;
              padding: 0 5vw 14px; box-shadow: none;
            }
            .pr-mobile-bar a {
              flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
              border-radius: 14px; padding: 13px; font-weight: 700; font-size: 14px;
              text-decoration: none; color: #fff;
              box-shadow: 0 4px 14px rgba(16, 24, 40, 0.22);
            }
            .pr-mobile-bar .pr-mobile-call { background: var(--izigo-navy); }
            .pr-mobile-bar .pr-mobile-call:hover { filter: brightness(1.15); }
            .pr-mobile-bar .pr-mobile-whatsapp { background: var(--izigo-green); }
            .pr-mobile-bar .pr-mobile-whatsapp:hover { filter: brightness(0.95); }
          }
        `}</style>
        <a href={`tel:+${digits}`} className="pr-mobile-call" onClick={recordContact}>
          <Phone size={17} />{t("phoneReveal.call")}
        </a>
        <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="pr-mobile-whatsapp" onClick={recordContact}>
          <MessageCircle size={17} />{t("villaDetail.contactWhatsapp")}
        </a>
      </div>

      {/* Safety warning: gated behind "Göstər" on desktop (only relevant once
          the number is exposed there); always shown on mobile, where the
          contact buttons above are always visible. */}
      <div className={`pr-warning${revealed ? " is-visible" : ""}`}>
        <style>{`
          .pr-warning {
            display: none; align-items: flex-start; gap: 8px; margin-top: 10px;
            background: rgba(224, 85, 63, 0.08); border: 1px solid rgba(224, 85, 63, 0.35);
            border-radius: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.4;
            color: #C0392B;
          }
          .pr-warning.is-visible { display: flex; }
          .pr-warning svg { flex-shrink: 0; margin-top: 1px; color: #C0392B; }
          @media (max-width: 640px) {
            .pr-warning { display: flex; margin-bottom: 90px; }
          }
        `}</style>
        <AlertTriangle size={16} />
        <span>{t("phoneReveal.safetyWarning")}</span>
      </div>
    </>
  );
}
