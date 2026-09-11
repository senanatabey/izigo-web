import { useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
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
    <div className="phone-reveal">
      <style>{`
        .phone-reveal .pr-row {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          background: var(--izigo-green); border: none; border-radius: 10px;
          padding: 12px 14px; margin-bottom: 10px;
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
      `}</style>

      {!revealed ? (
        <div className="pr-row is-hidden" onClick={() => setRevealed(true)}>
          <span className="pr-number"><Phone size={15} />{formatPhone(phone, true)}</span>
          <button type="button" className="pr-show" onClick={() => setRevealed(true)}>{t("phoneReveal.show")}</button>
        </div>
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
  );
}
