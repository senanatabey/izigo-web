import { useLanguage } from "../../i18n/LanguageContext";
import PlanMyTripForm from "./PlanMyTripForm";

export default function PlanMyTripPage() {
  const { t } = useLanguage();

  return (
    <div className="plan-trip-page">
      <style>{`
        .plan-trip-page { max-width: 880px; margin: 0 auto; padding: 48px 6vw 80px; }
        .plan-trip-page .pt-head { text-align: center; margin-bottom: 36px; }
        .plan-trip-page .pt-head h1 { font-size: 32px; font-weight: 800; margin: 0 0 10px; }
        .plan-trip-page .pt-head p { font-size: 15px; color: var(--text-soft); max-width: 560px; margin: 0 auto; line-height: 1.6; }
        .plan-trip-page .pt-tagline { display: inline-block; font-size: 12.5px; font-weight: 700; color: var(--izigo-orange); background: var(--bg-soft); padding: 6px 14px; border-radius: 999px; margin-bottom: 16px; }

        .plan-trip-page .pt-form { border: 1px solid var(--border); border-radius: 20px; padding: 32px; }
        .plan-trip-page .pt-section-title { font-size: 15px; font-weight: 800; margin: 0 0 14px; color: var(--text); }
        .plan-trip-page .pt-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
        .plan-trip-page .pt-field { display: flex; flex-direction: column; gap: 6px; }
        .plan-trip-page .pt-field.full { grid-column: 1 / -1; }
        .plan-trip-page .pt-field label { font-size: 12.5px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 5px; }
        .plan-trip-page .pt-field input,
        .plan-trip-page .pt-field select,
        .plan-trip-page .pt-field textarea {
          border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px;
          font-size: 14px; color: var(--text); background: #fff; font-family: var(--sans);
        }
        .plan-trip-page .pt-field textarea { resize: vertical; min-height: 80px; }

        .plan-trip-page .pt-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
        .plan-trip-page .pt-chip {
          display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); border-radius: 999px;
          padding: 9px 16px; font-size: 13px; font-weight: 600; color: var(--text); background: #fff; cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .plan-trip-page .pt-chip.active { background: var(--izigo-green); border-color: var(--izigo-green); color: #fff; }

        .plan-trip-page .pt-submit {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 15px; font-weight: 700; font-size: 15px; cursor: pointer;
        }
        .plan-trip-page .pt-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        .plan-trip-page .pt-submit-note { text-align: center; font-size: 12px; color: var(--text-soft); margin-top: 12px; }

        .plan-trip-page .pt-success { text-align: center; border: 1px solid var(--border); border-radius: 20px; padding: 56px 32px; }
        .plan-trip-page .pt-success-icon { color: var(--izigo-green); margin-bottom: 16px; }
        .plan-trip-page .pt-success h3 { font-size: 22px; font-weight: 800; margin: 0 0 10px; }
        .plan-trip-page .pt-success p { font-size: 14.5px; color: var(--text-soft); line-height: 1.6; max-width: 440px; margin: 0 auto; }

        @media (max-width: 640px) {
          .plan-trip-page { padding: 32px 5vw 56px; }
          .plan-trip-page .pt-form { padding: 22px 18px; }
          .plan-trip-page .pt-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pt-head">
        <div className="pt-tagline">{t("planTrip.tagline")}</div>
        <h1>{t("planTrip.heading")}</h1>
        <p>{t("planTrip.subtitle")}</p>
      </div>

      <PlanMyTripForm />
    </div>
  );
}
