import { useLanguage } from "../i18n/LanguageContext";

// Extracted as-is from the homepage so both the homepage (previously) and the
// Become a Host page can render the exact same comparison table without
// duplicating the JSX/CSS. Fully self-contained — no props required.
const COMPARISON_ROWS = ["commission", "hiddenFees", "directContact", "verified", "focus", "freeToList"];
const COMPARISON_COLUMNS = ["izigo", "airbnb", "booking", "vrbo"];

export default function ComparisonTable() {
  const { t } = useLanguage();

  return (
    <section className="comparison-table-block">
      <style>{`
        .comparison-table-block .comparison-card {
          max-width: 1280px; margin: 0 auto;
          background: var(--izigo-green); color: #fff;
          border-radius: 18px; padding: 32px; box-shadow: var(--shadow-md);
        }
        .comparison-table-block .comparison-card h2 { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 22px; }
        .comparison-table-block .comparison-scroll { overflow-x: auto; }
        .comparison-table-block .comparison-table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .comparison-table-block .comparison-table th, .comparison-table-block .comparison-table td {
          padding: 14px 12px; text-align: left; font-size: 14px; white-space: nowrap;
        }
        .comparison-table-block .comparison-table thead th {
          font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.75);
          text-transform: uppercase; letter-spacing: 0.3px;
          border-bottom: 1px solid rgba(255,255,255,0.25); padding-bottom: 12px;
        }
        .comparison-table-block .comparison-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.14); }
        .comparison-table-block .comparison-table tbody tr:last-child { border-bottom: none; }
        .comparison-table-block .comparison-table td.feature-cell { font-weight: 600; color: rgba(255,255,255,0.9); white-space: normal; }
        .comparison-table-block .comparison-table .col-izigo { color: #FFD447; text-align: center; }
        .comparison-table-block .comparison-table td.col-izigo { font-weight: 700; }
        .comparison-table-block .comparison-footnote { margin-top: 20px; font-size: 12.5px; color: rgba(255,255,255,0.65); text-align: center; }
      `}</style>
      <div className="comparison-card">
        <h2>{t("comparison.heading")}</h2>
        <div className="comparison-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                {COMPARISON_COLUMNS.map((col) => (
                  <th key={col} className={col === "izigo" ? "col-izigo" : ""}>{t(`comparison.columns.${col}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row}>
                  <td className="feature-cell">{t(`comparison.rows.${row}.feature`)}</td>
                  {COMPARISON_COLUMNS.map((col) => (
                    <td key={col} className={col === "izigo" ? "col-izigo" : ""}>{t(`comparison.rows.${row}.${col}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="comparison-footnote">{t("comparison.footnote")}</p>
      </div>
    </section>
  );
}
