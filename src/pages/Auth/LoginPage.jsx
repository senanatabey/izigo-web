import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/profile";

  return (
    <LoginForm
      onSuccess={() => navigate(redirectTo, { replace: true })}
      footerSwitch={
        <p className="ap-switch">
          {t("auth.noAccount")} <Link to="/register">{t("auth.signUpLink")}</Link>
        </p>
      }
    />
  );
}
