import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Smartphone, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";

export default function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/profile";

  const [mode, setMode] = useState("password");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!identifier || !password) return;
    login(identifier, password);
    navigate(redirectTo, { replace: true });
  };

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!phone) return;
    setOtpSent(true);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (code.trim().length < 4) return;
    login(phone, code);
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page .ap-head { text-align: center; margin-bottom: 24px; }
        .auth-page .ap-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
        .auth-page .ap-head p { font-size: 13.5px; color: var(--text-soft); line-height: 1.5; margin: 0; }

        .auth-page .ap-tabs {
          display: flex; gap: 6px; background: var(--bg-soft); border-radius: 10px; padding: 4px; margin-bottom: 22px;
        }
        .auth-page .ap-tab {
          flex: 1; border: none; background: none; padding: 9px; border-radius: 8px;
          font-size: 13px; font-weight: 700; color: var(--text-soft); cursor: pointer;
        }
        .auth-page .ap-tab.active { background: #fff; color: var(--izigo-green); box-shadow: var(--shadow-sm); }

        .auth-page .ap-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .auth-page .ap-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .auth-page .ap-input {
          display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 10px;
          padding: 11px 14px;
        }
        .auth-page .ap-input svg { color: var(--text-soft); flex-shrink: 0; }
        .auth-page .ap-input input {
          border: none; outline: none; font-size: 14px; color: var(--text); width: 100%; font-family: var(--sans);
        }

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

        .auth-page .ap-otp-actions { display: flex; justify-content: space-between; margin-top: 10px; }
        .auth-page .ap-link-btn { border: none; background: none; color: var(--izigo-green); font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 0; }
      `}</style>

      <div className="ap-head">
        <h1>{t("auth.loginTitle")}</h1>
        <p>{t("auth.loginSubtitle")}</p>
      </div>

      <div className="ap-tabs">
        <button type="button" className={`ap-tab${mode === "password" ? " active" : ""}`} onClick={() => setMode("password")}>
          {t("auth.tabPassword")}
        </button>
        <button type="button" className={`ap-tab${mode === "otp" ? " active" : ""}`} onClick={() => setMode("otp")}>
          {t("auth.tabOtp")}
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePasswordSubmit}>
          <div className="ap-field">
            <label>{t("auth.identifierLabel")}</label>
            <div className="ap-input">
              <Mail size={16} />
              <input
                type="text"
                placeholder={t("auth.identifierPlaceholder")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>
          <div className="ap-field">
            <label>{t("auth.passwordLabel")}</label>
            <div className="ap-input">
              <Lock size={16} />
              <input
                type="password"
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="ap-submit" disabled={!identifier || !password}>
            {t("auth.loginButton")}
          </button>
        </form>
      ) : (
        <form onSubmit={otpSent ? handleVerify : handleSendCode}>
          <div className="ap-field">
            <label>{t("auth.phoneLabel")}</label>
            <div className="ap-input">
              <Smartphone size={16} />
              <input
                type="tel"
                placeholder={t("auth.phonePlaceholder")}
                value={phone}
                disabled={otpSent}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {otpSent && (
            <div className="ap-field">
              <label>{t("auth.otpLabel")}</label>
              <div className="ap-input">
                <ShieldCheck size={16} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("auth.otpPlaceholder")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
          )}

          <button type="submit" className="ap-submit" disabled={otpSent ? code.trim().length < 4 : !phone}>
            {otpSent ? t("auth.verifyButton") : t("auth.sendCode")}
          </button>

          {otpSent && (
            <div className="ap-otp-actions">
              <button type="button" className="ap-link-btn" onClick={() => setOtpSent(false)}>{t("auth.changeNumber")}</button>
              <button type="button" className="ap-link-btn" onClick={() => setCode("")}>{t("auth.resendCode")}</button>
            </div>
          )}
        </form>
      )}

      <div className="ap-note">
        <ShieldCheck size={15} />
        <span>{mode === "otp" && otpSent ? t("auth.otpSentNote") : t("auth.demoNote")}</span>
      </div>

      <p className="ap-switch">
        {t("auth.noAccount")} <Link to="/register">{t("auth.signUpLink")}</Link>
      </p>
    </div>
  );
}
