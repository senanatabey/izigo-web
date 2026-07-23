import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Smartphone, Lock, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";

export default function RegisterPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = name && phone && email && password && confirmPassword && !mismatch;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    login(email, password, name);
    navigate("/profile", { replace: true });
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page .ap-head { text-align: center; margin-bottom: 24px; }
        .auth-page .ap-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
        .auth-page .ap-head p { font-size: 13.5px; color: var(--text-soft); line-height: 1.5; margin: 0; }

        .auth-page .ap-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .auth-page .ap-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .auth-page .ap-input {
          display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 10px;
          padding: 11px 14px;
        }
        .auth-page .ap-input.error { border-color: #E0553F; }
        .auth-page .ap-input svg { color: var(--text-soft); flex-shrink: 0; }
        .auth-page .ap-input input {
          border: none; outline: none; font-size: 14px; color: var(--text); width: 100%; font-family: var(--sans);
        }
        .auth-page .ap-error-text { font-size: 12px; color: #E0553F; margin: -10px 0 16px; }

        .auth-page .ap-submit {
          width: 100%; background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-weight: 700; font-size: 14.5px; cursor: pointer; margin-top: 4px;
        }
        .auth-page .ap-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-page .ap-submit:not(:disabled):hover { filter: brightness(0.95); }

        .auth-page .ap-note {
          display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--text-soft);
          background: var(--bg-soft); border-radius: 10px; padding: 10px 12px; margin-top: 16px; line-height: 1.5;
        }
        .auth-page .ap-note svg { flex-shrink: 0; color: var(--izigo-green); margin-top: 1px; }

        .auth-page .ap-switch { text-align: center; font-size: 13.5px; color: var(--text-soft); margin-top: 20px; }
        .auth-page .ap-switch a { color: var(--izigo-green); font-weight: 700; }
      `}</style>

      <div className="ap-head">
        <h1>{t("auth.registerTitle")}</h1>
        <p>{t("auth.registerSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ap-field">
          <label>{t("auth.nameLabel")}</label>
          <div className="ap-input">
            <User size={16} />
            <input type="text" placeholder={t("auth.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        <div className="ap-field">
          <label>{t("auth.phoneLabelRegister")}</label>
          <div className="ap-input">
            <Smartphone size={16} />
            <input type="tel" placeholder={t("auth.phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="ap-field">
          <label>{t("auth.emailLabel")}</label>
          <div className="ap-input">
            <Mail size={16} />
            <input type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="ap-field">
          <label>{t("auth.passwordLabel")}</label>
          <div className="ap-input">
            <Lock size={16} />
            <input type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <div className="ap-field">
          <label>{t("auth.confirmPasswordLabel")}</label>
          <div className={`ap-input${mismatch ? " error" : ""}`}>
            <Lock size={16} />
            <input type="password" placeholder={t("auth.passwordPlaceholder")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        {mismatch && <p className="ap-error-text">{t("auth.passwordMismatch")}</p>}

        <button type="submit" className="ap-submit" disabled={!canSubmit}>
          {t("auth.registerButton")}
        </button>
      </form>

      <div className="ap-note">
        <ShieldCheck size={15} />
        <span>{t("auth.demoNote")}</span>
      </div>

      <p className="ap-switch">
        {t("auth.haveAccount")} <Link to="/login">{t("auth.loginLink")}</Link>
      </p>
    </div>
  );
}
