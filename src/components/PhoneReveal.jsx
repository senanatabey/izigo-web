import { useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

function formatPhone(raw, mask) {
  const digits = raw.replace(/\D/g, "");
  const cc = digits.slice(0, 3);
  const p1 = digits.slice(3, 5);
  const p2 = digits.slice(5, 8);
  const p3 = digits.slice(8, 10);
  const p4 = mask ? "xx" : digits.slice(10, 12);
  return `+${cc} ${p1} ${p2} ${p3} ${p4}`;
}

export default function PhoneReveal({ phone }) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const digits = phone.replace(/\D/g, "");

  return (
    <div className="phone-reveal">
      <style>{`
        .phone-reveal .pr-row {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px; margin-bottom: 10px;
        }
        .phone-reveal .pr-number {
          display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 700; color: var(--text);
          letter-spacing: 0.2px;
        }
        .phone-reveal .pr-number svg { color: var(--izigo-green); flex-shrink: 0; }
        .phone-reveal .pr-show {
          border: none; background: none; color: var(--izigo-green); font-weight: 700; font-size: 13px; cursor: pointer;
          flex-shrink: 0;
        }
        .phone-reveal .pr-whatsapp {
          display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
          background: var(--izigo-green); color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-weight: 700; font-size: 14.5px; text-decoration: none;
        }
        .phone-reveal .pr-whatsapp:hover { filter: brightness(0.95); }
      `}</style>

      <div className="pr-row">
        <span className="pr-number"><Phone size={15} />{formatPhone(phone, !revealed)}</span>
        {!revealed && (
          <button type="button" className="pr-show" onClick={() => setRevealed(true)}>{t("phoneReveal.show")}</button>
        )}
      </div>

      {revealed && (
        <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="pr-whatsapp">
          <MessageCircle size={17} />{t("villaDetail.contactWhatsapp")}
        </a>
      )}
    </div>
  );
}
