import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <RegisterForm
      onSuccess={() => navigate("/profile", { replace: true })}
      footerSwitch={
        <p className="ap-switch">
          {t("auth.haveAccount")} <Link to="/login">{t("auth.loginLink")}</Link>
        </p>
      }
    />
  );
}
