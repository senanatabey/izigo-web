import { useState } from "react";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../App";
import { GoogleGlyph, AppleGlyph } from "./BrandGlyphs";

export default function LoginForm({ onSuccess, footerSwitch }) {
  const { t } = useLanguage();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!identifier || !password) return;
    login(identifier, password);
    onSuccess?.();
  };

  const handleSocialLogin = (provider) => {
    // Demo only — real Google/Apple sign-in needs Supabase Auth wired up.
    login(`demo@${provider}.com`, "social-auth");
    onSuccess?.();
  };

  return (
    <div className="auth-form">
      <style>{`
        .auth-form .ap-head { text-align: center; margin-bottom: 24px; }
        .auth-form .ap-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
        .auth-form .ap-head p { font-size: 13.5px; color: var(--text-soft); line-height: 1.5; margin: 0; }

        .auth-form .ap-social { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .auth-form .ap-social-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; border: 1.5px solid var(--border); background: #fff; color: var(--text);
          border-radius: 10px; padding: 11px; font-weight: 700; font-size: 14px; cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .auth-form .ap-social-btn:hover { border-color: var(--text); background: var(--bg-soft); }
        .auth-form .ap-social-btn.apple { background: #000; border-color: #000; color: #fff; }
        .auth-form .ap-social-btn.apple:hover { background: #222; }

        .auth-form .ap-divider { display: flex; align-items: center; gap: 12px; margin: 4px 0 20px; }
        .auth-form .ap-divider::before, .auth-form .ap-divider::after {
          content: ""; flex: 1; height: 1px; background: var(--border);
        }
        .auth-form .ap-divider span { font-size: 12px; color: var(--text-soft); font-weight: 600; text-transform: uppercase; }

        .auth-form .ap-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .auth-form .ap-field label { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .auth-form .ap-input {
          display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 10px;
          padding: 11px 14px;
        }
        .auth-form .ap-input svg { color: var(--text-soft); flex-shrink: 0; }
        .auth-form .ap-input input {
          border: none; outline: none; font-size: 14px; color: var(--text); width: 100%; font-family: var(--sans);
        }

        .auth-form .ap-submit {
          width: 100%; background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 13px; font-weight: 700; font-size: 14.5px; cursor: pointer; margin-top: 4px;
        }
        .auth-form .ap-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-form .ap-submit:not(:disabled):hover { filter: brightness(0.95); }

        .auth-form .ap-note {
          display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--text-soft);
          background: var(--bg-soft); border-radius: 10px; padding: 10px 12px; margin-top: 16px; line-height: 1.5;
        }
        .auth-form .ap-note svg { flex-shrink: 0; color: var(--izigo-green); margin-top: 1px; }

        .auth-form .ap-switch { text-align: center; font-size: 13.5px; color: var(--text-soft); margin-top: 20px; }
        .auth-form .ap-switch a, .auth-form .ap-switch button {
          color: var(--izigo-green); font-weight: 700; border: none; background: none; cursor: pointer; font-size: inherit; padding: 0;
        }
      `}</style>

      <div className="ap-head">
        <h1>{t("auth.loginTitle")}</h1>
        <p>{t("auth.loginSubtitle")}</p>
      </div>

      <div className="ap-social">
        <button type="button" className="ap-social-btn" onClick={() => handleSocialLogin("google")}>
          <GoogleGlyph />{t("auth.continueWithGoogle")}
        </button>
        <button type="button" className="ap-social-btn apple" onClick={() => handleSocialLogin("apple")}>
          <AppleGlyph />{t("auth.continueWithApple")}
        </button>
      </div>

      <div className="ap-divider"><span>{t("auth.orDivider")}</span></div>

      <form onSubmit={handlePasswordSubmit}>
        <div className="ap-field">
          <label>{t("auth.identifierLabel")}</label>
          <div className="ap-input">
            <Mail size={16} />
            <input
              type="email"
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

      <div className="ap-note">
        <ShieldCheck size={15} />
        <span>{t("auth.demoNote")}</span>
      </div>

      {footerSwitch}
    </div>
  );
}
