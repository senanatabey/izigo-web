import { useLanguage } from "../i18n/LanguageContext";
import { STATUS_TABS } from "../lib/useStatusFilter";

/* Status tabs for a host's own listings. Styling stays with the page (it
   passes the class names); the logic is in lib/useStatusFilter.js. */
export function ListingStatusTabs({ counts, value, onChange, className, itemClassName }) {
  const { t } = useLanguage();
  return (
    <div className={className}>
      {STATUS_TABS.map((key) => (
        <button
          key={key}
          type="button"
          className={`${itemClassName}${value === key ? " active" : ""}`}
          onClick={() => onChange(key)}
        >
          {key === "all" ? t("myListingsPage.tabAll") : t(`myListingsPage.status.${key}`)} ({counts[key]})
        </button>
      ))}
    </div>
  );
}
