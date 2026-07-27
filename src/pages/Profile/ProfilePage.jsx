import { useState } from "react";
import { User, Mail, MessageCircle, ShieldCheck, Check } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState("elvin@example.com");
  const [whatsapp, setWhatsapp] = useState("+994 55 123 45 67");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="profile-page">
      <style>{`
        .profile-page .pp-head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
        .profile-page .pp-avatar {
          width: 64px; height: 64px; border-radius: 50%; background: var(--bg-soft); color: var(--izigo-green);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .profile-page .pp-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
        .profile-page .pp-badge {
          display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: var(--izigo-green);
        }

        .profile-page form { border: 1px solid var(--border); border-radius: 18px; padding: 28px; max-width: 480px; }
        .profile-page .pp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
        .profile-page .pp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 5px; }
        .profile-page .pp-field input {
          border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px;
          font-size: 14px; color: var(--text); font-family: var(--sans);
        }
        .profile-page .pp-note { font-size: 12px; color: var(--text-soft); margin: -10px 0 18px; line-height: 1.5; }

        .profile-page .pp-save {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 12px 24px; font-weight: 700; font-size: 14px; cursor: pointer;
        }
        .profile-page .pp-saved-note {
          display: inline-flex; align-items: center; gap: 6px; color: var(--izigo-green); font-weight: 700; font-size: 13px; margin-left: 14px;
        }
      `}</style>

      <div className="pp-head">
        <div className="pp-avatar"><User size={28} /></div>
        <div>
          <h1>{user?.name}</h1>
          <span className="pp-badge"><ShieldCheck size={14} />{t("villaDetail.hostBadge")}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="pp-field">
          <label><User size={13} />{t("profilePage.nameLabel")}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="pp-field">
          <label><Mail size={13} />{t("profilePage.emailLabel")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="pp-field">
          <label><MessageCircle size={13} />{t("profilePage.whatsappLabel")}</label>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <p className="pp-note">{t("profilePage.note")}</p>

        <button type="submit" className="pp-save">{t("profilePage.save")}</button>
        {saved && <span className="pp-saved-note"><Check size={15} />{t("profilePage.saved")}</span>}
      </form>
    </div>
  );
}
